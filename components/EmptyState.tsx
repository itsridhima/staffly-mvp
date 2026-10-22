"use client";

interface Props {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

/** One sentence, one button: used wherever a list has nothing in it yet. */
export default function EmptyState({ title, body, actionLabel, onAction, icon }: Props) {
  return (
    <div className="glass flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="glass-dark flex h-14 w-14 items-center justify-center rounded-2xl" aria-hidden>
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <rect x="4" y="5" width="16" height="15" rx="3" />
            <path d="M8 3v4M16 3v4M4 10h16" />
          </svg>
        )}
      </span>
      <h2 className="text-lg font-bold">{title}</h2>
      {body && <p className="muted max-w-xs text-sm">{body}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn-primary mt-1 px-6 py-3">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
