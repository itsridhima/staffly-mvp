import type { RoleId, ShiftLength, Worker } from "./types";

/**
 * Staffly's roles, prices (before GST) and the worker pool used for availability.
 * Edit this file when prices, role descriptions or workers change.
 */

export interface RoleInfo {
  id: RoleId;
  label: string;
  /** Short name for tiles */
  shortLabel: string;
  /** Internal worker pay rate per hour (INR). Not shown to managers. */
  workerRatePerHour: number;
  /** Price charged to the manager per worker, before GST. */
  price: Record<ShiftLength, number>;
  overview: string;
  includes: string[];
}

// Listed in Staffly's priority order.
export const ROLES: RoleInfo[] = [
  {
    id: "waiter",
    label: "Waiter / steward",
    shortLabel: "Waiter",
    workerRatePerHour: 90,
    price: { 5: 690, 8: 1020 },
    overview:
      "Front-of-house staff who greet guests, take orders, serve food and drinks, and keep tables running smoothly during service.",
    includes: ["Greeting and seating guests", "Taking and serving orders", "Clearing and resetting tables", "Answering simple guest questions"],
  },
  {
    id: "kitchen_helper",
    label: "Kitchen helper",
    shortLabel: "Kitchen helper",
    workerRatePerHour: 85,
    price: { 5: 660, 8: 970 },
    overview: "Supports the kitchen team with prep work such as washing and cutting ingredients, keeping stations stocked and clean.",
    includes: ["Washing and chopping ingredients", "Keeping stations stocked", "Basic food prep as directed", "Tidying the kitchen between tasks"],
  },
  {
    id: "dishwasher",
    label: "Dishwasher / pot washer",
    shortLabel: "Dishwasher",
    workerRatePerHour: 80,
    price: { 5: 640, 8: 940 },
    overview: "Keeps plates, glasses, cutlery, pots and pans clean and ready so service never stalls.",
    includes: ["Washing dishes, glasses and cutlery", "Scrubbing pots and pans", "Putting clean items back in place", "Keeping the wash area tidy"],
  },
  {
    id: "food_runner",
    label: "Food runner and table busser",
    shortLabel: "Food runner",
    workerRatePerHour: 85,
    price: { 5: 660, 8: 970 },
    overview: "Carries food from kitchen to table and clears used plates, helping servers turn tables faster.",
    includes: ["Running orders to the right table", "Clearing used plates and glasses", "Wiping and resetting tables", "Supporting the waiting staff"],
  },
  {
    id: "takeaway_packer",
    label: "Takeaway packing and order handover",
    shortLabel: "Takeaway packer",
    workerRatePerHour: 85,
    price: { 5: 660, 8: 970 },
    overview: "Packs takeaway and delivery orders carefully and hands them over to riders or customers.",
    includes: ["Packing orders and checking items", "Sealing and labelling bags", "Handing orders to riders or customers", "Keeping the packing counter organised"],
  },
  {
    id: "cleaner",
    label: "Cleaner (floor, tables, washrooms)",
    shortLabel: "Cleaner",
    workerRatePerHour: 80,
    price: { 5: 640, 8: 940 },
    overview: "Keeps floors, tables and washrooms clean and presentable for guests throughout the shift.",
    includes: ["Sweeping and mopping floors", "Wiping tables and surfaces", "Cleaning and restocking washrooms", "Emptying bins"],
  },
];

export function roleInfo(id: RoleId): RoleInfo {
  const role = ROLES.find((r) => r.id === id);
  if (!role) throw new Error(`Unknown role: ${id}`);
  return role;
}

// Working-window patterns (hours). Staggered so that some start times are free and others are not.
const EARLY: [number, number] = [6, 16];
const MID: [number, number] = [9, 19];
const LATE: [number, number] = [12, 22];
const FULL: [number, number] = [6, 22];

// Skill sets, picked deterministically per worker.
const ROLE_SKILLS: Record<RoleId, string[]> = {
  waiter: ["Table service", "Order taking", "Menu knowledge", "Guest handling", "Tray carrying"],
  kitchen_helper: ["Vegetable prep", "Ingredient washing", "Station set-up", "Kitchen hygiene", "Basic food prep"],
  dishwasher: ["Dishwashing", "Pot scrubbing", "Glassware care", "Sanitising", "Wash-area upkeep"],
  food_runner: ["Order running", "Table busing", "Table resetting", "Team coordination", "Fast service"],
  takeaway_packer: ["Order packing", "Item checking", "Sealing and labelling", "Rider handover", "Counter upkeep"],
  cleaner: ["Floor mopping", "Washroom cleaning", "Surface wiping", "Waste disposal", "Restocking supplies"],
};

let skillCounter = 100;

function w(
  id: string,
  name: string,
  role: RoleId,
  years: number,
  languages: string[],
  [start, end]: [number, number],
  weeklyOff: number,
): Worker {
  const base = ROLE_SKILLS[role];
  const n = ++skillCounter;
  const skills = [0, 1, 2].map((i) => base[(n + i) % base.length]);
  return { id, name, role, yearsExperience: years, languages, skills, workStartHour: start, workEndHour: end, weeklyOff };
}

export const WORKERS: Worker[] = [
  w("w1", "Arjun Nair", "waiter", 4, ["Hindi", "English"], EARLY, 1),
  w("w2", "Meera Iyer", "waiter", 2, ["Hindi", "English", "Marathi"], MID, 3),
  w("w3", "Rohan Das", "waiter", 6, ["Hindi", "English"], LATE, 0),
  w("w4", "Sana Khan", "waiter", 3, ["Hindi", "Urdu", "English"], FULL, 2),

  w("k1", "Deepak Yadav", "kitchen_helper", 5, ["Hindi"], EARLY, 2),
  w("k2", "Lakshmi Reddy", "kitchen_helper", 3, ["Hindi", "Tamil", "English"], MID, 0),
  w("k3", "Imran Sheikh", "kitchen_helper", 7, ["Hindi", "Urdu"], LATE, 1),
  w("k4", "Pooja Patil", "kitchen_helper", 2, ["Hindi", "English"], FULL, 4),

  w("d1", "Ramesh Kumar", "dishwasher", 3, ["Hindi"], EARLY, 3),
  w("d2", "Kavita Jadhav", "dishwasher", 1, ["Hindi", "Marathi"], MID, 1),
  w("d3", "Sunil Verma", "dishwasher", 4, ["Hindi", "English"], LATE, 5),

  w("f1", "Neha Singh", "food_runner", 2, ["Hindi", "English"], MID, 4),
  w("f2", "Vikram Chauhan", "food_runner", 3, ["Hindi", "Punjabi"], LATE, 2),
  w("f3", "Anita Roy", "food_runner", 5, ["Hindi", "English", "Bengali"], FULL, 6),

  w("t1", "Farhan Ali", "takeaway_packer", 2, ["Hindi", "English"], EARLY, 0),
  // Roles with two workers overlap in the middle of the day, so booking both is possible.
  w("t2", "Divya Rao", "takeaway_packer", 3, ["Hindi", "Telugu"], MID, 3),

  w("c1", "Mohan Lal", "cleaner", 6, ["Hindi"], EARLY, 2),
  w("c2", "Rekha Gowda", "cleaner", 4, ["Hindi", "English"], MID, 5),
];

/** Maximum quantity a manager can add for a role = size of that role's worker pool. */
export function maxQuantity(role: RoleId, workers: Worker[] = WORKERS): number {
  return workers.filter((x) => x.role === role).length;
}

/** Older saved bookings may carry a trailing "Demo" in a worker's name; show names without it. */
export function displayName(name: string): string {
  return name.replace(/\s+Demo$/i, "");
}

/** Same clean-up for saved sentences such as "Arjun Demo assigned". */
export function cleanText(text: string): string {
  return text.replace(/(\p{L}+)\s+Demo\b/gu, "$1");
}

export const BOOKABLE_DAYS_AHEAD = 14;

/** Shifts starting at 2:00 PM are treated as fully booked, so there is always an unavailable slot to see. */
export const DEMO_BLOCKED_START = 14 * 60;
