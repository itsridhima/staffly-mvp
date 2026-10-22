/** Safe JSON helpers for localStorage (it can be blocked or full, so every call is guarded). */

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore: the app still works, it just won't remember */
  }
}

export const KEYS = {
  cart: "staffly-cart",
  guestBookings: "staffly-guest-bookings",
  demoLedger: "staffly-demo-ledger",
  notificationsSeen: "staffly-notifications-seen",
} as const;
