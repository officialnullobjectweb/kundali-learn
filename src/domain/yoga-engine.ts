// Yoga detection: classical combinations with strict, documented conditions.
// Only yogas with crisp computable definitions are implemented; composites
// (Dhana, Lakshmi, Saraswati) are marked as such in their reasons.
// Evaluated on the D1 chart; strength reflects how completely conditions hold.

import type { Aspect, BuiltChart, Graha, YogaResult } from './types';
import { RASHI_LORDS } from './constants';

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
/** Exalted, moolatrikona (own territory), or own. */
const STRONG_D = ['Exalted', 'Moolatrikona', 'Own'];

const strong = (c: BuiltChart, g: Graha): boolean =>
  STRONG_D.includes(c.planets[g].dignity);

const sameHouse = (c: BuiltChart, a: Graha, b: Graha): boolean =>
  c.planets[a].bhava === c.planets[b].bhava;

const mutualAspect = (aspects: Aspect[], a: Graha, b: Graha): boolean =>
  aspects.some((x) => x.from === a && x.to === b) &&
  aspects.some((x) => x.from === b && x.to === a);

function push(
  out: YogaResult[],
  name: string,
  factors: string[],
  strength: number,
  favourable = true,
): void {
  out.push({ name, factors, strength, favourable });
}

const MAHAPURUSHA: { graha: Graha; name: string }[] = [
  { graha: 'Mars', name: 'Ruchaka' },
  { graha: 'Mercury', name: 'Bhadra' },
  { graha: 'Jupiter', name: 'Hamsa' },
  { graha: 'Venus', name: 'Malavya' },
  { graha: 'Saturn', name: 'Sasa' },
];

/** Every yoga name this engine can detect. Domain rules may only reference these. */
export const KNOWN_YOGAS: string[] = [
  'Budha-Aditya',
  'Gajakesari',
  'Chandra-Mangala',
  'Amala',
  'Dharmakarmadhipati',
  'Ruchaka',
  'Bhadra',
  'Hamsa',
  'Malavya',
  'Sasa',
  'Lakshmi',
  'Dhana',
  'Saraswati',
];

export function yogaEngine(chart: BuiltChart, aspects: Aspect[] = []): YogaResult[] {
  const out: YogaResult[] = [];

  // Budha-Aditya: Sun and Mercury together.
  if (sameHouse(chart, 'Sun', 'Mercury')) {
    push(out, 'Budha-Aditya', ['Sun', 'Mercury', `Bhava:${chart.planets.Sun.bhava}`], 0.5);
  }
  // Gajakesari: Jupiter in kendra from the Moon.
  const moonBhava = chart.planets.Moon.bhava;
  const jupFromMoon = (((chart.planets.Jupiter.bhava - moonBhava) % 12) + 12) % 12 + 1;
  if (KENDRA.includes(jupFromMoon)) {
    push(out, 'Gajakesari', ['Jupiter', 'Moon'], 0.65);
  }
  // Chandra-Mangala: Moon and Mars together.
  if (sameHouse(chart, 'Moon', 'Mars')) {
    push(out, 'Chandra-Mangala', ['Moon', 'Mars', `Bhava:${chart.planets.Moon.bhava}`], 0.55);
  }
  // Amala: benefic in the 10th from lagna.
  for (const g of ['Jupiter', 'Venus', 'Mercury'] as Graha[]) {
    if (chart.houses[10].occupants.includes(g) && strong(chart, g)) {
      push(out, 'Amala', [g, 'Bhava:10'], 0.55);
      break;
    }
  }
  // Dharmakarmadhipati: 9th and 10th lords joined or aspecting each other.
  const lord9 = chart.houses[9].lord;
  const lord10 = chart.houses[10].lord;
  if (lord9 !== lord10) {
    if (
      sameHouse(chart, lord9, lord10) ||
      mutualAspect(aspects, lord9, lord10)
    ) {
      push(out, 'Dharmakarmadhipati', [lord9, lord10], 0.7);
    }
  } else if (strong(chart, lord9)) {
    // Same lord for both houses and strong: a single-lord variant, weaker.
    push(out, 'Dharmakarmadhipati', [lord9], 0.45);
  }
  // Pancha Mahapurusha: Mars/Mercury/Jupiter/Venus/Saturn own or exalted in kendra.
  for (const { graha, name } of MAHAPURUSHA) {
    const p = chart.planets[graha];
    if (KENDRA.includes(p.bhava) && STRONG_D.includes(p.dignity)) {
      push(out, name, [graha, `Bhava:${p.bhava}`], 0.75);
    }
  }
  // Lakshmi (documented composite): Venus exalted or in own territory in
  // kendra or trikona with a strong 9th lord.
  const venus = chart.planets.Venus;
  if (
    STRONG_D.includes(venus.dignity) &&
    (KENDRA.includes(venus.bhava) || TRIKONA.includes(venus.bhava)) &&
    strong(chart, chart.houses[9].lord)
  ) {
    push(out, 'Lakshmi', ['Venus', chart.houses[9].lord], 0.65);
  }
  // Dhana (documented composite): 2nd lord placed outside houses 3/6/8/12
  // with Jupiter or Venus strong.
  const lord2 = chart.houses[2].lord;
  const b2 = chart.planets[lord2].bhava;
  if (
    ![3, 6, 8, 12].includes(b2) &&
    (strong(chart, 'Jupiter') || strong(chart, 'Venus'))
  ) {
    push(out, 'Dhana', [lord2, 'Bhava:2'], 0.6);
  }
  // Saraswati (documented composite): Mercury, Jupiter and Venus all strong.
  if (strong(chart, 'Mercury') && strong(chart, 'Jupiter') && strong(chart, 'Venus')) {
    push(out, 'Saraswati', ['Mercury', 'Jupiter', 'Venus'], 0.6);
  }

  return out;
}
