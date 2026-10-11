// Domain engine tests: config integrity, honest timing, qualified output.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAllVargas } from '../chart-engine';
import { aspectEngine } from '../aspect-engine';
import { DOMAIN_DEFS } from '../domains';
import { analyzeAllDomains, analyzeDomain, evaluateDomainEvidence } from '../domain-engine';
import type { BuiltChart, ChartState, TopicId, Varga } from '../types';

const chart: ChartState = {
  ascendant: 15,
  placements: {
    Sun: 10, Moon: 95, Mars: 200, Mercury: 150, Jupiter: 260,
    Venus: 180, Saturn: 300, Rahu: 45, Ketu: 225,
  },
};

const charts: Record<Varga, BuiltChart> = buildAllVargas(chart, 'Janma');
const aspects = aspectEngine(charts.D1);
const INPUT = { charts, aspects, birthISO: '1990-05-05T00:00:00Z', dateISO: '2026-10-08T00:00:00Z' };

describe('domain definitions', () => {
  it('every domain declares houses, planets, lords, vargas, timing and both rule sides', () => {
    const keys = Object.keys(DOMAIN_DEFS) as TopicId[];
    assert.ok(keys.length >= 11);
    for (const d of keys) {
      const def = DOMAIN_DEFS[d];
      assert.ok(def.houses.length > 0, `${d}: houses`);
      assert.ok(def.planets.length > 0, `${d}: planets`);
      assert.ok(def.lordsOf.length > 0, `${d}: lords`);
      assert.ok(def.vargas.length > 0, `${d}: vargas`);
      assert.ok(def.timing.length > 0, `${d}: timing`);
      assert.ok(def.positive.length > 0, `${d}: positive rules`);
      assert.ok(def.negative.length > 0, `${d}: negative rules`);
      assert.ok(def.confirm.minFacts >= 2, `${d}: minFacts`);
      for (const r of [...def.positive, ...def.negative]) {
        assert.ok(r.strength > 0 && r.strength <= 0.8, `${d}/${r.ruleId}: strength cap`);
        assert.ok(r.relevance > 0 && r.relevance <= 1, `${d}/${r.ruleId}: relevance range`);
        assert.ok(r.reason.length > 0, `${d}/${r.ruleId}: reason`);
        if (r.kind === 'varga-dignity') {
          assert.ok(def.vargas.includes(r.varga as Varga), `${d}/${r.ruleId}: varga listed`);
        }
      }
    }
  });
});

describe('analyzeDomain', () => {
  it('returns the full contract for every domain', () => {
    const all = analyzeAllDomains(INPUT);
    for (const d of Object.keys(DOMAIN_DEFS) as TopicId[]) {
      const a = all[d];
      assert.ok(a.score >= 0 && a.score <= 100, `${d}: score`);
      assert.ok(['positive', 'negative', 'neutral'].includes(a.direction), `${d}: direction`);
      assert.ok(a.confidence >= 0 && a.confidence <= 1, `${d}: confidence`);
      assert.ok(a.explanation.includes(DOMAIN_DEFS[d].label), `${d}: explanation names domain`);
      assert.ok(!/\byou will\b|\bwill (be|become|get|have|marry|earn|win|die|fall|rise|succeed|fail)\b/i.test(a.explanation), `${d}: no fate claims`);
      assert.ok(a.timing.currentMahadasha, `${d}: computed mahadasha`);
      assert.ok(a.timing.currentAntardasha, `${d}: computed antardasha`);
      assert.ok(['activating', 'neutral', 'unknown'].includes(a.timing.state), `${d}: timing state`);
    }
  });

  it('direction follows score bands; timing honesty is explicit', () => {
    const career = analyzeDomain('career', INPUT);
    const expected = career.blocked || (career.score > 40 && career.score < 60)
      ? 'neutral'
      : career.score >= 60 ? 'positive' : 'negative';
    assert.equal(career.direction, expected);
    if (career.timing.systems.includes('transit')) {
      assert.ok(career.timing.note.includes('not computed yet'));
    }
  });

  it('high scores without cross-varga confirmation are capped', () => {
    // Career on this chart: strong 10th lord (Mars own Aries) + Saturn/Jupiter
    // support. Cap applies only if nothing confirmed.
    const career = analyzeDomain('career', INPUT);
    if (!career.blocked && career.score >= 75) {
      assert.ok(career.notes.some((n) => n.includes('Confirmed')));
    }
  });

  it('per-domain evidence stays scoped to its domain', () => {
    for (const d of Object.keys(DOMAIN_DEFS) as TopicId[]) {
      for (const e of evaluateDomainEvidence(DOMAIN_DEFS[d], charts, aspects)) {
        assert.equal(e.domain, d);
      }
    }
  });

  it('deterministic across runs', () => {
    assert.deepEqual(analyzeDomain('money', INPUT), analyzeDomain('money', INPUT));
  });
});
