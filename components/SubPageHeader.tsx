"use client";

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
  action?: React.ReactNode;
}

/** Back arrow + title used by every Profile sub-page. */
export default function SubPageHeader({ title, subtitle, onBack, action }: Props) {
  return (
    <header className="flex items-center gap-3">
      <button type="button" onClick={onBack} aria-label="Back" className="neu flex h-11 w-11 shrink-0 items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-black leading-tight">{title}</h1>
        {subtitle && <p className="muted truncate text-sm">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
