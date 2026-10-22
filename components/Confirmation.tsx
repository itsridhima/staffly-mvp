"use client";

import { ROLES } from "@/lib/prototypeData";
import type { Booking } from "@/lib/types";
import BillPanel from "./BillPanel";
import WorkerCard from "./WorkerCard";

interface Props {
  booking: Booking;
  saveError: string | null;
  onViewBookings: () => void;
  onReset: () => void;
}

export default function Confirmation({ booking, saveError, onViewBookings, onReset }: Props) {
  return (
    <section className="space-y-4">
      <div className="glass-dark p-5">
        <p className="text-sm font-medium text-sky-200">Booking confirmed</p>
        <p className="text-3xl font-black tracking-wide" data-testid="booking-reference">
          {booking.reference}
        </p>
        <p className="mt-2 text-sm text-sky-100">
          Your booking is confirmed. Track each worker under Profile → My bookings. Online payment isn&apos;t switched on yet, so nothing has been charged.
        </p>
      </div>

      {saveError && <p role="alert" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{saveError}</p>}

      {booking.venue && (
        <div className="glass p-4 text-sm">
          <div className="muted text-xs">Shift location</div>
          <div className="font-bold">{booking.venue.label}</div>
          <div className="muted">{booking.venue.address}</div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Your workers</h2>
        {ROLES.map((role) => {
          const group = booking.workers.filter((w) => w.role === role.id);
          if (group.length === 0) return null;
          return (
            <div key={role.id} className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-600">{role.label}</h3>
              {group.map((tw) => {
                const line = booking.lines.find((l) => l.id === tw.lineId);
                return line ? <WorkerCard key={tw.trackingId} tracked={tw} line={line} /> : null;
              })}
            </div>
          );
        })}
      </div>

      <BillPanel lines={booking.lines} withGst title="Bill" />

      <div className="flex gap-2">
        <button type="button" onClick={onViewBookings} className="btn-ghost px-4 py-3">
          My bookings
        </button>
        <button type="button" onClick={onReset} className="btn-primary flex-1 px-4 py-3">
          Book another shift
        </button>
      </div>
    </section>
  );
}
