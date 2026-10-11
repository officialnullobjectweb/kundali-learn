// Deterministic chart construction: sidereal longitudes -> planets + houses.
// Whole-sign houses. Varga views recompute rashis via varga-engine; the varga
// lagna is the varga rashi of the ascendant (or of the Moon in Chandra mode).
// Simplifications (documented, deterministic): combustion orb 8° (not applied
// to Sun/Rahu/Ketu); single-tier natural friendship for Friend/Enemy.

import { GRAHAS } from './types';
import {
  COMBUST_ORBS,
  debilitationRashi,
  EXALTATION,
  MOOLATRIKONA,
  NATURAL_ENEMIES,
  NATURAL_FRIENDS,
  OWN_RASHIS,
  RASHI_LORDS,
} from './constants';
import {
  bhavaFromRashis,
  degreeInRashi,
  nakshatraFromLongitude,
  norm360,
  padaFromLongitude,
  rashiFromLongitude,
  smallestAngularDistance,
} from './astro-math';
import { allVargaRashis, vargaDegree, vargaRashi, VARGAS } from './varga-engine';
import type {
  Bhava,
  BuildChartOptions,
  BuiltChart,
  ChartState,
  ChartView,
  Dignity,
  Graha,
  HouseInfo,
  PlanetInfo,
  RashiIndex,
  Varga,
} from './types';
import type { ChartEngine } from './engines';

export function dignityOf(graha: Graha, rashi: RashiIndex): Dignity {
  if (rashi === EXALTATION[graha].rashi) return 'Exalted';
  if (rashi === debilitationRashi(graha)) return 'Debilitated';
  if (MOOLATRIKONA[graha] === rashi) return 'Moolatrikona';
  if (OWN_RASHIS[graha].includes(rashi)) return 'Own';
  const lord = RASHI_LORDS[rashi];
  if (NATURAL_FRIENDS[graha].includes(lord)) return 'Friend';
  if (NATURAL_ENEMIES[graha].includes(lord)) return 'Enemy';
  return 'Neutral';
}

function planetInfo(
  graha: Graha,
  longitude: number,
  lagnaRashi: RashiIndex,
  sunLon: number,
  varga: Varga,
  retro?: boolean,
): PlanetInfo {
  const lon = norm360(longitude);
  const rashi = rashiFromLongitude(lon);
  const displayRashi = varga === 'D1' ? rashi : vargaRashi(lon, varga);
  return {
    graha,
    longitude: lon,
    rashi,
    degreeInRashi: degreeInRashi(lon),
    vargaDegree: vargaDegree(lon, varga),
    nakshatra: nakshatraFromLongitude(lon),
    pada: padaFromLongitude(lon),
    dignity: dignityOf(graha, displayRashi),
    isRetrograde: retro !== undefined ? retro : graha === 'Rahu' || graha === 'Ketu',
    isCombust:
      COMBUST_ORBS[graha] !== null &&
      smallestAngularDistance(lon, sunLon) < (COMBUST_ORBS[graha] as number),
    bhava: bhavaFromRashis(displayRashi, lagnaRashi),
    vargaRashi: allVargaRashis(lon),
  };
}

export const buildChart: ChartEngine = (chart, view, opts?: BuildChartOptions) => {
  const asc = norm360(chart.ascendant);
  const sunLon = norm360(chart.placements.Sun);
  const lagnaLon = view.lagna === 'Chandra' ? norm360(chart.placements.Moon) : asc;
  // Display rashi under the active varga; D1 lagna is the natal lagna rashi.
  const lagnaRashi =
    view.varga === 'D1' ? rashiFromLongitude(lagnaLon) : vargaRashi(lagnaLon, view.varga);

  const disp = (lon: number): RashiIndex =>
    view.varga === 'D1' ? rashiFromLongitude(lon) : vargaRashi(lon, view.varga);

  const planets = {} as Record<Graha, PlanetInfo>;
  for (const graha of GRAHAS) {
    const info = planetInfo(graha, chart.placements[graha], lagnaRashi, sunLon, view.varga, opts?.retrograde?.[graha]);
    info.bhava = bhavaFromRashis(disp(info.longitude), lagnaRashi);
    planets[graha] = info;
  }

  const houses = {} as Record<Bhava, HouseInfo>;
  for (let b = 1; b <= 12; b++) {
    const bhava = b as Bhava;
    const rashi = ((lagnaRashi + b - 1) % 12) as RashiIndex;
    houses[bhava] = {
      bhava,
      rashi,
      lord: RASHI_LORDS[rashi],
      occupants: GRAHAS.filter((g) => disp(planets[g].longitude) === rashi),
    };
  }

  const built: BuiltChart = { view, lagnaRashi, planets, houses };
  return built;
};

/** Every supported varga projection of one chart (single lagna mode). */
export function buildAllVargas(
  chart: ChartState,
  lagna: ChartView['lagna'],
  opts?: BuildChartOptions,
): Record<Varga, BuiltChart> {
  const out = {} as Record<Varga, BuiltChart>;
  for (const varga of VARGAS) out[varga] = buildChart(chart, { varga, lagna }, opts);
  return out;
}
