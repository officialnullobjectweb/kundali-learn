// Vedic graha-drishti as a pure function of the built chart.
// For each graha, its bhava projects SPECIAL_ASPECTS offsets; every reached
// house is aspected, plus every occupant (other than the source graha).
// Strength is 1 for all listed drishtis — a documented simplification
// (classical texts weight some aspects fractionally; not modelled here).

import { GRAHAS, type Aspect, type Bhava, type BuiltChart, type Graha } from './types';
import { SPECIAL_ASPECTS } from './constants';

export interface AspectOptions {
  /**
   * Rahu/Ketu cast 5/7/9 aspects in the Parashara-derived school used here.
   * Set false for schools that grant the nodes no drishti.
   */
  lunarNodesCastAspects?: boolean;
  /** Planets staged in the tray: cast no aspects and receive none. */
  exclude?: Graha[];
}

export function aspectEngine(chart: BuiltChart, opts?: AspectOptions): Aspect[] {
  const nodesAspect = opts?.lunarNodesCastAspects ?? true;
  const excluded = new Set<Graha>(opts?.exclude ?? []);
  const out: Aspect[] = [];
  for (const g of GRAHAS as readonly Graha[]) {
    if (excluded.has(g)) continue;
    if (!nodesAspect && (g === 'Rahu' || g === 'Ketu')) continue;
    const from = chart.planets[g].bhava;
    for (const n of SPECIAL_ASPECTS[g]) {
      const target = (((from - 1 + (n - 1)) % 12) + 1) as Bhava;
      out.push({ from: g, to: target, kind: 'graha', strength: 1 });
      for (const occ of chart.houses[target].occupants) {
        if (occ !== g && !excluded.has(occ)) out.push({ from: g, to: occ, kind: 'graha', strength: 1 });
      }
    }
  }
  return out;
}
