import type { RoleId, ShiftLength, Worker } from "./types";

/**
 * PROTOTYPE DATA ONLY.
 * These roles' prices come from Staffly's price table (before GST).
 * Every worker below is FICTIONAL. None of this is real worker availability.
 */

export interface RoleInfo {
  id: RoleId;
  label: string;
  /** Internal worker pay rate per hour (INR). Not shown to managers. */
  workerRatePerHour: number;
  /** Price charged to the manager per worker, before GST. */
  price: Record<ShiftLength, number>;
}

// Listed in Staffly's priority order.
export const ROLES: RoleInfo[] = [
  { id: "waiter", label: "Waiter / steward", workerRatePerHour: 90, price: { 5: 690, 8: 1020 } },
  { id: "kitchen_helper", label: "Kitchen helper", workerRatePerHour: 85, price: { 5: 660, 8: 970 } },
  { id: "dishwasher", label: "Dishwasher / pot washer", workerRatePerHour: 80, price: { 5: 640, 8: 940 } },
  { id: "food_runner", label: "Food runner and table busser", workerRatePerHour: 85, price: { 5: 660, 8: 970 } },
  { id: "takeaway_packer", label: "Takeaway packing and order handover", workerRatePerHour: 85, price: { 5: 660, 8: 970 } },
  { id: "cleaner", label: "Cleaner (floor, tables, washrooms)", workerRatePerHour: 80, price: { 5: 640, 8: 940 } },
];

export function roleInfo(id: RoleId): RoleInfo {
  const role = ROLES.find((r) => r.id === id);
  if (!role) throw new Error(`Unknown role: ${id}`);
  return role;
}

// Working-window patterns (hours). Staggered on purpose so that some start times
// are unavailable and others are free, which makes the demo realistic.
const EARLY: [number, number] = [6, 16];
const MID: [number, number] = [9, 19];
const LATE: [number, number] = [12, 22];
const FULL: [number, number] = [8, 22];

function w(
  id: string,
  name: string,
  role: RoleId,
  years: number,
  languages: string[],
  [start, end]: [number, number],
  weeklyOff: number,
): Worker {
  return { id, name, role, yearsExperience: years, languages, workStartHour: start, workEndHour: end, weeklyOff };
}

export const WORKERS: Worker[] = [
  w("w1", "Arjun Demo", "waiter", 4, ["Hindi", "English"], EARLY, 1),
  w("w2", "Meera Demo", "waiter", 2, ["Hindi", "English", "Marathi"], MID, 3),
  w("w3", "Rohan Demo", "waiter", 6, ["Hindi", "English"], LATE, 0),
  w("w4", "Sana Demo", "waiter", 3, ["Hindi", "Urdu", "English"], FULL, 2),

  w("k1", "Deepak Demo", "kitchen_helper", 5, ["Hindi"], EARLY, 2),
  w("k2", "Lakshmi Demo", "kitchen_helper", 3, ["Hindi", "Tamil", "English"], MID, 0),
  w("k3", "Imran Demo", "kitchen_helper", 7, ["Hindi", "Urdu"], LATE, 1),
  w("k4", "Pooja Demo", "kitchen_helper", 2, ["Hindi", "English"], FULL, 4),

  w("d1", "Ramesh Demo", "dishwasher", 3, ["Hindi"], EARLY, 3),
  w("d2", "Kavita Demo", "dishwasher", 1, ["Hindi", "Marathi"], MID, 1),
  w("d3", "Sunil Demo", "dishwasher", 4, ["Hindi", "English"], LATE, 5),

  w("f1", "Neha Demo", "food_runner", 2, ["Hindi", "English"], MID, 4),
  w("f2", "Vikram Demo", "food_runner", 3, ["Hindi", "Punjabi"], LATE, 2),
  w("f3", "Anita Demo", "food_runner", 5, ["Hindi", "English", "Bengali"], FULL, 6),

  w("t1", "Farhan Demo", "takeaway_packer", 2, ["Hindi", "English"], EARLY, 0),
  w("t2", "Divya Demo", "takeaway_packer", 3, ["Hindi", "Telugu"], LATE, 3),

  w("c1", "Mohan Demo", "cleaner", 6, ["Hindi"], EARLY, 2),
  w("c2", "Rekha Demo", "cleaner", 4, ["Hindi", "English"], LATE, 5),
];

/** Maximum quantity a manager can add for a role = size of that role's demo pool. */
export function maxQuantity(role: RoleId, workers: Worker[] = WORKERS): number {
  return workers.filter((x) => x.role === role).length;
}

export const BOOKABLE_DAYS_AHEAD = 14;

/**
 * DEMO RULE (prototype only): shifts starting at 2:00 PM always show as "already booked",
 * so the demo reliably shows an unavailable slot next to the available ones.
 */
export const DEMO_BLOCKED_START = 14 * 60;
