import { describe, expect, it } from "vitest";
import { canStaff, findNearestAlternatives, getSlots } from "./availability";
import { confirmBooking, simulateOtherBooking } from "./booking";
import { billBreakdown, orderTotal } from "./pricing";
import { maxQuantity, ROLES, WORKERS } from "./prototypeData";
import type { Order, Slot } from "./types";

// Thursday 22 Oct 2026, 08:00. Monday 26 Oct 2026 is a normal future day.
const NOW = new Date(2026, 9, 22, 8, 0);
const MONDAY = "2026-10-26";
const noon = 12 * 60;

describe("Test 1: slots and prices", () => {
  it("matches Staffly's price table for all 6 roles x 2 shift lengths", () => {
    const expected: Record<string, [number, number]> = {
      waiter: [690, 1020],
      kitchen_helper: [660, 970],
      dishwasher: [640, 940],
      food_runner: [660, 970],
      takeaway_packer: [660, 970],
      cleaner: [640, 940],
    };
    for (const role of ROLES) {
      expect(orderTotal({ [role.id]: 1 }, 5)).toBe(expected[role.id][0]);
      expect(orderTotal({ [role.id]: 1 }, 8)).toBe(expected[role.id][1]);
    }
  });

  it("builds a multi-role bill with GST", () => {
    const bill = billBreakdown({ kitchen_helper: 2, waiter: 1 }, 5);
    expect(bill.lines.map((l) => [l.role, l.qty, l.amount])).toEqual([
      ["waiter", 1, 690],
      ["kitchen_helper", 2, 1320],
    ]);
    expect(bill.itemTotal).toBe(2010);
    expect(bill.gst).toBe(362); // 2010 * 18% = 361.8
    expect(bill.grandTotal).toBe(2372);
  });

  it("flags slots with too few free workers as unavailable, with a reason", () => {
    const order: Order = { cleaner: 2 };
    const slots = getSlots(order, 5, MONDAY, noon, [], NOW);
    expect(slots.map((s) => s.startMinutes)).toEqual([660, 720, 780, 840]);
    const atNoon = slots.find((s) => s.startMinutes === noon)!;
    expect(atNoon.available).toBe(false);
    expect(atNoon.reason).toMatch(/Only 1 Cleaner/);
    expect(atNoon.total).toBe(1280);
  });

  it("marks times that have already passed as unavailable", () => {
    const today = "2026-10-22";
    const result = canStaff({ waiter: 1 }, { date: today, startMinutes: 7 * 60, length: 5 }, [], NOW);
    expect(result.ok).toBe(false);
  });

  it("limits quantity per role to the demo pool size", () => {
    expect(maxQuantity("cleaner")).toBe(2);
    expect(maxQuantity("waiter")).toBe(WORKERS.filter((w) => w.role === "waiter").length);
  });
});

describe("Test 2: confirming a booking", () => {
  const order: Order = { kitchen_helper: 2, waiter: 1 };
  const slot: Slot = { date: MONDAY, startMinutes: noon, length: 5 };

  it("assigns exactly the requested workers per role and returns a reference", () => {
    const result = confirmBooking(order, slot, [], NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.booking.reference).toMatch(/^STF-[A-Z0-9]{5}$/);
    expect(result.booking.workers.filter((w) => w.role === "kitchen_helper")).toHaveLength(2);
    expect(result.booking.workers.filter((w) => w.role === "waiter")).toHaveLength(1);
    expect(result.booking.workers.every((w) => w.worker.role === w.role)).toBe(true);
    expect(result.ledger).toHaveLength(3);
    expect(result.booking.bill.grandTotal).toBe(2372);
  });

  it("does not double-book the same workers", () => {
    const first = confirmBooking(order, slot, [], NOW);
    if (!first.ok) throw new Error("first booking should succeed");
    const second = confirmBooking(order, slot, first.ledger, NOW);
    expect(second.ok).toBe(false);
  });
});

describe("Test 3: slot taken before confirming", () => {
  const order: Order = { cleaner: 1 };
  const slot: Slot = { date: MONDAY, startMinutes: noon, length: 5 };

  it("refuses to book, leaves the ledger untouched, and offers alternatives", () => {
    expect(canStaff(order, slot, [], NOW).ok).toBe(true);

    const takenLedger = simulateOtherBooking(order, slot, []);
    const result = confirmBooking(order, slot, takenLedger, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("slot_taken");

    const alternatives = findNearestAlternatives(order, 5, MONDAY, noon, takenLedger, NOW);
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.length).toBeLessThanOrEqual(3);
    expect(alternatives[0].startMinutes).toBe(11 * 60); // nearest first
    for (const alt of alternatives) {
      expect(alt.startMinutes).not.toBe(noon);
      const check = canStaff(order, { ...slot, startMinutes: alt.startMinutes }, takenLedger, NOW);
      expect(check.ok).toBe(true);
    }
  });

  it("an alternative can then be booked", () => {
    const takenLedger = simulateOtherBooking(order, slot, []);
    const [alt] = findNearestAlternatives(order, 5, MONDAY, noon, takenLedger, NOW);
    const result = confirmBooking(order, { ...slot, startMinutes: alt.startMinutes }, takenLedger, NOW);
    expect(result.ok).toBe(true);
  });
});
