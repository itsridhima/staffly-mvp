import { GST_RATE } from "./pricing";

/**
 * Staffly's Terms of Use, Privacy Policy and Refund & Cancellation Policy.
 *
 * These are written from how Staffly actually works today. Where a number or contact detail has not
 * been decided (cancellation fees, support phone or email, legal entity name), the text says so in
 * plain words instead of inventing one. Have a lawyer review these before relying on them.
 */

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  id: "terms" | "privacy" | "refund";
  title: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_UPDATED = "22 October 2026";

const gstPercent = Math.round(GST_RATE * 100);

export const TERMS: LegalDoc = {
  id: "terms",
  title: "Terms of Use",
  intro:
    "These terms explain how you can use Staffly. By creating an account or making a booking you agree to them. If you don't agree, please don't use Staffly.",
  sections: [
    {
      heading: "1. What Staffly does",
      paragraphs: [
        "Staffly helps cafés, restaurants and hotels in India book pre-onboarded frontline workers for a single shift, so you don't have to search for a replacement yourself.",
        "You can book waiters and stewards, kitchen helpers, dishwashers and pot washers, food runners and table bussers, takeaway packers, and cleaners, for shifts of 5 or 8 hours.",
      ],
    },
    {
      heading: "2. Who can use Staffly",
      bullets: [
        "Staffly is for business owners and managers who are at least 18 years old.",
        "You must have the authority to book staff for the venue you book for.",
        "Staffly is not for individuals looking for work.",
      ],
    },
    {
      heading: "3. Your account",
      bullets: [
        "You log in or sign up with Google or your email (one-time code).",
        "Keep your login private. You are responsible for what happens under your account.",
        "Give accurate details in your profile and for your venue. Keep them up to date.",
      ],
    },
    {
      heading: "4. Booking a shift",
      paragraphs: [
        "To book, choose a role, a shift length (5 or 8 hours), a date, a start time and the number of workers. A booking can include several roles, and each role keeps its own date, shift and start time.",
      ],
      bullets: [
        "Slots shown as available can still become unavailable before you confirm. If that happens, nothing is booked or charged, and we show the nearest available start times.",
        "A slot is available only if enough workers of that role are free for the whole shift.",
        "Your booking is confirmed when you see a booking reference. Each worker is given a tracking ID.",
      ],
    },
    {
      heading: "5. Workers and replacements",
      bullets: [
        "Staffly assigns workers from its pool. Saving a worker as a favourite or booking a role again does not guarantee the same worker.",
        "If a worker cannot attend, Staffly will try to arrange a replacement. The replacement is shown under the same tracking ID and you are notified in the app.",
        "We cannot promise that a replacement will always be available. Our Refund & Cancellation Policy explains what happens then.",
      ],
    },
    {
      heading: "6. Your responsibilities at the venue",
      bullets: [
        "Give correct shift details and venue address, and save your venue in your profile so workers know where to go.",
        "Provide a safe and lawful place to work, and treat workers with respect.",
        "Give workers tasks that match the role and shift you booked.",
        "Do not harass, discriminate against or threaten workers.",
      ],
    },
    {
      heading: "7. Prices, GST and payment",
      bullets: [
        "Prices are shown per worker, for the shift length you choose, in rupees and before GST.",
        `GST at ${gstPercent}% is added on the payment page. You see the full total before you confirm.`,
        "Online payment is not switched on yet. For now, confirming a booking does not charge you. Before charging starts, we will update these terms and show clearly what will be charged and when.",
      ],
    },
    {
      heading: "8. Cancellations and refunds",
      paragraphs: ["Our Refund & Cancellation Policy forms part of these terms."],
    },
    {
      heading: "9. Ratings and reviews",
      bullets: [
        "After a shift is completed you can rate the worker. Please be honest and fair.",
        "Don't post abusive, false or unlawful comments. We may remove content that breaks these rules.",
      ],
    },
    {
      heading: "10. Using Staffly properly",
      bullets: [
        "Don't make false bookings, misuse the service, try to break or overload it, or copy its content.",
        "Don't use Staffly for anything unlawful.",
        "We may suspend or end access if these terms are broken.",
      ],
    },
    {
      heading: "11. The Staffly assistant",
      paragraphs: [
        "The in-app assistant answers questions about booking, prices and tracking. It can't make or change bookings, and its answers may sometimes be incomplete or wrong. Please check important details in the app.",
      ],
    },
    {
      heading: "12. Changes to the service",
      paragraphs: [
        "We may add, change or pause features, and worker availability can change at any time. We will try to give notice of big changes.",
      ],
    },
    {
      heading: "13. Our responsibility",
      paragraphs: [
        "We work to provide Staffly with reasonable care. To the extent the law allows, Staffly is not responsible for indirect or consequential losses, such as lost sales, that come from using the service. Nothing in these terms limits any right or liability that cannot be limited by law.",
      ],
    },
    {
      heading: "14. Changes to these terms",
      paragraphs: [
        `We may update these terms. The date at the top shows when they last changed. If you keep using Staffly after an update, you accept the new terms. Last updated: ${LEGAL_UPDATED}.`,
      ],
    },
    {
      heading: "15. Governing law",
      paragraphs: ["These terms are governed by the laws of India."],
    },
    {
      heading: "16. Contact",
      paragraphs: ["For questions about these terms, use Help & Support in the app."],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  id: "privacy",
  title: "Privacy Policy",
  intro:
    "This policy explains what information Staffly collects, why, and the choices you have. We aim to collect only what we need to run your bookings.",
  sections: [
    {
      heading: "1. Information we collect",
      bullets: [
        "Account details: your email address and, if you use Google to log in, the name and photo on your Google account.",
        "Profile details you add: your name, venue name and type, a contact number, saved venue addresses and favourite workers.",
        "Booking details: the roles, shifts, workers assigned, venue, totals, tracking updates, and any rating or note you give a worker.",
        "Chat messages: what you type to the Staffly assistant, plus a short summary of the booking you are looking at so it can answer accurately.",
        "Technical information: records kept by our hosting providers, such as your IP address and the pages requested, to keep the service running and secure.",
      ],
    },
    {
      heading: "2. How we use it",
      bullets: [
        "To log you in and keep your account secure.",
        "To check availability, make bookings, calculate your bill and show tracking.",
        "To arrange replacements, send in-app updates and give support.",
        "To improve Staffly and to prevent misuse.",
      ],
    },
    {
      heading: "3. Who handles your information",
      paragraphs: ["We use trusted services to run Staffly. They handle information only to provide their service to us:"],
      bullets: [
        "Supabase: login and the storage of your profile and bookings.",
        "Vercel: hosting the app.",
        "Google: Google login, and the Gemini service that writes the assistant's replies. The messages you send to the assistant are shared with Google for that purpose.",
      ],
    },
    {
      heading: "4. What we don't do",
      bullets: ["We do not sell your personal information.", "We do not use your information for advertising."],
    },
    {
      heading: "5. Worker information",
      paragraphs: [
        "When you book, you see limited details about the workers assigned to you, such as their name, role, skills, languages and experience. Please use this only for your booking and don't share it.",
      ],
    },
    {
      heading: "6. Information on your device",
      paragraphs: [
        "Staffly stores a few things in your browser so the app works: your current booking before you confirm it, and notification and preference settings. You can clear these in Profile → Manage account → Manage data.",
      ],
    },
    {
      heading: "7. How long we keep it",
      paragraphs: [
        "We keep your account and booking information while your account is active and as long as needed for our records and to resolve disputes. You can clear your saved profile at any time.",
      ],
    },
    {
      heading: "8. Your choices",
      bullets: [
        "Download your data and clear your saved profile in Profile → Manage account → Manage data.",
        "Edit your name, venue and contact details in Profile → Edit profile.",
        "Deleting your whole account is not available in the app yet.",
      ],
    },
    {
      heading: "9. Security",
      paragraphs: [
        "We use reasonable safeguards, including access controls so you can only see your own bookings. No system is completely secure, so please keep your login private.",
      ],
    },
    {
      heading: "10. Children",
      paragraphs: ["Staffly is for businesses and is not meant for anyone under 18."],
    },
    {
      heading: "11. Changes and contact",
      paragraphs: [
        `We may update this policy and will change the date when we do. Last updated: ${LEGAL_UPDATED}. For questions about your information, use Help & Support in the app.`,
      ],
    },
  ],
};

export const REFUND: LegalDoc = {
  id: "refund",
  title: "Refund & Cancellation Policy",
  intro:
    "This policy explains what happens if you cancel a booking, or if Staffly can't provide a worker. It forms part of our Terms of Use.",
  sections: [
    {
      heading: "1. Before you confirm",
      paragraphs: [
        "You are not committed until you confirm and receive a booking reference. If a slot becomes unavailable before you confirm, nothing is booked and nothing is charged.",
      ],
    },
    {
      heading: "2. Online payment status",
      paragraphs: [
        "Online payment is not switched on yet, so nothing is charged when you confirm a booking. The rest of this policy applies from the day charging starts, and we will tell you before that day.",
      ],
    },
    {
      heading: "3. If a worker can't attend",
      bullets: [
        "Staffly will try to arrange a replacement. It appears under the same tracking ID and you are notified in the app.",
        "If we cannot provide a worker for a booked shift, you will not be charged for that shift. If you have already paid for it, we will refund the full amount, including GST.",
      ],
    },
    {
      heading: "4. Cancelling a booking",
      bullets: [
        "To cancel or change a booking, send a request through Help & Support before the shift starts.",
        "Workers are scheduled for specific shifts, so a request made close to the start time may not be possible.",
        "Any cancellation fee will be shown before you confirm a booking. If no fee is shown, none applies.",
      ],
    },
    {
      heading: "5. If something went wrong during a shift",
      paragraphs: [
        "Tell us through Help & Support as soon as you can after the shift, with your booking reference and tracking ID. We will review what happened and let you know the outcome.",
      ],
    },
    {
      heading: "6. How refunds are paid",
      paragraphs: [
        "Approved refunds go back to the payment method you used. We will tell you the expected timing when a refund is approved.",
      ],
    },
    {
      heading: "7. Changes",
      paragraphs: [`We may update this policy and will change the date when we do. Last updated: ${LEGAL_UPDATED}.`],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDoc["id"], LegalDoc> = { terms: TERMS, privacy: PRIVACY, refund: REFUND };

/** All text in a document, for checks and search. */
export function legalText(doc: LegalDoc): string {
  return [doc.title, doc.intro, ...doc.sections.flatMap((s) => [s.heading, ...(s.paragraphs ?? []), ...(s.bullets ?? [])])].join("\n");
}
