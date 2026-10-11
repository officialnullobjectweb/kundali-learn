// Transit engine: geocentric sidereal positions at an explicit date against
// the natal chart. Whole-sign transit bhavas counted from the natal lagna;
// transit-to-natal aspects via standard graha-drishti. Also exposes the
// Sade-sati phase as pure rashi arithmetic on Moon vs transit Saturn.

import { tropicalLongitudes } from './astronomy-engine';
import { ayanamsaForDate } from './ayanamsa';
import { norm360, rashiFromLongitude } from './astro-math';
import { SPECIAL_ASPECTS } from './constants';
import { GRAHAS, type Bhava, type BuiltChart, type Graha, type RashiIndex } from './types';
import type { TransitEngine, TransitHit } from './engines';
import type { AyanamsaConfig } from './ayanamsa';

export type SadeSatiPhase = 'rising' | 'peak' | 'setting' | 'none';

/** Saturn 12th/1st/2nd from the Moon: 2.5 years each. Pure rashi math. */
export function sadeSatiPhase(moonRashi: RashiIndex, saturnRashi: RashiIndex): SadeSatiPhase {
  const rel = (((saturnRashi - moonRashi) % 12) + 12) % 12;
  if (rel === 11) return 'rising';
  if (rel === 0) return 'peak';
  if (rel === 1) return 'setting';
  return 'none';
}

export const transitEngine: TransitEngine = (input) => {
  const { natal, dateISO } = input;
  const ayan = ayanamsaForDate(dateISO, input.ayanamsa);
  const tropical = tropicalLongitudes(dateISO);
  const lagnaRashi = natal.lagnaRashi;
  const hits: TransitHit[] = [];

  for (const g of GRAHAS as readonly Graha[]) {
    const sidereal = norm360(tropical[g] - ayan);
    const rashi = rashiFromLongitude(sidereal);
    const natalBhava = (((((rashi - lagnaRashi) % 12) + 12) % 12) + 1) as Bhava;
    const aspectToNatal: Graha[] = [];
    for (const n of SPECIAL_ASPECTS[g]) {
      const reached = ((((natalBhava - 1 + (n - 1)) % 12) + 12) % 12) + 1;
      for (const occ of natal.houses[reached as Bhava].occupants) {
        if (!aspectToNatal.includes(occ)) aspectToNatal.push(occ);
      }
    }
    const hit: TransitHit = { graha: g, natalBhava, aspectToNatal };
    hits.push(hit);
  }
  return hits;
}

/** Transit Saturn's rashi (sidereal) at a date — the Sade-sati input. */
export function transitSaturnRashi(dateISO: string, ayanamsa?: AyanamsaConfig): RashiIndex {
  const ayan = ayanamsaForDate(dateISO, ayanamsa);
  return rashiFromLongitude(norm360(tropicalLongitudes(dateISO).Saturn - ayan));
}
