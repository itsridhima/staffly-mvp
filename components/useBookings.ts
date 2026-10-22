"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { KEYS, pendingKey, readLocal, writeLocal } from "@/lib/localStore";
import { getSupabase, supabaseConfigured } from "@/lib/supabaseClient";
import type { Booking } from "@/lib/types";

const TABLE_MISSING =
  "Saved bookings aren't set up in Supabase yet (the bookings table is missing). Your bookings are kept on this device for now.";

/** PostgREST says "table not found" with code PGRST205 (or a 404 / schema-cache message). */
function isMissingTable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return err.code === "PGRST205" || err.code === "42P01" || /could not find the table|schema cache|does not exist/i.test(err.message ?? "");
}

function mergeByReference(primary: Booking[], extra: Booking[]): Booking[] {
  const seen = new Set(primary.map((b) => b.reference));
  return [...primary, ...extra.filter((b) => !seen.has(b.reference))];
}

/**
 * Saved bookings.
 * - Signed in (Supabase): stored in the user's own rows of the `bookings` table. If a save fails
 *   (for example the table hasn't been created yet) the booking is kept on this device and synced later.
 * - Supabase not set up: saved in this browser only ("guest" mode) so the prototype still works.
 * - Supabase set up but nobody signed in: nothing to show.
 */
export function useBookings(user: User | null, authReady: boolean) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    setError(null);

    if (!supabaseConfigured) {
      setBookings(readLocal<Booking[]>(KEYS.guestBookings, []));
      setLoading(false);
      return;
    }
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = getSupabase();
    const pending = readLocal<Booking[]>(pendingKey(userId), []);

    (async () => {
      if (!supabase) return;
      const { data, error: err } = await supabase.from("bookings").select("data").order("created_at", { ascending: true });
      if (!active) return;
      if (err) {
        setError(isMissingTable(err) ? TABLE_MISSING : "Couldn't load your saved bookings. Please refresh and try again.");
        setBookings(pending);
        setLoading(false);
        return;
      }
      const saved = (data ?? []).map((row) => row.data as Booking);
      setBookings(mergeByReference(saved, pending));
      setLoading(false);

      // Try to push anything that couldn't be saved earlier.
      const stillPending: Booking[] = [];
      for (const b of pending) {
        if (saved.some((s) => s.reference === b.reference)) continue;
        const { error: insertErr } = await supabase.from("bookings").insert({ reference: b.reference, data: b });
        if (insertErr) stillPending.push(b);
      }
      writeLocal(pendingKey(userId), stillPending);
    })();

    return () => {
      active = false;
    };
  }, [authReady, userId]);

  const addBooking = useCallback(
    async (booking: Booking): Promise<string | null> => {
      setBookings((prev) => {
        const next = [...prev, booking];
        if (!supabaseConfigured) writeLocal(KEYS.guestBookings, next);
        return next;
      });
      if (!supabaseConfigured) return null;

      const keepLocally = () => {
        if (userId) writeLocal(pendingKey(userId), [...readLocal<Booking[]>(pendingKey(userId), []), booking]);
      };
      const supabase = getSupabase();
      if (!supabase || !userId) return "You need to be signed in to save a booking.";
      const { error: err } = await supabase.from("bookings").insert({ reference: booking.reference, data: booking });
      if (err) {
        keepLocally();
        setError(isMissingTable(err) ? TABLE_MISSING : "Your booking couldn't be saved to your account yet. It is kept on this device and will sync later.");
        return err.message;
      }
      return null;
    },
    [userId],
  );

  const updateBooking = useCallback(
    async (booking: Booking): Promise<string | null> => {
      setBookings((prev) => {
        const next = prev.map((b) => (b.reference === booking.reference ? booking : b));
        if (!supabaseConfigured) writeLocal(KEYS.guestBookings, next);
        return next;
      });
      if (!supabaseConfigured) return null;
      const supabase = getSupabase();
      if (!supabase || !userId) return "You need to be signed in to update a booking.";

      // A booking that is still waiting to be saved only needs its local copy updated.
      const pending = readLocal<Booking[]>(pendingKey(userId), []);
      if (pending.some((b) => b.reference === booking.reference)) {
        writeLocal(
          pendingKey(userId),
          pending.map((b) => (b.reference === booking.reference ? booking : b)),
        );
        return null;
      }

      const { error: err } = await supabase.from("bookings").update({ data: booking }).eq("reference", booking.reference);
      if (err) {
        setError(isMissingTable(err) ? TABLE_MISSING : "That update could not be saved. Please try again.");
        return err.message;
      }
      return null;
    },
    [userId],
  );

  return { bookings, loading, error, addBooking, updateBooking };
}
