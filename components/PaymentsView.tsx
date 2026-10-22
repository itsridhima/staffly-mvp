"use client";

import { bookingSummary, newestFirst, PAY_METHOD_LABEL, paymentsSummary } from "@/lib/bookingFilters";
import { formatINR } from "@/lib/pricing";
import type { Booking } from "@/lib/types";
import EmptyState from "./EmptyState";
import SubPageHeader from "./SubPageHeader";

interface Props {
  bookings: Booking[];
  onOpenBooking: (reference: string) => void;
  onBookNow: () => void;
  onBack: () => void;
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Bills for each booking. Online payment isn't switched on yet, so nothing has been charged. */
export default function PaymentsView({ bookings, onOpenBooking, onBookNow, onBack }: Props) {
  const { count, total } = paymentsSummary(bookings);
  const itemTotal = bookings.reduce((s, b) => s + b.bill.itemTotal, 0);
  const gst = bookings.reduce((s, b) => s + b.bill.gst, 0);

  return (
    <section className="space-y-4">
      <SubPageHeader title="Payments" subtitle="Your bills for each booking" onBack={onBack} />

      <div className="glass-dark p-5">
        <p className="text-sm text-sky-200">Total billed</p>
        <p className="text-4xl font-black">{formatINR(total)}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-sky-200">Shift charges</p>
            <p className="font-bold">{formatINR(itemTotal)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-sky-200">GST</p>
            <p className="font-bold">{formatINR(gst)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-sky-200">
          {count} {count === 1 ? "booking" : "bookings"}. Online payment isn&apos;t switched on yet, so nothing has been charged.
        </p>
      </div>

      <h2 className="text-lg font-black">Transactions</h2>
      {bookings.length === 0 ? (
        <EmptyState title="No transactions yet" body="Your bills appear here after you confirm a booking." actionLabel="Book now" onAction={onBookNow} />
      ) : (
        <ul className="space-y-3">
          {newestFirst(bookings).map((b) => (
            <li key={b.reference}>
              <button type="button" onClick={() => onOpenBooking(b.reference)} className="glass w-full space-y-1 p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono font-bold">{b.reference}</div>
                    <div className="muted text-xs">{when(b.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black">{formatINR(b.bill.grandTotal)}</div>
                    <div className="text-xs font-semibold text-emerald-700">Booked</div>
                  </div>
                </div>
                <p className="text-sm">{bookingSummary(b)}</p>
                <p className="muted text-xs">
                  {formatINR(b.bill.itemTotal)} + {formatINR(b.bill.gst)} GST
                  {b.paymentMethod ? ` · ${PAY_METHOD_LABEL[b.paymentMethod]}` : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
