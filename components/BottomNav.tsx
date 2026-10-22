"use client";

export type NavTarget = "home" | "cart" | "profile";

interface Props {
  active: NavTarget | null;
  cartCount: number;
  onNavigate: (target: NavTarget) => void;
}

const base = "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold";

function Icon({ d }: { d: string[] }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6">
      {d.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  );
}

export default function BottomNav({ active, cartCount, onNavigate }: Props) {
  return (
    <nav
      aria-label="Main"
      className="glass fixed bottom-3 left-1/2 z-30 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center rounded-[28px] px-2"
    >
      <button type="button" onClick={() => onNavigate("home")} aria-current={active === "home" ? "page" : undefined} className={`${base} ${active === "home" ? "text-blue-600" : "muted"}`}>
        <Icon d={["M4 11l8-7 8 7", "M6 10v10h12V10"]} />
        Home
      </button>

      <button
        type="button"
        onClick={() => onNavigate("cart")}
        aria-label={`Your booking, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
        aria-current={active === "cart" ? "page" : undefined}
        className="btn-primary relative -mt-7 mb-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
      >
        <Icon d={["M6 7h14l-1.5 9H8z", "M6 7L5 4H3", "M9 20h.01", "M17 20h.01"]} />
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {cartCount}
          </span>
        )}
      </button>

      <button type="button" onClick={() => onNavigate("profile")} aria-current={active === "profile" ? "page" : undefined} className={`${base} ${active === "profile" ? "text-blue-600" : "muted"}`}>
        <Icon d={["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21c0-4 4-6 8-6s8 2 8 6"]} />
        Profile
      </button>
    </nav>
  );
}
