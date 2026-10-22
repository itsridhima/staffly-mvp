import { DEMO_BLOCKED_START, roleInfo, WORKERS } from "./prototypeData";
import { lineTotal } from "./pricing";
import { minutesOfDay, toDateString, weekdayOf } from "./time";
import type { BookingLine, Ledger, LedgerEntry, LineSpec, ShiftLength, Worker } from "./types";

interface SlotTime {
  date: string;
  startMinutes: number;
  length: ShiftLength;
}

export type StaffResult = { ok: true; workers: Worker[] } | { ok: false; reason: string };

/** Is this worker free (working hours + no overlapping booking) for the whole slot? */
export function isWorkerFree(worker: Worker, slot: SlotTime, ledger: Ledger): boolean {
  if (weekdayOf(slot.date) === worker.weeklyOff) return false;
  const start = slot.startMinutes;
  const end = start + slot.length * 60;
  if (start < worker.workStartHour * 60 || end > worker.workEndHour * 60) return false;
  return !ledger.some(
    (e) => e.workerId === worker.id && e.date === slot.date && start < e.endMinutes && e.startMinutes < end,
  );
}

function hasStarted(slot: SlotTime, now: Date): boolean {
  const today = toDateString(now);
  if (slot.date < today) return true;
  return slot.date === today && slot.startMinutes <= minutesOfDay(now);
}

/**
 * Can this line (role, quantity, shift) be fully staffed?
 * On success, returns the specific workers that would be assigned.
 */
export function canStaffLine(
  line: LineSpec,
  ledger: Ledger,
  now: Date,
  workers: Worker[] = WORKERS,
): StaffResult {
  if (line.startMinutes + line.length * 60 > 24 * 60) return { ok: false, reason: "Shift would run past midnight" };
  if (hasStarted(line, now)) return { ok: false, reason: "This time has already passed" };
  if (line.startMinutes === DEMO_BLOCKED_START) return { ok: false, reason: "Already booked (demo)" };

  const free = workers.filter((w) => w.role === line.role && isWorkerFree(w, line, ledger));
  if (free.length < line.qty) {
    const label = roleInfo(line.role).label;
    return {
      ok: false,
      reason: free.length === 0 ? `No ${label} free` : `Only ${free.length} ${label} free (you need ${line.qty})`,
    };
  }
  return { ok: true, workers: free.slice(0, line.qty) };
}

function entriesFor(line: LineSpec, assigned: Worker[]): LedgerEntry[] {
  return assigned.map((w) => ({
    workerId: w.id,
    date: line.date,
    startMinutes: line.startMinutes,
    endMinutes: line.startMinutes + line.length * 60,
    source: "booking" as const,
  }));
}

export type AssignResult =
  | { ok: true; assignments: Record<string, Worker[]>; ledger: Ledger }
  | { ok: false; lineId: string; reason: string };

/**
 * Staff every line in order, so two lines for the same role can't use the same worker at
 * overlapping times. All-or-nothing: the first line that can't be staffed is reported.
 */
export function assignLines(
  lines: BookingLine[],
  ledger: Ledger,
  now: Date,
  workers: Worker[] = WORKERS,
): AssignResult {
  const assignments: Record<string, Worker[]> = {};
  let working = ledger;
  for (const line of lines) {
    const result = canStaffLine(line, working, now, workers);
    if (!result.ok) return { ok: false, lineId: line.id, reason: result.reason };
    assignments[line.id] = result.workers;
    working = [...working, ...entriesFor(line, result.workers)];
  }
  return { ok: true, assignments, ledger: working };
}

/** Ledger plus tentative holds for the lines already in the cart (lines that can't be staffed are skipped). */
export function reserveLines(lines: BookingLine[], ledger: Ledger, now: Date, workers: Worker[] = WORKERS): Ledger {
  let working = ledger;
  for (const line of lines) {
    const result = canStaffLine(line, working, now, workers);
    if (result.ok) working = [...working, ...entriesFor(line, result.workers)];
  }
  return working;
}

export interface SlotOption {
  startMinutes: number;
  available: boolean;
  /** Price of this line (qty x unit price) before GST */
  total: number;
  reason?: string;
}

const HOUR = 60;

function optionFor(line: LineSpec, ledger: Ledger, now: Date, workers: Worker[]): SlotOption {
  const result = canStaffLine(line, ledger, now, workers);
  return {
    startMinutes: line.startMinutes,
    available: result.ok,
    total: lineTotal(line),
    reason: result.ok ? undefined : result.reason,
  };
}

/**
 * Four slots: 1 hour before the typed start time, the typed time, and the next 2 hours.
 * `cart` = lines already in the booking, treated as already holding their workers.
 */
export function getSlots(
  spec: Omit<LineSpec, "startMinutes">,
  requestedStart: number,
  ledger: Ledger,
  now: Date,
  cart: BookingLine[] = [],
  workers: Worker[] = WORKERS,
): SlotOption[] {
  const held = reserveLines(cart, ledger, now, workers);
  const options: SlotOption[] = [];
  for (const offset of [-1, 0, 1, 2]) {
    const start = requestedStart + offset * HOUR;
    if (start < 0 || start + spec.length * HOUR > 24 * HOUR) continue;
    options.push(optionFor({ ...spec, startMinutes: start }, held, now, workers));
  }
  return options;
}

/**
 * Nearest start times (within 3 hours, hourly) that can fit this line, closest first.
 * `otherLines` = the rest of the booking, treated as already holding their workers.
 */
export function findNearestAlternatives(
  line: LineSpec,
  ledger: Ledger,
  now: Date,
  otherLines: BookingLine[] = [],
  workers: Worker[] = WORKERS,
  limit = 3,
): SlotOption[] {
  const held = reserveLines(otherLines, ledger, now, workers);
  const offsets = [-1, 1, -2, 2, -3, 3]; // nearest first; earlier before later on ties
  const found: SlotOption[] = [];
  for (const offset of offsets) {
    const start = line.startMinutes + offset * HOUR;
    if (start < 0 || start + line.length * HOUR > 24 * HOUR) continue;
    const option = optionFor({ ...line, startMinutes: start }, held, now, workers);
    if (option.available) found.push(option);
    if (found.length === limit) break;
  }
  return found;
}
