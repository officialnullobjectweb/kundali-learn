// Prediction synthesis: all domains + yogas + timing -> one overview.
// Pure assembly: the overall score is the mean of unblocked domain scores
// (labeled as such, never a probability); strengths/concerns are the
// highest-weight evidence records across domains, each citing its IDs.

import { DOMAIN_DEFS } from './domains';
import { currentPeriods } from './dasha-engine';
import { sadeSatiPhase, type SadeSatiPhase } from './transit-engine';
import type {
  BuiltChart,
  DomainAnalysis,
  Graha,
  RashiIndex,
  TopicId,
  YogaResult,
} from './types';

export interface RankedFactor {
  domain: TopicId;
  text: string;
  weight: number;
  evidenceIds: string[];
}

export interface PredictionTiming {
  mahadasha?: Graha;
  antardasha?: Graha;
  sadeSati: SadeSatiPhase;
  activatingDomains: TopicId[];
}

export interface PredictionSummary {
  computed: number;
  blocked: number;
  /** Mean of unblocked domain scores; null when every domain is blocked. */
  overall: number | null;
  strengths: RankedFactor[];
  concerns: RankedFactor[];
  yogas: string[];
  timing: PredictionTiming;
}

export interface SynthesisInput {
  analyses: Record<TopicId, DomainAnalysis>;
  yogas: YogaResult[];
  d1: BuiltChart;
  moonRashi: number;
  saturnTransitRashi: number;
  birthISO: string | null;
  dateISO: string;
}

export function synthesizePrediction(input: SynthesisInput): PredictionSummary {
  const { analyses, yogas, d1, moonRashi, saturnTransitRashi, birthISO, dateISO } = input;
  const domains = Object.keys(DOMAIN_DEFS) as TopicId[];
  const live = domains.filter((d) => !analyses[d].blocked);
  const overall = live.length > 0
    ? Math.round(live.reduce((a, d) => a + analyses[d].score, 0) / live.length)
    : null;

  const weightOf = (domain: TopicId, id: string): number =>
    analyses[domain].contributions.find((c) => c.evidenceId === id)?.weight ?? 0;

  const strengths: RankedFactor[] = [];
  const concerns: RankedFactor[] = [];
  for (const d of live) {
    for (const e of analyses[d].supporting) {
      strengths.push({ domain: d, text: e.reason, weight: weightOf(d, e.id), evidenceIds: [e.id] });
    }
    for (const e of analyses[d].contradicting) {
      concerns.push({ domain: d, text: e.reason, weight: Math.abs(weightOf(d, e.id)), evidenceIds: [e.id] });
    }
  }
  strengths.sort((a, b) => b.weight - a.weight);
  concerns.sort((a, b) => b.weight - a.weight);

  let mahadasha: Graha | undefined;
  let antardasha: Graha | undefined;
  if (birthISO) {
    try {
      const p = currentPeriods(d1.planets.Moon.longitude, birthISO, dateISO);
      mahadasha = p.mahadasha;
      antardasha = p.antardasha;
    } catch {
      mahadasha = undefined;
      antardasha = undefined;
    }
  }
  const lords: Graha[] = [mahadasha, antardasha].filter((g): g is Graha => !!g);
  const activatingDomains = live.filter((d) => {
    const def = DOMAIN_DEFS[d];
    return lords.some(
      (g) =>
        def.planets.includes(g) ||
        def.houses.some((h) => d1.houses[h].lord === g) ||
        def.houses.includes(d1.planets[g].bhava),
    );
  });

  return {
    computed: live.length,
    blocked: domains.length - live.length,
    overall,
    strengths: strengths.slice(0, 3),
    concerns: concerns.slice(0, 3),
    yogas: yogas.map((y) => y.name),
    timing: {
      mahadasha,
      antardasha,
      sadeSati: sadeSatiPhase(moonRashi as RashiIndex, saturnTransitRashi as RashiIndex),
      activatingDomains,
    },
  };
}
