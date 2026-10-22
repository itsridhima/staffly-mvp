"use client";

import { formatINR } from "@/lib/pricing";
import { maxQuantity, ROLES } from "@/lib/prototypeData";
import type { Order, RoleId, ShiftLength } from "@/lib/types";
import QuantityStepper from "./QuantityStepper";

interface Props {
  order: Order;
  length: ShiftLength;
  onChange: (role: RoleId, qty: number) => void;
}

export default function RoleMenu({ order, length, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">2. Choose your crew</h2>
      <p className="mb-3 text-sm text-stone-600">
        Add as many people as you need, from any mix of roles. Prices are per person for a {length}-hour shift, excl.
        GST.
      </p>
      <ul className="divide-y divide-stone-100">
        {ROLES.map((role) => (
          <li key={role.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <div className="font-medium">{role.label}</div>
              <div className="text-sm text-stone-600">{formatINR(role.price[length])} per person</div>
            </div>
            <QuantityStepper
              label={role.label}
              value={order[role.id] ?? 0}
              max={maxQuantity(role.id)}
              onChange={(v) => onChange(role.id, v)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
