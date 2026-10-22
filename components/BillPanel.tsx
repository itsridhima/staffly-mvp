import { billBreakdown, formatINR, GST_RATE } from "@/lib/pricing";
import type { Order, ShiftLength } from "@/lib/types";

interface Props {
  order: Order;
  length: ShiftLength;
  /** Show GST and grand total (payment page / confirmation) */
  withGst?: boolean;
  title?: string;
}

export default function BillPanel({ order, length, withGst = false, title = "Your order" }: Props) {
  const bill = billBreakdown(order, length);
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm" aria-label={title}>
      <h3 className="mb-2 font-semibold">{title}</h3>
      {bill.lines.length === 0 ? (
        <p className="text-sm text-stone-500">No workers added yet.</p>
      ) : (
        <dl className="space-y-1 text-sm">
          {bill.lines.map((l) => (
            <div key={l.role} className="flex justify-between gap-3">
              <dt>
                {l.qty} × {l.label}
              </dt>
              <dd className="whitespace-nowrap">{formatINR(l.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-stone-200 pt-1 font-medium">
            <dt>Item total{withGst ? "" : " (excl. GST)"}</dt>
            <dd>{formatINR(bill.itemTotal)}</dd>
          </div>
          {withGst && (
            <>
              <div className="flex justify-between">
                <dt>GST ({Math.round(GST_RATE * 100)}%, placeholder rate)</dt>
                <dd>{formatINR(bill.gst)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-300 pt-1 text-base font-bold">
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
