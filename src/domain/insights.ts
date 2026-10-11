// Learning insights: honest, computed metrics about the chart as built.
// No astrology is invented here — every metric derives from placed planets,
// built houses, detected yogas, and domain verdicts. WHY lines cite the
// underlying facts; empty states say what is missing instead of guessing.

import { DOMAIN_DEFS } from './domains';
import type { Bhava, BuiltChart, DomainAnalysis, Graha, TopicId, YogaResult } from './types';

export interface InsightMetric {
  id: string;
  /** Display value, e.g. "7/9", "Career 72", "—". */
  value: string;
  /** Short factual reason, e.g. "Jupiter, Venus placed; Mars, … in tray". */
  why: string;
}

export function chartInsights(
  built: BuiltChart,
  placed: Graha[],
  analyses: Record<TopicId, DomainAnalysis> | null,
  yogas: YogaResult[],
): InsightMetric[] {
  const placedSet = new Set<Graha>(placed);
  const inChart = (g: Graha): boolean => placedSet.has(g);
  const missing = (Object.keys(built.planets) as Graha[]).filter((g) => !inChart(g));

  const occupied = (Object.keys(built.houses) as unknown as Bhava[]).filter(
    (b) => built.houses[b].occupants.some((g) => inChart(g)),
  );

  const exalted = placed.filter((g) => built.planets[g].dignity === 'Exalted');
  const debilitated = placed.filter((g) => built.planets[g].dignity === 'Debilitated');
  const retrograde = placed.filter((g) => built.planets[g].isRetrograde);

  const name = (g: Graha): string => g;
  const metrics: InsightMetric[] = [
    {
      id: 'completeness',
      value: `${placed.length}/9`,
      why: missing.length === 0
        ? 'All 9 planets placed.'
        : `${missing.map(name).join(', ')} still in the tray.`,
    },
    {
      id: 'houseCoverage',
      value: `${occupied.length}/12`,
      why: occupied.length === 0
        ? 'No house has a planet yet.'
        : `Houses ${occupied.join(', ')} hold at least one placed planet.`,
    },
    {
      id: 'exalted',
      value: exalted.length > 0 ? exalted.map(name).join(', ') : '—',
      why: exalted.length > 0
        ? 'Exalted = in the strongest sign (whole-sign dignity).'
        : 'No placed planet is exalted. Place a planet to test dignities.',
    },
    {
      id: 'retrograde',
      value: retrograde.length > 0 ? retrograde.map(name).join(', ') : '—',
      why: retrograde.length > 0
        ? 'Retrograde planets are read as delayed, not denied.'
        : 'No placed planet is retrograde right now.',
    },
    {
      id: 'debilitated',
      value: debilitated.length > 0 ? debilitated.map(name).join(', ') : '—',
      why: debilitated.length > 0
        ? 'Debilitated = in the weakest sign (whole-sign dignity).'
        : 'No placed planet is debilitated right now.',
    },
    {
      id: 'yogas',
      value: yogas.length > 0 ? yogas.map((y) => y.name).join(', ') : '—',
      why: yogas.length > 0
        ? 'Detected from strict classical conditions on this chart.'
        : 'No classical combination detected yet — add planets to form yogas.',
    },
  ];

  if (analyses) {
    const scored = (Object.keys(DOMAIN_DEFS) as TopicId[])
      .map((d) => ({ domain: d, score: analyses[d].score, blocked: analyses[d].blocked }))
      .filter((x) => !x.blocked);
    if (scored.length > 0) {
      const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
      const worst = scored.reduce((a, b) => (b.score < a.score ? b : a));
      metrics.push({
        id: 'strongest',
        value: `${DOMAIN_DEFS[best.domain].label} ${best.score}`,
        why: `Highest unblocked domain score of ${scored.length} computed domains.`,
      });
      metrics.push({
        id: 'weakest',
        value: `${DOMAIN_DEFS[worst.domain].label} ${worst.score}`,
        why: `Lowest unblocked domain score of ${scored.length} computed domains.`,
      });
    } else {
      metrics.push({
        id: 'strongest',
        value: '—',
        why: 'Every domain is blocked — fewer than 2 independent facts each. Place planets to unlock scores.',
      });
      metrics.push({
        id: 'weakest',
        value: '—',
        why: 'Every domain is blocked — fewer than 2 independent facts each. Place planets to unlock scores.',
      });
    }
  }

  return metrics;
}
