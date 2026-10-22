import type { Booking, Ledger, LedgerEntry } from "./types";

/**
 * Which workers are busy when. Rebuilt from saved bookings (current worker of each tracked
 * assignment, so a replaced worker is automatically freed) plus any demo entries.
 */
export function ledgerFromBookings(bookings: Booking[], demoEntries: LedgerEntry[] = []): Ledger {
  const entries: LedgerEntry[] = [];
  for (const booking of bookings) {
    for (const tw of booking.workers) {
      const line = booking.lines.find((l) => l.id === tw.lineId);
      if (!line) continue;
      entries.push({
        workerId: tw.worker.id,
        date: line.date,
        startMinutes: line.startMinutes,
        endMinutes: line.startMinutes + line.length * 60,
        source: "booking",
        trackingId: tw.trackingId,
      });
    }
  }
  return [...entries, ...demoEntries];
}
