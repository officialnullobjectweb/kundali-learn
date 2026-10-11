// Parashari varga mapping: pure function of D1 sidereal longitude.
// D4 (Chaturthamsha, BPHS kendra rule): 4 slices of 7°30'; quarter k maps to
//   the k-th kendra from the sign (offsets 0, 3, 6, 9) — same for odd/even.
// D6 (Shashtamsha, Tajika): 6 slices of 5°; odd signs from the sign itself,
//   even signs from the 7th from it (user-confirmed convention).
// D7 (Saptamsha): 7 slices of 30/7°; odd signs from the sign itself, even
//   signs from the 7th from it (BPHS 6.10-11).
// D9 (Navamsha): 9 slices of 3°20'; start counted from the rashi itself
//   (movable), the 9th from it (fixed), or the 5th from it (dual).
// D10 (Dashamsha): 10 slices of 3°; odd rashis counted from the rashi
//   itself, even rashis from the 9th from it.
// D60 (Shashtiamsha): 60 slices of 0°30'; odd signs from Mesha, even signs
//   from Tula (Jagannatha Hora convention, user-confirmed).

import {
  DEG_PER_PADA,
  degreeInRashi,
  moveToRashi,
  norm360,
  rashiFromLongitude,
  smallestAngularDistance,
} from './astro-math';
import type { Longitude, RashiIndex, Varga } from './types';

export const VARGAS: readonly Varga[] = ['D1', 'D4', 'D6', 'D7', 'D9', 'D10', 'D60'];

/** Divisions per sign for degree mapping. */
const DIVISIONS: Record<Varga, number> = {
  D1: 1, D4: 4, D6: 6, D7: 7, D9: 9, D10: 10, D60: 60,
};

export function vargaRashi(longitude: Longitude, varga: Varga): RashiIndex {
  const r = rashiFromLongitude(longitude);
  if (varga === 'D1') return r;
  const d = degreeInRashi(longitude);
  const odd = r % 2 === 0; // Mesha, Mithuna, ... are odd signs
  if (varga === 'D4') {
    const n = Math.min(3, Math.floor(d / 7.5));
    return ((r + n * 3) % 12) as RashiIndex;
  }
  if (varga === 'D6') {
    const n = Math.min(5, Math.floor(d / 5));
    const start = odd ? r : (r + 6) % 12;
    return ((start + n) % 12) as RashiIndex;
  }
  if (varga === 'D7') {
    const n = Math.min(6, Math.floor(d / (30 / 7)));
    const start = odd ? r : (r + 6) % 12;
    return ((start + n) % 12) as RashiIndex;
  }
  if (varga === 'D9') {
    const n = Math.min(8, Math.floor(d / DEG_PER_PADA));
    // Movable: 0 Mesha, 3 Karka, 6 Tula, 9 Makara -> r % 3 === 0.
    const start = r % 3 === 0 ? r : r % 3 === 1 ? (r + 8) % 12 : (r + 4) % 12;
    return ((start + n) % 12) as RashiIndex;
  }
  if (varga === 'D10') {
    const n = Math.min(9, Math.floor(d / 3));
    const start = odd ? r : (r + 8) % 12;
    return ((start + n) % 12) as RashiIndex;
  }
  // D60
  const n = Math.min(59, Math.floor(d / 0.5));
  const start = odd ? 0 : 6; // Mesha for odd signs, Tula for even
  return ((start + n) % 12) as RashiIndex;
}

/** Degrees elapsed inside the active varga sign, [0, 30). */
export function vargaDegree(longitude: Longitude, varga: Varga): number {
  if (varga === 'D1') return degreeInRashi(longitude);
  const d = degreeInRashi(longitude);
  const v = (((d / 30) * DIVISIONS[varga]) % 1) * 30;
  // Snap float dust near whole degrees (e.g. exact 12.0 reading 11.9999999).
  // 1e-6° is far below any varga part, so no real boundary can be crossed.
  const s = Math.round(v) % 30;
  if (Math.abs(v - Math.round(v)) < 1e-6) return s;
  return v > 30 - 1e-9 ? 0 : v;
}

/** Per-varga rashi of one longitude, for every supported varga. */
export function allVargaRashis(longitude: Longitude): Record<Varga, RashiIndex> {
  const out = {} as Record<Varga, RashiIndex>;
  for (const v of VARGAS) out[v] = vargaRashi(longitude, v);
  return out;
}

/**
 * New D1 longitude whose `varga` sign becomes `target`, staying as close as
 * possible to `current` (same D1 sign preferred). Used for drag/drop inside
 * varga views. D1 keeps exact degree preservation via moveToRashi.
 */
export function moveToVargaRashi(
  currentLongitude: number,
  target: RashiIndex,
  varga: Varga,
): Longitude {
  const cur = norm360(currentLongitude);
  if (varga === 'D1') return moveToRashi(cur, target);
  const r = rashiFromLongitude(cur);
  let best: Longitude = cur;
  let bestCost = Infinity;
  for (let r2 = 0; r2 < 12; r2++) {
    for (let d2 = 0; d2 < 30; d2 += 0.25) {
      const lon = norm360(r2 * 30 + d2);
      if (vargaRashi(lon, varga) !== target) continue;
      // Same-sign candidates always win (max angular distance is 180).
      const cost = smallestAngularDistance(cur, lon) + (r2 === r ? -360 : 0);
      if (cost < bestCost) {
        bestCost = cost;
        best = lon;
      }
    }
  }
  return best;
}
