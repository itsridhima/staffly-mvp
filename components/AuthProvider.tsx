"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type AuthMethods, fetchAuthMethods } from "@/lib/authSettings";
import { getSupabase, supabaseConfigured } from "@/lib/supabaseClient";

interface AuthValue {
  /** True when the Supabase keys are present, so login is possible. */
  configured: boolean;
  /** False until we know whether someone is already signed in. */
  ready: boolean;
  user: User | null;
  /** Which methods are switched on in Supabase (null = couldn't find out). */
  methods: AuthMethods | null;
  signInWithGoogle: () => Promise<string | null>;
  sendEmailCode: (email: string) => Promise<string | null>;
  verifyEmailCode: (email: string, code: string) => Promise<string | null>;
  sendPhoneCode: (phoneE164: string) => Promise<string | null>;
  verifyPhoneCode: (phoneE164: string, code: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

interface SupabaseErrorLike {
  message: string;
  code?: string;
}

/** Turn Supabase's technical errors into something a manager can act on. */
function friendly(error: SupabaseErrorLike): string {
  const code = error.code ?? "";
  const m = error.message.toLowerCase();
  if (code === "phone_provider_disabled" || m.includes("unsupported phone provider")) {
    return "Phone login isn't switched on yet. Please use Google or email instead.";
  }
  if (code === "provider_disabled" || m.includes("provider is not enabled") || m.includes("unsupported provider")) {
    return "Google sign-in isn't switched on yet. Please use phone or email instead.";
  }
  if (code === "over_sms_send_rate_limit" || m.includes("sms") && m.includes("rate")) {
    return "Too many codes were requested for this number. Please wait a few minutes and try again.";
  }
  if (code === "sms_send_failed" || m.includes("sms") && (m.includes("fail") || m.includes("send"))) {
    return "We couldn't send the SMS. Check the number, or use Google or email instead.";
  }
  if (code === "over_email_send_rate_limit" || m.includes("rate limit") || m.includes("too many")) {
    return "Too many emails were requested. Please wait a few minutes and try again.";
  }
  if (code === "otp_expired" || m.includes("expired") || m.includes("invalid") || m.includes("token")) {
    return "That code didn't work or has expired. Request a new code and try again.";
  }
  return "Something went wrong signing you in. Please try again.";
}

const NOT_SET_UP = "Login isn't set up on this copy of the app.";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);
  const [methods, setMethods] = useState<AuthMethods | null>(null);

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
    fetchAuthMethods(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).then((m) => {
      if (active) setMethods(m);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return NOT_SET_UP;
    // Check first: if Google is off, redirecting would land on a raw Supabase error page.
    if (methods && !methods.google) return friendly({ message: "provider is not enabled", code: "provider_disabled" });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return friendly(error ?? { message: "unsupported provider" });
    window.location.assign(data.url);
    return null;
  }, [methods]);

  const sendEmailCode = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return NOT_SET_UP;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
    });
    return error ? friendly(error) : null;
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    const supabase = getSupabase();
    if (!supabase) return NOT_SET_UP;
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    return error ? friendly(error) : null;
  }, []);

  const sendPhoneCode = useCallback(
    async (phone: string) => {
      const supabase = getSupabase();
      if (!supabase) return NOT_SET_UP;
      if (methods && !methods.phone) return friendly({ message: "unsupported phone provider", code: "phone_provider_disabled" });
      const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true } });
      return error ? friendly(error) : null;
    },
    [methods],
  );

  const verifyPhoneCode = useCallback(async (phone: string, code: string) => {
    const supabase = getSupabase();
    if (!supabase) return NOT_SET_UP;
    const { error } = await supabase.auth.verifyOtp({ phone, token: code.trim(), type: "sms" });
    return error ? friendly(error) : null;
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase()?.auth.signOut();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      configured: supabaseConfigured,
      ready,
      user,
      methods,
      signInWithGoogle,
      sendEmailCode,
      verifyEmailCode,
      sendPhoneCode,
      verifyPhoneCode,
      signOut,
    }),
    [ready, user, methods, signInWithGoogle, sendEmailCode, verifyEmailCode, sendPhoneCode, verifyPhoneCode, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
