"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AssistantChat from "@/components/AssistantChat";
import { useAuth } from "@/components/AuthProvider";
import BookingDetail from "@/components/BookingDetail";
import BottomNav, { type NavTarget } from "@/components/BottomNav";
import CartView from "@/components/CartView";
import Confirmation from "@/components/Confirmation";
import HomeView from "@/components/HomeView";
import LoginScreen from "@/components/LoginScreen";
import NotificationsView from "@/components/NotificationsView";
import PaymentPage, { type PayMethod } from "@/components/PaymentPage";
import ProfileView from "@/components/ProfileView";
import PrototypeBanner from "@/components/PrototypeBanner";
import RoleView from "@/components/RoleView";
import SimulatedBankPage from "@/components/SimulatedBankPage";
import UnavailableNotice from "@/components/UnavailableNotice";
import { useBookings } from "@/components/useBookings";
import { assignLines, findNearestAlternatives, type SlotOption } from "@/lib/availability";
import { confirmBooking, makeLineId, simulateOtherBooking } from "@/lib/booking";
import { ledgerFromBookings } from "@/lib/ledger";
import { KEYS, readLocal, writeLocal } from "@/lib/localStore";
import { deriveNotifications } from "@/lib/notifications";
import { headcount } from "@/lib/pricing";
import { roleInfo } from "@/lib/prototypeData";
import { toDateString } from "@/lib/time";
import { applyAction, rateWorker, type TrackingAction } from "@/lib/tracking";
import type { Booking, BookingLine, LedgerEntry, LineSpec, RoleId } from "@/lib/types";

type View =
  | "home"
  | "role"
  | "cart"
  | "login"
  | "payment"
  | "bank"
  | "taken"
  | "confirmed"
  | "profile"
  | "booking"
  | "notifications";

const PENDING_CHECKOUT = "staffly-pending-checkout";

const NAV_FOR_VIEW: Record<View, NavTarget | null> = {
  home: "home",
  role: "home",
  notifications: "home",
  cart: "cart",
  login: "cart",
  payment: "cart",
  bank: "cart",
  taken: "cart",
  profile: "profile",
  booking: "profile",
  confirmed: null,
};

export default function Home() {
  const { configured, user, ready } = useAuth();
  const { bookings, loading, error: bookingsError, addBooking, updateBooking } = useBookings(user, ready);

  const [today, setToday] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [view, setView] = useState<View>("home");
  const [roleId, setRoleId] = useState<RoleId>("waiter");
  const [cart, setCart] = useState<BookingLine[]>([]);
  const [demoEntries, setDemoEntries] = useState<LedgerEntry[]>([]);
  const [method, setMethod] = useState<PayMethod>("upi");
  const [taken, setTaken] = useState<{ lineId: string; reason: string; alternatives: SlotOption[] } | null>(null);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loginNote, setLoginNote] = useState<string | null>(null);
  const [seenAt, setSeenAt] = useState("");

  // Load client-only state once (today's date, saved cart, demo entries).
  useEffect(() => {
    setToday(toDateString(new Date()));
    setCart(readLocal<BookingLine[]>(KEYS.cart, []));
    setDemoEntries(readLocal<LedgerEntry[]>(KEYS.demoLedger, []));
    setSeenAt(readLocal<string>(KEYS.notificationsSeen, ""));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) writeLocal(KEYS.cart, cart);
  }, [cart, loaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Everyone's booked workers: the user's saved bookings plus demo entries.
  const ledger = useMemo(() => ledgerFromBookings(bookings, demoEntries), [bookings, demoEntries]);

  const notifications = useMemo(() => deriveNotifications(bookings), [bookings]);
  const unseen = notifications.filter((n) => n.at > seenAt).length;

  const go = useCallback((next: View) => {
    setView(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  /** Slot taken: name the line, offer the nearest alternatives for that line only. */
  const goTaken = useCallback(
    (lineId: string, reason: string) => {
      const line = cart.find((l) => l.id === lineId);
      if (!line) return;
      const others = cart.filter((l) => l.id !== lineId);
      setTaken({
        lineId,
        reason,
        alternatives: findNearestAlternatives(line, ledger, new Date(), others),
      });
      go("taken");
    },
    [cart, ledger, go],
  );

  /** Re-check every line right now; if all are still free, move on. */
  const advanceIfStillFree = useCallback(
    (next: View) => {
      const result = assignLines(cart, ledger, new Date());
      if (result.ok) go(next);
      else goTaken(result.lineId, result.reason);
    },
    [cart, ledger, go, goTaken],
  );

  // Remember that we were on the way to checkout (Google login leaves the page and comes back).
  useEffect(() => {
    if (view === "login") writeLocal(PENDING_CHECKOUT, true);
  }, [view]);

  // After an email-code login (no page reload): carry on to payment.
  useEffect(() => {
    if (user && view === "login" && headcount(cart) > 0) {
      writeLocal(PENDING_CHECKOUT, false);
      advanceIfStillFree("payment");
    }
  }, [user, view, cart, advanceIfStillFree]);

  // After a Google login (page reloaded): return to the booking, ready to continue.
  useEffect(() => {
    if (!ready || !loaded || !user) return;
    if (readLocal<boolean>(PENDING_CHECKOUT, false)) {
      writeLocal(PENDING_CHECKOUT, false);
      setLoginNote("You're signed in. Press Continue to go to payment.");
      go("cart");
    }
  }, [ready, loaded, user, go]);

  function handleContinue() {
    if (headcount(cart) === 0) return;
    if (configured && !user) {
      go("login");
      return;
    }
    advanceIfStillFree("payment");
  }

  async function approvePayment() {
    const result = confirmBooking(cart, ledger, new Date());
    if (!result.ok) {
      goTaken(result.lineId, result.reason);
      return;
    }
    setConfirmed(result.booking);
    setCart([]);
    setSaveError(null);
    go("confirmed");
    const err = await addBooking(result.booking);
    if (err) setSaveError("Your booking was confirmed on screen but could not be saved to your account. Please screenshot your reference and try again later.");
  }

  function addLine(spec: LineSpec) {
    setCart((prev) => [...prev, { ...spec, id: makeLineId() }]);
    setToast(`Added ${spec.qty} × ${roleInfo(spec.role).label} to your booking`);
    go("home");
  }

  function changeLineStart(startMinutes: number) {
    if (!taken) return;
    setCart((prev) => prev.map((l) => (l.id === taken.lineId ? { ...l, startMinutes } : l)));
    setTaken(null);
    go("cart");
  }

  function demoTake() {
    if (cart.length === 0) return;
    const entries = simulateOtherBooking(cart[0], ledger);
    const next = [...demoEntries, ...entries];
    setDemoEntries(next);
    writeLocal(KEYS.demoLedger, next);
  }

  async function onTrackingAction(trackingId: string, action: TrackingAction) {
    const booking = bookings.find((b) => b.workers.some((w) => w.trackingId === trackingId));
    if (!booking) return;
    const result = applyAction(booking, trackingId, action, new Date(), { allBookings: bookings, demoEntries });
    if (!result.ok) {
      setBookingNotice(result.reason);
      return;
    }
    setBookingNotice(
      action === "cannot_come"
        ? `Replacement arranged for ${trackingId}. Your booking was updated and you've been notified in the app (simulated).`
        : null,
    );
    await updateBooking(result.booking);
  }

  async function onRate(trackingId: string, stars: number, note: string) {
    const booking = bookings.find((b) => b.workers.some((w) => w.trackingId === trackingId));
    if (!booking) return;
    const result = rateWorker(booking, trackingId, stars, note, new Date());
    if (!result.ok) {
      setBookingNotice(result.reason);
      return;
    }
    setBookingNotice("Thanks for your rating!");
    await updateBooking(result.booking);
  }

  function openBooking(reference: string) {
    setSelectedRef(reference);
    setBookingNotice(null);
    go("booking");
  }

  function openNotifications() {
    const now = new Date().toISOString();
    setSeenAt(now);
    writeLocal(KEYS.notificationsSeen, now);
    go("notifications");
  }

  function onNavigate(target: NavTarget) {
    setLoginNote(null);
    go(target === "cart" ? "cart" : target);
  }

  if (today === null || !loaded) {
    return (
      <>
        <PrototypeBanner />
        <main className="mx-auto max-w-lg p-6 muted">Loading…</main>
      </>
    );
  }

  const greetingName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? null;
  const selectedBooking = bookings.find((b) => b.reference === selectedRef) ?? null;
  const takenLine = taken ? cart.find((l) => l.id === taken.lineId) : undefined;
  const hideNav = view === "payment" || view === "bank";

  return (
    <>
      <PrototypeBanner />
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-5">
        {toast && (
          <div role="status" className="glass-dark fixed left-1/2 top-12 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 px-4 py-3 text-sm font-semibold">
            ✓ {toast}
          </div>
        )}

        {view === "home" && (
          <HomeView
            lines={cart}
            greetingName={greetingName}
            notificationCount={unseen}
            onOpenRole={(r) => {
              setRoleId(r);
              go("role");
            }}
            onOpenCart={() => go("cart")}
            onOpenNotifications={openNotifications}
          />
        )}

        {view === "role" && (
          <RoleView
            key={roleId}
            role={roleId}
            today={today}
            cart={cart}
            ledger={ledger}
            onBack={() => go("home")}
            onAdd={addLine}
          />
        )}

        {view === "cart" && (
          <CartView
            lines={cart}
            loginNote={loginNote}
            onRemove={(id) => setCart((prev) => prev.filter((l) => l.id !== id))}
            onAddAnother={() => go("home")}
            onContinue={handleContinue}
            onDemoTake={demoTake}
          />
        )}

        {view === "login" && <LoginScreen reason="Log in to continue to payment. Your booking is saved." onCancel={() => go("cart")} />}

        {view === "payment" && (
          <PaymentPage lines={cart} method={method} onMethod={setMethod} onBack={() => go("cart")} onPay={() => advanceIfStillFree("bank")} onDemoTake={demoTake} />
        )}

        {view === "bank" && (
          <SimulatedBankPage lines={cart} onApprove={approvePayment} onDecline={() => go("payment")} onDemoTake={demoTake} />
        )}

        {view === "taken" && taken && takenLine && (
          <UnavailableNotice
            line={takenLine}
            reason={taken.reason}
            alternatives={taken.alternatives}
            onSelectAlternative={changeLineStart}
            onBackToBooking={() => go("cart")}
          />
        )}

        {view === "confirmed" && confirmed && (
          <Confirmation
            booking={confirmed}
            saveError={saveError}
            onViewBookings={() => {
              setSelectedRef(confirmed.reference);
              go("booking");
            }}
            onReset={() => {
              setConfirmed(null);
              go("home");
            }}
          />
        )}

        {view === "profile" && (
          <ProfileView bookings={bookings} loading={loading} error={bookingsError} onOpenBooking={openBooking} onLogin={() => go("login")} />
        )}

        {view === "booking" && selectedBooking && (
          <BookingDetail
            booking={selectedBooking}
            notice={bookingNotice}
            onBack={() => go("profile")}
            onAction={onTrackingAction}
            onRate={onRate}
          />
        )}

        {view === "notifications" && (
          <NotificationsView items={notifications} onOpen={openBooking} onBack={() => go("home")} />
        )}
      </main>

      {!hideNav && <BottomNav active={NAV_FOR_VIEW[view]} cartCount={headcount(cart)} onNavigate={onNavigate} />}
      <AssistantChat view={view} lines={cart} />
    </>
  );
}
