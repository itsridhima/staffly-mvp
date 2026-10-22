"use client";

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Bold title, muted subtitle, and an optional "See all" link. */
export default function SectionHeader({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-black">{title}</h2>
        {subtitle && <p className="muted text-sm">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="shrink-0 text-sm font-bold text-blue-700">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
