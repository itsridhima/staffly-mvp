import { BOOKABLE_DAYS_AHEAD, ROLES } from "./prototypeData";
import { GST_RATE } from "./pricing";
import { formatINR } from "./pricing";

export type HelpTopic = "faq" | "booking" | "account" | "payment";

export interface HelpItem {
  id: string;
  topic: Exclude<HelpTopic, "faq">;
  /** Shown under "Frequently asked" too */
  popular?: boolean;
  q: string;
  a: string;
}

export const HELP_TOPIC_LABEL: Record<HelpTopic, string> = {
  faq: "Frequently asked",
  booking: "Booking",
  account: "Account",
  payment: "Payment",
};

const prices = ROLES.map((r) => `${r.label}: ${formatINR(r.price[5])} (5h), ${formatINR(r.price[8])} (8h)`).join("; ");

/**
 * Written only from what Staffly has decided. Anything not decided (refunds, cancellation,
 * worker checks, contact channels) is answered honestly as "not available yet".
 */
export const HELP_ITEMS: HelpItem[] = [
  {
    id: "how",
    topic: "booking",
    popular: true,
    q: "How do I book staff?",
    a: "Open a role on the home screen, choose a 5-hour or 8-hour shift, a date and a start time, pick an available slot and the number of workers, then press Add to booking. Repeat for other roles, then review, press Continue and pay.",
  },
  {
    id: "slots",
    topic: "booking",
    popular: true,
    q: "Why can't I see any available slots?",
    a: `A slot is available only if enough workers of that role are free for the whole shift. Slots that are taken, or whose time has passed, are greyed out. Try another start time or date (you can book up to ${BOOKABLE_DAYS_AHEAD} days ahead), or fewer workers.`,
  },
  {
    id: "multi",
    topic: "booking",
    q: "Can I book different roles with different shifts?",
    a: "Yes. Each role in your booking keeps its own date, shift length, start time and number of workers.",
  },
  {
    id: "taken",
    topic: "booking",
    q: "What if a slot is taken before I confirm?",
    a: "Nothing is booked or charged. You'll see which item is affected and the nearest available start times for it. Your other items stay as they are.",
  },
  {
    id: "track",
    topic: "booking",
    popular: true,
    q: "How do I track my workers?",
    a: "Open Profile → My bookings → your booking. Each worker has a tracking ID and a timeline: Booked, Confirmation check (a Staffly representative calls the worker one hour before), On the way, On duty, Shift completed, then Rate your experience. If a worker can't come, a replacement is arranged under the same tracking ID and you're notified in the app.",
  },
  {
    id: "venue",
    topic: "booking",
    q: "How do workers know where to go?",
    a: "Save your venue under Profile → Saved venues. The selected venue is shown on your booking.",
  },
  {
    id: "crew",
    topic: "account",
    q: "How do I save workers I liked?",
    a: "Open Profile → Your crew, then tap the heart on a worker. Booking the same role again doesn't guarantee the same worker.",
  },
  {
    id: "login",
    topic: "account",
    q: "How do I log in?",
    a: "You log in when you press Continue on your booking, or from Profile. Depending on what's switched on, you can use Google, your mobile number (OTP) or your email.",
  },
  {
    id: "data",
    topic: "account",
    q: "Can I download or clear my data?",
    a: "Yes: Profile → Manage account → Manage data lets you download your data and clear your saved profile. Deleting your whole account isn't available in the app yet.",
  },
  {
    id: "price",
    topic: "payment",
    popular: true,
    q: "How much does each role cost?",
    a: `Prices per person before GST: ${prices}.`,
  },
  {
    id: "gst",
    topic: "payment",
    q: "Is GST included?",
    a: `Prices are shown before GST. GST is added on the payment page at ${Math.round(GST_RATE * 100)}%, and you see the full total before you confirm.`,
  },
  {
    id: "real",
    topic: "payment",
    popular: true,
    q: "Will I be charged when I confirm?",
    a: "Not yet. Online payment isn't switched on, so confirming a booking doesn't charge you. We'll update our terms and tell you before charging starts.",
  },
  {
    id: "refund",
    topic: "payment",
    q: "What is the refund and cancellation policy?",
    a: "If we can't provide a worker for a booked shift, you aren't charged for it, or you're refunded in full including GST. To cancel or change a booking, send a request through Help & Support before the shift starts. Any cancellation fee is shown before you confirm. The full policy is under Profile → Manage account → Refund & Cancellation Policy.",
  },
  {
    id: "replace",
    topic: "booking",
    q: "What if my worker doesn't show up?",
    a: "Staffly will try to arrange a replacement. The replacement appears under the same tracking ID and you're notified in the app. If we can't provide a worker, you aren't charged for that shift.",
  },
];

export function searchHelp(items: HelpItem[], query: string): HelpItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const words = q.split(/\s+/);
  return items.filter((i) => {
    const text = `${i.q} ${i.a}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

export function itemsForTopic(topic: HelpTopic): HelpItem[] {
  return topic === "faq" ? HELP_ITEMS.filter((i) => i.popular) : HELP_ITEMS.filter((i) => i.topic === topic);
}
