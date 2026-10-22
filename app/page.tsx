"use client";

import { useEffect, useMemo, useState } from "react";
import AssistantChat from "@/components/AssistantChat";
import BillPanel from "@/components/BillPanel";
import Confirmation from "@/components/Confirmation";
import PaymentPage, { type PayMethod } from "@/components/PaymentPage";
import PrototypeBanner from "@/components/PrototypeBanner";
import ReviewPanel from "@/components/ReviewPanel";
import RoleMenu from "@/components/RoleMenu";
import ShiftBasics from "@/components/ShiftBasics";
import SimulatedBankPage from "@/components/SimulatedBankPage";
import StartTimeAndSlots from "@/components/StartTimeAndSlots";
import UnavailableNotice from "@/components/UnavailableNotice";
import { canStaff, findNearestAlternatives, getSlots, type SlotOption } from "@/lib/availability";
import { confirmBooking, simulateOtherBooking } from "@/lib/booking";
import { orderHeadcount } from "@/lib/pricing";
import { maxQuantity } from "@/lib/prototypeData";
import { addDays, parseTime, toDateString } from "@/lib/time";
import type { Booking, Ledger, Order, RoleId, ShiftLength, Slot } from "@/lib/types";

type Step = "build" | "review" | "payment" | "bank" | "confirmed" | "taken";

const LEDGER_KEY = "staffly-prototype-ledger";

export default function Home() {
  const [today, setToday] = useState<string | null>(null);
  const [ledger, setLedger] = useState<Ledger>([]);

  const [length, setLength] = useState<ShiftLength>(5);
  const [date, setDate] = useState("");
  const [order, setOrder] = useState<Order>({});
  const [startTime, setStartTime] = useState("12:00");
  const [shownStart, setShownStart] = useState<number | null>(null);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);

  const [step, setStep] = useState<Step>("build");
  const [method, setMethod] = useState<PayMethod>("upi");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [takenReason, setTakenReason] = useState("");
  const [alternatives, setAlternatives] = useState<SlotOption[]>([]);

  // Load "today" and the prototype ledger once, on the client only.
  useEffect(() => {
    const t = toDateString(new Date());
    setToday(t);
    setDate(addDays(t, 1)); // default to tomorrow so the demo isn't affected by today's clock
    try {
      const saved = localStorage.getItem(LEDGER_KEY);
      if (saved) setLedger(JSON.parse(saved) as Ledger);
    } catch {
      /* storage unavailable: start with an empty ledger */
    }
  }, []);

  function saveLedger(next: Ledger) {
    setLedger(next);
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const slot: Slot | null = selectedStart === null ? null : { date, startMinutes: selectedStart, length };

  const slotOptions = useMemo<SlotOption[] | null>(() => {
    if (shownStart === null || orderHeadcount(order) === 0) return null;
    return getSlots(order, length, date, shownStart, ledger, new Date());
  }, [shownStart, order, length, date, ledger]);

  function resetSlots() {
    setShownStart(null);
    setSelectedStart(null);
  }

  function changeLength(l: ShiftLength) {
    setLength(l);
    resetSlots();
  }

  function changeDate(d: string) {
    setDate(d);
    resetSlots();
  }

  function changeQty(role: RoleId, qty: number) {
    const clamped = Math.max(0, Math.min(qty, maxQuantity(role)));
    setOrder((prev) => {
      const next = { ...prev };
      if (clamped === 0) delete next[role];
      else next[role] = clamped;
      return next;
    });
    resetSlots();
  }

  const requestedStart = parseTime(startTime);

  function showSlots() {
    if (Number.isNaN(requestedStart)) return;
    setShownStart(requestedStart);
    setSelectedStart(null);
  }

  function selectSlot(startMinutes: number) {
    setSelectedStart(startMinutes);
    setStep("review");
  }

  /** Re-check the slot right now; if it's gone, show the "taken" screen with alternatives. */
  function goTaken(forSlot: Slot, reason: string, ledgerNow: Ledger = ledger) {
    setTakenReason(reason);
    setAlternatives(findNearestAlternatives(order, forSlot.length, forSlot.date, forSlot.startMinutes, ledgerNow, new Date()));
    setStep("taken");
  }

  function advanceIfStillFree(next: Step) {
    if (!slot) return;
    const result = canStaff(order, slot, ledger, new Date());
    if (result.ok) setStep(next);
    else goTaken(slot, result.reason);
  }

  function approvePayment() {
    if (!slot) return;
    const result = confirmBooking(order, slot, ledger, new Date());
    if (result.ok) {
      saveLedger(result.ledger);
      setBooking(result.booking);
      setStep("confirmed");
    } else {
      goTaken(slot, result.reason);
    }
  }

  function demoTakeSlot() {
    if (!slot) return;
    saveLedger(simulateOtherBooking(order, slot, ledger));
  }

  function resetAll() {
    setOrder({});
    setBooking(null);
    resetSlots();
    setStep("build");
  }

  if (today === null) {
    return (
      <>
        <PrototypeBanner />
        <main className="mx-auto max-w-xl p-4 text-stone-500">Loading…</main>
      </>
    );
  }

  const hasWorkers = orderHeadcount(order) > 0;

  return (
    <>
      <PrototypeBanner />
      <main className="mx-auto max-w-xl space-y-4 p-4 pb-8">
        <header>
          <h1 className="text-2xl font-bold">Staffly</h1>
          <p className="text-stone-600">Book trained frontline staff for your next shift.</p>
        </header>

        {step === "build" && (
          <>
            <ShiftBasics length={length} date={date} today={today} onLength={changeLength} onDate={changeDate} />
            <RoleMenu order={order} length={length} onChange={changeQty} />
            <StartTimeAndSlots
              startTime={startTime}
              onStartTime={(v) => {
                setStartTime(v);
                resetSlots();
              }}
              onShowSlots={showSlots}
              canShow={hasWorkers}
              timeInvalid={Number.isNaN(requestedStart)}
              slots={slotOptions}
              length={length}
              onSelect={selectSlot}
            />
            <div className="sticky bottom-2">
              <BillPanel order={order} length={length} />
            </div>
          </>
        )}

        {step === "review" && slot && (
          <ReviewPanel
            order={order}
            slot={slot}
            onBack={() => setStep("build")}
            onContinue={() => advanceIfStillFree("payment")}
            onDemoTake={demoTakeSlot}
          />
        )}

        {step === "payment" && slot && (
          <PaymentPage
            order={order}
            slot={slot}
            method={method}
            onMethod={setMethod}
            onBack={() => setStep("review")}
            onPay={() => advanceIfStillFree("bank")}
            onDemoTake={demoTakeSlot}
          />
        )}

        {step === "bank" && slot && (
          <SimulatedBankPage
            order={order}
            length={slot.length}
            onApprove={approvePayment}
            onDecline={() => setStep("payment")}
            onDemoTake={demoTakeSlot}
          />
        )}

        {step === "taken" && slot && (
          <UnavailableNotice
            reason={takenReason}
            takenStart={slot.startMinutes}
            length={slot.length}
            alternatives={alternatives}
            onSelectAlternative={selectSlot}
            onChangeOrder={() => {
              resetSlots();
              setStep("build");
            }}
          />
        )}

        {step === "confirmed" && booking && <Confirmation booking={booking} onReset={resetAll} />}
      </main>
      <AssistantChat step={step} length={length} date={date} order={order} />
    </>
  );
}
