// Configurable ayanamsa. Pure: same (date, config) -> same offset.
// Lahiri is the default; deltas for other schools are documented
// approximations — pass { system: 'custom', customOffset } for exact control.

import { norm360, YEAR_MS } from './astro-math';
import { LAHIRI_J2000 } from './constants';

export type AyanamsaSystem = 'lahiri' | 'raman' | 'krishnamurti' | 'custom';

export interface AyanamsaConfig {
  system?: AyanamsaSystem;
  /** Required when system === 'custom'. Exact sidereal offset in degrees. */
  customOffset?: number;
}

/** Raman ≈ Lahiri − 1°10'; Krishnamurti ≈ Lahiri − 6'. Approximate by design. */
const RAMAN_DELTA = -1.17;
const KRISHNAMURTI_DELTA = -0.11;
/** Mean precession rate, deg per tropical year. */
const PRECESSION_PER_YEAR = 50.29 / 3600;

export function ayanamsaForDate(dateISO: string, config: AyanamsaConfig = {}): number {
  const { system = 'lahiri', customOffset } = config;
  if (system === 'custom') {
    if (customOffset === undefined || !Number.isFinite(customOffset)) {
      throw new Error("ayanamsaForDate: system 'custom' requires a finite customOffset");
    }
    return norm360(customOffset);
  }
  const ms = Date.parse(dateISO);
  if (!Number.isFinite(ms)) {
    throw new Error(`ayanamsaForDate: invalid dateISO '${dateISO}'`);
  }
  const years = (ms - Date.UTC(2000, 0, 1, 12)) / YEAR_MS;
  const lahiri = LAHIRI_J2000 + years * PRECESSION_PER_YEAR;
  switch (system) {
    case 'lahiri':
      return lahiri;
    case 'raman':
      return lahiri + RAMAN_DELTA;
    case 'krishnamurti':
      return lahiri + KRISHNAMURTI_DELTA;
  }
}

/** Tropical longitude -> sidereal longitude. */
export function tropicalToSidereal(tropical: number, ayanamsa: number): number {
  return norm360(tropical - ayanamsa);
}
