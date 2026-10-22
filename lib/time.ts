const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export function weekdayOf(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** "HH:MM" -> minutes after midnight (NaN if invalid) */
export function parseTime(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return NaN;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return NaN;
  return h * 60 + m;
}

/** minutes after midnight -> "1:00 PM" */
export function formatTime(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

export function formatTimeRange(startMinutes: number, lengthHours: number): string {
  return `${formatTime(startMinutes)} – ${formatTime(startMinutes + lengthHours * 60)}`;
}

export function formatDateLong(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
