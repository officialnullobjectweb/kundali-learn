// Canonical Vedic astrology type system.
// Pure types + static tables only. No calculation logic, no React, no I/O.
// All longitudes are sidereal degrees in [0, 360) unless noted.

export const GRAHAS = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
] as const;
export type Graha = (typeof GRAHAS)[number];

export const RASHI_NAMES = [
  'Mesha',
  'Vrishabha',
  'Mithuna',
  'Karka',
  'Simha',
  'Kanya',
  'Tula',
  'Vrishchika',
  'Dhanu',
  'Makara',
  'Kumbha',
  'Meena',
] as const;
export type RashiName = (typeof RASHI_NAMES)[number];
/** 0 = Mesha … 11 = Meena */
export type RashiIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
/** 0 = Ashwini … 26 = Revati. */
export type NakshatraIndex = number;
/** Lunar quarter within a nakshatra. */
export type Pada = 1 | 2 | 3 | 4;
/** 1–12, house 1 = lagna rashi */
export type Bhava = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Sidereal longitude in [0, 360). Single source of truth for a graha. */
export type Longitude = number;

export interface PlanetPlacement {
  graha: Graha;
  /** Sidereal longitude [0, 360). Dragging a planet writes this. */
  longitude: Longitude;
}

export type Varga = 'D1' | 'D4' | 'D6' | 'D7' | 'D9' | 'D10' | 'D60';
export type LagnaMode = 'Janma' | 'Chandra';
export interface ChartView {
  varga: Varga;
  lagna: LagnaMode;
}
/** Kundali visual template. Presentation only — never affects calculation. */
export type ChartTheme = 'classic' | 'midnight' | 'sand';

/** Per-graha retrograde overrides for chart construction. */
export interface BuildChartOptions {
  retrograde?: Partial<Record<Graha, boolean>>;
}

export type TopicId =
  | 'career'
  | 'money'
  | 'marriage'
  | 'relationships'
  | 'education'
  | 'family'
  | 'property'
  | 'children'
  | 'health'
  | 'spirituality'
  | 'personality'
  | 'general';

/** A complete chart: ascendant + one longitude per graha. Immutable — edits produce a copy. */
export interface ChartState {
  ascendant: Longitude;
  placements: Record<Graha, Longitude>;
}

export type Dignity =
  | 'Exalted'
  | 'Moolatrikona'
  | 'Own'
  | 'Friend'
  | 'Neutral'
  | 'Enemy'
  | 'Debilitated';

export interface PlanetInfo {
  graha: Graha;
  longitude: Longitude;
  rashi: RashiIndex;
  degreeInRashi: number;
  /** Degrees elapsed inside the ACTIVE varga sign [0, 30) — what varga charts display. */
  vargaDegree: number;
  nakshatra: NakshatraIndex; // 0–26 (Ashwini = 0)
  pada: Pada;
  /** Dignity in the ACTIVE varga sign (D1 dignity when viewing D1). */
  dignity: Dignity;
  isRetrograde: boolean;
  isCombust: boolean;
  bhava: Bhava; // from active lagna
  vargaRashi: Record<Varga, RashiIndex>; // per-varga rashi of this longitude
}

export interface HouseInfo {
  bhava: Bhava;
  rashi: RashiIndex;
  lord: Graha;
  occupants: Graha[];
}

export interface BuiltChart {
  view: ChartView;
  lagnaRashi: RashiIndex; // Janma asc rashi, or Moon rashi in Chandra mode
  planets: Record<Graha, PlanetInfo>;
  houses: Record<Bhava, HouseInfo>;
}

/** One graha-drishti link. `fromRashiAspect` covers Jaimini-style rashi aspects if enabled. */
export interface Aspect {
  from: Graha;
  to: Graha | Bhava;
  kind: 'graha' | 'rashi';
  strength: number; // 0–1
}

export interface YogaResult {
  name: string;
  factors: string[]; // graha/bhava keys involved, e.g. ['Jupiter', 'Bhava:10']
  strength: number; // 0–1
  favourable: boolean;
}

export interface DashaPeriod {
  lord: Graha;
  start: string; // ISO date
  end: string; // ISO date
}
export interface DashaSequence {
  birthNakshatra: number;
  mahadashas: DashaPeriod[];
}

/** Direction of an evidence record. Magnitude lives in `strength`; sign here. */
export type EvidenceDirection = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

/**
 * One attributable fact behind a conclusion. Powers the "Why?" panel.
 * Every prediction must cite both supporting and contradicting records.
 */
export interface Evidence {
  id: string;
  ruleId: string;
  domain: TopicId;
  direction: EvidenceDirection;
  strength: number; // 0–1 magnitude; sign comes from `direction`
  sourceChart: Varga; // which view produced it
  reason: string; // simple-language statement, e.g. "10th lord Jupiter is exalted"
  affectedFactors: string[]; // graha names and/or 'Bhava:N', e.g. ['Jupiter', 'Bhava:10']
  /**
   * Identity of the underlying fact, WITHOUT varga. Records sharing a key
   * collapse to one independent confirmation in aggregation.
   */
  independenceKey: string;
  relevance: number; // 0–1, how central this rule is to the domain
  inputs: Record<string, string | number>; // exact values the rule read
}

export interface VerdictContribution {
  evidenceId: string;
  /** Signed weight after relevance/strength/house/confirmation handling. */
  weight: number;
}

/** Timing systems a domain cares about. Only computed ones appear in output. */
export type TimingSystem = 'vimshottari' | 'transit' | 'sade-sati';

export interface TimingInfo {
  systems: TimingSystem[];
  currentMahadasha?: Graha;
  currentAntardasha?: Graha;
  state: 'activating' | 'neutral' | 'unknown';
  /** States exactly what was computed — never claims uncomputed systems. */
  note: string;
}

export type AnalysisDirection = 'positive' | 'negative' | 'neutral';

/** Full domain result: verdict + direction + timing + qualified explanation. */
export interface DomainAnalysis extends DomainVerdict {
  direction: AnalysisDirection;
  timing: TimingInfo;
  /** Qualified language only ("suggests", "points to") — never fate claims. */
  explanation: string;
}

/** A prediction IS a domain analysis: score + direction + evidence. Kept explicit for UI code. */
export type Prediction = DomainAnalysis;

/** One planet's fully derived state; doubles as its chart position record. */
export type PlanetPosition = PlanetInfo;

/** Per-domain bar for trusting a high score. */
export interface ConfirmationReq {
  minFacts: number;
  highScoreThreshold: number;
  highScoreNeedsConfirm: boolean;
}

export interface DomainVerdict {
  domain: TopicId;
  score: number; // 0–100
  confidence: number; // 0–1
  /** True when fewer than 2 independent facts exist: no prediction, score 50. */
  blocked: boolean;
  supporting: Evidence[]; // representative records, strongest first
  contradicting: Evidence[];
  neutral: Evidence[];
  contributions: VerdictContribution[];
  notes: string[]; // dedupe / confirmation / contradiction audit trail
}

export interface TopicScore {
  topic: TopicId;
  score: number; // 0–100
  contributions: { evidenceId: string; weight: number }[];
}

/** One rendered sentence. Non-empty evidenceIds except on blocked analyses. */
export interface InterpretationSentence {
  text: string;
  evidenceIds: string[];
}

export interface Interpretation {
  topic: TopicId;
  headline: string;
  shortExplanation: InterpretationSentence[];
  whyThisHappened: InterpretationSentence[];
  supporting: InterpretationSentence[];
  contradicting: InterpretationSentence[];
  confidence: number;
  confidenceNote: InterpretationSentence[];
  /** Expandable: real terms (lords, dignities, rules, inputs). */
  technical: InterpretationSentence[];
  score: number;
  direction: AnalysisDirection;
  blocked: boolean;
}
