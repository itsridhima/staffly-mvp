import { describe, expect, it } from "vitest";
import { confirmBooking } from "./booking";
import { filterBookings, isCompleted, paymentsSummary } from "./bookingFilters";
import {
  addVenue,
  buildDataExport,
  crewFromBookings,
  EMPTY_PROFILE,
  MAX_VENUES,
  parseProfile,
  removeVenue,
  selectedVenue,
  selectVenue,
  toBookingVenue,
  toggleFavourite,
  updateVenue,
  validateVenue,
} from "./profile";
import { applyAction } from "./tracking";
import type { Booking, BookingLine, LedgerEntry } from "./types";

const NOW = new Date(2026, 9, 22, 8, 0);
let n = 0;
const line = (p: Partial<BookingLine> & Pick<BookingLine, "role">): BookingLine => ({
  id: `l${++n}`,
  qty: 1,
  length: 5,
  date: "2026-10-26",
  startMinutes: 12 * 60,
  ...p,
});

function book(lines: BookingLine[]): Booking {
  const r = confirmBooking(lines, [], NOW);
  if (!r.ok) throw new Error("booking should succeed");
  return r.booking;
}

describe("parseProfile", () => {
  it("cleans untrusted stored data", () => {
    const p = parseProfile({
      name: "  Ridhima  ",
      contactPhone: "12345",
      venueName: "x".repeat(200),
      venueType: "spaceship",
      venues: [
        { id: "a", label: "Main", address: "12 MG Road, Bengaluru", pincode: "560001" },
        { id: "b", label: "", address: "no label" },
        { id: "c", label: "Bad pin", address: "Somewhere nice", pincode: "12" },
      ],
      selectedVenueId: "missing",
      favourites: ["w1", "w1", "nobody", 7],
    });
    expect(p.name).toBe("Ridhima");
    expect(p.contactPhone).toBe("");
    expect(p.venueName).toHaveLength(60);
    expect(p.venueType).toBe("");
    expect(p.venues.map((v) => v.id)).toEqual(["a", "c"]);
    expect(p.venues[1].pincode).toBeUndefined();
    expect(p.selectedVenueId).toBe("a"); // falls back to the first venue
    expect(p.favourites).toEqual(["w1"]);
  });

  it("returns an empty profile for junk", () => {
    expect(parseProfile(null)).toEqual(EMPTY_PROFILE);
    expect(parseProfile("hello")).toEqual(EMPTY_PROFILE);
  });
});

describe("saved venues", () => {
  const input = { label: "Main café", address: "12 MG Road, Bengaluru", pincode: "560001" };

  it("validates venue details", () => {
    expect(validateVenue(input)).toBeNull();
    expect(validateVenue({ ...input, label: " " })).toMatch(/short name/);
    expect(validateVenue({ ...input, address: "abc" })).toMatch(/full address/);
    expect(validateVenue({ ...input, pincode: "12" })).toMatch(/6 digits/);
  });

  it("selects the first venue automatically, then lets you change, edit and remove", () => {
    let p = addVenue(EMPTY_PROFILE, input, "v1");
    expect(p.selectedVenueId).toBe("v1");
    p = addVenue(p, { label: "Second", address: "5 Church Street, Pune" }, "v2");
    expect(p.selectedVenueId).toBe("v1");
    p = selectVenue(p, "v2");
    expect(selectedVenue(p)?.label).toBe("Second");
    p = updateVenue(p, "v2", { label: "Second outlet", address: "5 Church Street, Pune" });
    expect(selectedVenue(p)?.label).toBe("Second outlet");
    p = removeVenue(p, "v2");
    expect(p.selectedVenueId).toBe("v1");
    p = removeVenue(p, "v1");
    expect(p.selectedVenueId).toBeNull();
  });

  it("limits the number of saved venues", () => {
    let p = EMPTY_PROFILE;
    for (let i = 0; i < MAX_VENUES + 2; i++) p = addVenue(p, { label: `V${i}`, address: "Some long address" }, `v${i}`);
    expect(p.venues).toHaveLength(MAX_VENUES);
  });

  it("makes a snapshot for the booking", () => {
    const p = addVenue(EMPTY_PROFILE, input, "v1");
    expect(toBookingVenue(selectedVenue(p))).toEqual({ label: "Main café", address: "12 MG Road, Bengaluru – 560001" });
    expect(toBookingVenue(null)).toBeUndefined();
  });
});

describe("favourites and crew", () => {
  it("toggles favourites", () => {
    let p = toggleFavourite(EMPTY_PROFILE, "w1");
    expect(p.favourites).toEqual(["w1"]);
    p = toggleFavourite(p, "w1");
    expect(p.favourites).toEqual([]);
  });

  it("lists each worker once, with shift counts, newest first", () => {
    const a = book([line({ role: "waiter", qty: 1, date: "2026-10-26" })]);
    const b = book([line({ role: "waiter", qty: 1, date: "2026-10-27" })]);
    const crew = crewFromBookings([a, b]);
    // Same first-free waiter both days is possible; whichever, no duplicates and counts add up.
    expect(new Set(crew.map((c) => c.worker.id)).size).toBe(crew.length);
    expect(crew.reduce((s, c) => s + c.shifts, 0)).toBe(2);
    const dates = crew.map((c) => c.lastShiftDate);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("does not list a worker who was replaced", () => {
    let b = book([line({ role: "waiter", qty: 1 })]);
    const original = b.workers[0].worker.id;
    const id = b.workers[0].trackingId;
    const ctx = () => ({ allBookings: [b], demoEntries: [] as LedgerEntry[] });
    const call = applyAction(b, id, "call", NOW, ctx());
    if (!call.ok) throw new Error("call");
    b = call.booking;
    const swap = applyAction(b, id, "cannot_come", NOW, ctx());
    if (!swap.ok) throw new Error("swap");
    const ids = crewFromBookings([swap.booking]).map((c) => c.worker.id);
    expect(ids).not.toContain(original);
    expect(ids).toHaveLength(1);
  });
});

describe("booking filters and payments", () => {
  it("filters upcoming, completed and multi-role bookings", () => {
    const single = book([line({ role: "waiter" })]);
    const multi = book([line({ role: "kitchen_helper" }), line({ role: "cleaner", startMinutes: 10 * 60 })]);
    // Finish the single booking's worker.
    let done = single;
    const id = single.workers[0].trackingId;
    for (const action of ["call", "confirm", "arrive", "finish"] as const) {
      const r = applyAction(done, id, action, NOW, { allBookings: [done], demoEntries: [] });
      if (!r.ok) throw new Error(action);
      done = r.booking;
    }
    expect(isCompleted(done)).toBe(true);
    expect(filterBookings([done, multi], "completed")).toEqual([done]);
    expect(filterBookings([done, multi], "upcoming")).toEqual([multi]);
    expect(filterBookings([done, multi], "multiple")).toEqual([multi]);
    expect(filterBookings([done, multi], "all")).toHaveLength(2);
  });

  it("sums payments including GST", () => {
    const a = book([line({ role: "waiter" })]); // 690 + 124 = 814
    const b = book([line({ role: "kitchen_helper", date: "2026-10-28" })]); // 660 + 119 = 779
    expect(paymentsSummary([a, b])).toEqual({ count: 2, total: 814 + 779 });
  });
});

describe("data export", () => {
  it("includes the profile and bookings", () => {
    const b = book([line({ role: "waiter" })]);
    const data = buildDataExport(EMPTY_PROFILE, [b], { email: "a@b.co", phone: null });
    expect(data.account.email).toBe("a@b.co");
    expect(data.bookings).toHaveLength(1);
    expect(data.profile).toEqual(EMPTY_PROFILE);
  });
});
