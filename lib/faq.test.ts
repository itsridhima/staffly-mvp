import { describe, expect, it } from "vitest";
import { sanitizeContext } from "./assistantKnowledge";
import { faqAnswer } from "./faq";

const empty = sanitizeContext({});

describe("scripted FAQ fallback", () => {
  it("quotes the right price for a role", () => {
    const answer = faqAnswer("How much does a cleaner cost?", empty);
    expect(answer).toContain("₹640");
    expect(answer).toContain("₹940");
  });

  it("lists every role when no role is named", () => {
    const answer = faqAnswer("what are your prices?", empty);
    expect(answer).toContain("Waiter / steward");
    expect(answer).toContain("₹1,020");
  });

  it("says GST is a placeholder", () => {
    expect(faqAnswer("is gst included?", empty)).toMatch(/placeholder/);
  });

  it("is honest that the prototype is not real", () => {
    expect(faqAnswer("are these payments real?", empty)).toMatch(/prototype/i);
  });

  it("does not guess about things it was never told", () => {
    for (const q of ["what is your refund policy?", "do you serve Pune?", "are workers background verified?"]) {
      expect(faqAnswer(q, empty)).toMatch(/don't have that information/);
    }
  });

  it("explains tracking", () => {
    expect(faqAnswer("how does tracking work?", empty)).toMatch(/Replacement arranged/);
  });

  it("totals the current booking with GST", () => {
    const ctx = sanitizeContext({
      lines: [
        { role: "kitchen_helper", qty: 2, length: 5, date: "2026-10-26", startMinutes: 720 },
        { role: "waiter", qty: 1, length: 5, date: "2026-10-26", startMinutes: 720 },
      ],
    });
    expect(faqAnswer("what is my total?", ctx)).toContain("₹2,372");
  });
});
