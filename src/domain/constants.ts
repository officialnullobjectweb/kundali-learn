// Static Vedic tables. Data only — no logic, no derivation.
// Everything here is a widely-published classical assignment.

import type { Bhava, Graha, RashiIndex } from './types';

/** Rashi lord (Rahu/Ketu co-lordships noted where classical schools differ). */
export const RASHI_LORDS: Record<RashiIndex, Graha> = {
  0: 'Mars',
  1: 'Venus',
  2: 'Mercury',
  3: 'Moon',
  4: 'Sun',
  5: 'Mercury',
  6: 'Venus',
  7: 'Mars',
  8: 'Jupiter',
  9: 'Saturn',
  10: 'Saturn',
  11: 'Jupiter',
};

/**
 * Exaltation signs. `degree` is the classical deep-exaltation point —
 * informational here: dignity is evaluated at whole-sign granularity
 * (documented simplification). Reserved for a future strength engine.
 */
export const EXALTATION: Record<Graha, { rashi: RashiIndex; degree: number }> = {
  Sun: { rashi: 0, degree: 10 },
  Moon: { rashi: 1, degree: 3 },
  Mars: { rashi: 9, degree: 28 },
  Mercury: { rashi: 5, degree: 15 },
  Jupiter: { rashi: 3, degree: 5 },
  Venus: { rashi: 11, degree: 27 },
  Saturn: { rashi: 6, degree: 20 },
  Rahu: { rashi: 1, degree: 0 },
  Ketu: { rashi: 7, degree: 0 },
};
/** Debilitation is always the 7th from exaltation: derived, never tabled. */
export function debilitationRashi(graha: Graha): RashiIndex {
  return ((EXALTATION[graha].rashi + 6) % 12) as RashiIndex;
}

export const MOOLATRIKONA: Record<Graha, RashiIndex | null> = {
  Sun: 4,
  Moon: 1,
  Mars: 0,
  Mercury: 5,
  Jupiter: 8,
  Venus: 6,
  Saturn: 10,
  Rahu: null,
  Ketu: null,
};

export const OWN_RASHIS: Record<Graha, RashiIndex[]> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
  Rahu: [],
  Ketu: [],
};

/**
 * Vedic graha-drishti: bhavas aspected from the graha's bhava (1 = own position).
 * Parashara grants special drishtis ONLY to Mars (4/7/8), Jupiter (5/7/9) and
 * Saturn (3/7/10). Sun, Moon, Mercury and Venus aspect the 7th only — Mercury
 * having a single aspect is correct here, not an omission. (Jaimini rashi
 * drishti is a separate system and is not modelled.)
 */
export const SPECIAL_ASPECTS: Record<Graha, number[]> = {
  Sun: [7],
  Moon: [7],
  Mars: [4, 7, 8],
  Mercury: [7],
  Jupiter: [5, 7, 9],
  Venus: [7],
  Saturn: [3, 7, 10],
  Rahu: [5, 7, 9],
  Ketu: [5, 7, 9],
};

/** Vimshottari order + years. */
export const DASHA_ORDER: Graha[] = [
  'Ketu',
  'Venus',
  'Sun',
  'Moon',
  'Mars',
  'Rahu',
  'Jupiter',
  'Saturn',
  'Mercury',
];
export const DASHA_YEARS: Record<Graha, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

/** Natural friendships (naisargika sambandha). Rahu/Ketu per common usage. */
export const NATURAL_FRIENDS: Record<Graha, Graha[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'],
  Moon: ['Sun', 'Mercury'],
  Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'],
  Rahu: ['Venus', 'Saturn'],
  Ketu: ['Mars', 'Venus'],
};
export const NATURAL_ENEMIES: Record<Graha, Graha[]> = {
  Sun: ['Venus', 'Saturn'],
  Moon: [],
  Mars: ['Mercury'],
  Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'],
  Venus: ['Sun', 'Moon'],
  Saturn: ['Sun', 'Moon', 'Mars'],
  Rahu: ['Sun', 'Moon', 'Mars'],
  Ketu: ['Sun', 'Moon'],
};

export const NAKSHATRA_NAMES = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

/** Short life-area labels per bhava, for house hover cards. */
export const HOUSE_THEMES: Record<Bhava, string[]> = {
  1: ['Self', 'Body', 'Personality'],
  2: ['Wealth', 'Speech', 'Family'],
  3: ['Courage', 'Siblings', 'Skills'],
  4: ['Home', 'Mother', 'Comfort'],
  5: ['Creativity', 'Children', 'Study'],
  6: ['Health', 'Service', 'Competition'],
  7: ['Marriage', 'Partnerships'],
  8: ['Longevity', 'Transformation'],
  9: ['Dharma', 'Fortune', 'Teachers'],
  10: ['Career', 'Status', 'Action'],
  11: ['Gains', 'Friends', 'Goals'],
  12: ['Expenses', 'Travel', 'Spirit'],
};

/** Combustion orbs in degrees (widely-published mean values; retrograde
 * Mercury ~12° and Venus ~8° — direct-motion values used, documented). */
export const COMBUST_ORBS: Record<Graha, number | null> = {
  Sun: null,
  Moon: 12,
  Mars: 17,
  Mercury: 14,
  Jupiter: 11,
  Venus: 10,
  Saturn: 15,
  Rahu: null,
  Ketu: null,
};
/** Lahiri ayanamsa reference (J2000). Astronomy engine applies precession from here. */
export const LAHIRI_J2000 = 23.85;
