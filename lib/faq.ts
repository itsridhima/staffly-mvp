import type { AssistantContext } from "./assistantKnowledge";
import { billBreakdown, formatINR, GST_RATE, headcount } from "./pricing";
import { BOOKABLE_DAYS_AHEAD, ROLES } from "./prototypeData";
import { formatDateLong, formatTimeRange } from "./time";
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
  "I don't have that information. I can help with how booking works, role prices, GST, slots, tracking, payments and our refund and cancellation policy.";

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

  if (has(q, ["worker", "people", "person", "staff"]) && has(q, ["real", "genuine", "actual", "fake"])) {
    return "The worker profiles in the app are sample profiles while Staffly builds its worker network, and no worker is notified when a booking is confirmed yet.";
  }

  if (has(q, ["refund", "cancel"])) {
    return "If we can't provide a worker for a booked shift, you aren't charged for it, or you're refunded in full including GST. To cancel or change a booking, send a request through Help & Support before the shift starts. Any cancellation fee is shown before you confirm. The full policy is under Profile → Manage account → Refund & Cancellation Policy.";
  }

  if (has(q, ["verif", "background", "police", "city", "cities", "where", "contact us", "phone number of staffly", "support", "insurance", "salary", "wage"])) {
    return UNKNOWN;
  }

  if (has(q, ["real", "actually", "charged", "charge me", "pay online", "money"])) {
    return "Online payment isn't switched on yet, so confirming a booking doesn't charge you. We'll update our terms and tell you before charging starts.";
  }

  if (has(q, ["my total", "my bill", "my booking", "my order", "how much do i", "current"])) {
    if (headcount(ctx.lines) === 0) return "Your booking is empty. Open a role from the home screen, choose a shift and add workers to start.";
    const b = billBreakdown(ctx.lines);
    const parts = b.lines.map((l) => `${l.qty} x ${l.label} (${l.length}h, ${formatDateLong(l.date)}, ${formatTimeRange(l.startMinutes, l.length)})`);
    return `Your booking: ${parts.join("; ")}. Item total ${formatINR(b.itemTotal)} before GST, GST ${formatINR(b.gst)} (${Math.round(GST_RATE * 100)}%), grand total ${formatINR(b.grandTotal)}.`;
  }

  if (has(q, ["track", "status", "replacement", "replace", "on the way", "on duty", "rate your", "rating"])) {
    return "After booking, open Profile → My bookings. Each worker has a tracking ID with these steps: Booked, Confirmation check (Staffly calls the worker one hour before), On the way, Replacement arranged (if the worker can't come, a replacement is assigned under the same tracking ID), On duty, Shift completed, then Rate your experience.";
  }

  if (has(q, ["gst", "tax"])) {
    return `Prices are shown before taxes. The payment page adds GST at ${Math.round(GST_RATE * 100)}%, and you see the full total before you confirm.`;
  }

  if (has(q, ["price", "cost", "rate", "charge", "how much", "fee", "₹", "rupee"])) {
    if (mentionedRoles.length > 0) return `${mentionedRoles.map(priceLine).join(". ")}. Per person, before GST.`;
    return `Prices per person, before GST:\n${ROLES.map((r) => `- ${priceLine(r.id)}`).join("\n")}`;
  }

  if (mentionedRoles.length > 0) return `${mentionedRoles.map(priceLine).join(". ")}. Per person, before GST. Open the role to read the overview and reviews, then book it.`;

  if (has(q, ["unavailable", "grey", "gray", "disabled", "taken", "booked", "alternative", "why can"])) {
    return "A slot is unavailable when not enough workers of that role are free for the whole shift, or when the time has already passed. Unavailable slots are greyed out and can't be selected. If a slot is taken before you confirm, nothing is booked or charged and the nearest available start times are shown.";
  }

  if (has(q, ["how many", "multiple", "more than one", "quantity", "mix", "several", "different shift", "different time"])) {
    return "You can add several roles to one booking, and as many people per role as are available. Each role keeps its own date, shift length and start time, so for example 2 kitchen helpers can work 12 PM to 5 PM while a waiter works 7 AM to 3 PM.";
  }

  if (has(q, ["shift", "5 hour", "8 hour", "5-hour", "8-hour", "length", "hours", "slot", "time", "date", "when"])) {
    return `Shifts are 5 or 8 hours. Pick a role, choose the shift length and a date up to ${BOOKABLE_DAYS_AHEAD} days ahead, then type the start time you want. You'll see that time and nearby start times with prices, and can pick any available one.`;
  }

  if (has(q, ["how", "book", "work", "start", "step", "process", "pay", "payment", "login", "log in", "sign"])) {
    return "1) On Home, open a role. 2) Choose a 5-hour or 8-hour shift, a date and a start time, pick an available slot and the number of workers, then Add to booking. 3) Repeat for other roles. 4) Review and press Continue (you'll be asked to log in). 5) Check the bill with GST, press Pay, then confirm the payment. 6) You get a booking reference and a profile card for each worker.";
  }

  if (has(q, ["hi", "hello", "hey", "namaste", "help"])) {
    return "Hi! I can help with how booking works, role prices, GST, slots and tracking. What would you like to know?";
  }

  return UNKNOWN;
}
