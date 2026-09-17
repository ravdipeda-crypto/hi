// Date helpers. Everything operates on local calendar days represented as
// 'YYYY-MM-DD' strings, so a "day" always means the user's local day and
// never shifts because of timezone/UTC math.

import type { DayRecord } from '../types';

/** Returns today's date as a local 'YYYY-MM-DD' string. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Formats a Date as local 'YYYY-MM-DD' (no UTC conversion). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parses a 'YYYY-MM-DD' string into a local Date at midnight. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Adds `days` (can be negative) to a 'YYYY-MM-DD' string, returns new ISO string. */
export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Inclusive end date given a start date and a duration in days. */
export function computeEndDate(startDate: string, durationDays: number): string {
  return addDays(startDate, Math.max(1, durationDays) - 1);
}

/** Returns every 'YYYY-MM-DD' date from start to end, inclusive. */
export function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cursor = startDate;
  // Guard against malformed ranges causing an infinite loop.
  let safety = 0;
  while (cursor <= endDate && safety < 100000) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
    safety++;
  }
  return dates;
}

/** True if `iso` is strictly before today (local). */
export function isPast(iso: string): boolean {
  return iso < todayISO();
}

export function isToday(iso: string): boolean {
  return iso === todayISO();
}

export function isFuture(iso: string): boolean {
  return iso > todayISO();
}

/** Formats seconds as H:MM:SS (or M:SS if under an hour) for compact display. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Formats seconds as "Xh Ym" for daily-target style display; drops 0 parts. */
export function formatHoursMinutes(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** Human-friendly date, e.g. "Wed, 16 Sep 2026". */
export function formatLongDate(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Short date, e.g. "16 Sep". */
export function formatShortDate(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

/**
 * Groups a chronologically-sorted list of day records into calendar weeks
 * (Sun-Sat), padding leading/trailing gaps with `null` so a calendar grid
 * can render fixed 7-column rows. Moved out of screens/CommitmentDetail.tsx
 * verbatim — this is pure calendar-layout logic, not screen-specific.
 */
export function groupByWeek(records: DayRecord[]): (DayRecord | null)[][] {
  if (records.length === 0) return [];
  const weeks: (DayRecord | null)[][] = [];
  let currentWeek: (DayRecord | null)[] = [];

  const firstDow = parseISODate(records[0].date).getDay();
  for (let i = 0; i < firstDow; i++) currentWeek.push(null);

  for (const record of records) {
    currentWeek.push(record);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}
