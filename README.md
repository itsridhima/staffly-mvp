# Staffly – shift booking prototype

A hackathon MVP for Staffly: a café, restaurant or hotel manager books available, pre-onboarded frontline workers for a shift. One booking can hold several roles, each with its **own date, shift length, start time and number of workers**, and each worker can be tracked like a parcel.

> **This is a prototype.** Staffly has not been built yet. The workers, their availability, skill sets, contact numbers, reviews, ratings, booking references, tracking updates, the payment page, the bank approval page, the Staffly "confirmation calls" and in-app notifications are all **simulated demo data**. No real worker is booked or notified, no money moves, and no card or UPI details are collected. The 18% GST rate is a **placeholder** pending confirmation.

## Job to be done
When a café, restaurant, or hotel needs frontline staff for an upcoming shift, I want to book an available worker from Staffly's pre-onboarded worker pool, so I can fill the shift without searching for a replacement myself.

**Users:** café, restaurant and hotel owners or managers in India who need service staff or kitchen helpers.

## The 3 tests the MVP must pass
1. I select a role, choose a 5-hour or 8-hour shift, and select a date. In the booking flow I can see available slots with their prices and cannot select unavailable slots.
2. I select an available slot, review the booking, and confirm it. I see a clear booking confirmation with a booking reference and the assigned worker's profile card.
3. If a slot becomes unavailable before I confirm, I see a clear message and the nearest available alternatives instead of being allowed to book it.

All three are covered by automated logic tests (`npm test`) and were also clicked through in the browser.

## Current workflow → future workflow
**Current:** the manager needs staff for an upcoming shift and has to search for a replacement themselves.

**Future (this prototype):**
1. **Home:** pick a role from the categories (Waiter, Kitchen helper, Dishwasher, Food runner, Takeaway packer, Cleaner).
2. **Role page:** read the overview and (sample) reviews, then **Book**: choose 5h or 8h, a date, a start time; see four nearby slots with prices, available or unavailable; pick a slot and the number of workers; **Add to booking**.
3. Repeat for other roles, or the same role with a different shift. Each line keeps its own date, shift length and timing.
4. **Review booking:** every role with its qty, date, shift, timing and price. **Continue** (login is required here).
5. **Payment:** per-line breakdown, GST and grand total; pay; simulated bank approval.
6. **Confirmation:** booking reference, a profile card per worker (skills, demo contact, tracking ID, shift), full bill.
7. **Profile → My bookings:** each worker's tracking timeline: Booked → Confirmation check → On the way (or Replacement arranged) → On duty → Shift completed → Rate your experience. A replacement keeps the same tracking ID and cancels the original worker's booking.
8. If a slot is taken at any point, a clear message names that item and offers the nearest available start times for it; nothing is charged and the other items stay unchanged.

**Navigation and Home layout** (modelled on Urban Company's home tab, in Staffly's own theme):
- **Header:** on Home, a venue chip top-left; on every other screen, a back arrow top-left with the screen title. The bell and the profile icon are always top-right.
- **Bottom bar:** five equal tabs: Home, Shifts (My bookings), Booking (review), Crew, Help. Hidden during payment.
- **Home:** pinned search bar, a slim information bar, one 3×2 roles grid (price, next free shift, Add), then Book again, Your crew and a help row. Add opens a quick-book sheet.
- **Back:** the on-screen arrow and the phone's back button follow the same rules (`lib/navigation.ts`).
- **Test controls:** open the app with `?dev=1` to show the "book out" and tracking-step buttons.

**Profile tab** (modelled on the features of home-service apps, adapted for Staffly):
- **Profile header and Edit profile:** name, venue name and type, venue contact number. - **My bookings:** filters (All, Upcoming, Completed, Multiple roles); each card shows the roles, dates, venue, worker count and status.
- **Payments:** history of bills with item total, GST and payment method (simulated). There is no wallet or credit balance.
- **Your crew:** workers who've been on your shifts, a heart to save favourites, and "Book {role} again" (does not guarantee the same worker).
- **Saved venues:** up to 5 addresses with one selected; the selected venue is shown on the review page, confirmation and booking detail.
- **Help & Support:** searchable FAQ with topics, a shortcut to My bookings, and a button that opens the chat helper.
- **Manage account:** log out, Terms of Use, Privacy Policy, Refund & Cancellation Policy (full text in `lib/legal.ts`), and Manage data (download your data, clear your saved profile, clear this device).
- Not included on purpose: offers, referrals and a wallet (nothing was specified), and account deletion (not possible without a server-side admin key).
- Profile data is stored in your sign-in account's metadata (no extra Supabase table), or in this browser in guest mode.

## Architecture: Input → AI → Logic → Action → Output
| Stage | What happens here |
|---|---|
| **Input** | Manager picks roles, shift lengths, dates, start times and quantities (`components/`, `app/page.tsx`); logs in with Google or an email code (Supabase) |
| **AI** | Optional **Staffly assistant** chat (Google Gemini) that answers questions about booking, prices, tracking and the current screen, with scripted answers as a fallback. It never books, prices or checks availability |
| **Logic** | Plain code: pricing and GST (`lib/pricing.ts`), availability and nearest alternatives (`lib/availability.ts`), all-or-nothing booking and worker assignment (`lib/booking.ts`), tracking and replacement (`lib/tracking.ts`) |
| **Action** | Re-check availability at Continue, Pay and bank approval; assign workers; save the booking to the user's account (Supabase table with Row Level Security) |
| **Output** | Slot lists with prices, bill, confirmation, My bookings with tracking, or the "slot taken" message with alternatives |

## Where AI is used, what stays human, and why
- **AI is used in one place: the customer assistant** (chat bubble). It calls Google's Gemini API (free tier available) from a server route (`app/api/assistant/route.ts`), so the API key never reaches the browser. It is given only facts from this project (roles, prices before GST, the flow, tracking, the prototype caveats) plus a summary of the manager's current booking, and it is told to say "I don't have that information" instead of guessing. It can explain and guide; it **cannot** book, change the booking or take payment.
- **Everything else is ordinary code:** price lookup, sums, GST, time windows, picking free workers, tracking steps. Code does these instantly, for free and predictably, so a language model would only add cost and the chance of a wrong answer. The booking works without the assistant. If no key is set, or the AI is unavailable, the chat falls back to scripted answers (`lib/faq.ts`) and says so.
- **What stays human:** the manager decides roles, quantities, shifts and which slot to book. Things Staffly hasn't specified stay open: the real GST rate, other fees, real worker onboarding and availability, real payments, real calls and notifications.
- **Why these tools:** Next.js (deploys to Vercel with no extra setup), TypeScript (catches mistakes early), Tailwind CSS (quick styling), Vitest (tests for the booking logic), Supabase (login and per-user saved bookings without writing a server), Gemini (free-tier assistant).

## Failure cases and limits
- **Slot taken before you confirm:** every line is re-checked on Continue, Pay and bank approval. If any item fails, nothing is booked or charged, and the failing item gets the nearest alternatives. Booking is all-or-nothing across the whole order.
- **Two lines, same role:** lines in the same booking can't use the same worker at overlapping times.
- **No second real user:** the "Simulate another manager booking" button is a demo tool that stands in for one.
- **Demo rule:** shifts starting at 2:00 PM always show as "Already booked (demo)" so there is always one unavailable slot (`DEMO_BLOCKED_START` in `lib/prototypeData.ts`).
- **Replacement needs a free worker:** the demo pool is small, so a replacement may not exist for some shifts; tracking then says so instead of inventing one.
- **Tracking is simulated:** the "Demo controls" buttons stand in for the real confirmation call, the worker's reply and the shift itself.
- **Login:** Google, mobile number (SMS OTP) and email (one-time code or magic link) through Supabase. The login page asks Supabase which methods are switched on and only offers those, so nobody is sent to an error page. Real SMS needs an SMS provider (Twilio, MessageBird, Vonage or TextLocal; in India, DLT registration too), which is paid. For demos, Supabase's "test phone numbers and OTPs" setting lets chosen numbers log in with a fixed code and no SMS. Supabase's built-in email sender allows only a few emails per hour, fine for a demo but not for real use.
- **Saved bookings need the Supabase table.** If the `bookings` table hasn't been created, the app says so and keeps new bookings on this device, then syncs them once the table exists.
- **If Supabase isn't set up:** login is unavailable; the app falls back to a guest mode that saves bookings in this browser only.
- **Availability across devices:** the worker pool is fictional, so availability is rebuilt from the signed-in user's own saved bookings, not shared between different users.
- **Assistant:** with no key, a rejected key, the free-tier limit, our rate limit (30 questions per 10 minutes per visitor, best-effort), a timeout or an outage, the chat falls back to scripted answers labelled "Quick answer". It does not know cancellation/refund rules, worker verification, cities served, support contacts or other fees, because none were specified, and it says so.
- **Not covered:** real payments, real calls or notifications, mobile OTP login, taxes beyond the placeholder GST, other fees, permanent hiring, 10-hour shifts, a Chef role (no price was given).

## Run it locally
You need Node.js (LTS) installed.

```bash
npm install
npm run dev
```
Then open http://localhost:3000.

```bash
npm test        # logic tests (pricing, availability, booking, tracking, assistant)
npm run build   # production build (what Vercel runs)
```

### Optional: turn on the AI assistant
Get a free key at https://aistudio.google.com/apikey, copy `.env.example` to `.env.local`, add your own `GEMINI_API_KEY=...`, and restart `npm run dev`.

### Optional: turn on login and saved bookings (Supabase)
1. Create a free project at https://supabase.com.
2. In the SQL Editor run `supabase/schema.sql` (creates the `bookings` table with Row Level Security so users only see their own rows).
3. Project Settings → API: copy the **Project URL** and the **anon / publishable** key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (these two are public by design). **Never** use the `service_role` key in this app.
4. Authentication → URL Configuration: set the Site URL and add Redirect URLs for `http://localhost:3000/**` and your Vercel domain.
5. Email: for a 6-digit code, edit Authentication → Email Templates → Magic Link to include `{{ .Token }}`.
6. Google: create an OAuth client (Web application) in Google Cloud, add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI (and your site URLs as authorized JavaScript origins), then paste the Client ID and secret into Authentication → Sign In / Providers → Google and switch it on.
7. Mobile number: Authentication → Sign In / Providers → Phone → switch on. For a real SMS provider, pick one and paste its credentials. For a free demo, add a test number and code under "Test Phone Numbers and OTPs" (for example `919999999999=123456`) and log in with that number.
8. Restart `npm run dev`. On Vercel, add the same two `NEXT_PUBLIC_` variables under Environment Variables and **redeploy** (changes only apply to new deployments).
9. Keep the `service_role` key out of this app and out of Vercel. The app never needs it.

## Project layout
- `app/page.tsx` – the single page and its view flow (home → role → booking → payment → confirmation, profile, tracking)
- `components/` – home, role page and booking, cart, payment, bank page, confirmation, worker card, tracking timeline, rating, login, chat assistant, bottom navigation
- `lib/prototypeData.ts` – roles, price table (before GST), role overviews, sample reviews, fictional workers
- `lib/pricing.ts`, `lib/availability.ts`, `lib/booking.ts`, `lib/tracking.ts`, `lib/ledger.ts` – the logic
- `lib/supabaseClient.ts`, `components/AuthProvider.tsx`, `components/useBookings.ts`, `supabase/schema.sql` – login and saved bookings
- `lib/staffly.test.ts` and friends – tests

## Legal text and what is still open
`lib/legal.ts` holds the Terms of Use, Privacy Policy and Refund & Cancellation Policy, written from how Staffly works today. **Have a lawyer review them.** They deliberately do not state a company name, support phone or email, cancellation fee or governing court, because none were decided; they point to Help & Support instead. Add those details to `lib/legal.ts` when you have them. The GST rate (18%) lives in `lib/pricing.ts` and should be confirmed.

Still true about the app today, and stated in plain words where it matters: online payment is not switched on (confirming a booking charges nothing), the worker profiles in `lib/prototypeData.ts` are sample profiles, and no worker is notified or called automatically. Role pages show no reviews until an employer rates a worker; there are no invented reviews.

## Developer tools
Open the app with `?dev=1` (for example `https://your-site/?dev=1`) to show testing controls that customers don't see: a button on the review, payment and confirm screens that books out the first item (to test the "slot no longer available" screen), and buttons on a booking that move a worker through the tracking steps. Use `?dev=0` to hide them again.

## Secrets
`GEMINI_API_KEY` lives only in `.env.local` (git-ignored) and is read on the server. The two Supabase values are public by design; security comes from Row Level Security. `.env` and `.env*.local` are in `.gitignore`, and `.env.example` contains no real values. On Vercel, add keys under Environment Variables, never in the code.
