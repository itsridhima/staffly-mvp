"use client";

interface Props {
  /** The screen title and back arrow now live in the shared header at the top of every screen. */
  title?: string;
  onBack?: () => void;
  /** Optional line of text under the header, for example "Workers you've had on your shifts" */
  subtitle?: string;
  /** Optional button on the right, for example "+ Add" */
  action?: React.ReactNode;
}

/** Page intro used by Profile sub-pages: a short description and/or an action button. */
export default function SubPageHeader({ subtitle, action }: Props) {
  if (!subtitle && !action) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      {subtitle ? <p className="muted text-sm">{subtitle}</p> : <span />}
      {action}
    </div>
  );
}
