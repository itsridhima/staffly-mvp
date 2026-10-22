"use client";

import { billBreakdown, formatINR } from "@/lib/pricing";
import type { BookingLine } from "@/lib/types";
import BillPanel from "./BillPanel";
import DemoTakeSlotButton from "./DemoTakeSlotButton";

export type PayMethod = "upi" | "card" | "netbanking";

const METHODS: { id: PayMethod; label: string }[] = [
  { id: "upi", label: "UPI" },
  { id: "card", label: "Credit / debit card" },
  { id: "netbanking", label: "Net banking" },
];

interface Props {
  lines: BookingLine[];
  method: PayMethod;
  onMethod: (m: PayMethod) => void;
  onPay: () => void;
  onBack: () => void;
  /** Only passed when developer tools are on */
  onDemoTake?: () => void;
}

export default function PaymentPage({ lines, method, onMethod, onPay, onBack, onDemoTake }: Props) {
  const bill = billBreakdown(lines);
  return (
    <section className="space-y-4">
      <BillPanel lines={lines} withGst title="Bill details" />

      <fieldset className="glass p-4">
        <legend className="px-1 font-bold">Pay using</legend>
        <div className="space-y-2">
          {METHODS.map((m) => (
            <label key={m.id} className={`flex cursor-pointer items-center gap-3 px-3 py-3 ${method === m.id ? "glass-dark" : "neu"}`}>
              <input type="radio" name="pay-method" checked={method === m.id} onChange={() => onMethod(m.id)} />
              {m.label}
            </label>
          ))}
        </div>
        <p className="muted mt-3 text-xs">Online payment isn&apos;t switched on yet, so you won&apos;t be charged when you confirm.</p>
      </fieldset>

      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="btn-ghost px-4 py-3">
          Back
        </button>
        <button type="button" onClick={onPay} className="btn-primary flex-1 px-4 py-3">
          Pay {formatINR(bill.grandTotal)}
        </button>
      </div>
      {onDemoTake && <DemoTakeSlotButton onClick={onDemoTake} />}
    </section>
  );
}
