import { displayName } from "./prototypeData";
import type { Booking, RoleId } from "./types";

export interface RoleReview {
  trackingId: string;
  stars: number;
  note?: string;
  workerName: string;
  /** ISO timestamp */
  at: string;
}

/** Ratings the employer has given to workers in this role after completed shifts, newest first. */
export function reviewsForRole(bookings: Booking[], role: RoleId): RoleReview[] {
  const reviews: RoleReview[] = [];
  for (const booking of bookings) {
    for (const tw of booking.workers) {
      if (tw.role !== role || !tw.rating) continue;
      reviews.push({
        trackingId: tw.trackingId,
        stars: tw.rating.stars,
        note: tw.rating.note,
        workerName: displayName(tw.worker.name),
        at: tw.rating.at,
      });
    }
  }
  return reviews.sort((a, b) => b.at.localeCompare(a.at));
}

export function averageStars(reviews: RoleReview[]): number | null {
  if (reviews.length === 0) return null;
  return Math.round((reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length) * 10) / 10;
}
