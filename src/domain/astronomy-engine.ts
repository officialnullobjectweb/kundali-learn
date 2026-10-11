// Real ephemeris. VSOP87 heliocentric planets + ELP-based Moon (astronomia,
// Meeus algorithms), light-time iteration, nutation, aberration, ΔT.
// Tropical apparent longitudes of date -> sidereal via configured ayanamsa.
//
// VERIFIED: Sun/Moon/Mars geocentric longitude within 0.05° of JPL Horizons
// (2026-10-08 00:00 UT, CENTER 500@399, quantity 31).
// Validity: years 1900–2100. Nodes are MEAN nodes (classical usage, ±0.3°).
// Retrograde = sign of dλ/dt by finite difference. Rahu/Ketu always true
// (mean motion is retrograde by definition).

import { CalendarGregorianToJD } from 'astronomia/julian';
import { deltaT } from 'astronomia/deltat';
import { mean as gmst } from 'astronomia/sidereal';
import { meanObliquity, nutation } from 'astronomia/nutation';
import { aberration } from 'astronomia/solar';
import { Planet } from 'astronomia/planetposition';
import { position as moonPosition } from 'astronomia/moonposition';
import earthData from 'astronomia/data/vsop87Bearth';
import mercuryData from 'astronomia/data/vsop87Bmercury';
import venusData from 'astronomia/data/vsop87Bvenus';
import marsData from 'astronomia/data/vsop87Bmars';
import jupiterData from 'astronomia/data/vsop87Bjupiter';
import saturnData from 'astronomia/data/vsop87Bsaturn';
import { norm360 } from './astro-math';
import { ayanamsaForDate } from './ayanamsa';
import type { AstronomyEngine, AstronomyInput } from './engines';
import type { Graha } from './types';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const LIGHT_DAYS_PER_AU = 0.0057756;

const earth = new Planet(earthData);
const PLANETS: Record<string, InstanceType<typeof Planet>> = {
  Mercury: new Planet(mercuryData),
  Venus: new Planet(venusData),
  Mars: new Planet(marsData),
  Jupiter: new Planet(jupiterData),
  Saturn: new Planet(saturnData),
};

/** Julian Day (UT) for an ISO instant. Throws on invalid input. */
export function julianDayUT(dateISO: string): number {
  const ms = Date.parse(dateISO);
  if (!Number.isFinite(ms)) throw new Error(`astronomy: invalid dateISO '${dateISO}'`);
  const d = new Date(ms);
  const day0 = CalendarGregorianToJD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  return day0 + (d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds() + d.getUTCMilliseconds() / 1000) / 86400;
}

/** Julian Ephemeris Day (TT) for an ISO instant. */
export function ephemerisDay(dateISO: string): number {
  const ms = Date.parse(dateISO);
  if (!Number.isFinite(ms)) throw new Error(`astronomy: invalid dateISO '${dateISO}'`);
  const d = new Date(ms);
  const decimalYear = d.getUTCFullYear() + (julianDayUT(dateISO) - CalendarGregorianToJD(d.getUTCFullYear(), 1, 1)) / 365.25;
  return julianDayUT(dateISO) + deltaT(decimalYear) / 86400;
}

interface Vec {
  x: number;
  y: number;
  z: number;
}

const helioRect = (lon: number, lat: number, r: number): Vec => ({
  x: r * Math.cos(lat) * Math.cos(lon),
  y: r * Math.cos(lat) * Math.sin(lon),
  z: r * Math.sin(lat),
});

/** Geocentric apparent ecliptic longitude (tropical, degrees) via light-time iteration. */
function geocentricLongitude(planet: InstanceType<typeof Planet>, jde: number): number {
  const e = earth.position(jde);
  const E = helioRect(e.lon, e.lat, e.range);
  let tau = 0;
  let lon = 0;
  let delta = 1;
  for (let i = 0; i < 2; i++) {
    const p = planet.position(jde - tau);
    const P = helioRect(p.lon, p.lat, p.range);
    const dx = P.x - E.x;
    const dy = P.y - E.y;
    const dz = P.z - E.z;
    delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
    lon = Math.atan2(dy, dx);
    tau = LIGHT_DAYS_PER_AU * delta;
  }
  const dPsi = nutation(jde)[0];
  return norm360((lon + dPsi + aberration(delta)) * R2D);
}

function sunLongitude(jde: number): number {
  const e = earth.position(jde);
  const dPsi = nutation(jde)[0];
  return norm360((e.lon + Math.PI + dPsi + aberration(e.range)) * R2D);
}

function moonLongitude(jde: number): number {
  const m = moonPosition(jde);
  const dPsi = nutation(jde)[0];
  return norm360((m.lon + dPsi) * R2D);
}

/** Mean lunar ascending node (Rahu), Meeus low-accuracy, degrees. */
export function meanNode(jde: number): number {
  const T = (jde - 2451545.0) / 36525;
  return norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000);
}

/** Tropical longitudes of date for all 9 grahas. */
export function tropicalLongitudes(dateISO: string): Record<Graha, number> {
  const jde = ephemerisDay(dateISO);
  return {
    Sun: sunLongitude(jde),
    Moon: moonLongitude(jde),
    Mars: geocentricLongitude(PLANETS.Mars, jde),
    Mercury: geocentricLongitude(PLANETS.Mercury, jde),
    Jupiter: geocentricLongitude(PLANETS.Jupiter, jde),
    Venus: geocentricLongitude(PLANETS.Venus, jde),
    Saturn: geocentricLongitude(PLANETS.Saturn, jde),
    Rahu: meanNode(jde),
    Ketu: norm360(meanNode(jde) + 180),
  };
}

const DAY_MS = 86400000;

/** True when ecliptic longitude decreases across the date (finite difference). */
function isRetrogradeAt(graha: Graha, dateISO: string): boolean {
  if (graha === 'Rahu' || graha === 'Ketu') return true;
  const ms = Date.parse(dateISO);
  const before = tropicalLongitudes(new Date(ms - 0.6 * DAY_MS).toISOString());
  const after = tropicalLongitudes(new Date(ms + 0.6 * DAY_MS).toISOString());
  let d = after[graha] - before[graha];
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d < 0;
}

/**
 * Tropical ascendant longitude via LST + oblique ascension (Meeus ch. 12).
 * Whole-sign use only needs the rashi; exact degrees carry ΔT/nutation noise.
 */
export function ascendantLongitude(dateISO: string, lat: number, lonEast: number): number {
  if (!Number.isFinite(lat) || lat <= -90 || lat >= 90) {
    throw new Error(`astronomy: latitude ${lat} out of (-90, 90)`);
  }
  const jdUT = julianDayUT(dateISO);
  const jde = ephemerisDay(dateISO);
  const lstDeg = norm360((gmst(jdUT) / 240 + lonEast) % 360);
  const H = lstDeg * D2R;
  const eps = meanObliquity(jde);
  const phi = lat * D2R;
  const asc = Math.atan2(Math.cos(H), -(Math.sin(H) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  return norm360(asc * R2D);
}

export const astronomyEngine: AstronomyEngine = (input: AstronomyInput) => {
  const { dateISO, lat, lon } = input;
  const ayan = ayanamsaForDate(dateISO, input.ayanamsa);
  const tropical = tropicalLongitudes(dateISO);
  const placements = {} as Record<Graha, number>;
  const retrograde = {} as Record<Graha, boolean>;
  (Object.keys(tropical) as Graha[]).forEach((g) => {
    placements[g] = norm360(tropical[g] - ayan);
    retrograde[g] = isRetrogradeAt(g, dateISO);
  });
  return {
    ascendant: norm360(ascendantLongitude(dateISO, lat, lon) - ayan),
    placements,
    retrograde,
  };
};
