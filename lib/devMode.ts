/**
 * Developer tools (for testing the "slot taken" screen and moving a booking through its tracking steps).
 * Hidden from customers. Turn on by opening the app with ?dev=1 and off with ?dev=0.
 * The choice is remembered for the browser tab only.
 */
const KEY = "staffly-dev-tools";

export function readDevMode(search: string): boolean {
  try {
    const param = new URLSearchParams(search).get("dev");
    if (param === "1") sessionStorage.setItem(KEY, "1");
    if (param === "0") sessionStorage.removeItem(KEY);
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
