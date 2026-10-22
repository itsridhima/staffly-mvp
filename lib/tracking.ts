import { isWorkerFree } from "./availability";
import { ledgerFromBookings } from "./ledger";
import { roleInfo, WORKERS } from "./prototypeData";
import type { Booking, LedgerEntry, TrackedWorker, TrackingStatus, Worker } from "./types";

/**
 * PROTOTYPE tracking. In real life Staffly would phone the worker, and the worker would reply.
 * Here those events are triggered by the "Demo controls" buttons and nothing is actually sent.
 */

export const STATUS_LABEL: Record<TrackingStatus | "rate", string> = {
  booked: "Booked",
  confirmation_check: "Confirmation check",
  on_the_way: "On the way",
  replacement_arranged: "Replacement arranged",
  on_duty: "On duty",
  completed: "Shift completed",
  rate: "Rate your experience",
};

export const STATUS_DESCRIPTION: Record<TrackingStatus | "rate", string> = {
  booked: "A worker has been assigned to your shift.",
  confirmation_check: "One hour before the shift, a Staffly representative calls the worker to confirm they will arrive.",
  on_the_way: "The worker confirmed and is coming.",
  replacement_arranged: "The worker couldn't come or didn't respond, so Staffly arranged a replacement.",
  on_duty: "The worker has arrived and started the shift.",
  completed: "The worker has completed the shift.",
  rate: "Tell us how the shift went.",
};

export type TrackingAction = "call" | "confirm" | "cannot_come" | "arrive" | "finish";

/** Which demo actions make sense right now. */
export function availableActions(tw: TrackedWorker): TrackingAction[] {
  switch (tw.status) {
    case "booked":
      return ["call"];
    case "confirmation_check":
      return ["confirm", "cannot_come"];
    case "on_the_way":
    case "replacement_arranged":
      return ["arrive"];
    case "on_duty":
      return ["finish"];
    default:
      return [];
  }
}

export type TrackingResult = { ok: true; booking: Booking } | { ok: false; reason: string };

function patchWorker(booking: Booking, trackingId: string, patch: (tw: TrackedWorker) => TrackedWorker): Booking {
  return { ...booking, workers: booking.workers.map((tw) => (tw.trackingId === trackingId ? patch(tw) : tw)) };
}

function findTracked(booking: Booking, trackingId: string): TrackedWorker | undefined {
  return booking.workers.find((tw) => tw.trackingId === trackingId);
}

/**
 * Cancels the original worker's booking and assigns a free worker of the same role to the SAME
 * tracking id. Returns a reason if nobody in the demo pool is free.
 */
export function arrangeReplacement(
  booking: Booking,
  trackingId: string,
  allBookings: Booking[],
  demoEntries: LedgerEntry[],
  now: Date,
  workers: Worker[] = WORKERS,
): TrackingResult {
  const tw = findTracked(booking, trackingId);
  const line = tw && booking.lines.find((l) => l.id === tw.lineId);
  if (!tw || !line) return { ok: false, reason: "Booking not found" };

  const ledger = ledgerFromBookings(allBookings, demoEntries);
  const replacement = workers.find(
    (w) => w.role === tw.role && w.id !== tw.worker.id && isWorkerFree(w, line, ledger),
  );
  if (!replacement) {
    return { ok: false, reason: `No other ${roleInfo(tw.role).label} is free for this shift in the demo pool` };
  }

  const at = now.toISOString();
  return {
    ok: true,
    booking: patchWorker(booking, trackingId, (t) => ({
      ...t,
      worker: replacement,
      status: "replacement_arranged",
      replaced: [...t.replaced, { worker: t.worker, at }],
      history: [
        ...t.history,
        {
          status: "replacement_arranged",
          at,
          note: `${t.worker.name}'s booking was cancelled. ${replacement.name} will cover the shift.`,
        },
      ],
    })),
  };
}

/** Applies one demo action. Replacement needs the wider booking list to find a free worker. */
export function applyAction(
  booking: Booking,
  trackingId: string,
  action: TrackingAction,
  now: Date,
  context: { allBookings: Booking[]; demoEntries: LedgerEntry[] },
  workers: Worker[] = WORKERS,
): TrackingResult {
  const tw = findTracked(booking, trackingId);
  if (!tw) return { ok: false, reason: "Booking not found" };
  if (!availableActions(tw).includes(action)) return { ok: false, reason: "That step isn't available right now" };

  if (action === "cannot_come") return arrangeReplacement(booking, trackingId, context.allBookings, context.demoEntries, now, workers);

  const at = now.toISOString();
  const next: Record<Exclude<TrackingAction, "cannot_come">, { status: TrackingStatus; note: string }> = {
    call: { status: "confirmation_check", note: "Staffly representative called the worker (simulated)." },
    confirm: { status: "on_the_way", note: `${tw.worker.name} confirmed and is on the way.` },
    arrive: { status: "on_duty", note: `${tw.worker.name} arrived and started the shift.` },
    finish: { status: "completed", note: `${tw.worker.name} completed the shift.` },
  };
  const step = next[action];
  return {
    ok: true,
    booking: patchWorker(booking, trackingId, (t) => ({
      ...t,
      status: step.status,
      history: [...t.history, { status: step.status, at, note: step.note }],
    })),
  };
}

/** Ratings are allowed only after the shift is completed, and only once. */
export function rateWorker(
  booking: Booking,
  trackingId: string,
  stars: number,
  note: string | undefined,
  now: Date,
): TrackingResult {
  const tw = findTracked(booking, trackingId);
  if (!tw) return { ok: false, reason: "Booking not found" };
  if (tw.status !== "completed") return { ok: false, reason: "You can rate after the shift is completed" };
  if (tw.rating) return { ok: false, reason: "Already rated" };
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { ok: false, reason: "Choose 1 to 5 stars" };
  const at = now.toISOString();
  const cleanNote = note?.trim().slice(0, 300) || undefined;
  return {
    ok: true,
    booking: patchWorker(booking, trackingId, (t) => ({
      ...t,
      rating: { stars, note: cleanNote, at },
      history: [...t.history, { status: "rated", at, note: `Rated ${stars} out of 5` }],
    })),
  };
}
