export type RoleId =
  | "waiter"
  | "kitchen_helper"
  | "dishwasher"
  | "food_runner"
  | "takeaway_packer"
  | "cleaner";

export type ShiftLength = 5 | 8;

/** PROTOTYPE DATA: every worker is fictional. */
export interface Worker {
  id: string;
  name: string;
  role: RoleId;
  yearsExperience: number;
  languages: string[];
  skills: string[];
  /** Obviously fake number, shown as "Demo contact". */
  contact: string;
  /** Working window each day, in hours (24h clock). */
  workStartHour: number;
  workEndHour: number;
  /** Weekday the worker is off (0 = Sunday ... 6 = Saturday). */
  weeklyOff: number;
}

/** One role in a booking, with its own shift. A booking can hold many lines. */
export interface BookingLine {
  id: string;
  role: RoleId;
  qty: number;
  length: ShiftLength;
  /** YYYY-MM-DD */
  date: string;
  /** Minutes after midnight */
  startMinutes: number;
}

/** A line that hasn't been given an id yet (used when checking availability). */
export type LineSpec = Omit<BookingLine, "id">;

export interface LedgerEntry {
  workerId: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  /** "demo" = created by the "simulate another manager" tool */
  source: "booking" | "demo";
  trackingId?: string;
}

export type Ledger = LedgerEntry[];

export interface BillLine {
  lineId: string;
  role: RoleId;
  label: string;
  qty: number;
  unitPrice: number;
  amount: number;
  length: ShiftLength;
  date: string;
  startMinutes: number;
}

export interface Bill {
  lines: BillLine[];
  itemTotal: number;
  gstRate: number;
  gst: number;
  grandTotal: number;
}

/** Tracking steps 1-6. Step 7 ("Rate your experience") is `completed` plus a rating. */
export type TrackingStatus =
  | "booked"
  | "confirmation_check"
  | "on_the_way"
  | "replacement_arranged"
  | "on_duty"
  | "completed";

export interface TrackEvent {
  status: TrackingStatus | "rated";
  /** ISO timestamp */
  at: string;
  note?: string;
}

export interface TrackedWorker {
  /** Stays the same even if the worker is replaced. */
  trackingId: string;
  lineId: string;
  role: RoleId;
  /** The worker currently assigned. */
  worker: Worker;
  status: TrackingStatus;
  history: TrackEvent[];
  /** Workers whose booking was cancelled and replaced, oldest first. */
  replaced: { worker: Worker; at: string }[];
  rating?: { stars: number; note?: string; at: string };
}

export interface Booking {
  reference: string;
  /** ISO timestamp */
  createdAt: string;
  lines: BookingLine[];
  workers: TrackedWorker[];
  bill: Bill;
}
