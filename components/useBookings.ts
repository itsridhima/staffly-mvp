"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { KEYS, readLocal, writeLocal } from "@/lib/localStore";
import { getSupabase, supabaseConfigured } from "@/lib/supabaseClient";
import type { Booking } from "@/lib/types";

/**
 * Saved bookings.
 * - Signed in (Supabase): stored in the user's own rows of the `bookings` table.
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
    supabase
      ?.from("bookings")
      .select("data")
      .order("created_at", { ascending: true })
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) setError("Couldn't load your bookings. Please refresh and try again.");
        else setBookings((data ?? []).map((row) => row.data as Booking));
        setLoading(false);
      });
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
      const supabase = getSupabase();
      if (!supabase || !userId) return "You need to be signed in to save a booking.";
      const { error: err } = await supabase.from("bookings").insert({ reference: booking.reference, data: booking });
      if (err) {
        setError("Your booking was made on screen but could not be saved. Please try again.");
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
      const { error: err } = await supabase.from("bookings").update({ data: booking }).eq("reference", booking.reference);
      if (err) {
        setError("That update could not be saved. Please try again.");
        return err.message;
      }
      return null;
    },
    [userId],
  );

  return { bookings, loading, error, addBooking, updateBooking };
}
