import { describe, expect, it } from "vitest";
import { buildSystemPrompt, sanitizeContext } from "./assistantKnowledge";
import { HELP_ITEMS } from "./helpContent";
import { LEGAL_DOCS, legalText } from "./legal";
import { cleanText, displayName, ROLES, WORKERS } from "./prototypeData";
import { averageStars, reviewsForRole } from "./reviews";
import { confirmBooking } from "./booking";
import { applyAction, rateWorker } from "./tracking";
import type { Booking } from "./types";

// Words that mark unfinished or test content. None of them should appear in text customers read.
const BANNED = /prototype|demo|placeholder|sample review|simulated|lorem|coming soon|to be confirmed|haven't been (written|decided)/i;

describe("customer-facing content", () => {
  it("has complete Terms, Privacy and Refund & Cancellation documents", () => {
    for (const doc of Object.values(LEGAL_DOCS)) {
      expect(doc.sections.length).toBeGreaterThanOrEqual(5);
      expect(legalText(doc)).not.toMatch(BANNED);
    }
    expect(legalText(LEGAL_DOCS.terms)).toMatch(/Staffly/);
    expect(legalText(LEGAL_DOCS.privacy)).toMatch(/Supabase/);
    expect(legalText(LEGAL_DOCS.refund)).toMatch(/refund/i);
  });

  it("does not invent contact details, fees or a company name", () => {
    const all = Object.values(LEGAL_DOCS).map(legalText).join("\n");
    expect(all).not.toMatch(/@[a-z0-9-]+\.[a-z]{2,}/i); // no email addresses
    expect(all).not.toMatch(/\+?91[\s-]?\d{5}/); // no phone numbers
    expect(all).not.toMatch(/Pvt\.? Ltd|Private Limited|LLP/i);
  });

  it("help answers have no unfinished wording", () => {
    for (const item of HELP_ITEMS) expect(`${item.q} ${item.a}`).not.toMatch(BANNED);
  });

  it("role descriptions and worker profiles have no unfinished wording", () => {
    for (const role of ROLES) expect(`${role.label} ${role.overview} ${role.includes.join(" ")}`).not.toMatch(BANNED);
    for (const worker of WORKERS) {
      expect(worker.name).not.toMatch(/demo/i);
      expect(worker.skills.join(" ")).not.toMatch(BANNED);
    }
  });

  it("the assistant prompt is not framed as a prototype", () => {
    const prompt = buildSystemPrompt(sanitizeContext({}));
    expect(prompt).not.toMatch(/prototype|demo data|placeholder/i);
  });

  it("cleans old saved names", () => {
    expect(displayName("Arjun Demo")).toBe("Arjun");
    expect(cleanText("Arjun Demo assigned")).toBe("Arjun assigned");
    expect(cleanText("Sana Khan assigned")).toBe("Sana Khan assigned");
  });
});

describe("reviews come only from real ratings", () => {
  const NOW = new Date(2026, 9, 22, 8, 0);

  function completedBooking(): Booking {
    const r = confirmBooking([{ id: "l1", role: "waiter", qty: 1, length: 5, date: "2026-10-26", startMinutes: 720 }], [], NOW);
    if (!r.ok) throw new Error("booking should succeed");
    let b = r.booking;
    const id = b.workers[0].trackingId;
    for (const action of ["call", "confirm", "arrive", "finish"] as const) {
      const step = applyAction(b, id, action, NOW, { allBookings: [b], demoEntries: [] });
      if (!step.ok) throw new Error(action);
      b = step.booking;
    }
    return b;
  }

  it("shows nothing until a worker is rated", () => {
    const b = completedBooking();
    expect(reviewsForRole([b], "waiter")).toEqual([]);
    expect(averageStars([])).toBeNull();
  });

  it("lists the employer's own ratings for that role only", () => {
    const b = completedBooking();
    const rated = rateWorker(b, b.workers[0].trackingId, 4, "Good", NOW);
    if (!rated.ok) throw new Error("rating should work");
    const reviews = reviewsForRole([rated.booking], "waiter");
    expect(reviews).toHaveLength(1);
    expect(reviews[0].stars).toBe(4);
    expect(averageStars(reviews)).toBe(4);
    expect(reviewsForRole([rated.booking], "cleaner")).toEqual([]);
  });
});
