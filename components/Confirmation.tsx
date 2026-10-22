"use client";

import { ROLES } from "@/lib/prototypeData";
import type { Booking } from "@/lib/types";
import BillPanel from "./BillPanel";
import ShiftSummary from "./ShiftSummary";
import WorkerCard from "./WorkerCard";

export default function Confirmation({ booking, onReset }: { booking: Booking; onReset: () => void }) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-emerald-600 p-5 text-white">
        <p className="text-sm font-medium">Booking confirmed</p>
        <p className="text-2xl font-bold tracking-wide" data-testid="booking-reference">
          {booking.reference}
        </p>
        <p className="mt-1 text-sm opacity-90">
          Prototype booking: no real payment was taken and no real worker has been notified.
        </p>
      </div>

      <ShiftSummary slot={booking.slot} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your workers</h2>
        {ROLES.map((role) => {
          const group = booking.workers.filter((w) => w.role === role.id);
          if (group.length === 0) return null;
          return (
            <div key={role.id}>
              <h3 className="mb-1 text-sm font-semibold text-stone-700">{role.label}</h3>
              <div className="space-y-2">
                {group.map((w) => (
                  <WorkerCard key={w.worker.id} worker={w.worker} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <BillPanel order={booking.order} length={booking.slot.length} withGst title="Bill" />

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
      >
        Book another shift
      </button>
    </section>
  );
}
