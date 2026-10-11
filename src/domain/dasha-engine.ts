// Vimshottari dasha: pure functions of (Moon longitude, explicit dates).
// Balance at birth = untraversed fraction of the birth nakshatra x lord
// years; then full 120-year cycle in DASHA_ORDER starting from birth lord.

import { DASHA_ORDER, DASHA_YEARS } from './constants';
import { nakshatraFromLongitude, norm360, YEAR_MS } from './astro-math';
import { DEG_PER_NAKSHATRA } from './astro-math';
import type { DashaPeriod, DashaSequence, Graha } from './types';

function parseISO(iso: string, name: string): number {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) throw new Error(`dasha: invalid ${name} '${iso}'`);
  return ms;
}

const isoOf = (ms: number): string => new Date(ms).toISOString();

/** Balance of the birth mahadasha remaining at birth, in years. */
export function birthBalance(moonLongitude: number): { lord: Graha; years: number } {
  const lon = norm360(moonLongitude);
  const nak = nakshatraFromLongitude(lon);
  const lord = DASHA_ORDER[nak % 9];
  const traversed = (lon - nak * DEG_PER_NAKSHATRA) / DEG_PER_NAKSHATRA;
  return { lord, years: (1 - traversed) * DASHA_YEARS[lord] };
}

function mahadashasFrom(birthMs: number, startLord: Graha, firstYears: number): DashaPeriod[] {
  const out: DashaPeriod[] = [];
  let idx = DASHA_ORDER.indexOf(startLord);
  let cursor = birthMs;
  let first = true;
  // Cover 120 years from birth; the cycle repeats afterwards.
  while (cursor - birthMs < 120 * YEAR_MS) {
    const lord = DASHA_ORDER[idx % 9];
    const years = first ? firstYears : DASHA_YEARS[lord];
    first = false;
    if (years <= 0) {
      idx += 1;
      continue;
    }
    const start = cursor;
    cursor += years * YEAR_MS;
    out.push({ lord, start: isoOf(start), end: isoOf(cursor) });
    idx += 1;
  }
  return out;
}

export function dashaEngine(moonLongitude: number, birthISO: string): DashaSequence {
  const birthMs = parseISO(birthISO, 'birthISO');
  const lon = norm360(moonLongitude);
  const { lord, years } = birthBalance(lon);
  return {
    birthNakshatra: nakshatraFromLongitude(lon),
    mahadashas: mahadashasFrom(birthMs, lord, years),
  };
}

/** Antardasha lords inside one mahadasha, proportional to 120-year shares. */
export function antardashas(mahadashaLord: Graha, mdStartMs: number, mdYears: number): DashaPeriod[] {
  const out: DashaPeriod[] = [];
  let idx = DASHA_ORDER.indexOf(mahadashaLord);
  let cursor = mdStartMs;
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[idx % 9];
    const years = (mdYears * DASHA_YEARS[lord]) / 120;
    const start = cursor;
    cursor += years * YEAR_MS;
    out.push({ lord, start: isoOf(start), end: isoOf(cursor) });
    idx += 1;
  }
  return out;
}

export interface CurrentPeriods {
  mahadasha: Graha;
  antardasha: Graha;
}

export function currentPeriods(
  moonLongitude: number,
  birthISO: string,
  dateISO: string,
): CurrentPeriods {
  const birthMs = parseISO(birthISO, 'birthISO');
  const dateMs = parseISO(dateISO, 'dateISO');
  if (dateMs < birthMs) throw new Error('dasha: dateISO precedes birthISO');
  const seq = dashaEngine(moonLongitude, birthISO);
  const md =
    seq.mahadashas.find((m) => dateMs >= Date.parse(m.start) && dateMs < Date.parse(m.end)) ??
    seq.mahadashas[seq.mahadashas.length - 1];
  const mdYears = (Date.parse(md.end) - Date.parse(md.start)) / YEAR_MS;
  const ad =
    antardashas(md.lord, Date.parse(md.start), mdYears).find(
      (a) => dateMs >= Date.parse(a.start) && dateMs < Date.parse(a.end),
    ) ?? antardashas(md.lord, Date.parse(md.start), mdYears)[0];
  return { mahadasha: md.lord, antardasha: ad.lord };
}
