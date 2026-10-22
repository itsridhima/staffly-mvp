export type RoleId =
  | "waiter"
  | "kitchen_helper"
  | "dishwasher"
  | "food_runner"
  | "takeaway_packer"
  | "cleaner";

export type ShiftLength = 5 | 8;

/** How many workers of each role the manager wants, e.g. { kitchen_helper: 2, waiter: 1 } */
export type Order = Partial<Record<RoleId, number>>;

/** PROTOTYPE DATA: every worker is fictional. */
export interface Worker {
  id: string;
  name: string;
  role: RoleId;
  yearsExperience: number;
  languages: string[];
  /** Working window each day, in hours (24h clock). */
  workStartHour: number;
  workEndHour: number;
  /** Weekday the worker is off (0 = Sunday ... 6 = Saturday). */
  weeklyOff: number;
}

export interface Slot {
  /** YYYY-MM-DD */
  date: string;
  /** Minutes after midnight */
  startMinutes: number;
  length: ShiftLength;
}

export interface LedgerEntry {
  workerId: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  /** "demo" = created by the "simulate another manager" tool */
  source: "booking" | "demo";
}

export type Ledger = LedgerEntry[];

export interface BillLine {
  role: RoleId;
  label: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface Bill {
  lines: BillLine[];
  itemTotal: number;
  gstRate: number;
  gst: number;
  grandTotal: number;
}

export interface BookedWorker {
  role: RoleId;
  worker: Worker;
}

export interface Booking {
  reference: string;
  slot: Slot;
  order: Order;
  workers: BookedWorker[];
  bill: Bill;
}
