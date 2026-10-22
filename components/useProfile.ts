"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { KEYS, readLocal, writeLocal } from "@/lib/localStore";
import { EMPTY_PROFILE, type ProfileData, parseProfile } from "@/lib/profile";
import { getSupabase, supabaseConfigured } from "@/lib/supabaseClient";

/**
 * The employer's profile (name, venue, saved venues, favourite workers).
 * - Signed in with Supabase: kept in the account's own metadata, so it follows you across devices
 *   and needs no extra database table.
 * - Supabase not set up: kept in this browser only (guest mode).
 */
export function useProfile(user: User | null, authReady: boolean) {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;
  const metadata = (user?.user_metadata as Record<string, unknown> | undefined)?.staffly;

  useEffect(() => {
    if (!authReady) return;
    if (!supabaseConfigured) setProfile(parseProfile(readLocal<unknown>(KEYS.guestProfile, null)));
    else if (userId) setProfile(parseProfile(metadata));
    else setProfile(EMPTY_PROFILE);
    // Re-read when the account's metadata changes (for example after saving on another tab).
  }, [authReady, userId, metadata]);

  const save = useCallback(
    async (next: ProfileData): Promise<string | null> => {
      const safe = parseProfile(next);
      setProfile(safe);
      setError(null);
      if (!supabaseConfigured) {
        writeLocal(KEYS.guestProfile, safe);
        return null;
      }
      const supabase = getSupabase();
      if (!supabase || !userId) return "You need to be signed in to save your profile.";
      const { error: err } = await supabase.auth.updateUser({ data: { staffly: safe } });
      if (err) {
        setError("Your changes couldn't be saved to your account. Please try again.");
        return err.message;
      }
      return null;
    },
    [userId],
  );

  const update = useCallback((fn: (current: ProfileData) => ProfileData) => save(fn(profile)), [profile, save]);

  return { profile, error, save, update };
}
