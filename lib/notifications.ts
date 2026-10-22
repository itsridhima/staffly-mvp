import type { Booking, TrackingStatus } from "./types";

/** In-app notifications derived from tracking updates (simulated; nothing is pushed anywhere). */
export interface AppNotification {
  id: string;
  at: string;
  title: string;
  body: string;
  reference: string;
}

const TITLES: Partial<Record<TrackingStatus, string>> = {
  replacement_arranged: "Replacement arranged",
  on_the_way: "Worker is on the way",
  on_duty: "Worker is on duty",
  completed: "Shift completed",
};

export function deriveNotifications(bookings: Booking[]): AppNotification[] {
  const items: AppNotification[] = [];
  for (const booking of bookings) {
    for (const tw of booking.workers) {
      tw.history.forEach((event, i) => {
        if (event.status === "booked" || event.status === "rated" || event.status === "confirmation_check") return;
        const title = TITLES[event.status];
        if (!title) return;
        items.push({
          id: `${tw.trackingId}-${i}`,
          at: event.at,
          title,
          body: `${tw.trackingId}: ${event.note ?? title}`,
          reference: booking.reference,
        });
      });
    }
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}
