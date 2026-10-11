// Config-driven domain evaluation. Reads DomainDefs, emits Evidence, then
// aggregates, times (Vimshottari only — the sole computed system) and
// explains in qualified language. Components call analyzeDomain; they never
// encode domain rules.

import type { AggregationInput } from './engines';
import { aggregateEvidence } from './aggregation';
import { currentPeriods } from './dasha-engine';
import { DOMAIN_DEFS, type DomainDef, type RuleDef } from './domains';
import { GRAHAS } from './types';
import { yogaEngine } from './yoga-engine';
import type {
  AnalysisDirection,
  Aspect,
  Bhava,
  BuiltChart,
  Dignity,
  DomainAnalysis,
  Evidence,
  EvidenceDirection,
  Graha,
  TimingInfo,
  TopicId,
  Varga,
  YogaResult,
} from './types';

const STRONG: Dignity[] = ['Exalted', 'Moolatrikona', 'Own'];
const WEAK: Dignity[] = ['Debilitated', 'Enemy'];
const MALEFICS: Graha[] = ['Saturn', 'Rahu', 'Mars', 'Ketu'];

interface EvalCtx {
  def: DomainDef;
  charts: Record<Varga, BuiltChart>;
  aspects: Aspect[];
  yogas: YogaResult[];
  emit: (e: Omit<Evidence, 'id'>) => void;
}

const aspectsHouse = (aspects: Aspect[], g: Graha, b: Bhava): boolean =>
  aspects.some((a) => a.from === g && a.to === b);
const aspectsGraha = (aspects: Aspect[], g: Graha, t: Graha): boolean =>
  aspects.some((a) => a.from === g && a.to === t);

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

function noteRetro(ctx: EvalCtx, subject: Graha, domain: TopicId, relevance: number): void {
  if (!ctx.charts.D1.planets[subject].isRetrograde) return;
  ctx.emit({
    ruleId: 'retrograde', domain, direction: 'NEUTRAL', strength: 0.3, sourceChart: 'D1',
    reason: `${subject} is retrograde — results come late, not denied`,
    affectedFactors: [subject], independenceKey: `retro:${subject}`,
    relevance: relevance * 0.5, inputs: { graha: subject },
  });
}

/** Evaluate one rule configuration; emits only when its condition holds. */
function evalRule(ctx: EvalCtx, rule: RuleDef, direction: EvidenceDirection): void {
  const { def, charts, aspects, emit } = ctx;
  const d1 = charts.D1;
  const base = {
    ruleId: rule.ruleId, domain: def.domain, direction,
    relevance: rule.relevance,
  };

  switch (rule.kind) {
    case 'lord-dignity': {
      const house = rule.house as Bhava;
      const lord = d1.houses[house].lord;
      const dignity = d1.planets[lord].dignity;
      const hit = rule.when === 'strong' ? STRONG.includes(dignity) : WEAK.includes(dignity);
      if (!hit) return;
      emit({
        ...base, strength: rule.strength, sourceChart: 'D1',
        reason: fill(rule.reason, { lord, dignity }),
        affectedFactors: [lord, `Bhava:${house}`], independenceKey: `dignity:${lord}`,
        inputs: { lord, dignity, house },
      });
      noteRetro(ctx, lord, def.domain, rule.relevance);
      return;
    }
    case 'graha-dignity': {
      const graha = rule.graha as Graha;
      const dignity = d1.planets[graha].dignity;
      const hit = rule.when === 'strong' ? STRONG.includes(dignity) : WEAK.includes(dignity);
      if (!hit) return;
      emit({
        ...base, strength: rule.strength, sourceChart: 'D1',
        reason: fill(rule.reason, { graha, dignity }),
        affectedFactors: [graha], independenceKey: `dignity:${graha}`,
        inputs: { graha, dignity },
      });
      noteRetro(ctx, graha, def.domain, rule.relevance);
      return;
    }
    case 'occupant': {
      const house = rule.house as Bhava;
      for (const g of rule.grahas ?? []) {
        if (!d1.houses[house].occupants.includes(g)) continue;
        emit({
          ...base, strength: rule.strength, sourceChart: 'D1',
          reason: fill(rule.reason, { graha: g, house: String(house) }),
          affectedFactors: [g, `Bhava:${house}`], independenceKey: `occupancy:${house}:${g}`,
          inputs: { graha: g, house },
        });
      }
      return;
    }
    case 'aspect-house': {
      const house = rule.house as Bhava;
      const by = rule.by as Graha;
      if (!aspectsHouse(aspects, by, house)) return;
      emit({
        ...base, strength: rule.strength, sourceChart: 'D1',
        reason: fill(rule.reason, { graha: by, house: String(house) }),
        affectedFactors: [by, `Bhava:${house}`], independenceKey: `aspect:${by}:${house}`,
        inputs: { by, house },
      });
      return;
    }
    case 'aspect-lord': {
      const targetHouse = rule.targetHouse as Bhava;
      const by = rule.by as Graha;
      const lord = d1.houses[targetHouse].lord;
      if (!aspectsGraha(aspects, by, lord)) return;
      emit({
        ...base, strength: rule.strength, sourceChart: 'D1',
        reason: fill(rule.reason, { graha: by, lord }),
        affectedFactors: [by, lord], independenceKey: `aspect:${by}:${lord}`,
        inputs: { by, lord },
      });
      return;
    }
    case 'affliction': {
      const graha = rule.graha as Graha;
      const p = d1.planets[graha];
      const withMalefics = MALEFICS.filter(
        (m) => m !== graha && d1.planets[m].bhava === p.bhava,
      );
      const afflicted = WEAK.includes(p.dignity) || withMalefics.length > 0 || p.isCombust;
      if (!afflicted) return;
      emit({
        ...base, strength: rule.strength, sourceChart: 'D1',
        reason: fill(rule.reason, {
          graha,
          with: withMalefics.length > 0 ? ` (with ${withMalefics.join(', ')})` : '',
        }),
        affectedFactors: [graha], independenceKey: `affliction:${graha}`,
        inputs: { graha, dignity: p.dignity, with: withMalefics.join(',') || 'none', combust: p.isCombust ? 1 : 0 },
      });
      return;
    }
    case 'varga-dignity': {
      const house = rule.house as Bhava;
      const varga = rule.varga as Varga;
      if (!def.vargas.includes(varga)) return;
      const lord = d1.houses[house].lord;
      const dignity = charts[varga].planets[lord].dignity;
      const hit = rule.when === 'strong' ? STRONG.includes(dignity) : WEAK.includes(dignity);
      if (!hit) return;
      emit({
        ...base, strength: rule.strength, sourceChart: varga,
        reason: fill(rule.reason, { lord, dignity, varga }),
        affectedFactors: [lord, `Bhava:${house}`], independenceKey: `dignity:${lord}`,
        inputs: { lord, dignity, varga },
      });
      return;
    }
    case 'yoga': {
      const found = ctx.yogas.find((y) => y.name === rule.yoga);
      if (!found) return;
      emit({
        ...base, strength: Math.min(rule.strength, found.strength), sourceChart: 'D1',
        reason: fill(rule.reason, { yoga: found.name }),
        affectedFactors: found.factors, independenceKey: `yoga:${found.name}`,
        inputs: { yoga: found.name },
      });
      return;
    }
  }
}

export function evaluateDomainEvidence(
  def: DomainDef,
  charts: Record<Varga, BuiltChart>,
  aspects: Aspect[],
  yogas: YogaResult[] = [],
): Evidence[] {
  const out: Evidence[] = [];
  let seq = 0;
  const ctx: EvalCtx = {
    def, charts, aspects, yogas,
    emit: (e) => {
      out.push({ ...e, id: `${e.ruleId}:${e.domain}:${e.sourceChart}:${seq++}` });
    },
  };
  for (const rule of def.positive) evalRule(ctx, rule, 'POSITIVE');
  for (const rule of def.negative) evalRule(ctx, rule, 'NEGATIVE');
  return out;
}

export interface AnalyzeInput {
  charts: Record<Varga, BuiltChart>;
  aspects: Aspect[];
  birthISO: string;
  /** Explicit date — the engine never reads the clock. */
  dateISO: string;
  /** Tray-staged planets: their evidence is dropped before aggregation. */
  exclude?: Graha[];
}

function timingFor(def: DomainDef, d1: BuiltChart, birthISO: string, dateISO: string): TimingInfo {
  const computed: TimingInfo = {
    systems: def.timing,
    state: 'unknown',
    note: '',
  };
  const uncomputed = def.timing.filter((s) => s !== 'vimshottari');
  const suffix = uncomputed.length > 0
    ? ` ${uncomputed.join(', ')} ${uncomputed.length === 1 ? 'is' : 'are'} listed as relevant but not computed yet.`
    : '';
  let md: Graha;
  let ad: Graha;
  try {
    ({ mahadasha: md, antardasha: ad } = currentPeriods(d1.planets.Moon.longitude, birthISO, dateISO));
  } catch {
    return { ...computed, note: `Timing input invalid — no period computed.${suffix}` };
  }
  const touches = (g: Graha): boolean =>
    def.planets.includes(g) ||
    def.houses.some((h) => d1.houses[h].lord === g) ||
    def.houses.includes(d1.planets[g].bhava);
  const activating = touches(md) || touches(ad);
  return {
    systems: def.timing,
    currentMahadasha: md,
    currentAntardasha: ad,
    state: activating ? 'activating' : 'neutral',
    note: `Vimshottari ${md} mahadasha / ${ad} antardasha ${
      activating ? 'touches this area, so its themes are currently active.' : 'is neutral for this area.'
    }${suffix}`,
  };
}

function explain(
  def: DomainDef,
  score: number,
  confidence: number,
  blocked: boolean,
  supportCount: number,
  opposeCount: number,
  strongestFor: string | null,
  strongestAgainst: string | null,
  timing: TimingInfo,
): string {
  const label = def.label;
  if (blocked) {
    return `${label} has too little independent evidence — no conclusion is drawn. ${timing.note}`;
  }
  const lean = score >= 60 ? 'leans supportive' : score <= 40 ? 'leans difficult' : 'looks mixed';
  const parts = [
    `${label} ${lean} (${score}/100, confidence ${confidence}).`,
    `${supportCount} independent factor(s) support this, ${opposeCount} weigh(s) against.`,
  ];
  if (strongestFor) parts.push(`Strongest support: "${strongestFor}".`);
  if (strongestAgainst) parts.push(`Main concern: "${strongestAgainst}".`);
  parts.push(timing.note);
  return parts.join(' ');
}

export function analyzeDomain(domain: TopicId, input: AnalyzeInput): DomainAnalysis {
  const def = DOMAIN_DEFS[domain];
  const excluded = new Set<Graha>(input.exclude ?? []);
  const isGraha = (f: string): f is Graha => (GRAHAS as readonly string[]).includes(f);
  const yogas: YogaResult[] = yogaEngine(input.charts.D1, input.aspects);
  const evidence = evaluateDomainEvidence(def, input.charts, input.aspects, yogas).filter(
    (e) => !e.affectedFactors.some((f) => isGraha(f) && excluded.has(f)),
  );
  const aggInput: AggregationInput = {
    domain,
    charts: input.charts,
    confirm: def.confirm,
  };
  const verdict = aggregateEvidence(evidence, aggInput);
  const timing = timingFor(def, input.charts.D1, input.birthISO, input.dateISO);
  const direction: AnalysisDirection = verdict.blocked
    ? 'neutral'
    : verdict.score >= 60
      ? 'positive'
      : verdict.score <= 40
        ? 'negative'
        : 'neutral';
  return {
    ...verdict,
    direction,
    timing,
    explanation: explain(
      def, verdict.score, verdict.confidence, verdict.blocked,
      verdict.supporting.length, verdict.contradicting.length,
      verdict.supporting[0]?.reason ?? null,
      verdict.contradicting[0]?.reason ?? null,
      timing,
    ),
  };
}

export function analyzeAllDomains(input: AnalyzeInput): Record<TopicId, DomainAnalysis> {
  const out = {} as Record<TopicId, DomainAnalysis>;
  for (const domain of Object.keys(DOMAIN_DEFS) as TopicId[]) {
    out[domain] = analyzeDomain(domain, input);
  }
  return out;
}
