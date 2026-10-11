// Pure date/time helpers for the calendar picker. No DOM, no locale data
// (month/weekday names come from Intl in the component). Ephemeris validity
// bounds the selectable years to 1900–2100.

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export function clampYear(y: number): number {
  if (!Number.isFinite(y)) return new Date().getFullYear();
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.trunc(y)));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(clampYear(year), month + 1, 0)).getUTCDate();
}

/** 0 = Sunday … 6 = Saturday, for the 1st of the month (UTC: DST-proof). */
export function firstWeekday(year: number, month: number): number {
  return new Date(Date.UTC(clampYear(year), month, 1)).getUTCDay();
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = clampYear(year) * 12 + month + delta;
  const min = MIN_YEAR * 12;
  const max = MAX_YEAR * 12 + 11;
  const clamped = Math.min(max, Math.max(min, total));
  return { year: Math.floor(clamped / 12), month: clamped % 12 };
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 24h -> 12h dial value + period. */
export function to12Hour(h24: number): { h12: number; period: 'AM' | 'PM' } {
  const h = ((h24 % 24) + 24) % 24;
  return { h12: h % 12 === 0 ? 12 : h % 12, period: h < 12 ? 'AM' : 'PM' };
}

/** 12h dial value + period -> 24h. */
export function from12Hour(h12: number, period: 'AM' | 'PM'): number {
  return (h12 % 12) + (period === 'PM' ? 12 : 0);
}

/** 12-year window start containing the year (clamped to bounds). */
export function yearWindow(year: number): number[] {
  const start = clampYear(year) - 6;
  const s = Math.min(MAX_YEAR - 11, Math.max(MIN_YEAR, start));
  return Array.from({ length: 12 }, (_, i) => s + i);
}

/** Local 'YYYY-MM-DDTHH:mm' (matches datetime-local value shape). */
export function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Parse local 'YYYY-MM-DDTHH:mm' (or date-only); null when invalid/out of range. */
export function parseLocalInput(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const d = new Date(y, mo - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0), 0, 0);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}
