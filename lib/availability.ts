import { DEMO_BLOCKED_START, roleInfo, ROLES, WORKERS } from "./prototypeData";
import { orderTotal } from "./pricing";
import { minutesOfDay, toDateString, weekdayOf } from "./time";
import type { Ledger, Order, RoleId, ShiftLength, Slot, Worker } from "./types";

export type StaffResult =
  | { ok: true; assignments: Partial<Record<RoleId, Worker[]>> }
  | { ok: false; reason: string };

/** Is this worker free (working hours + no overlapping booking) for the whole slot? */
export function isWorkerFree(worker: Worker, slot: Slot, ledger: Ledger): boolean {
  if (weekdayOf(slot.date) === worker.weeklyOff) return false;
  const start = slot.startMinutes;
  const end = start + slot.length * 60;
  if (start < worker.workStartHour * 60 || end > worker.workEndHour * 60) return false;
  return !ledger.some(
    (e) => e.workerId === worker.id && e.date === slot.date && start < e.endMinutes && e.startMinutes < end,
  );
}

function hasStarted(slot: Slot, now: Date): boolean {
  const today = toDateString(now);
  if (slot.date < today) return true;
  return slot.date === today && slot.startMinutes <= minutesOfDay(now);
}

/**
 * Can every worker in the order be staffed for this slot? (All-or-nothing.)
 * On success, returns the specific workers that would be assigned.
 */
export function canStaff(
  order: Order,
  slot: Slot,
  ledger: Ledger,
  now: Date,
  workers: Worker[] = WORKERS,
): StaffResult {
  if (slot.startMinutes + slot.length * 60 > 24 * 60) return { ok: false, reason: "Shift would run past midnight" };
  if (hasStarted(slot, now)) return { ok: false, reason: "This time has already passed" };
  if (slot.startMinutes === DEMO_BLOCKED_START) return { ok: false, reason: "Already booked (demo)" };

  const assignments: Partial<Record<RoleId, Worker[]>> = {};
  for (const role of ROLES) {
    const need = order[role.id] ?? 0;
    if (need <= 0) continue;
    const free = workers.filter((w) => w.role === role.id && isWorkerFree(w, slot, ledger));
    if (free.length < need) {
      const label = roleInfo(role.id).label;
      return {
        ok: false,
        reason: free.length === 0 ? `No ${label} free` : `Only ${free.length} ${label} free (you need ${need})`,
      };
    }
    assignments[role.id] = free.slice(0, need);
  }
  return { ok: true, assignments };
}

export interface SlotOption {
  startMinutes: number;
  available: boolean;
  /** Order total before GST for this shift */
  total: number;
  reason?: string;
}

const HOUR = 60;

function optionFor(
  order: Order,
  length: ShiftLength,
  date: string,
  startMinutes: number,
  ledger: Ledger,
  now: Date,
  workers: Worker[],
): SlotOption {
  const result = canStaff(order, { date, startMinutes, length }, ledger, now, workers);
  return {
    startMinutes,
    available: result.ok,
    total: orderTotal(order, length),
    reason: result.ok ? undefined : result.reason,
  };
}

/** Four slots: 1 hour before the typed start time, the typed time, and the next 2 hours. */
export function getSlots(
  order: Order,
  length: ShiftLength,
  date: string,
  requestedStart: number,
  ledger: Ledger,
  now: Date,
  workers: Worker[] = WORKERS,
): SlotOption[] {
  const options: SlotOption[] = [];
  for (const offset of [-1, 0, 1, 2]) {
    const start = requestedStart + offset * HOUR;
    if (start < 0 || start + length * HOUR > 24 * HOUR) continue;
    options.push(optionFor(order, length, date, start, ledger, now, workers));
  }
  return options;
}

/** Nearest start times (within 3 hours, hourly) that can fit the whole order, closest first. */
export function findNearestAlternatives(
  order: Order,
  length: ShiftLength,
  date: string,
  chosenStart: number,
  ledger: Ledger,
  now: Date,
  workers: Worker[] = WORKERS,
  limit = 3,
): SlotOption[] {
  const offsets = [-1, 1, -2, 2, -3, 3]; // nearest first; earlier before later on ties
  const found: SlotOption[] = [];
  for (const offset of offsets) {
    const start = chosenStart + offset * HOUR;
    if (start < 0 || start + length * HOUR > 24 * HOUR) continue;
    const option = optionFor(order, length, date, start, ledger, now, workers);
    if (option.available) found.push(option);
    if (found.length === limit) break;
  }
  return found;
}
