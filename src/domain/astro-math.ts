// Pure spherical/positional helpers. No ephemeris, no I/O, no dates.
// All functions are total and deterministic: same input -> same output.

import type { Bhava, Longitude, RashiIndex } from './types';

export const DEG_PER_RASHI = 30;
export const DEG_PER_NAKSHATRA = 40 / 3; // 13°20'
export const DEG_PER_PADA = 10 / 3; // 3°20'
/** Mean tropical year. Single source for all year-length math. */
export const YEAR_MS = 365.25 * 86_400_000;

const EPS = 1e-9;

/** Normalise any number to [0, 360). Snaps float dust at the 360/0 seam. */
export function norm360(lon: number): Longitude {
  const n = lon % 360;
  const v = n < 0 ? n + 360 : n;
  return v > 360 - EPS || v < EPS ? 0 : v;
}

/** 0 = Mesha … 11 = Meena. Upper bound clamps float dust (e.g. 359.999999999). */
export function rashiFromLongitude(lon: Longitude): RashiIndex {
  return Math.min(11, Math.floor(norm360(lon) / DEG_PER_RASHI)) as RashiIndex;
}

/** Degrees elapsed within the rashi, [0, 30). */
export function degreeInRashi(lon: Longitude): number {
  const d = norm360(lon) % DEG_PER_RASHI;
  return d > DEG_PER_RASHI - EPS ? 0 : d;
}

/** 0 = Ashwini … 26 = Revati. */
export function nakshatraFromLongitude(lon: Longitude): number {
  return Math.min(26, Math.floor(norm360(lon) / DEG_PER_NAKSHATRA));
}

export function padaFromLongitude(lon: Longitude): 1 | 2 | 3 | 4 {
  const inNak = norm360(lon) % DEG_PER_NAKSHATRA;
  return (Math.min(3, Math.floor(inNak / DEG_PER_PADA)) + 1) as 1 | 2 | 3 | 4;
}

/** Whole-sign house: house 1 = lagna rashi. */
export function bhavaFromRashis(planetRashi: RashiIndex, lagnaRashi: RashiIndex): Bhava {
  return (((((planetRashi - lagnaRashi) % 12) + 12) % 12) + 1) as Bhava;
}

export function bhavaFromLongitude(planetLon: Longitude, lagnaRashi: RashiIndex): Bhava {
  return bhavaFromRashis(rashiFromLongitude(planetLon), lagnaRashi);
}

/** Smallest angular separation in [0, 180]. */
export function smallestAngularDistance(a: Longitude, b: Longitude): number {
  const d = Math.abs(norm360(a) - norm360(b)) % 360;
  return d > 180 ? 360 - d : d;
}

/** Build an absolute longitude from rashi + degree-in-rashi (for tests/fixtures). */
export function longitudeFromRashiDegree(rashi: RashiIndex, degree: number): Longitude {
  if (degree < 0 || degree >= DEG_PER_RASHI) {
    throw new Error(`longitudeFromRashiDegree: degree ${degree} out of [0, 30)`);
  }
  return norm360(rashi * DEG_PER_RASHI + degree);
}

/**
 * New longitude for a planet moved into another rashi, degree preserved.
 * The single place UI drag/drop and click-to-move compose longitudes.
 */
export function moveToRashi(currentLongitude: number, targetRashi: RashiIndex): Longitude {
  return norm360(targetRashi * DEG_PER_RASHI + degreeInRashi(norm360(currentLongitude)));
}

/**
 * Which rashi must be lagna so that `bhava` holds `rashi`.
 * Assign Aries to house 6 -> lagna is Scorpio; every house follows.
 */
export function lagnaRashiForHouseRashi(bhava: Bhava, rashi: RashiIndex): RashiIndex {
  return ((((rashi - (bhava - 1)) % 12) + 12) % 12) as RashiIndex;
}

/** Ascendant longitude after assigning a rashi to any house (degree preserved). */
export function ascendantForHouseRashi(bhava: Bhava, rashi: RashiIndex, currentAscendant: number): Longitude {
  return norm360(lagnaRashiForHouseRashi(bhava, rashi) * DEG_PER_RASHI + degreeInRashi(currentAscendant));
}

/** "23°14'" — display only, never parsed back. */
export function toDMS(lon: Longitude): string {
  const v = norm360(lon);
  const d = Math.floor(v);
  const m = Math.floor((v - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}'`;
}
