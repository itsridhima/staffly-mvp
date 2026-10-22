import { roleInfo } from "./prototypeData";
import type { Bill, BillLine, BookingLine, LineSpec, ShiftLength } from "./types";

/**
 * PLACEHOLDER: the real GST rate has not been confirmed by Staffly.
 * Change this one number once the real rate is known.
 */
export const GST_RATE = 0.18;

export function headcount(lines: BookingLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function unitPrice(role: BookingLine["role"], length: ShiftLength): number {
  return roleInfo(role).price[length];
}

/** Price of one line (qty x price for that role and shift length), before GST. */
export function lineTotal(line: Pick<LineSpec, "role" | "qty" | "length">): number {
  return line.qty * unitPrice(line.role, line.length);
}

export function billBreakdown(lines: BookingLine[], gstRate: number = GST_RATE): Bill {
  const billLines: BillLine[] = lines
    .filter((l) => l.qty > 0)
    .map((l) => ({
      lineId: l.id,
      role: l.role,
      label: roleInfo(l.role).label,
      qty: l.qty,
      unitPrice: unitPrice(l.role, l.length),
      amount: lineTotal(l),
      length: l.length,
      date: l.date,
      startMinutes: l.startMinutes,
    }));
  const itemTotal = billLines.reduce((sum, l) => sum + l.amount, 0);
  const gst = Math.round(itemTotal * gstRate);
  return { lines: billLines, itemTotal, gstRate, gst, grandTotal: itemTotal + gst };
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
