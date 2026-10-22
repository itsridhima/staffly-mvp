import { canStaff } from "./availability";
import { billBreakdown } from "./pricing";
import { ROLES, WORKERS } from "./prototypeData";
import { isWorkerFree } from "./availability";
import type { BookedWorker, Booking, Ledger, LedgerEntry, Order, Slot, Worker } from "./types";

export type ConfirmResult =
  | { ok: true; booking: Booking; ledger: Ledger }
  | { ok: false; error: "slot_taken"; reason: string };

// No look-alike characters (0/O, 1/I)
const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** PROTOTYPE: a random-looking reference. Not a real Staffly booking number. */
export function makeReference(rng: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 5; i++) out += REF_CHARS[Math.floor(rng() * REF_CHARS.length)];
  return `STF-${out}`;
}

/**
 * Re-checks availability, then assigns specific workers and records them in the ledger.
 * If the slot is no longer available, nothing is booked and the ledger is untouched.
 */
export function confirmBooking(
  order: Order,
  slot: Slot,
  ledger: Ledger,
  now: Date,
  workers: Worker[] = WORKERS,
  rng: () => number = Math.random,
): ConfirmResult {
  const result = canStaff(order, slot, ledger, now, workers);
  if (!result.ok) return { ok: false, error: "slot_taken", reason: result.reason };

  const booked: BookedWorker[] = [];
  const entries: LedgerEntry[] = [];
  for (const role of ROLES) {
    for (const worker of result.assignments[role.id] ?? []) {
      booked.push({ role: role.id, worker });
      entries.push({
        workerId: worker.id,
        date: slot.date,
        startMinutes: slot.startMinutes,
        endMinutes: slot.startMinutes + slot.length * 60,
        source: "booking",
      });
    }
  }

  return {
    ok: true,
    booking: { reference: makeReference(rng), slot, order, workers: booked, bill: billBreakdown(order, slot.length) },
    ledger: [...ledger, ...entries],
  };
}

/**
 * DEMO TOOL ONLY: pretends another manager booked workers first.
 * It books out just enough free workers of the order's scarcest role so this slot
 * can no longer be staffed. (Staffly has no real second user yet.)
 */
export function simulateOtherBooking(
  order: Order,
  slot: Slot,
  ledger: Ledger,
  workers: Worker[] = WORKERS,
): Ledger {
  let target: { workers: Worker[]; need: number } | null = null;
  for (const role of ROLES) {
    const need = order[role.id] ?? 0;
    if (need <= 0) continue;
    const free = workers.filter((w) => w.role === role.id && isWorkerFree(w, slot, ledger));
    if (!target || free.length - need < target.workers.length - target.need) target = { workers: free, need };
  }
  if (!target) return ledger;
  const count = Math.max(0, target.workers.length - target.need + 1);
  const entries: LedgerEntry[] = target.workers.slice(0, count).map((w) => ({
    workerId: w.id,
    date: slot.date,
    startMinutes: slot.startMinutes,
    endMinutes: slot.startMinutes + slot.length * 60,
    source: "demo",
  }));
  return [...ledger, ...entries];
}
