"use client";

import { useEffect, useState } from "react";
import { formatIndianPhone, normalizeIndianPhone } from "@/lib/phone";
import { useAuth } from "./AuthProvider";

interface Props {
  /** Why we're asking, e.g. "Log in to continue to payment." */
  reason: string;
  onCancel: () => void;
}

type Tab = "phone" | "email";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;

export default function LoginScreen({ reason, onCancel }: Props) {
  const { configured, methods, signInWithGoogle, sendEmailCode, verifyEmailCode, sendPhoneCode, verifyPhoneCode } = useAuth();

  // Open on a method that is actually switched on. Until we know, start with phone.
  const [tab, setTab] = useState<Tab>("phone");
  const [chosen, setChosen] = useState(false);
  useEffect(() => {
    if (!methods || chosen) return;
    setTab(methods.phone ? "phone" : "email");
  }, [methods, chosen]);

  const [phoneInput, setPhoneInput] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null); // phone (E.164) or email the code went to
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function resetFlow(next: Tab) {
    setTab(next);
    setChosen(true);
    setSentTo(null);
    setCode("");
    setMessage(null);
    setError(null);
  }

  async function run(task: () => Promise<string | null>, onOk?: () => void) {
    setBusy(true);
    setError(null);
    setMessage(null);
    const err = await task();
    setBusy(false);
    if (err) setError(err);
    else onOk?.();
  }

  function sendPhone() {
    const phone = normalizeIndianPhone(phoneInput);
    if (!phone) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    run(() => sendPhoneCode(phone), () => {
      setSentTo(phone);
      setCooldown(RESEND_SECONDS);
      setMessage(`We sent a 6-digit code by SMS to ${formatIndianPhone(phone)}.`);
    });
  }

  if (!configured) {
    return (
      <section className="glass space-y-3 p-6">
        <h2 className="text-xl font-bold">Login isn&apos;t set up on this copy</h2>
        <p className="muted text-sm">The app owner hasn&apos;t added the Supabase keys yet, so login is unavailable here.</p>
        <button type="button" onClick={onCancel} className="btn-ghost px-4 py-3">
          Back
        </button>
      </section>
    );
  }

  const googleOff = methods !== null && !methods.google;
  const phoneOff = methods !== null && !methods.phone;
  const emailOff = methods !== null && !methods.email;
  const nothingOn = googleOff && phoneOff && emailOff;

  return (
    <section className="space-y-4">
      <div className="glass-dark p-5">
        <h2 className="text-2xl font-black">Log in to Staffly</h2>
        <p className="mt-1 text-sm text-sky-100">{reason}</p>
      </div>

      <div className="glass space-y-4 p-5">
        {nothingOn && (
          <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No login method is switched on yet. The app owner needs to enable one in Supabase.
          </p>
        )}

        <div>
          <button
            type="button"
            disabled={busy || googleOff}
            onClick={() => run(signInWithGoogle)}
            className="btn-ghost flex w-full items-center justify-center gap-3 px-4 py-3 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.4z" />
              <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6z" />
              <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A12 12 0 0 0 1.8 7.1l3.8 3C6.5 6.8 9 4.8 12 4.8z" />
            </svg>
            Continue with Google
          </button>
          {googleOff && <p className="muted mt-1 text-center text-xs">Google sign-in isn&apos;t switched on yet.</p>}
        </div>

        <div className="muted flex items-center gap-3 text-xs" aria-hidden>
          <span className="h-px flex-1 bg-slate-300" />
          or
          <span className="h-px flex-1 bg-slate-300" />
        </div>

        <div role="tablist" aria-label="Login method" className="neu-inset grid grid-cols-2 gap-1 p-1">
          {(["phone", "email"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => resetFlow(t)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === t ? "glass-dark" : "muted"}`}
            >
              {t === "phone" ? "Mobile number" : "Email"}
            </button>
          ))}
        </div>

        {tab === "phone" && phoneOff && (
          <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">
            Mobile-number login isn&apos;t switched on yet. Please use Google or email.
          </p>
        )}
        {tab === "email" && emailOff && (
          <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">Email login isn&apos;t switched on yet.</p>
        )}

        {tab === "phone" && !phoneOff &&
          (sentTo === null ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendPhone();
              }}
            >
              <label className="block text-sm font-semibold" htmlFor="login-phone">
                Mobile number
              </label>
              <div className="neu-inset flex items-center gap-2 px-3">
                <span className="font-semibold text-slate-600">+91</span>
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full bg-transparent py-3 outline-none"
                />
              </div>
              <button type="submit" disabled={busy || !phoneInput.trim()} className="btn-primary w-full px-4 py-3">
                {busy ? "Sending…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\d{6}$/.test(code.trim())) {
                  setError("Enter the 6-digit code from the SMS.");
                  return;
                }
                run(() => verifyPhoneCode(sentTo, code));
              }}
            >
              <label className="block text-sm font-semibold" htmlFor="login-otp">
                6-digit OTP
              </label>
              <input
                id="login-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                placeholder="123456"
                className="neu-inset w-full px-3 py-3 tracking-widest"
              />
              <button type="submit" disabled={busy || code.length !== 6} className="btn-primary w-full px-4 py-3">
                {busy ? "Checking…" : "Verify and log in"}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => resetFlow("phone")} className="font-semibold text-blue-700 underline">
                  Change number
                </button>
                <button
                  type="button"
                  disabled={busy || cooldown > 0}
                  onClick={() => run(() => sendPhoneCode(sentTo), () => {
                    setCooldown(RESEND_SECONDS);
                    setMessage("We sent a new code.");
                  })}
                  className="font-semibold text-blue-700 underline disabled:text-slate-400 disabled:no-underline"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          ))}

        {tab === "email" && !emailOff &&
          (sentTo === null ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!EMAIL_OK.test(email.trim())) {
                  setError("Please enter a valid email address.");
                  return;
                }
                run(() => sendEmailCode(email.trim()), () => {
                  setSentTo(email.trim());
                  setMessage(`We sent a login code to ${email.trim()}. Enter the code, or tap the link in the email.`);
                });
              }}
            >
              <label className="block text-sm font-semibold" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="neu-inset w-full px-3 py-3"
              />
              <button type="submit" disabled={busy || !email} className="btn-primary w-full px-4 py-3">
                {busy ? "Sending…" : "Send login code"}
              </button>
            </form>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\d{6,8}$/.test(code.trim())) {
                  setError("Enter the numeric code from the email.");
                  return;
                }
                run(() => verifyEmailCode(sentTo, code));
              }}
            >
              <label className="block text-sm font-semibold" htmlFor="login-code">
                Login code
              </label>
              <input
                id="login-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={8}
                placeholder="123456"
                className="neu-inset w-full px-3 py-3 tracking-widest"
              />
              <button type="submit" disabled={busy || code.length < 6} className="btn-primary w-full px-4 py-3">
                {busy ? "Checking…" : "Verify and log in"}
              </button>
              <button type="button" onClick={() => resetFlow("email")} className="w-full text-sm font-semibold text-blue-700 underline">
                Use a different email or resend
              </button>
            </form>
          ))}

        {message && (
          <p role="status" className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>

      <button type="button" onClick={onCancel} className="btn-ghost w-full px-4 py-3">
        Back to my booking
      </button>
    </section>
  );
}
