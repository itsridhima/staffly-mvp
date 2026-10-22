"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AssistantChat from "@/components/AssistantChat";
import { useAuth } from "@/components/AuthProvider";
import BookingDetail from "@/components/BookingDetail";
import BottomNav from "@/components/BottomNav";
import CartView from "@/components/CartView";
import Confirmation from "@/components/Confirmation";
import CrewView from "@/components/CrewView";
import EditProfileView from "@/components/EditProfileView";
import HelpView from "@/components/HelpView";
import HomeView from "@/components/HomeView";
import LegalView from "@/components/LegalView";
import LoginScreen from "@/components/LoginScreen";
import ManageAccountView from "@/components/ManageAccountView";
import ManageDataView from "@/components/ManageDataView";
import MyBookingsView from "@/components/MyBookingsView";
import NotificationsView from "@/components/NotificationsView";
import PaymentPage, { type PayMethod } from "@/components/PaymentPage";
import PaymentsView from "@/components/PaymentsView";
import ProfileView, { type ProfileTarget } from "@/components/ProfileView";
import QuickBookSheet from "@/components/QuickBookSheet";
import RoleView from "@/components/RoleView";
import SimulatedBankPage from "@/components/SimulatedBankPage";
import StickyCartBar from "@/components/StickyCartBar";
import UnavailableNotice from "@/components/UnavailableNotice";
import VenueSheet from "@/components/VenueSheet";
import VenuesView from "@/components/VenuesView";
import { useBookings } from "@/components/useBookings";
import { useProfile } from "@/components/useProfile";
import { assignLines, findNearestAlternatives, type SlotOption } from "@/lib/availability";
import { confirmBooking, makeLineId, simulateOtherBooking } from "@/lib/booking";
import { readDevMode } from "@/lib/devMode";
import type { BookAgainPreset } from "@/lib/home";
import { LEGAL_DOCS, type LegalDoc } from "@/lib/legal";
import { ledgerFromBookings } from "@/lib/ledger";
import { KEYS, readLocal, writeLocal } from "@/lib/localStore";
import {
  activeTab,
  back,
  backTo,
  canGoBack,
  push,
  showBottomBar,
  type Tab,
  tabStack,
  VIEW_TITLE,
  type View,
} from "@/lib/navigation";
import { deriveNotifications } from "@/lib/notifications";
import { billBreakdown, headcount } from "@/lib/pricing";
import { addVenue, removeVenue, selectedVenue, selectVenue, toBookingVenue, toggleFavourite, updateVenue } from "@/lib/profile";
import { roleInfo, WORKERS } from "@/lib/prototypeData";
import { toDateString } from "@/lib/time";
import { applyAction, rateWorker, type TrackingAction } from "@/lib/tracking";
import type { Booking, BookingLine, LedgerEntry, LineSpec, RoleId, Worker } from "@/lib/types";

const PENDING_CHECKOUT = "staffly-pending-checkout";

/** Screens where the header shows which venue the booking is for. */
const VENUE_LINE_VIEWS: View[] = ["role", "cart", "payment", "bank"];
/** Screens where the "View booking" bar must not appear. */
const NO_CART_BAR: View[] = ["cart", "login", "payment", "bank", "taken", "confirmed"];

type Sheet = { type: "quick"; role: RoleId; preset?: BookAgainPreset } | { type: "venue" } | null;

export default function Home() {
  const { configured, user, ready } = useAuth();
  const { bookings, loading, error: bookingsError, addBooking, updateBooking } = useBookings(user, ready);
  const { profile, error: profileError, save: saveProfile, update: updateProfile } = useProfile(user, ready);

  const [today, setToday] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // The screens the user has opened, newest last. The on-screen back arrow and the phone's back button both use this.
  const [stack, setStack] = useState<View[]>(["home"]);
  const view = stack[stack.length - 1];
  const stackRef = useRef(stack);
  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

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
  const [loginPurpose, setLoginPurpose] = useState<"checkout" | "general">("general");
  const [legalDoc, setLegalDoc] = useState<LegalDoc["id"]>("terms");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [seenAt, setSeenAt] = useState("");
  // Test controls, hidden from customers. Open the app with ?dev=1 to show them.
  const [devTools, setDevTools] = useState(false);

  // ---- navigation -------------------------------------------------------------------------
  const navigate = useCallback((next: View) => setStack((s) => push(s, next)), []);
  const goBack = useCallback(() => setStack((s) => back(s)), []);
  const backToView = useCallback((v: View) => setStack((s) => backTo(s, v)), []);
  const openTab = useCallback((tab: Tab) => {
    setLoginNote(null);
    setStack(tabStack(tab));
  }, []);

  // Make the phone's / browser's back button follow the same rules as the on-screen back arrow.
  const historyReady = useRef(false);
  useEffect(() => {
    if (historyReady.current) return;
    historyReady.current = true;
    const mark = (extra: Record<string, unknown>) => ({ ...(window.history.state ?? {}), stafflyBase: undefined, stafflyTop: undefined, ...extra });
    try {
      window.history.replaceState(mark({ stafflyBase: true }), "");
      window.history.pushState(mark({ stafflyTop: true }), "");
    } catch {
      /* history not available: the on-screen back arrow still works */
    }
    const onPop = (e: PopStateEvent) => {
      if (!e.state?.stafflyBase) return;
      if (stackRef.current.length > 1) {
        setStack((s) => back(s));
        try {
          window.history.pushState(mark({ stafflyTop: true }), "");
        } catch {
          /* ignore */
        }
      } else {
        window.history.back(); // already on Home: let the phone leave the app
      }
    };
    window.addEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [view]);

  // ---- load client-only state ---------------------------------------------------------------
  useEffect(() => {
    setDevTools(readDevMode(window.location.search));
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

  // Everyone's booked workers: the user's saved bookings plus any test entries.
  const ledger = useMemo(() => ledgerFromBookings(bookings, demoEntries), [bookings, demoEntries]);

  const notifications = useMemo(() => deriveNotifications(bookings), [bookings]);
  const unseen = notifications.filter((n) => n.at > seenAt).length;

  const needsLogin = configured && ready && !user;

  // ---- booking steps ------------------------------------------------------------------------
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
      navigate("taken");
    },
    [cart, ledger, navigate],
  );

  /** Re-check every line right now; if all are still free, move on. */
  const advanceIfStillFree = useCallback(
    (next: View, replaceLogin = false) => {
      const result = assignLines(cart, ledger, new Date());
      if (!result.ok) {
        goTaken(result.lineId, result.reason);
        return;
      }
      // Coming from the login screen: replace it, so Back doesn't land on a login that bounces forward again.
      if (replaceLogin) setStack((s) => push(back(s), next));
      else navigate(next);
    },
    [cart, ledger, goTaken, navigate],
  );

  // Remember that we were on the way to checkout (Google login leaves the page and comes back).
  useEffect(() => {
    if (view === "login" && loginPurpose === "checkout") writeLocal(PENDING_CHECKOUT, true);
  }, [view, loginPurpose]);

  // After a login that didn't reload the page: carry on to payment, or return to where we were.
  useEffect(() => {
    if (!user || view !== "login") return;
    if (loginPurpose === "checkout" && headcount(cart) > 0) {
      writeLocal(PENDING_CHECKOUT, false);
      advanceIfStillFree("payment", true);
    } else {
      goBack();
    }
  }, [user, view, loginPurpose, cart, advanceIfStillFree, goBack]);

  // After a Google login (page reloaded): return to the booking, ready to continue.
  useEffect(() => {
    if (!ready || !loaded || !user) return;
    if (readLocal<boolean>(PENDING_CHECKOUT, false)) {
      writeLocal(PENDING_CHECKOUT, false);
      setLoginNote("You're signed in. Press Continue to go to payment.");
      setStack(["home", "cart"]);
    }
  }, [ready, loaded, user]);

  function handleContinue() {
    if (headcount(cart) === 0) return;
    if (configured && !user) {
      setLoginPurpose("checkout");
      navigate("login");
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
    // Remember where the workers should go and the payment method chosen.
    const booking: Booking = { ...result.booking, venue: toBookingVenue(selectedVenue(profile)), paymentMethod: method };
    setConfirmed(booking);
    setCart([]);
    setSaveError(null);
    navigate("confirmed");
    const err = await addBooking(booking);
    if (err) setSaveError("Your booking was confirmed on screen but could not be saved to your account. Please screenshot your reference and try again later.");
  }

  function addLineToCart(spec: LineSpec) {
    setCart((prev) => [...prev, { ...spec, id: makeLineId() }]);
    setToast(`Added ${spec.qty} × ${roleInfo(spec.role).label} to your booking`);
  }

  /** Added from a role page: return to Home. */
  function addFromRolePage(spec: LineSpec) {
    addLineToCart(spec);
    setStack(["home"]);
  }

  /** Added from the quick-book sheet: close it and stay where we are. */
  function addFromSheet(spec: LineSpec) {
    addLineToCart(spec);
    setSheet(null);
  }

  function changeLineStart(startMinutes: number) {
    if (!taken) return;
    setCart((prev) => prev.map((l) => (l.id === taken.lineId ? { ...l, startMinutes } : l)));
    setTaken(null);
    backToView("cart");
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
        ? `Replacement arranged for ${trackingId}. Your booking was updated and you've been notified in the app.`
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

  // ---- small navigation helpers used by screens ----------------------------------------------
  function openBooking(reference: string) {
    setSelectedRef(reference);
    setBookingNotice(null);
    navigate("booking");
  }

  function openNotifications() {
    const now = new Date().toISOString();
    setSeenAt(now);
    writeLocal(KEYS.notificationsSeen, now);
    navigate("notifications");
  }

  function openRole(role: RoleId) {
    setSheet(null);
    setRoleId(role);
    navigate("role");
  }

  function openDoc(id: LegalDoc["id"]) {
    setLegalDoc(id);
    navigate("legal");
  }

  function openLogin(purpose: "checkout" | "general") {
    setLoginPurpose(purpose);
    navigate("login");
  }

  /** The venue chip / "at Main café" line: log in first if needed, otherwise pick a venue. */
  function openVenue() {
    if (needsLogin) openLogin("general");
    else setSheet({ type: "venue" });
  }

  function openProfileTarget(target: ProfileTarget) {
    navigate(target);
  }

  function askAssistant() {
    window.dispatchEvent(new Event("staffly:open-assistant"));
  }

  function addSavedVenue(input: { label: string; address: string; pincode?: string }) {
    updateProfile((p) => addVenue(p, input, `v${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`));
  }

  // ---- render --------------------------------------------------------------------------------
  if (today === null || !loaded) {
    return <main className="mx-auto max-w-lg p-6 muted">Loading…</main>;
  }

  const accountName: string | null = (user?.user_metadata?.full_name as string | undefined) ?? null;
  const avatarUrl: string | null = (user?.user_metadata?.avatar_url as string | undefined) ?? (user?.user_metadata?.picture as string | undefined) ?? null;
  const initial = user ? (profile.name || accountName || user.email || "").trim()[0]?.toUpperCase() ?? null : null;
  const venueForBooking = selectedVenue(profile);
  const selectedBooking = bookings.find((b) => b.reference === selectedRef) ?? null;
  const takenLine = taken ? cart.find((l) => l.id === taken.lineId) : undefined;
  const favouriteWorkers = profile.favourites.map((id) => WORKERS.find((w) => w.id === id)).filter((w): w is Worker => Boolean(w));

  const isHome = view === "home";
  const title = view === "role" ? roleInfo(roleId).shortLabel : view === "legal" ? LEGAL_DOCS[legalDoc].title : VIEW_TITLE[view];
  const venueLine = VENUE_LINE_VIEWS.includes(view) ? (venueForBooking ? `at ${venueForBooking.label}` : "Add your venue") : null;
  const barVisible = showBottomBar(view);
  const cartBarVisible = barVisible && headcount(cart) > 0 && !NO_CART_BAR.includes(view) && sheet === null;
  const cartTotal = billBreakdown(cart).itemTotal;

  return (
    <>
      <main className={`mx-auto max-w-lg space-y-4 px-4 pt-1 ${barVisible ? (cartBarVisible ? "pb-44" : "pb-28") : "pb-10"}`}>
        {toast && (
          <div role="status" className="glass-dark fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 px-4 py-3 text-sm font-semibold">
            ✓ {toast}
          </div>
        )}

        <AppHeader
          isHome={isHome}
          title={title}
          venueLine={venueLine}
          onVenueLine={openVenue}
          canBack={canGoBack(stack)}
          onBack={goBack}
          venueLabel={venueForBooking?.label ?? "Add your venue"}
          onVenue={openVenue}
          notificationCount={unseen}
          onBell={openNotifications}
          avatarUrl={avatarUrl}
          initial={initial}
          profileActive={view === "profile"}
          onProfile={() => navigate("profile")}
        />

        {view === "home" && (
          <HomeView
            lines={cart}
            bookings={bookings}
            ledger={ledger}
            favourites={favouriteWorkers}
            onOpenRole={openRole}
            onQuickAdd={(role, preset) => setSheet({ type: "quick", role, preset })}
            onOpenCart={() => openTab("booking")}
            onOpenBooking={openBooking}
            onOpenShifts={() => openTab("shifts")}
            onOpenCrew={() => openTab("crew")}
            onOpenHelp={() => openTab("help")}
            onOpenDoc={openDoc}
          />
        )}

        {view === "role" && (
          <RoleView key={roleId} role={roleId} today={today} cart={cart} ledger={ledger} bookings={bookings} onAdd={addFromRolePage} />
        )}

        {view === "cart" && (
          <CartView
            lines={cart}
            loginNote={loginNote}
            venue={venueForBooking}
            onChangeVenue={openVenue}
            onRemove={(id) => setCart((prev) => prev.filter((l) => l.id !== id))}
            onAddAnother={() => openTab("home")}
            onContinue={handleContinue}
            onDemoTake={devTools ? demoTake : undefined}
          />
        )}

        {view === "login" && (
          <LoginScreen
            reason={loginPurpose === "checkout" ? "Continue to payment. Your booking is saved." : "Save your venues, bookings and crew."}
            onCancel={goBack}
          />
        )}

        {view === "payment" && (
          <PaymentPage lines={cart} method={method} onMethod={setMethod} onBack={goBack} onPay={() => advanceIfStillFree("bank")} onDemoTake={devTools ? demoTake : undefined} />
        )}

        {view === "bank" && (
          <SimulatedBankPage lines={cart} onApprove={approvePayment} onDecline={goBack} onDemoTake={devTools ? demoTake : undefined} />
        )}

        {view === "taken" && taken && takenLine && (
          <UnavailableNotice
            line={takenLine}
            reason={taken.reason}
            alternatives={taken.alternatives}
            onSelectAlternative={changeLineStart}
            onBackToBooking={() => backToView("cart")}
          />
        )}

        {view === "confirmed" && confirmed && (
          <Confirmation
            booking={confirmed}
            saveError={saveError}
            onViewBookings={() => {
              setSelectedRef(confirmed.reference);
              setBookingNotice(null);
              setStack(["home", "my-bookings", "booking"]);
            }}
            onReset={() => {
              setConfirmed(null);
              openTab("home");
            }}
          />
        )}

        {view === "profile" && (
          <ProfileView
            profile={profile}
            accountName={accountName}
            avatarUrl={avatarUrl}
            bookings={bookings}
            loading={loading}
            error={bookingsError ?? profileError}
            onOpen={openProfileTarget}
            onLogin={() => openLogin("general")}
          />
        )}

        {view === "my-bookings" && (
          <MyBookingsView
            bookings={bookings}
            loading={loading}
            error={bookingsError}
            onOpenBooking={openBooking}
            onBookNow={() => openTab("home")}
            onBack={goBack}
          />
        )}

        {view === "payments" && <PaymentsView bookings={bookings} onOpenBooking={openBooking} onBookNow={() => openTab("home")} onBack={goBack} />}

        {view === "crew" && (
          <CrewView
            bookings={bookings}
            profile={profile}
            onToggleFavourite={(id) => updateProfile((p) => toggleFavourite(p, id))}
            onRebook={(role) => setSheet({ type: "quick", role })}
            onBookNow={() => openTab("home")}
            onBack={goBack}
          />
        )}

        {view === "venues" && (
          <VenuesView
            profile={profile}
            error={profileError}
            onAdd={addSavedVenue}
            onUpdate={(id, input) => updateProfile((p) => updateVenue(p, id, input))}
            onRemove={(id) => updateProfile((p) => removeVenue(p, id))}
            onSelect={(id) => updateProfile((p) => selectVenue(p, id))}
            onBack={goBack}
          />
        )}

        {view === "edit-profile" && <EditProfileView profile={profile} onSave={saveProfile} onBack={goBack} />}

        {view === "help" && <HelpView onOpenBookings={() => openTab("shifts")} onAskAssistant={askAssistant} onBack={goBack} />}

        {view === "account" && <ManageAccountView onOpenDoc={openDoc} onOpenData={() => navigate("manage-data")} />}

        {view === "legal" && <LegalView docId={legalDoc} />}

        {view === "manage-data" && <ManageDataView profile={profile} bookings={bookings} onSaveProfile={saveProfile} />}

        {view === "booking" && selectedBooking && (
          <BookingDetail booking={selectedBooking} notice={bookingNotice} onAction={onTrackingAction} onRate={onRate} devTools={devTools} />
        )}

        {view === "notifications" && <NotificationsView items={notifications} onOpen={openBooking} />}
      </main>

      {cartBarVisible && <StickyCartBar shifts={cart.length} total={cartTotal} onOpen={() => openTab("booking")} />}
      {barVisible && <BottomNav active={activeTab(view)} bookingCount={headcount(cart)} shiftsDot={unseen > 0} onSelect={openTab} />}

      <QuickBookSheet
        role={sheet?.type === "quick" ? sheet.role : null}
        preset={sheet?.type === "quick" ? sheet.preset : undefined}
        today={today}
        cart={cart}
        ledger={ledger}
        onAdd={addFromSheet}
        onSeeDetails={openRole}
        onClose={() => setSheet(null)}
      />
      <VenueSheet
        open={sheet?.type === "venue"}
        profile={profile}
        onSelect={(id) => {
          updateProfile((p) => selectVenue(p, id));
          setSheet(null);
        }}
        onAdd={() => {
          setSheet(null);
          navigate("venues");
        }}
        onManage={() => {
          setSheet(null);
          navigate("venues");
        }}
        onClose={() => setSheet(null)}
      />

      <AssistantChat view={view} lines={cart} />
    </>
  );
}
