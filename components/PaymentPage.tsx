"use client";

import { billBreakdown, formatINR } from "@/lib/pricing";
import type { Order, Slot } from "@/lib/types";
import BillPanel from "./BillPanel";
import DemoTakeSlotButton from "./DemoTakeSlotButton";
import ShiftSummary from "./ShiftSummary";

export type PayMethod = "upi" | "card" | "netbanking";

const METHODS: { id: PayMethod; label: string }[] = [
  { id: "upi", label: "UPI" },
  { id: "card", label: "Credit / debit card" },
  { id: "netbanking", label: "Net banking" },
];

interface Props {
  order: Order;
  slot: Slot;
  method: PayMethod;
  onMethod: (m: PayMethod) => void;
  onPay: () => void;
  onBack: () => void;
  onDemoTake: () => void;
}

export default function PaymentPage({ order, slot, method, onMethod, onPay, onBack, onDemoTake }: Props) {
  const bill = billBreakdown(order, slot.length);
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Payment</h2>
      <ShiftSummary slot={slot} />
      <BillPanel order={order} length={slot.length} withGst title="Bill details" />

      <fieldset className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <legend className="px-1 font-semibold">Pay using</legend>
        <div className="space-y-2">
          {METHODS.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-3">
              <input type="radio" name="pay-method" checked={method === m.id} onChange={() => onMethod(m.id)} />
              {m.label}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Prototype: no real money moves and no card or UPI details are collected. You&apos;ll see a simulated bank
          page next.
        </p>
      </fieldset>

      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="rounded-xl border border-stone-300 px-4 py-3 font-medium">
          Back
        </button>
        <button
          type="button"
          onClick={onPay}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
        >
          Pay {formatINR(bill.grandTotal)}
        </button>
      </div>
      <DemoTakeSlotButton onClick={onDemoTake} />
    </section>
  );
}
