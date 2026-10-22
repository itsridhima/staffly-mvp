export interface AuthMethods {
  google: boolean;
  email: boolean;
  phone: boolean;
}

/**
 * Asks Supabase which login methods are switched on, using only the public URL and anon key.
 * Lets the login page avoid sending people to an error page for a method that isn't enabled.
 * Returns null if the answer can't be fetched (then the page offers everything and handles errors).
 */
export async function fetchAuthMethods(url: string | undefined, anonKey: string | undefined): Promise<AuthMethods | null> {
  if (!url || !anonKey) return null;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } });
    if (!res.ok) return null;
    const data = (await res.json()) as { external?: Record<string, boolean> };
    const ext = data.external ?? {};
    return { google: ext.google === true, email: ext.email !== false, phone: ext.phone === true };
  } catch {
    return null;
  }
}
