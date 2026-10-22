"use client";

import { roleInfo } from "@/lib/prototypeData";
import { availableActions, type TrackingAction } from "@/lib/tracking";
import { formatDateLong, formatTimeRange } from "@/lib/time";
import type { Booking } from "@/lib/types";
import BillPanel from "./BillPanel";
import RatingForm from "./RatingForm";
import TrackingTimeline from "./TrackingTimeline";
import WorkerCard from "./WorkerCard";

const ACTION_LABEL: Record<TrackingAction, string> = {
  call: "Staffly confirmation call (1 hour before shift)",
  confirm: "Worker confirms they're coming",
  cannot_come: "Worker can't come / doesn't answer",
  arrive: "Worker arrives and starts",
  finish: "Shift ends",
};

interface Props {
  booking: Booking;
  notice: string | null;
  onAction: (trackingId: string, action: TrackingAction) => void;
  onRate: (trackingId: string, stars: number, note: string) => void;
  /** Developer tools (?dev=1): buttons that move a worker through the tracking steps for testing */
  devTools?: boolean;
}

export default function BookingDetail({ booking, notice, onAction, onRate, devTools = false }: Props) {
  return (
    <div className="space-y-5">
      <section className="glass-dark p-5">
        <p className="text-sm text-sky-200">Booking reference</p>
        <p className="font-mono text-2xl font-black">{booking.reference}</p>
        <p className="mt-1 text-xs text-sky-200">Each worker has a tracking ID. Updates appear below as your shift gets closer.</p>
      </section>

      {notice && (
        <p role="status" className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {notice}
        </p>
      )}

      {booking.venue && (
        <div className="glass p-4 text-sm">
          <div className="muted text-xs">Shift location</div>
          <div className="font-bold">{booking.venue.label}</div>
          <div className="muted">{booking.venue.address}</div>
        </div>
      )}

      {booking.lines.map((line) => {
        const workers = booking.workers.filter((w) => w.lineId === line.id);
        return (
          <section key={line.id} className="space-y-3" aria-label={roleInfo(line.role).label}>
            <div>
              <h2 className="text-lg font-black">
                {line.qty} × {roleInfo(line.role).label}
              </h2>
              <p className="muted text-sm">
                {line.length}-hour shift · {formatDateLong(line.date)} · {formatTimeRange(line.startMinutes, line.length)}
              </p>
            </div>
            {workers.map((tw) => {
              const actions = availableActions(tw);
              return (
                <div key={tw.trackingId} className="space-y-3">
                  <WorkerCard tracked={tw} line={line} showStatus />
                  <div className="glass p-4">
                    <h3 className="mb-3 font-bold">Tracking · {tw.trackingId}</h3>
                    <TrackingTimeline tracked={tw} />
                    <RatingForm tracked={tw} onSubmit={(stars, note) => onRate(tw.trackingId, stars, note)} />

                    {devTools && actions.length > 0 && (
                      <div className="mt-3 rounded-2xl border border-dashed border-amber-400 bg-amber-50/80 p-3">
                        <p className="mb-2 text-xs font-semibold text-amber-900">
                          Developer tools: move this worker to the next tracking step for testing.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {actions.map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => onAction(tw.trackingId, a)}
                              className="rounded-xl border border-amber-500 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
                            >
                              {ACTION_LABEL[a]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      <BillPanel lines={booking.lines} withGst title="Bill" />
    </div>
  );
}
