"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

interface Props {
  /** Why we're asking, e.g. "Log in to continue to payment." */
  reason: string;
  onCancel: () => void;
}

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ reason, onCancel }: Props) {
  const { configured, signInWithGoogle, sendEmailCode, verifyEmailCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(task: () => Promise<string | null>, onOk?: () => void) {
    setBusy(true);
    setError(null);
    setMessage(null);
    const err = await task();
    setBusy(false);
    if (err) setError(err);
    else onOk?.();
  }

  if (!configured) {
    return (
      <section className="glass space-y-3 p-6">
        <h2 className="text-xl font-bold">Login isn&apos;t set up on this copy</h2>
        <p className="muted text-sm">
          The app owner hasn&apos;t added the Supabase keys yet, so login is unavailable here.
        </p>
        <button type="button" onClick={onCancel} className="btn-ghost px-4 py-3">
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="glass-dark p-5">
        <h2 className="text-2xl font-black">Log in to Staffly</h2>
        <p className="mt-1 text-sm text-sky-100">{reason}</p>
      </div>

      <div className="glass space-y-4 p-5">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(signInWithGoogle)}
          className="btn-ghost flex w-full items-center justify-center gap-3 px-4 py-3"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.4z" />
            <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6z" />
            <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A12 12 0 0 0 1.8 7.1l3.8 3C6.5 6.8 9 4.8 12 4.8z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-xs muted" aria-hidden>
          <span className="h-px flex-1 bg-slate-300" />
          or use your email
          <span className="h-px flex-1 bg-slate-300" />
        </div>

        {!sent ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!EMAIL_OK.test(email.trim())) {
                setError("Please enter a valid email address.");
                return;
              }
              run(() => sendEmailCode(email.trim()), () => {
                setSent(true);
                setMessage(`We sent a login code to ${email.trim()}. Enter the 6-digit code, or tap the link in the email.`);
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
              run(() => verifyEmailCode(email.trim(), code));
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
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setCode("");
                setMessage(null);
                setError(null);
              }}
              className="w-full text-sm font-semibold text-blue-700 underline"
            >
              Use a different email or resend
            </button>
          </form>
        )}

        {message && <p role="status" className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">{message}</p>}
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
