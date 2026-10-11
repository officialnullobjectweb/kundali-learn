// Aggregation layer: evidence -> verdict. Deterministic.
// 1. Filter to domain. 2. Collapse shared independenceKeys (strongest wins,
//    rest noted, never summed). 3. Weight by relevance x planetary strength x
//    house importance. 4. Boost cross-varga confirmation (same fact, 2+
//    charts). 5. Dampen when support and opposition genuinely conflict.
// 6. Block predictions with fewer than 2 independent facts.

import type { AggregationInput, AggregationEngine } from './engines';
import { GRAHAS } from './types';
import type { Bhava, BuiltChart, Dignity, DomainVerdict, Evidence, Graha, VerdictContribution } from './types';

const DIGNITY_W: Record<Dignity, number> = {
  Exalted: 1.25,
  Moolatrikona: 1.15,
  Own: 1.1,
  Friend: 1.0,
  Neutral: 0.9,
  Enemy: 0.8,
  Debilitated: 0.6,
};

/** Kendra/trikona houses carry more weight; dusthanas less. */
function houseWeight(bhava: Bhava): number {
  if ([1, 4, 5, 7, 9, 10].includes(bhava)) return 1.2;
  if ([6, 8, 12].includes(bhava)) return 0.85;
  return 1.0;
}

const GRAHA_SET = new Set<Graha>(GRAHAS as readonly Graha[]);

function planetWeight(natal: BuiltChart, e: Evidence): number {
  const grahas = e.affectedFactors.filter((f): f is Graha => GRAHA_SET.has(f as Graha));
  if (grahas.length === 0) return 1;
  const ws = grahas.map((g) => {
    const p = natal.planets[g];
    return DIGNITY_W[p.dignity] * (p.isCombust ? 0.7 : 1);
  });
  return ws.reduce((a, b) => a + b, 0) / ws.length;
}

function factorHouseWeight(e: Evidence): number {
  const houses = e.affectedFactors
    .filter((f) => f.startsWith('Bhava:'))
    .map((f) => Number(f.split(':')[1]) as Bhava);
  if (houses.length === 0) return 1;
  return houses.map(houseWeight).reduce((a, b) => a + b, 0) / houses.length;
}

const signOf = (e: Evidence): number =>
  e.direction === 'POSITIVE' ? 1 : e.direction === 'NEGATIVE' ? -1 : 0;

const round2 = (n: number): number => Math.round(n * 100) / 100;

interface FactGroup {
  key: string;
  representative: Evidence;
  collapsed: number;
  sources: string[];
  conflicted: boolean;
}

export const aggregateEvidence: AggregationEngine = (
  evidence: Evidence[],
  input: AggregationInput,
): DomainVerdict => {
  const { domain, charts } = input;
  const natal = charts.D1;
  const notes: string[] = [];
  const scoped = evidence.filter((e) => e.domain === domain);

  // Group by underlying fact. Representative = strongest |signed| record.
  const groups = new Map<string, FactGroup>();
  for (const e of scoped) {
    const g = groups.get(e.independenceKey);
    if (!g) {
      groups.set(e.independenceKey, {
        key: e.independenceKey,
        representative: e,
        collapsed: 0,
        sources: [e.sourceChart],
        conflicted: false,
      });
    } else {
      g.collapsed += 1;
      if (!g.sources.includes(e.sourceChart)) g.sources.push(e.sourceChart);
      if (signOf(e) !== 0 && signOf(g.representative) !== 0 && signOf(e) !== signOf(g.representative)) {
        g.conflicted = true;
      }
      const cur = Math.abs(signOf(g.representative) * g.representative.strength * g.representative.relevance);
      const nxt = Math.abs(signOf(e) * e.strength * e.relevance);
      if (nxt > cur) g.representative = e;
    }
  }

  const signed = [...groups.values()].filter((g) => signOf(g.representative) !== 0);
  const neutral = [...groups.values()]
    .filter((g) => signOf(g.representative) === 0)
    .map((g) => g.representative);

  // Fewer than 2 independent facts -> no prediction. Ever.
  if (signed.length < 2) {
    if (signed.length === 1) {
      notes.push('Only one independent fact found — no prediction made (minimum is two).');
    } else {
      notes.push('No directional evidence found — no prediction made.');
    }
    return {
      domain, score: 50, confidence: 0, blocked: true,
      supporting: [], contradicting: [], neutral,
      contributions: [], notes,
    };
  }

  let support = 0;
  let oppose = 0;
  let confirmed = false;
  const contributions: VerdictContribution[] = [];
  const supporting: Evidence[] = [];
  const contradicting: Evidence[] = [];

  for (const g of signed) {
    const rep = g.representative;
    const base = signOf(rep) * rep.strength * rep.relevance;
    let w = base * planetWeight(natal, rep) * factorHouseWeight(rep);
    // Cross-varga confirmation: same fact seen in 2+ charts, agreeing.
    if (g.sources.length >= 2 && !g.conflicted) {
      w *= 1.25;
      confirmed = true;
      notes.push(`Confirmed in ${g.sources.join(' + ')}: "${rep.reason}" carries extra weight.`);
    }
    if (g.conflicted) {
      notes.push(`Charts disagree on "${rep.reason}" — treated cautiously.`);
    }
    if (g.collapsed > 0 && !g.conflicted) {
      notes.push(`${g.collapsed} rule(s) describing the same fact as "${rep.reason}" counted once.`);
    }
    contributions.push({ evidenceId: rep.id, weight: round2(w) });
    if (w > 0) {
      support += w;
      supporting.push(rep);
    } else {
      oppose += -w;
      contradicting.push(rep);
    }
  }

  // Contradiction dampening: strong both sides -> pull toward neutral.
  const total = support + oppose;
  const conflictRatio = total > 0 ? Math.min(support, oppose) / total : 0;
  let dampen = 1;
  if (conflictRatio >= 0.25 && total > 0.5) {
    dampen = 1 - 0.3 * (conflictRatio / 0.5);
    notes.push('Strong evidence on both sides — mixed signals, verdict pulled toward neutral.');
  }

  const raw = total > 0 ? ((support - oppose) / (total + 1.5)) * dampen : 0;
  let score = Math.round(50 + 50 * raw);
  const confirm = input.confirm;
  if (
    confirm?.highScoreNeedsConfirm &&
    score > confirm.highScoreThreshold &&
    !confirmed
  ) {
    notes.push(
      `Score capped at ${confirm.highScoreThreshold}: high confidence needs cross-varga confirmation.`,
    );
    score = confirm.highScoreThreshold;
  }
  const coverage = Math.min(1, signed.length / 5);
  const agreement = total > 0 ? 1 - Math.min(support, oppose) / total : 0;
  const confidence = round2(0.65 * coverage + 0.35 * agreement);

  const byWeight = (a: Evidence, b: Evidence): number => {
    const wa = Math.abs(contributions.find((c) => c.evidenceId === a.id)?.weight ?? 0);
    const wb = Math.abs(contributions.find((c) => c.evidenceId === b.id)?.weight ?? 0);
    return wb - wa;
  };
  supporting.sort(byWeight);
  contradicting.sort(byWeight);

  return { domain, score, confidence, blocked: false, supporting, contradicting, neutral, contributions, notes };
};
