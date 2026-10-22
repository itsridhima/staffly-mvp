import { formatINR } from "./pricing";
import { roleInfo } from "./prototypeData";
import type { Booking } from "./types";

export type BookingFilter = "all" | "upcoming" | "completed" | "multiple";

export const FILTER_LABEL: Record<BookingFilter, string> = {
  all: "All bookings",
  upcoming: "Upcoming",
  completed: "Completed",
  multiple: "Multiple roles",
};

/** A booking is completed when every one of its workers has finished the shift. */
export function isCompleted(b: Booking): boolean {
  return b.workers.length > 0 && b.workers.every((w) => w.status === "completed");
}

export function isMultiRole(b: Booking): boolean {
  return new Set(b.lines.map((l) => l.role)).size > 1;
}

export function filterBookings(bookings: Booking[], filter: BookingFilter): Booking[] {
  switch (filter) {
    case "upcoming":
      return bookings.filter((b) => !isCompleted(b));
    case "completed":
      return bookings.filter(isCompleted);
    case "multiple":
      return bookings.filter(isMultiRole);
    default:
      return bookings;
  }
}

export function newestFirst(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** "2 × Kitchen helper, 1 × Waiter / steward" */
export function bookingSummary(b: Booking): string {
  return b.lines.map((l) => `${l.qty} × ${roleInfo(l.role).label}`).join(", ");
}

export function paymentsSummary(bookings: Booking[]): { count: number; total: number } {
  return { count: bookings.length, total: bookings.reduce((sum, b) => sum + b.bill.grandTotal, 0) };
}

export const PAY_METHOD_LABEL: Record<NonNullable<Booking["paymentMethod"]>, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
};

export function totalLabel(b: Booking): string {
  return formatINR(b.bill.grandTotal);
}
