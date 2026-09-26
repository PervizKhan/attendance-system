// lib/date.ts
// Centralized Pakistan Standard Time (UTC+5) helpers.
// Pakistan has no DST, so a fixed offset is safe.

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Returns the PKT calendar date as 'YYYY-MM-DD'. */
export function getPKTDateString(d: Date = new Date()): string {
  return new Date(d.getTime() + PKT_OFFSET_MS).toISOString().split('T')[0];
}

/**
 * Returns the [start, end) UTC Date range covering the given PKT calendar day.
 * If dateStr is omitted, uses today in PKT. Throws on malformed input.
 */
export function getPKTDayRange(dateStr?: string): { start: Date; end: Date } {
  const str = dateStr ?? getPKTDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    throw new Error(`Invalid date format: ${str}`);
  }
  const start = new Date(`${str}T00:00:00+05:00`);
  if (isNaN(start.getTime())) {
    throw new Error(`Invalid date: ${str}`);
  }
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** True if the given PKT date string is a Sunday. */
export function isPKTSunday(dateStr?: string): boolean {
  const str = dateStr ?? getPKTDateString();
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() === 0;
}