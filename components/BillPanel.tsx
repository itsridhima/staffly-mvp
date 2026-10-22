import { billBreakdown, formatINR, GST_RATE } from "@/lib/pricing";
import { formatDateLong, formatTimeRange } from "@/lib/time";
import type { BookingLine } from "@/lib/types";

interface Props {
  lines: BookingLine[];
  /** Show GST and grand total (payment page / confirmation) */
  withGst?: boolean;
  title?: string;
  dark?: boolean;
}

/** Every line keeps its own date, shift length and timing. */
export default function BillPanel({ lines, withGst = false, title = "Your booking", dark = false }: Props) {
  const bill = billBreakdown(lines);
  const sub = dark ? "text-sky-200" : "muted";
  return (
    <section className={`${dark ? "glass-dark" : "glass"} p-5`} aria-label={title}>
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      {bill.lines.length === 0 ? (
        <p className={`text-sm ${sub}`}>No workers added yet.</p>
      ) : (
        <dl className="space-y-3 text-sm">
          {bill.lines.map((l) => (
            <div key={l.lineId} className="flex justify-between gap-3">
              <dt>
                <span className="block font-semibold">
                  {l.qty} × {l.label}
                </span>
                <span className={`block text-xs ${sub}`}>
                  {l.length}-hour shift · {formatDateLong(l.date)} · {formatTimeRange(l.startMinutes, l.length)}
                </span>
                <span className={`block text-xs ${sub}`}>
                  {formatINR(l.unitPrice)} per person
                </span>
              </dt>
              <dd className="whitespace-nowrap font-semibold">{formatINR(l.amount)}</dd>
            </div>
          ))}
          <div className={`flex justify-between border-t pt-3 font-semibold ${dark ? "border-white/20" : "border-slate-200"}`}>
            <dt>Item total{withGst ? "" : " (excl. GST)"}</dt>
            <dd>{formatINR(bill.itemTotal)}</dd>
          </div>
          {withGst && (
            <>
              <div className="flex justify-between">
                <dt>GST ({Math.round(GST_RATE * 100)}%)</dt>
                <dd>{formatINR(bill.gst)}</dd>
              </div>
              <div className={`flex justify-between border-t pt-3 text-lg font-bold ${dark ? "border-white/20" : "border-slate-300"}`}>
                <dt>Grand total</dt>
                <dd>{formatINR(bill.grandTotal)}</dd>
              </div>
            </>
          )}
        </dl>
      )}
    </section>
  );
}
