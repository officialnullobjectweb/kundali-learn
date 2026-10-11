// Engine contracts. Every engine is a pure, deterministic function:
// same input -> same output. No React, no fetch, no Math.random, no Date.now.
// Time-varying engines take an explicit ISO date / Julian day parameter.
// Components and store selectors call these; they never re-implement them.

import type {
  Aspect,
  Bhava,
  BuildChartOptions,
  BuiltChart,
  ChartState,
  ChartView,
  ConfirmationReq,
  DashaSequence,
  DomainAnalysis,
  DomainVerdict,
  Evidence,
  Graha,
  Interpretation,
  Longitude,
  PlanetInfo,
  TopicId,
  TopicScore,
  Varga,
  YogaResult,
} from './types';

import type { AyanamsaConfig } from './ayanamsa';

export interface AstronomyInput {
  /** UTC ISO, e.g. birth moment or transit moment. */
  dateISO: string;
  lat: number;
  lon: number;
  /** Defaults to Lahiri. Output longitudes are sidereal via this ayanamsa. */
  ayanamsa?: AyanamsaConfig;
}
export interface AstronomyResult {
  ascendant: Longitude;
  placements: Record<Graha, Longitude>;
  retrograde: Record<Graha, boolean>;
}
export type AstronomyEngine = (input: AstronomyInput) => AstronomyResult;

export type ChartEngine = (chart: ChartState, view: ChartView, opts?: BuildChartOptions) => BuiltChart;

export type PlanetEngine = (
  graha: Graha,
  longitude: Longitude,
  bhava: Bhava,
  retrograde?: boolean,
) => PlanetInfo;

/** Varga mapping is a pure function of D1 longitude (Parashari scheme). */
export type VargaEngine = (longitude: Longitude, varga: Varga) => number;

export type AspectEngine = (chart: BuiltChart) => Aspect[];

/** Yoga detection against fixed classical rule list; returns matches only. */
export type YogaEngine = (chart: BuiltChart) => YogaResult[];

export interface DashaInput {
  moonLongitude: Longitude;
  birthISO: string;
}
export type DashaEngine = (input: DashaInput) => DashaSequence;

export interface TransitInput {
  natal: BuiltChart;
  dateISO: string;
  ayanamsa?: AyanamsaConfig;
}
export interface TransitHit {
  graha: Graha;
  natalBhava: Bhava;
  aspectToNatal: Graha[];
}
export type TransitEngine = (input: TransitInput) => TransitHit[];

/**
 * Evidence is the ONLY path from calculation to UI claims.
 * Interpretation/Why panels may render nothing that lacks an Evidence record.
 * Collection always gathers BOTH supporting and contradicting records.
 */
export interface EvidenceInput {
  charts: Record<Varga, BuiltChart>;
  /** D1 graha-drishti from the aspect engine. */
  aspects: Aspect[];
}
export type EvidenceEngine = (input: EvidenceInput) => Evidence[];

export interface AggregationInput {
  domain: TopicId;
  /** Natal baseline for planetary-strength and house-importance weights. */
  charts: Record<Varga, BuiltChart>;
  /** Domain bar for trusting high scores; absent = no cap. */
  confirm?: ConfirmationReq;
}
/** Collapses shared facts, applies confirmation, penalises contradictions. */
export type AggregationEngine = (evidence: Evidence[], input: AggregationInput) => DomainVerdict;

export type ScoringEngine = (
  evidence: Evidence[],
  topic: TopicId,
) => TopicScore;

/** Template-based rendering of evidence into simple language. No LLM calls. */
export type InterpretationEngine = (analysis: DomainAnalysis) => Interpretation;
