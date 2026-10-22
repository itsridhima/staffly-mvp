"use client";

import Icon from "./icons";

interface Props {
  /** Home shows the venue on the left; every other screen shows a back arrow and the title */
  isHome: boolean;
  title: string;
  /** Small line under the title on booking screens, for example "at Main café" */
  venueLine: string | null;
  onVenueLine: () => void;
  canBack: boolean;
  onBack: () => void;
  /** Label for the venue chip on Home */
  venueLabel: string;
  onVenue: () => void;
  notificationCount: number;
  onBell: () => void;
  avatarUrl: string | null;
  initial: string | null;
  profileActive: boolean;
  onProfile: () => void;
}

/**
 * The header on every screen. Left: venue (Home) or back arrow + title. Right: bell, then the profile icon.
 */
export default function AppHeader({
  isHome,
  title,
  venueLine,
  onVenueLine,
  canBack,
  onBack,
  venueLabel,
  onVenue,
  notificationCount,
  onBell,
  avatarUrl,
  initial,
  profileActive,
  onProfile,
}: Props) {
  return (
    <header
      className={`flex items-center gap-2 py-3 ${isHome ? "" : "sticky top-0 z-30 -mx-4 bg-[rgba(234,242,255,0.9)] px-4 backdrop-blur"}`}
    >
      <div className="min-w-0 flex-1">
        {isHome ? (
          <>
            <h1 className="sr-only">Staffly</h1>
            <button
              type="button"
              onClick={onVenue}
              aria-label={`Venue: ${venueLabel}. Change venue`}
              className="neu flex max-w-full items-center gap-2 px-3 py-2 text-left"
            >
              <Icon name="pin" className="h-5 w-5 shrink-0 text-blue-700" />
              <span className="min-w-0">
                <span className="muted block text-[0.65rem] font-semibold uppercase tracking-wide">Shifts at</span>
                <span className="block truncate text-sm font-bold">{venueLabel}</span>
              </span>
              <Icon name="chevronDown" className="h-4 w-4 shrink-0 text-slate-500" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            {canBack && (
              <button type="button" onClick={onBack} aria-label="Back" className="neu flex h-11 w-11 shrink-0 items-center justify-center">
                <Icon name="back" className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black leading-tight">{title}</h1>
              {venueLine && (
                <button type="button" onClick={onVenueLine} className="muted flex max-w-full items-center gap-1 text-xs font-semibold">
                  <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{venueLine}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onBell}
        aria-label={`Notifications${notificationCount ? `, ${notificationCount} new` : ""}`}
        className="neu relative flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <Icon name="bell" className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {notificationCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onProfile}
        aria-label="Profile"
        aria-current={profileActive ? "page" : undefined}
        className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full ${profileActive ? "glass-dark" : "neu"}`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : initial ? (
          <span className="text-sm font-bold">{initial}</span>
        ) : (
          <Icon name="user" className="h-5 w-5" />
        )}
      </button>
    </header>
  );
}
