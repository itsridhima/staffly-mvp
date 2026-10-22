import { describe, expect, it } from "vitest";
import { sanitizeContext } from "./assistantKnowledge";
import { faqAnswer } from "./faq";

const empty = sanitizeContext({});

describe("scripted quick answers", () => {
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

  it("explains GST", () => {
    expect(faqAnswer("is gst included?", empty)).toMatch(/18%/);
  });

  it("is honest that online payment isn't switched on", () => {
    expect(faqAnswer("are these payments real?", empty)).toMatch(/isn't switched on/);
  });

  it("is honest about the worker profiles when asked", () => {
    expect(faqAnswer("are the workers real people?", empty)).toMatch(/sample profiles/);
  });

  it("answers refund and cancellation questions from the policy", () => {
    const answer = faqAnswer("what is your refund policy?", empty);
    expect(answer).toMatch(/refunded in full/);
    expect(answer).toMatch(/Help & Support/);
  });

  it("does not guess about things it was never told", () => {
    for (const q of ["do you serve Pune?", "are workers background verified?"]) {
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
