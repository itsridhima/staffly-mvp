import type { AssistantContext } from "./assistantKnowledge";
import { billBreakdown, formatINR, GST_RATE, orderHeadcount } from "./pricing";
import { BOOKABLE_DAYS_AHEAD, ROLES } from "./prototypeData";
import type { RoleId } from "./types";

/**
 * Scripted answers used when the AI assistant is off (no API key) or unavailable
 * (rate limit, outage). Plain keyword matching: it can't make things up, but it
 * only understands common questions.
 */

const ROLE_WORDS: Record<RoleId, string[]> = {
  waiter: ["waiter", "steward"],
  kitchen_helper: ["kitchen"],
  dishwasher: ["dishwash", "pot wash", "dish"],
  food_runner: ["runner", "busser"],
  takeaway_packer: ["takeaway", "packing", "handover"],
  cleaner: ["cleaner", "cleaning", "washroom"],
};

const UNKNOWN =
  "I don't have that information in this prototype. I can help with how booking works, role prices, GST, slots, and whether bookings and payments are real.";

function has(q: string, words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

function priceLine(id: RoleId): string {
  const role = ROLES.find((r) => r.id === id)!;
  return `${role.label}: ${formatINR(role.price[5])} for 5 hours, ${formatINR(role.price[8])} for 8 hours`;
}

export function faqAnswer(question: string, ctx: AssistantContext): string {
  const q = question.toLowerCase();

  const mentionedRoles = (Object.keys(ROLE_WORDS) as RoleId[]).filter((id) => has(q, ROLE_WORDS[id]));

  if (has(q, ["cancel", "refund", "verif", "background", "police", "city", "cities", "where", "contact", "phone", "email", "support", "insurance", "salary", "wage"])) {
    return UNKNOWN;
  }

  if (has(q, ["real", "fake", "demo", "prototype", "actually"])) {
    return "This is a prototype. The workers are fictional demo data, availability is simulated, and the payment and bank pages are fake: no real money moves, no real worker is notified, and no real booking is made.";
  }

  if (has(q, ["my total", "my bill", "my order", "how much do i", "current"])) {
    if (orderHeadcount(ctx.order) === 0) return "You haven't added any workers yet. Pick a role and press ADD to start your order.";
    const b = billBreakdown(ctx.order, ctx.length);
    return `Your order: ${b.lines.map((l) => `${l.qty} x ${l.label}`).join(", ")}. Item total ${formatINR(b.itemTotal)} before GST, GST ${formatINR(b.gst)} (placeholder ${Math.round(GST_RATE * 100)}%), grand total ${formatINR(b.grandTotal)}.`;
  }

  if (has(q, ["gst", "tax"])) {
    return `Prices are shown before taxes. The payment page adds GST at ${Math.round(GST_RATE * 100)}%, but that rate is a placeholder and hasn't been confirmed.`;
  }

  if (has(q, ["price", "cost", "rate", "charge", "how much", "fee", "₹", "rupee"])) {
    if (mentionedRoles.length > 0) return `${mentionedRoles.map(priceLine).join(". ")}. Per person, before GST.`;
    return `Prices per person, before GST:\n${ROLES.map((r) => `- ${priceLine(r.id)}`).join("\n")}`;
  }

  if (mentionedRoles.length > 0) return `${mentionedRoles.map(priceLine).join(". ")}. Per person, before GST. Use ADD on that role to include it in your order.`;

  if (has(q, ["unavailable", "grey", "gray", "disabled", "taken", "booked", "alternative", "why can"])) {
    return "A slot is unavailable when not every worker in your order is free for the whole shift, or when the time has already passed. Unavailable slots are greyed out and can't be selected. If a slot is taken before you confirm, nothing is booked or charged and the nearest available start times are shown.";
  }

  if (has(q, ["how many", "multiple", "more than one", "quantity", "mix", "several"])) {
    return "You can add any mix of roles and as many people per role as the demo has available, for example 2 kitchen helpers and 1 waiter. Everything in one order is for the same shift: same date, start time and length.";
  }

  if (has(q, ["shift", "5 hour", "8 hour", "5-hour", "8-hour", "length", "hours", "slot", "time", "date", "when"])) {
    return `Shifts are 5 or 8 hours. Choose a date up to ${BOOKABLE_DAYS_AHEAD} days ahead, add your crew, then type the start time you want. You'll see that time and nearby start times with prices, and can pick any available one.`;
  }

  if (has(q, ["how", "book", "work", "start", "step", "process", "pay", "payment"])) {
    return "1) Choose a 5-hour or 8-hour shift and a date. 2) Add workers by role. 3) Type a start time and pick an available slot. 4) Review and press Continue. 5) Check the bill with GST, press Pay, then approve on the (simulated) bank page. 6) You get a booking reference and a profile card for each worker.";
  }

  if (has(q, ["hi", "hello", "hey", "namaste", "help"])) {
    return "Hi! I can help with how booking works, role prices, GST, slots, and what to do on this screen. What would you like to know?";
  }

  return UNKNOWN;
}
