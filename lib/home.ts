import { STATUS_LABEL } from "./tracking";
import { toDateString } from "./time";
import type { Booking, BookingLine, RoleId, ShiftLength } from "./types";

export interface NextShift {
  reference: string;
  role: RoleId;
  qty: number;
  length: ShiftLength;
  date: string;
  startMinutes: number;
  /** Status of the first worker on this shift, in words */
  statusLabel: string;
}

/**
 * The employer's soonest shift that isn't finished yet (today or later).
 * Shifts earlier today still count while a worker hasn't completed them.
 */
export function nextShift(bookings: Booking[], now: Date): NextShift | null {
  const today = toDateString(now);
  let best: (NextShift & { key: string }) | null = null;
  for (const booking of bookings) {
    for (const line of booking.lines) {
      const workers = booking.workers.filter((w) => w.lineId === line.id);
      if (workers.length === 0 || workers.every((w) => w.status === "completed")) continue;
      if (line.date < today) continue;
      const key = `${line.date}T${String(line.startMinutes).padStart(5, "0")}`;
      if (!best || key < best.key) {
        best = {
          key,
          reference: booking.reference,
          role: line.role,
          qty: line.qty,
          length: line.length,
          date: line.date,
          startMinutes: line.startMinutes,
          statusLabel: STATUS_LABEL[workers[0].status],
        };
      }
    }
  }
  if (!best) return null;
  const { key: _key, ...shift } = best;
  void _key;
  return shift;
}

export interface BookAgainPreset {
  id: string;
  role: RoleId;
  qty: number;
  length: ShiftLength;
  startMinutes: number;
}

/** Past lines the employer can repeat in one tap: newest first, no duplicates. */
export function bookAgainPresets(bookings: Booking[], limit = 6): BookAgainPreset[] {
  const lines: { createdAt: string; line: BookingLine }[] = [];
  for (const b of bookings) for (const line of b.lines) lines.push({ createdAt: b.createdAt, line });
  lines.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const seen = new Set<string>();
  const presets: BookAgainPreset[] = [];
  for (const { line } of lines) {
    const id = `${line.role}-${line.qty}-${line.length}-${line.startMinutes}`;
    if (seen.has(id)) continue;
    seen.add(id);
    presets.push({ id, role: line.role, qty: line.qty, length: line.length, startMinutes: line.startMinutes });
    if (presets.length === limit) break;
  }
  return presets;
}

/** Short, true facts shown in the information bar when there's nothing personal to show. */
export const INFO_FACTS: { title: string; body: string }[] = [
  { title: "Book up to 14 days ahead", body: "Pick a role, a shift and a time." },
  { title: "Shifts of 5 or 8 hours", body: "Prices are per person, before GST." },
  { title: "Worker can't come?", body: "We arrange a replacement and tell you in the app." },
];
