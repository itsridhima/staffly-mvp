import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These two values are PUBLIC by design (they ship to the browser). Security comes from the
// Row Level Security rules in supabase/schema.sql. Never put the service_role key anywhere here.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Returns the shared Supabase client, or null when the keys aren't set (login is then unavailable). */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true },
    });
  }
  return client;
}
