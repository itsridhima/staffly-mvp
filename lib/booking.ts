import { assignLines, isWorkerFree } from "./availability";
import { billBreakdown } from "./pricing";
import { WORKERS } from "./prototypeData";
import type { Booking, BookingLine, Ledger, LedgerEntry, LineSpec, TrackedWorker, Worker } from "./types";

export type ConfirmResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: "slot_taken"; lineId: string; reason: string };

// No look-alike characters (0/O, 1/I)
const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** PROTOTYPE: a random-looking reference. Not a real Staffly booking number. */
export function makeReference(rng: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 5; i++) out += REF_CHARS[Math.floor(rng() * REF_CHARS.length)];
  return `STF-${out}`;
}

export function makeLineId(rng: () => number = Math.random): string {
  return `L${Math.floor(rng() * 1e9).toString(36)}${Date.now().toString(36)}`;
}

/**
 * Re-checks availability for every line, then assigns specific workers.
 * All-or-nothing: if any line can no longer be staffed, nothing is booked and that line is reported.
 * `ledger` = everything that is already booked (not including these lines).
 */
export function confirmBooking(
  lines: BookingLine[],
  ledger: Ledger,
  now: Date,
  workers: Worker[] = WORKERS,
  rng: () => number = Math.random,
): ConfirmResult {
  const result = assignLines(lines, ledger, now, workers);
  if (!result.ok) return { ok: false, error: "slot_taken", lineId: result.lineId, reason: result.reason };

  const reference = makeReference(rng);
  const createdAt = now.toISOString();
  const tracked: TrackedWorker[] = [];
  for (const line of lines) {
    for (const worker of result.assignments[line.id] ?? []) {
      tracked.push({
        trackingId: `TRK-${reference.slice(4)}-${tracked.length + 1}`,
        lineId: line.id,
        role: line.role,
        worker,
        status: "booked",
        history: [{ status: "booked", at: createdAt, note: `${worker.name} assigned` }],
        replaced: [],
      });
    }
  }

  return { ok: true, booking: { reference, createdAt, lines, workers: tracked, bill: billBreakdown(lines) } };
}

/**
 * DEMO TOOL ONLY: pretends another manager booked workers first.
 * Returns ledger entries that book out just enough free workers of this line's role so the
 * slot can no longer be staffed. (Staffly has no real second user yet.)
 */
export function simulateOtherBooking(line: LineSpec, ledger: Ledger, workers: Worker[] = WORKERS): LedgerEntry[] {
  const free = workers.filter((w) => w.role === line.role && isWorkerFree(w, line, ledger));
  const count = free.length - line.qty + 1;
  if (count <= 0) return [];
  return free.slice(0, count).map((w) => ({
    workerId: w.id,
    date: line.date,
    startMinutes: line.startMinutes,
    endMinutes: line.startMinutes + line.length * 60,
    source: "demo" as const,
  }));
}
