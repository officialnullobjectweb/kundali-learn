// What-if comparison: birth (BEFORE) vs explore draft (AFTER).
// Pure diff of built charts + domain analyses. Never mutates inputs.
// Sentences state facts and co-occurrence ("after moving X, score moved"),
// never causation.

import { analyzeAllDomains } from './domain-engine';
import { aspectEngine } from './aspect-engine';
import { DOMAIN_DEFS } from './domains';
import { degreeInRashi, norm360, toDMS } from './astro-math';
import { RASHI_NAMES, type Bhava, type BuiltChart, type Graha, type TopicId, type Varga } from './types';

export interface PlanetMove {
  graha: Graha;
  fromRashi: number;
  toRashi: number;
  fromBhava: Bhava;
  toBhava: Bhava;
  fromDegree: number;
  toDegree: number;
}

export interface OccupancyChange {
  bhava: Bhava;
  left: Graha[];
  joined: Graha[];
}

export interface DomainDelta {
  domain: TopicId;
  before: number;
  after: number;
  delta: number;
  directionChanged: boolean;
}

export interface WhatIfDiff {
  hasChanges: boolean;
  ascendant: { from: number; to: number } | null;
  moves: PlanetMove[];
  occupancy: OccupancyChange[];
  deltas: DomainDelta[];
  sentences: string[];
}

/** Score moves worth narrating; smaller shifts stay in the table only. */
const DELTA_THRESHOLD = 3;

const EPS = 1e-9;

export interface WhatIfInput {
  before: Record<Varga, BuiltChart>;
  after: Record<Varga, BuiltChart>;
  birthISO: string;
  dateISO: string;
  exclude?: Graha[];
}

function relevantTo(domain: TopicId, g: Graha, d1: BuiltChart): boolean {
  const def = DOMAIN_DEFS[domain];
  return (
    def.planets.includes(g) ||
    def.houses.some((h) => d1.houses[h].lord === g)
  );
}

export function diffCharts(input: WhatIfInput): WhatIfDiff {
  const { before, after, birthISO, dateISO } = input;
  const moves: PlanetMove[] = [];
  const d1b = before.D1;
  const d1a = after.D1;

  for (const key of Object.keys(d1b.planets) as Graha[]) {
    const pb = d1b.planets[key];
    const pa = d1a.planets[key];
    const degB = degreeInRashi(norm360(pb.longitude));
    const degA = degreeInRashi(norm360(pa.longitude));
    if (pb.rashi !== pa.rashi || pb.bhava !== pa.bhava || Math.abs(degB - degA) > EPS) {
      moves.push({
        graha: key,
        fromRashi: pb.rashi, toRashi: pa.rashi,
        fromBhava: pb.bhava, toBhava: pa.bhava,
        fromDegree: degB, toDegree: degA,
      });
    }
  }

  const ascendant = d1b.lagnaRashi !== d1a.lagnaRashi
    ? { from: d1b.lagnaRashi, to: d1a.lagnaRashi }
    : null;

  const occupancy: OccupancyChange[] = [];
  for (let b = 1; b <= 12; b++) {
    const bhava = b as Bhava;
    const left = d1b.houses[bhava].occupants.filter((g) => !d1a.houses[bhava].occupants.includes(g));
    const joined = d1a.houses[bhava].occupants.filter((g) => !d1b.houses[bhava].occupants.includes(g));
    if (left.length > 0 || joined.length > 0) occupancy.push({ bhava, left, joined });
  }

  const ab = analyzeAllDomains({ charts: before, aspects: aspectEngine(before.D1), birthISO, dateISO, exclude: input.exclude });
  const aa = analyzeAllDomains({ charts: after, aspects: aspectEngine(after.D1), birthISO, dateISO, exclude: input.exclude });
  const deltas: DomainDelta[] = (Object.keys(DOMAIN_DEFS) as TopicId[]).map((domain) => ({
    domain,
    before: ab[domain].score,
    after: aa[domain].score,
    delta: aa[domain].score - ab[domain].score,
    directionChanged: ab[domain].direction !== aa[domain].direction,
  }));

  const sentences: string[] = [];
  if (ascendant) {
    sentences.push(
      `The ascendant moved from ${RASHI_NAMES[ascendant.from]} (${ascendant.from + 1}) to ${RASHI_NAMES[ascendant.to]} (${ascendant.to + 1}) — every house shifted.`,
    );
  }
  for (const m of moves) {
    const housePart = m.fromBhava === m.toBhava
      ? `stayed in House ${m.toBhava}`
      : `moved from House ${m.fromBhava} to House ${m.toBhava}`;
    const degPart = Math.abs(m.fromDegree - m.toDegree) > EPS
      ? ` Its degree changed from ${toDMS(m.fromDegree)} to ${toDMS(m.toDegree)}.`
      : '';
    sentences.push(
      `${m.graha} ${housePart} (${RASHI_NAMES[m.fromRashi]} → ${RASHI_NAMES[m.toRashi]}).${degPart}`,
    );
  }
  for (const d of deltas) {
    if (Math.abs(d.delta) < DELTA_THRESHOLD) continue;
    const label = DOMAIN_DEFS[d.domain].label;
    const linked = moves.filter((m) => relevantTo(d.domain, m.graha, d1a)).slice(0, 2);
    if (linked.length > 0) {
      const who = linked.map((m) => `moving ${m.graha} from House ${m.fromBhava} to House ${m.toBhava}`).join(' and ');
      sentences.push(
        `After ${who}, the ${label} score moved ${d.before} → ${d.after}.`,
      );
    } else {
      const dir = d.delta > 0 ? 'rose' : 'fell';
      sentences.push(`The ${label} score ${dir} ${d.before} → ${d.after}.`);
    }
  }

  return {
    hasChanges: moves.length > 0 || ascendant !== null,
    ascendant, moves, occupancy, deltas, sentences,
  };
}
