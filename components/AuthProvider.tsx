"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabaseClient";

interface AuthValue {
  /** True when the Supabase keys are present, so login is possible. */
  configured: boolean;
  /** False until we know whether someone is already signed in. */
  ready: boolean;
  user: User | null;
  signInWithGoogle: () => Promise<string | null>;
  sendEmailCode: (email: string) => Promise<string | null>;
  verifyEmailCode: (email: string, code: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** Turn Supabase's technical errors into something a manager can act on. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many")) return "Too many emails were requested. Please wait a few minutes and try again.";
  if (m.includes("expired") || m.includes("invalid") || m.includes("token")) return "That code didn't work or has expired. Request a new code and try again.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) return "Google sign-in isn't switched on yet. Ask the app owner to enable it in Supabase.";
  return "Something went wrong signing you in. Please try again.";
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return "Login isn't set up on this copy of the app.";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return error ? friendly(error.message) : null;
  }, []);

  const sendEmailCode = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Login isn't set up on this copy of the app.";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
    });
    return error ? friendly(error.message) : null;
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Login isn't set up on this copy of the app.";
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    return error ? friendly(error.message) : null;
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase()?.auth.signOut();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ configured: supabaseConfigured, ready, user, signInWithGoogle, sendEmailCode, verifyEmailCode, signOut }),
    [ready, user, signInWithGoogle, sendEmailCode, verifyEmailCode, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
