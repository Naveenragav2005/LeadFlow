/**
 * Date helpers. The API speaks UTC; everything here converts to the rep's
 * local timezone, which is what "today" and "overdue" must be judged in.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const relative = new Intl.RelativeTimeFormat("en", { numeric: "always" });

/** "just now", "5 minutes ago", "2 days ago", "3 weeks ago"... */
export function timeAgo(iso: string, now: number): string {
  const elapsed = Math.max(0, now - Date.parse(iso));
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return relative.format(-Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return relative.format(-Math.floor(elapsed / HOUR), "hour");
  if (elapsed < WEEK) return relative.format(-Math.floor(elapsed / DAY), "day");
  if (elapsed < 5 * WEEK) return relative.format(-Math.floor(elapsed / WEEK), "week");
  if (elapsed < 365 * DAY) return relative.format(-Math.floor(elapsed / (30 * DAY)), "month");
  return relative.format(-Math.floor(elapsed / (365 * DAY)), "year");
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** "2:00 PM" */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "May 4, 10:30 AM" (the year is added when it isn't the current year). */
export function formatDateTime(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type FollowUpState = "overdue" | "today" | "upcoming";

export function followUpState(iso: string, now: number): FollowUpState {
  const due = new Date(iso);
  if (due.getTime() < now) return "overdue";
  return isSameLocalDay(due, new Date(now)) ? "today" : "upcoming";
}

/** Human description of a follow-up relative to now, e.g. "today at 2:00 PM". */
export function describeFollowUp(iso: string, now: number): string {
  const due = new Date(iso);
  const today = new Date(now);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  if (isSameLocalDay(due, today)) return `today at ${formatTime(due)}`;
  if (isSameLocalDay(due, tomorrow)) return `tomorrow at ${formatTime(due)}`;
  if (isSameLocalDay(due, yesterday)) return `yesterday at ${formatTime(due)}`;
  return formatDateTime(iso, now);
}

/** Combine `<input type="date">` and `<input type="time">` values (local time) into a UTC ISO string. */
export function localInputsToIso(date: string, time: string): string {
  // A date-time string without an offset is parsed as local time.
  return new Date(`${date}T${time}`).toISOString();
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Local date as "YYYY-MM-DD", the format `<input type="date">` uses. */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local time as "HH:MM", the format `<input type="time">` uses. */
export function toTimeInputValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
