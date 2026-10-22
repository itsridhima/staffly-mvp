import { describe, expect, it } from "vitest";
import { assignLines, canStaffLine, findNearestAlternatives, getSlots } from "./availability";
import { confirmBooking, simulateOtherBooking } from "./booking";
import { ledgerFromBookings } from "./ledger";
import { billBreakdown, lineTotal } from "./pricing";
import { maxQuantity, ROLES, WORKERS } from "./prototypeData";
import { applyAction, availableActions, rateWorker } from "./tracking";
import type { Booking, BookingLine, LedgerEntry } from "./types";

// Thursday 22 Oct 2026, 08:00. Monday 26 Oct 2026 is a normal future day.
const NOW = new Date(2026, 9, 22, 8, 0);
const MONDAY = "2026-10-26";
const noon = 12 * 60;

let n = 0;
const line = (p: Partial<BookingLine> & Pick<BookingLine, "role">): BookingLine => ({
  id: `line${++n}`,
  qty: 1,
  length: 5,
  date: MONDAY,
  startMinutes: noon,
  ...p,
});

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
      expect(lineTotal({ role: role.id, qty: 1, length: 5 })).toBe(expected[role.id][0]);
      expect(lineTotal({ role: role.id, qty: 1, length: 8 })).toBe(expected[role.id][1]);
    }
  });

  it("builds a multi-role, multi-shift bill with GST and keeps each line's own shift", () => {
    const kitchen = line({ role: "kitchen_helper", qty: 2, length: 5, startMinutes: noon });
    const waiter = line({ role: "waiter", qty: 1, length: 8, startMinutes: 7 * 60, date: "2026-10-27" });
    const bill = billBreakdown([kitchen, waiter]);
    expect(bill.lines.map((l) => [l.role, l.qty, l.length, l.date, l.startMinutes, l.amount])).toEqual([
      ["kitchen_helper", 2, 5, MONDAY, noon, 1320],
      ["waiter", 1, 8, "2026-10-27", 420, 1020],
    ]);
    expect(bill.itemTotal).toBe(2340);
    expect(bill.gst).toBe(421); // 2340 * 18% = 421.2
    expect(bill.grandTotal).toBe(2761);
  });

  it("offers four slots, flags unstaffable ones with a reason, and the 2 PM demo slot as booked", () => {
    const slots = getSlots({ role: "cleaner", qty: 2, length: 5, date: MONDAY }, noon, [], NOW);
    expect(slots.map((s) => s.startMinutes)).toEqual([660, 720, 780, 840]);
    const atNoon = slots.find((s) => s.startMinutes === noon)!;
    expect(atNoon.available).toBe(false);
    expect(atNoon.reason).toMatch(/Only 1 Cleaner/);
    expect(atNoon.total).toBe(1280);

    const waiters = getSlots({ role: "waiter", qty: 1, length: 5, date: MONDAY }, noon, [], NOW);
    expect(waiters.map((s) => s.available)).toEqual([true, true, true, false]);
    expect(waiters[3].reason).toMatch(/Fully booked/);
  });

  it("marks times that have already passed as unavailable", () => {
    const result = canStaffLine({ role: "waiter", qty: 1, length: 5, date: "2026-10-22", startMinutes: 7 * 60 }, [], NOW);
    expect(result.ok).toBe(false);
  });

  it("limits quantity per role to the demo pool size", () => {
    expect(maxQuantity("cleaner")).toBe(2);
    expect(maxQuantity("waiter")).toBe(WORKERS.filter((w) => w.role === "waiter").length);
  });

  it("treats workers already held by other cart lines as busy (same role, overlapping times)", () => {
    // Only 2 cleaners exist. Cart already holds 1 cleaner at 10:00-15:00 on Monday.
    const cart = [line({ role: "cleaner", qty: 1, startMinutes: 10 * 60 })];
    const slots = getSlots({ role: "cleaner", qty: 2, length: 5, date: MONDAY }, 10 * 60, [], NOW, cart);
    expect(slots.find((s) => s.startMinutes === 10 * 60)!.available).toBe(false);
    // A different day (Wednesday) is unaffected by the cart line.
    const other = getSlots({ role: "cleaner", qty: 2, length: 5, date: "2026-10-28" }, 10 * 60, [], NOW, cart);
    expect(other.find((s) => s.startMinutes === 10 * 60)!.available).toBe(true);
  });
});

describe("Test 2: confirming a multi-role booking", () => {
  it("assigns the requested workers per line, each line with its own shift, and returns tracking IDs", () => {
    const lines = [
      line({ role: "kitchen_helper", qty: 2, length: 5, startMinutes: noon }),
      line({ role: "waiter", qty: 1, length: 8, startMinutes: 9 * 60 }),
    ];
    const result = confirmBooking(lines, [], NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { booking } = result;
    expect(booking.reference).toMatch(/^STF-[A-Z0-9]{5}$/);
    expect(booking.workers).toHaveLength(3);
    expect(booking.workers.filter((w) => w.lineId === lines[0].id)).toHaveLength(2);
    expect(booking.workers.every((w) => w.worker.role === w.role)).toBe(true);
    expect(booking.workers.every((w) => w.status === "booked" && w.history.length === 1)).toBe(true);
    const ids = booking.workers.map((w) => w.trackingId);
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toBe(`TRK-${booking.reference.slice(4)}-1`);
    expect(booking.bill.grandTotal).toBe(billBreakdown(lines).grandTotal);
  });

  it("does not double-book the same workers", () => {
    const lines = [line({ role: "kitchen_helper", qty: 2 })];
    const first = confirmBooking(lines, [], NOW);
    if (!first.ok) throw new Error("first booking should succeed");
    const second = confirmBooking([line({ role: "kitchen_helper", qty: 2 })], ledgerFromBookings([first.booking]), NOW);
    expect(second.ok).toBe(false);
  });

  it("two lines for the same role at overlapping times use different workers", () => {
    const result = assignLines(
      [line({ role: "waiter", qty: 1, startMinutes: 12 * 60 }), line({ role: "waiter", qty: 1, startMinutes: 13 * 60 })],
      [],
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = Object.values(result.assignments).flat().map((w) => w.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("Test 3: slot taken before confirming", () => {
  const cleaner = line({ role: "cleaner", qty: 1, startMinutes: noon });
  const kitchen = line({ role: "kitchen_helper", qty: 1, startMinutes: 10 * 60 });

  it("is all-or-nothing, names the failing line, and leaves nothing booked", () => {
    const demo = simulateOtherBooking(cleaner, []);
    const result = confirmBooking([kitchen, cleaner], demo, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("slot_taken");
    expect(result.lineId).toBe(cleaner.id);
  });

  it("offers nearest alternatives for that line only, closest first", () => {
    const demo = simulateOtherBooking(cleaner, []);
    const alternatives = findNearestAlternatives(cleaner, demo, NOW, [kitchen]);
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.length).toBeLessThanOrEqual(3);
    expect(alternatives[0].startMinutes).toBe(11 * 60);
    for (const alt of alternatives) {
      expect(alt.startMinutes).not.toBe(noon);
      expect(canStaffLine({ ...cleaner, startMinutes: alt.startMinutes }, demo, NOW).ok).toBe(true);
    }
  });

  it("an alternative can then be booked together with the other lines", () => {
    const demo = simulateOtherBooking(cleaner, []);
    const [alt] = findNearestAlternatives(cleaner, demo, NOW, [kitchen]);
    const result = confirmBooking([kitchen, { ...cleaner, startMinutes: alt.startMinutes }], demo, NOW);
    expect(result.ok).toBe(true);
  });
});

describe("Tracking", () => {
  function booked(): Booking {
    const result = confirmBooking([line({ role: "waiter", qty: 1, startMinutes: noon })], [], NOW);
    if (!result.ok) throw new Error("booking should succeed");
    return result.booking;
  }
  const ctx = (b: Booking) => ({ allBookings: [b], demoEntries: [] as LedgerEntry[] });

  it("follows the normal path: booked -> call -> confirm -> arrive -> finish -> rate", () => {
    let b = booked();
    const id = b.workers[0].trackingId;
    for (const action of ["call", "confirm", "arrive", "finish"] as const) {
      const r = applyAction(b, id, action, NOW, ctx(b));
      expect(r.ok).toBe(true);
      if (r.ok) b = r.booking;
    }
    expect(b.workers[0].status).toBe("completed");
    expect(b.workers[0].history.map((h) => h.status)).toEqual(["booked", "confirmation_check", "on_the_way", "on_duty", "completed"]);
    const rated = rateWorker(b, id, 5, "Great", NOW);
    expect(rated.ok).toBe(true);
    if (rated.ok) expect(rated.booking.workers[0].rating?.stars).toBe(5);
  });

  it("rejects out-of-order steps and early or repeated ratings", () => {
    const b = booked();
    const id = b.workers[0].trackingId;
    expect(applyAction(b, id, "arrive", NOW, ctx(b)).ok).toBe(false);
    expect(availableActions(b.workers[0])).toEqual(["call"]);
    expect(rateWorker(b, id, 5, undefined, NOW).ok).toBe(false);
  });

  it("replacement keeps the tracking ID, swaps the worker, and frees the original's slot", () => {
    let b = booked();
    const original = b.workers[0].worker;
    const id = b.workers[0].trackingId;
    const call = applyAction(b, id, "call", NOW, ctx(b));
    if (!call.ok) throw new Error("call should work");
    b = call.booking;
    const swap = applyAction(b, id, "cannot_come", NOW, ctx(b));
    expect(swap.ok).toBe(true);
    if (!swap.ok) return;
    const tw = swap.booking.workers[0];
    expect(tw.trackingId).toBe(id);
    expect(tw.status).toBe("replacement_arranged");
    expect(tw.worker.id).not.toBe(original.id);
    expect(tw.worker.role).toBe("waiter");
    expect(tw.replaced.map((r) => r.worker.id)).toEqual([original.id]);

    // Original is freed, replacement is now busy.
    const ledger = ledgerFromBookings([swap.booking]);
    expect(ledger.some((e) => e.workerId === original.id)).toBe(false);
    expect(ledger.some((e) => e.workerId === tw.worker.id)).toBe(true);

    // Replacement then arrives and the shift continues under the same ID.
    const arrive = applyAction(swap.booking, id, "arrive", NOW, ctx(swap.booking));
    expect(arrive.ok && arrive.booking.workers[0].status).toBe("on_duty");
  });

  it("says so when no replacement is free", () => {
    // Book both cleaners for the same shift, then ask for a replacement for one of them.
    const l = line({ role: "cleaner", qty: 2, startMinutes: 10 * 60 });
    const result = confirmBooking([l], [], NOW);
    if (!result.ok) throw new Error("booking should succeed");
    const b = result.booking;
    const id = b.workers[0].trackingId;
    const call = applyAction(b, id, "call", NOW, ctx(b));
    if (!call.ok) throw new Error("call should work");
    const swap = applyAction(call.booking, id, "cannot_come", NOW, ctx(call.booking));
    expect(swap.ok).toBe(false);
    if (!swap.ok) expect(swap.reason).toMatch(/No other Cleaner/);
  });
});
