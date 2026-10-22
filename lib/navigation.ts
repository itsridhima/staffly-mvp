/**
 * Screen navigation rules. The app is a single page, so we keep our own stack of screens.
 * The on-screen back arrow and the phone's back button both use these rules.
 */
export type View =
  | "home"
  | "role"
  | "cart"
  | "login"
  | "payment"
  | "bank"
  | "taken"
  | "confirmed"
  | "profile"
  | "my-bookings"
  | "payments"
  | "help"
  | "crew"
  | "venues"
  | "edit-profile"
  | "account"
  | "legal"
  | "manage-data"
  | "booking"
  | "notifications";

export type Tab = "home" | "shifts" | "booking" | "crew" | "help";

/** The screen each bottom-bar tab opens. */
export const TAB_ROOT: Record<Tab, View> = {
  home: "home",
  shifts: "my-bookings",
  booking: "cart",
  crew: "crew",
  help: "help",
};

/** Pressing a tab starts a fresh stack. Back from any tab other than Home goes to Home. */
export function tabStack(tab: Tab): View[] {
  return tab === "home" ? ["home"] : ["home", TAB_ROOT[tab]];
}

/** Which bottom-bar tab to highlight for a screen (null = none, for example Profile pages). */
export function activeTab(view: View): Tab | null {
  switch (view) {
    case "home":
    case "role":
    case "notifications":
      return "home";
    case "my-bookings":
    case "booking":
      return "shifts";
    case "cart":
    case "login":
    case "payment":
    case "bank":
    case "taken":
      return "booking";
    case "crew":
      return "crew";
    case "help":
      return "help";
    default:
      return null;
  }
}

/** Open a screen on top of the current one. */
export function push(stack: View[], view: View): View[] {
  const top = stack[stack.length - 1];
  if (top === view) return stack;
  // After a confirmed booking you can't go back into payment: back goes to Home.
  if (view === "confirmed") return ["home", "confirmed"];
  // "Slot no longer available" goes back to Review booking, not to the payment steps.
  if (view === "taken") {
    const i = stack.lastIndexOf("cart");
    return i >= 0 ? [...stack.slice(0, i + 1), "taken"] : [...stack, "taken"];
  }
  return [...stack, view];
}

/** One step back. The first screen stays put. */
export function back(stack: View[]): View[] {
  return stack.length > 1 ? stack.slice(0, -1) : stack;
}

/** Go back to the nearest earlier copy of a screen (or open it if it isn't in the stack). */
export function backTo(stack: View[], view: View): View[] {
  const i = stack.lastIndexOf(view);
  return i >= 0 ? stack.slice(0, i + 1) : [...stack, view];
}

export function canGoBack(stack: View[]): boolean {
  return stack.length > 1;
}

/** The bottom bar is hidden while paying. */
export function showBottomBar(view: View): boolean {
  return view !== "payment" && view !== "bank";
}

export const VIEW_TITLE: Record<View, string> = {
  home: "Staffly",
  role: "Role",
  cart: "Review booking",
  login: "Log in or sign up",
  payment: "Payment",
  bank: "Confirm payment",
  taken: "Slot unavailable",
  confirmed: "Booking confirmed",
  profile: "Profile",
  "my-bookings": "My shifts",
  payments: "Payments",
  help: "Help & Support",
  crew: "Your crew",
  venues: "Saved venues",
  "edit-profile": "Edit profile",
  account: "Manage account",
  legal: "Policy",
  "manage-data": "Manage data",
  booking: "Booking",
  notifications: "Notifications",
};
