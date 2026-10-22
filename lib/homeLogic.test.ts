import { describe, expect, it } from "vitest";
import { getSlots } from "./availability";
import { confirmBooking } from "./booking";
import { earliestLabel, earliestStart } from "./earliest";
import { bookAgainPresets, nextShift } from "./home";
import { searchRoles } from "./search";
import { applyAction } from "./tracking";
import type { Booking, BookingLine } from "./types";

// Thursday 22 Oct 2026, 15:20.
const NOW = new Date(2026, 9, 22, 15, 20);
const MORNING = new Date(2026, 9, 22, 8, 0);

let n = 0;
const line = (p: Partial<BookingLine> & Pick<BookingLine, "role">): BookingLine => ({
  id: `l${++n}`,
  qty: 1,
  length: 5,
  date: "2026-10-26",
  startMinutes: 12 * 60,
  ...p,
});

function book(lines: BookingLine[], when: Date = MORNING): Booking {
  const r = confirmBooking(lines, [], when);
  if (!r.ok) throw new Error("booking should succeed");
  return r.booking;
}

describe("earliest availability", () => {
  it("finds the next on-the-hour start today, after the current time", () => {
    const slot = earliestStart("waiter", [], NOW);
    expect(slot).not.toBeNull();
    expect(slot!.date).toBe("2026-10-22");
    expect(slot!.startMinutes).toBeGreaterThanOrEqual(16 * 60); // 15:20 has passed, so 16:00 or later
    expect(earliestLabel(slot, NOW)).toMatch(/^Today from \d{1,2}:00 (AM|PM)$/);
  });

  it("moves to tomorrow when nobody can still start a 5-hour shift today", () => {
    const late = new Date(2026, 9, 22, 21, 30);
    const slot = earliestStart("kitchen_helper", [], late);
    expect(slot!.date).toBe("2026-10-23");
    expect(earliestLabel(slot, late)).toMatch(/^Tomorrow from /);
  });

  it("skips times already held by workers in the cart", () => {
    const base = earliestStart("cleaner", [], MORNING)!;
    const cart = [line({ role: "cleaner", qty: 2, date: base.date, startMinutes: base.startMinutes })];
    const next = earliestStart("cleaner", [], MORNING, cart)!;
    expect(`${next.date}-${next.startMinutes}`).not.toBe(`${base.date}-${base.startMinutes}`);
  });

  it("has a readable label when nothing is free", () => {
    expect(earliestLabel(null, NOW)).toBe("No slots soon");
  });
});

describe("few left", () => {
  it("flags available slots where at most one extra worker is free, and never flags unavailable ones", () => {
    // Two cleaners exist. At 11:00 on a Monday both are free: asking for 1 leaves 1 spare -> few left.
    const slots = getSlots({ role: "cleaner", qty: 1, length: 5, date: "2026-10-26" }, 12 * 60, [], MORNING);
    const eleven = slots.find((s) => s.startMinutes === 11 * 60)!;
    expect(eleven.available).toBe(true);
    expect(eleven.fewLeft).toBe(true);
    const blocked = slots.find((s) => !s.available)!; // the 2:00 PM slot is always fully booked
    expect(blocked.fewLeft).toBeUndefined();
  });

  it("doesn't flag a slot when plenty of workers are free", () => {
    // Three waiters are free at 12:00 on a Monday, so one waiter leaves two spare.
    const slots = getSlots({ role: "waiter", qty: 1, length: 5, date: "2026-10-26" }, 12 * 60, [], MORNING);
    const noon = slots.find((s) => s.startMinutes === 12 * 60)!;
    expect(noon.available).toBe(true);
    expect(noon.fewLeft).toBe(false);
  });
});

describe("search", () => {
  it("finds roles by name, task and everyday words", () => {
    expect(searchRoles("cleaner")[0]).toBe("cleaner");
    expect(searchRoles("wash dishes")[0]).toBe("dishwasher");
    expect(searchRoles("server")[0]).toBe("waiter");
    expect(searchRoles("packing")[0]).toBe("takeaway_packer");
    expect(searchRoles("mop")).toContain("cleaner");
  });

  it("ranks the role name above task matches", () => {
    const results = searchRoles("kitchen");
    expect(results[0]).toBe("kitchen_helper");
  });

  it("returns nothing for an empty or unmatched search", () => {
    expect(searchRoles("")).toEqual([]);
    expect(searchRoles("   ")).toEqual([]);
    expect(searchRoles("astronaut")).toEqual([]);
  });

  it("needs every word typed to match", () => {
    expect(searchRoles("waiter dishes")).toEqual([]);
  });
});

describe("next shift and book again", () => {
  it("picks the soonest unfinished shift", () => {
    const later = book([line({ role: "waiter", date: "2026-10-28" })]);
    const sooner = book([line({ role: "cleaner", date: "2026-10-26", startMinutes: 10 * 60 })]);
    const result = nextShift([later, sooner], MORNING)!;
    expect(result.reference).toBe(sooner.reference);
    expect(result.role).toBe("cleaner");
    expect(result.statusLabel).toBe("Booked");
  });

  it("ignores finished and past shifts, and returns null when there is nothing", () => {
    expect(nextShift([], MORNING)).toBeNull();
    let b = book([line({ role: "waiter" })]);
    const id = b.workers[0].trackingId;
    for (const action of ["call", "confirm", "arrive", "finish"] as const) {
      const step = applyAction(b, id, action, MORNING, { allBookings: [b], demoEntries: [] });
      if (!step.ok) throw new Error(action);
      b = step.booking;
    }
    expect(nextShift([b], MORNING)).toBeNull();
    const past = book([line({ role: "waiter", date: "2026-10-26" })]);
    expect(nextShift([past], new Date(2026, 9, 30))).toBeNull();
  });

  it("builds book-again presets newest first without duplicates", () => {
    const first = book([line({ role: "waiter", qty: 1, length: 8, startMinutes: 9 * 60 })]);
    const second = { ...book([line({ role: "cleaner", qty: 1, length: 5, startMinutes: 10 * 60 })]), createdAt: "2026-10-23T08:00:00.000Z" };
    const dup = { ...book([line({ role: "cleaner", qty: 1, length: 5, startMinutes: 10 * 60, date: "2026-10-27" })]), createdAt: "2026-10-21T08:00:00.000Z" };
    const presets = bookAgainPresets([first, second, dup]);
    expect(presets.map((p) => p.role)).toEqual(["cleaner", "waiter"]);
    expect(presets[1]).toMatchObject({ qty: 1, length: 8, startMinutes: 540 });
    expect(bookAgainPresets([])).toEqual([]);
  });
});
