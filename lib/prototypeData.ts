import type { RoleId, ShiftLength, Worker } from "./types";

/**
 * PROTOTYPE DATA ONLY.
 * Role prices come from Staffly's price table (before GST).
 * Every worker, skill list, contact number and review below is FICTIONAL / SAMPLE.
 * None of this is real worker availability or real customer feedback.
 */

export interface SampleReview {
  who: string;
  stars: number;
  text: string;
}

export interface RoleInfo {
  id: RoleId;
  label: string;
  /** Short name for tiles */
  shortLabel: string;
  /** Internal worker pay rate per hour (INR). Not shown to managers. */
  workerRatePerHour: number;
  /** Price charged to the manager per worker, before GST. */
  price: Record<ShiftLength, number>;
  /** Draft copy written from the role name; edit freely. */
  overview: string;
  includes: string[];
  /** SAMPLE reviews: not from real customers. */
  sampleReviews: SampleReview[];
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
    sampleReviews: [
      { who: "Café manager", stars: 5, text: "Polite with guests and picked up our menu quickly." },
      { who: "Hotel restaurant lead", stars: 4, text: "Reliable during the lunch rush. Would book again." },
      { who: "Restaurant owner", stars: 5, text: "Arrived on time and needed very little guidance." },
    ],
  },
  {
    id: "kitchen_helper",
    label: "Kitchen helper",
    shortLabel: "Kitchen helper",
    workerRatePerHour: 85,
    price: { 5: 660, 8: 970 },
    overview: "Supports the kitchen team with prep work such as washing and cutting ingredients, keeping stations stocked and clean.",
    includes: ["Washing and chopping ingredients", "Keeping stations stocked", "Basic food prep as directed", "Tidying the kitchen between tasks"],
    sampleReviews: [
      { who: "Cloud kitchen owner", stars: 5, text: "Kept prep moving so the chefs could focus on cooking." },
      { who: "Café manager", stars: 4, text: "Hard-working and kept the station tidy." },
      { who: "Hotel kitchen supervisor", stars: 4, text: "Followed instructions well on a busy evening." },
    ],
  },
  {
    id: "dishwasher",
    label: "Dishwasher / pot washer",
    shortLabel: "Dishwasher",
    workerRatePerHour: 80,
    price: { 5: 640, 8: 940 },
    overview: "Keeps plates, glasses, cutlery, pots and pans clean and ready so service never stalls.",
    includes: ["Washing dishes, glasses and cutlery", "Scrubbing pots and pans", "Putting clean items back in place", "Keeping the wash area tidy"],
    sampleReviews: [
      { who: "Restaurant owner", stars: 5, text: "Never let the dish pile build up, even at peak time." },
      { who: "Banquet manager", stars: 4, text: "Quick and thorough on a big event night." },
      { who: "Café manager", stars: 4, text: "Dependable and no fuss." },
    ],
  },
  {
    id: "food_runner",
    label: "Food runner and table busser",
    shortLabel: "Food runner",
    workerRatePerHour: 85,
    price: { 5: 660, 8: 970 },
    overview: "Carries food from kitchen to table and clears used plates, helping servers turn tables faster.",
    includes: ["Running orders to the right table", "Clearing used plates and glasses", "Wiping and resetting tables", "Supporting the waiting staff"],
    sampleReviews: [
      { who: "Restaurant manager", stars: 5, text: "Quick on their feet and always checked the table number." },
      { who: "Hotel F&B lead", stars: 4, text: "Made our weekend dinner service much smoother." },
      { who: "Café owner", stars: 4, text: "Friendly and attentive." },
    ],
  },
  {
    id: "takeaway_packer",
    label: "Takeaway packing and order handover",
    shortLabel: "Takeaway packer",
    workerRatePerHour: 85,
    price: { 5: 660, 8: 970 },
    overview: "Packs takeaway and delivery orders carefully and hands them over to riders or customers.",
    includes: ["Packing orders and checking items", "Sealing and labelling bags", "Handing orders to riders or customers", "Keeping the packing counter organised"],
    sampleReviews: [
      { who: "Cloud kitchen owner", stars: 5, text: "Orders went out neat and complete during the dinner peak." },
      { who: "Café manager", stars: 4, text: "Careful with packing, very few mistakes." },
      { who: "Restaurant owner", stars: 4, text: "Handled rider handovers calmly." },
    ],
  },
  {
    id: "cleaner",
    label: "Cleaner (floor, tables, washrooms)",
    shortLabel: "Cleaner",
    workerRatePerHour: 80,
    price: { 5: 640, 8: 940 },
    overview: "Keeps floors, tables and washrooms clean and presentable for guests throughout the shift.",
    includes: ["Sweeping and mopping floors", "Wiping tables and surfaces", "Cleaning and restocking washrooms", "Emptying bins"],
    sampleReviews: [
      { who: "Hotel manager", stars: 5, text: "Washrooms and floors stayed spotless all day." },
      { who: "Restaurant owner", stars: 4, text: "Thorough and unobtrusive while guests were around." },
      { who: "Café manager", stars: 4, text: "Took initiative to keep things tidy." },
    ],
  },
];

export function roleInfo(id: RoleId): RoleInfo {
  const role = ROLES.find((r) => r.id === id);
  if (!role) throw new Error(`Unknown role: ${id}`);
  return role;
}

/** Average of the SAMPLE reviews, one decimal. Always shown with a "sample" label. */
export function sampleRating(id: RoleId): number {
  const reviews = roleInfo(id).sampleReviews;
  return Math.round((reviews.reduce((s, r) => s + r.stars, 0) / reviews.length) * 10) / 10;
}

// Working-window patterns (hours). Staggered on purpose so that some start times
// are unavailable and others are free, which makes the demo realistic.
const EARLY: [number, number] = [6, 16];
const MID: [number, number] = [9, 19];
const LATE: [number, number] = [12, 22];
const FULL: [number, number] = [6, 22];

// Fictional skill sets, picked deterministically per worker.
const ROLE_SKILLS: Record<RoleId, string[]> = {
  waiter: ["Table service", "Order taking", "Menu knowledge", "Guest handling", "Tray carrying"],
  kitchen_helper: ["Vegetable prep", "Ingredient washing", "Station set-up", "Kitchen hygiene", "Basic food prep"],
  dishwasher: ["Dishwashing", "Pot scrubbing", "Glassware care", "Sanitising", "Wash-area upkeep"],
  food_runner: ["Order running", "Table busing", "Table resetting", "Team coordination", "Fast service"],
  takeaway_packer: ["Order packing", "Item checking", "Sealing and labelling", "Rider handover", "Counter upkeep"],
  cleaner: ["Floor mopping", "Washroom cleaning", "Surface wiping", "Waste disposal", "Restocking supplies"],
};

let contactCounter = 100;

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
  const n = ++contactCounter;
  const skills = [0, 1, 2].map((i) => base[(n + i) % base.length]);
  return {
    id,
    name,
    role,
    yearsExperience: years,
    languages,
    skills,
    // Clearly fake (all zeros): can never be a real person's number.
    contact: `+91 00000 00${n}`,
    workStartHour: start,
    workEndHour: end,
    weeklyOff,
  };
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
  // Roles with two workers overlap in the middle of the day, so booking both is possible.
  w("t2", "Divya Demo", "takeaway_packer", 3, ["Hindi", "Telugu"], MID, 3),

  w("c1", "Mohan Demo", "cleaner", 6, ["Hindi"], EARLY, 2),
  w("c2", "Rekha Demo", "cleaner", 4, ["Hindi", "English"], MID, 5),
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
