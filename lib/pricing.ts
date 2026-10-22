import { roleInfo, ROLES } from "./prototypeData";
import type { Bill, BillLine, Order, ShiftLength } from "./types";

/**
 * PLACEHOLDER: the real GST rate has not been confirmed by Staffly.
 * Change this one number once the real rate is known.
 */
export const GST_RATE = 0.18;

export function orderHeadcount(order: Order): number {
  return Object.values(order).reduce((sum, qty) => sum + (qty ?? 0), 0);
}

export function billBreakdown(order: Order, length: ShiftLength, gstRate: number = GST_RATE): Bill {
  const lines: BillLine[] = [];
  for (const role of ROLES) {
    const qty = order[role.id] ?? 0;
    if (qty <= 0) continue;
    const unitPrice = role.price[length];
    lines.push({ role: role.id, label: roleInfo(role.id).label, qty, unitPrice, amount: qty * unitPrice });
  }
  const itemTotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const gst = Math.round(itemTotal * gstRate);
  return { lines, itemTotal, gstRate, gst, grandTotal: itemTotal + gst };
}

export function orderTotal(order: Order, length: ShiftLength): number {
  return billBreakdown(order, length).itemTotal;
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
