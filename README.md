# Staffly – shift booking prototype

A hackathon MVP for Staffly: a café, restaurant or hotel manager books available, pre-onboarded frontline workers for a shift, Swiggy-style (add one or many workers of different roles, see a live bill, pay, get confirmation).

> **This is a prototype.** Staffly has not been built yet. The workers, their availability, booking references, the payment page, the bank approval page and the confirmation are all **simulated demo data**. No real worker is booked or notified, no money moves, and no card or UPI details are collected. The 18% GST rate is a **placeholder** pending confirmation.

## Job to be done
When a café, restaurant, or hotel needs frontline staff for an upcoming shift, I want to book an available worker from Staffly's pre-onboarded worker pool, so I can fill the shift without searching for a replacement myself.

**Users:** café, restaurant and hotel owners or managers in India who need waiters/service staff or kitchen helpers (including dishwashing).

## The 3 tests the MVP must pass
1. I select a role, choose a 5-hour or 8-hour shift, and select a date. In the booking flow I can see available slots with their prices and cannot select unavailable slots.
2. I select an available slot, review the booking, and confirm it. I see a clear booking confirmation with a booking reference and the assigned worker's profile card.
3. If a slot becomes unavailable before I confirm, I see a clear message and the nearest available alternatives instead of being allowed to book it.

All three are covered by automated logic tests (`npm test`) and were also clicked through in the browser.

## Current workflow → future workflow
**Current:** the manager needs staff for an upcoming shift and has to search for a replacement themselves.

**Future (this prototype):**
1. Choose a 5h or 8h shift and a date.
2. Add workers from the menu (any mix of roles and quantities); the bill updates live.
3. Type the start time; see nearby slots with prices, available or unavailable.
4. Pick a slot, review, press Continue.
5. Payment page shows the bill with GST; pay; simulated bank approval.
6. Confirmation with a booking reference and a profile card for each assigned worker.
7. If the slot is taken at any point, see a clear message and the nearest available start times instead.

## Architecture: Input → AI → Logic → Action → Output
| Stage | What happens here |
|---|---|
| **Input** | Manager picks shift length, date, roles and quantities, and a start time (`components/`, `app/page.tsx`) |
| **AI** | Optional **Staffly assistant** chat (Claude) that answers questions about booking, prices and the current screen. It never books, prices or checks availability (see below) |
| **Logic** | Plain code: pricing and GST (`lib/pricing.ts`), slot availability and nearest alternatives (`lib/availability.ts`), booking and worker assignment (`lib/booking.ts`) |
| **Action** | Re-check availability at Continue, Pay and bank approval; assign specific workers; record the booking in the browser's `localStorage` |
| **Output** | Slot list with prices, bill, payment page, confirmation with reference and worker cards, or the "slot taken" message with alternatives |

## Where AI is used, what stays human, and why
- **AI is used in one place: the customer assistant** (chat bubble, bottom-right). It calls Claude through the Anthropic API from a server route (`app/api/assistant/route.ts`), so the API key never reaches the browser. It is given only facts from this project (roles, prices before GST, the booking flow, the prototype caveats) plus a summary of the manager's current screen, and it is told to say "I don't have that information" instead of guessing. It can explain and guide; it **cannot** book, change the order or take payment.
- **Everything else is ordinary code:** price lookup, sums, GST, checking time windows and picking free workers. Code does these instantly, for free and predictably, so a language model would only add cost and the chance of a wrong answer. The booking works without the assistant, and the assistant is simply inactive if no API key is set.
- **What stays human:** the manager decides which roles, how many people, and which slot to book. Staffly decisions that were not specified stay open: the real GST rate, real worker onboarding and availability, real payment provider, and any other fees.
- **Why these tools:** Next.js (what you asked for; deploys to Vercel with no extra setup), TypeScript (catches mistakes early), Tailwind CSS (quick styling), Vitest (small automated tests for the booking logic). The booking state lives in the browser so no database or login is needed for the prototype.

## Failure cases and limits
- **Slot taken before you confirm:** availability is re-checked on Continue, Pay and bank approval. If it fails, nothing is booked or charged and the nearest available start times that fit the whole order are shown (or a note to change date or crew if none fit).
- **No second real user:** the "Simulate another manager booking this slot" button is a demo tool that stands in for one.
- **Demo rule:** shifts starting at 2:00 PM always show as "Already booked (demo)" so the demo always has an unavailable slot (`DEMO_BLOCKED_START` in `lib/prototypeData.ts`).
- **All-or-nothing orders:** if any role in your order can't be fully staffed, the whole slot is unavailable (no partial bookings).
- **Bookings are local:** clearing browser data resets them; they are not shared between devices or people, so double-booking across users is not prevented.
- **Times already passed** on today's date are unavailable; shifts can't run past midnight.
- **Assistant failure cases:** with no key it says it isn't switched on; a rejected key, rate limit (30 questions per 10 minutes per visitor, best-effort) or API outage shows a friendly message and the booking flow is unaffected. It can still misunderstand a question, so it is limited to stated facts and labelled as a prototype helper. It does not know cancellation/refund rules, worker verification details, cities served, support contacts or other fees, because none were specified, and it says so.
- **Not covered:** real payments, notifications, login, taxes beyond the placeholder GST, other fees, permanent hiring, and 10-hour shifts.

## Run it locally
You need Node.js (LTS) installed.

```bash
npm install
npm run dev
```
Then open http://localhost:3000.

**Optional: turn on the AI assistant.** Copy `.env.example` to `.env.local`, add your own `ANTHROPIC_API_KEY=...`, and restart `npm run dev`. Without a key the booking still works and the assistant says it isn't switched on.

```bash
npm test        # logic tests for the 3 scenarios
npm run build   # production build (what Vercel runs)
```

## Project layout
- `app/page.tsx` – the single screen and its step flow
- `components/` – role menu, slot list, bill, payment page, simulated bank page, confirmation, worker card
- `lib/prototypeData.ts` – roles, price table (before GST), fictional workers
- `lib/pricing.ts`, `lib/availability.ts`, `lib/booking.ts` – the logic
- `lib/staffly.test.ts` – tests for the 3 scenarios

## Secrets
The assistant's `ANTHROPIC_API_KEY` lives only in `.env.local` (git-ignored) and is read on the server. `.env` and `.env*.local` are in `.gitignore`; `.env.example` has no real key. If deploying to Vercel, add the key in the project's Environment Variables settings instead.
