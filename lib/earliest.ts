import { canStaffLine, reserveLines } from "./availability";
import { BOOKABLE_DAYS_AHEAD, WORKERS } from "./prototypeData";
import { addDays, formatTime, toDateString, weekdayOf } from "./time";
import type { BookingLine, Ledger, RoleId, ShiftLength, Worker } from "./types";

export interface EarliestSlot {
  date: string;
  startMinutes: number;
}

/**
 * The first start time (on the hour) at which one worker of this role can start a shift,
 * looking from now across the bookable days. Used for tags like "Today from 4:00 PM".
 * Lines already in the cart are treated as holding their workers.
 */
export function earliestStart(
  role: RoleId,
  ledger: Ledger,
  now: Date,
  cart: BookingLine[] = [],
  length: ShiftLength = 5,
  workers: Worker[] = WORKERS,
): EarliestSlot | null {
  const held = reserveLines(cart, ledger, now, workers);
  const today = toDateString(now);
  for (let day = 0; day <= BOOKABLE_DAYS_AHEAD; day++) {
    const date = addDays(today, day);
    for (let hour = 0; hour * 60 + length * 60 <= 24 * 60; hour++) {
      const startMinutes = hour * 60;
      const result = canStaffLine({ role, qty: 1, length, date, startMinutes }, held, now, workers);
      if (result.ok) return { date, startMinutes };
    }
  }
  return null;
}

/** "Today from 4:00 PM", "Tomorrow from 6:00 AM", or "Mon from 9:00 AM". */
export function earliestLabel(slot: EarliestSlot | null, now: Date): string {
  if (!slot) return "No slots soon";
  const today = toDateString(now);
  const time = formatTime(slot.startMinutes);
  if (slot.date === today) return `Today from ${time}`;
  if (slot.date === addDays(today, 1)) return `Tomorrow from ${time}`;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekdayOf(slot.date)];
  return `${day} from ${time}`;
}
