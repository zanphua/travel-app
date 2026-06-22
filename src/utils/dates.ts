import { parseISO, format, addDays, differenceInCalendarDays, isAfter } from "date-fns";

export function toDateOnlyISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function eachDateInRange(startISO: string, endISO: string): string[] {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const days: string[] = [];
  let cursor = start;
  while (!isAfter(cursor, end)) {
    days.push(toDateOnlyISO(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function tripDurationDays(startISO: string, endISO: string): number {
  return differenceInCalendarDays(parseISO(endISO), parseISO(startISO)) + 1;
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "EEE d MMM");
}

export function formatDateRange(startISO: string, endISO: string): string {
  return `${format(parseISO(startISO), "d MMM")} – ${format(parseISO(endISO), "d MMM yyyy")}`;
}

export function isEndAfterOrEqualStart(startISO: string, endISO: string): boolean {
  return !isAfter(parseISO(startISO), parseISO(endISO));
}
