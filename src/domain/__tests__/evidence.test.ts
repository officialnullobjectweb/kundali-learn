// Evidence + aggregation tests: both-sides collection, independence
// collapse, cross-varga confirmation, contradiction handling, and the
// two-independent-facts minimum for any prediction.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAllVargas } from '../chart-engine';
import { aspectEngine } from '../aspect-engine';
import { collectEvidence } from '../rules';
import { aggregateEvidence } from '../aggregation';
import type { BuiltChart, ChartState, Evidence, TopicId, Varga } from '../types';

const chart: ChartState = {
  ascendant: 15,
  placements: {
    Sun: 10,
    Moon: 95,
    Mars: 200,
    Mercury: 150,
    Jupiter: 260,
    Venus: 180,
    Saturn: 300,
    Rahu: 45,
    Ketu: 225,
  },
};

function builtAll(): Record<Varga, BuiltChart> {
  return buildAllVargas(chart, 'Janma');
}

const ev = (partial: Partial<Evidence> & { independenceKey: string }): Evidence => ({
  id: `test:${partial.independenceKey}:${partial.sourceChart ?? 'D1'}`,
  ruleId: 'test-rule',
  domain: 'career',
  direction: 'POSITIVE',
  strength: 0.5,
  sourceChart: 'D1',
  reason: 'test reason',
  affectedFactors: [],
  relevance: 1,
  inputs: {},
  ...partial,
});

describe('collectEvidence', () => {
  it('collects both supporting and contradicting records with full structure', () => {
    const charts = builtAll();
    const collected = collectEvidence({ charts, aspects: aspectEngine(charts.D1) });
    const dirs = new Set(collected.map((e) => e.direction));
    assert.ok(dirs.has('POSITIVE'), 'must collect supporting evidence');
    assert.ok(dirs.has('NEGATIVE'), 'must collect contradicting evidence');
    for (const e of collected) {
      assert.ok(e.ruleId && e.id && e.reason);
      assert.ok(e.strength >= 0 && e.strength <= 1);
      assert.ok(e.relevance >= 0 && e.relevance <= 1);
      assert.ok(e.independenceKey.length > 0);
      assert.ok(['D1', 'D9', 'D10'].includes(e.sourceChart));
    }
  });

  it('is deterministic', () => {
    const charts = builtAll();
    const a = collectEvidence({ charts, aspects: aspectEngine(charts.D1) });
    const b = collectEvidence({ charts, aspects: aspectEngine(charts.D1) });
    assert.deepEqual(a, b);
  });
});

describe('aggregateEvidence independence', () => {
  const charts = builtAll();

  it('three rules, one fact -> counted once (strongest wins)', () => {
    const evidence = [
      ev({ independenceKey: 'K', strength: 0.5 }),
      ev({ independenceKey: 'K', strength: 0.7, ruleId: 'other-rule' }),
      ev({ independenceKey: 'K', strength: 0.6, ruleId: 'third-rule' }),
      ev({ independenceKey: 'J', strength: 0.4 }),
    ];
    const v = aggregateEvidence(evidence, { domain: 'career', charts });
    // S = 0.7 + 0.4 = 1.1 -> 50 + 50 * 1.1 / 2.6 = 71.15 -> 71
    assert.equal(v.score, 71);
    assert.equal(v.blocked, false);
    assert.equal(v.supporting.length, 2);
    assert.ok(v.notes.some((n) => n.includes('counted once')));
  });

  it('same fact in D1 + D9 confirms instead of doubling', () => {
    const d1only = [ev({ independenceKey: 'K', strength: 0.6 }), ev({ independenceKey: 'J', strength: 0.6 })];
    const both = [
      ev({ independenceKey: 'K', strength: 0.6 }),
      ev({ independenceKey: 'K', strength: 0.6, sourceChart: 'D9', ruleId: 'd9-confirm' }),
      ev({ independenceKey: 'J', strength: 0.6 }),
    ];
    const v1 = aggregateEvidence(d1only, { domain: 'career', charts });
    const v2 = aggregateEvidence(both, { domain: 'career', charts });
    assert.ok(v2.score > v1.score);
    assert.ok(v2.notes.some((n) => n.includes('Confirmed in D1 + D9')));
  });

  it('opposing varga readings are flagged, not confirmed', () => {
    const evidence = [
      ev({ independenceKey: 'K', strength: 0.8 }),
      ev({ independenceKey: 'K', strength: 0.7, direction: 'NEGATIVE', sourceChart: 'D9', ruleId: 'd9-confirm' }),
      ev({ independenceKey: 'J', strength: 0.5 }),
    ];
    const v = aggregateEvidence(evidence, { domain: 'career', charts });
    assert.ok(v.notes.some((n) => n.includes('disagree')));
    assert.ok(!v.notes.some((n) => n.includes('Confirmed')));
  });

  it('balanced opposition pulls toward neutral with a mixed-signals note', () => {
    const evidence = [
      ev({ independenceKey: 'K', strength: 1.0 }),
      ev({ independenceKey: 'J', strength: 1.0, direction: 'NEGATIVE' }),
    ];
    const v = aggregateEvidence(evidence, { domain: 'career', charts });
    assert.equal(v.score, 50);
    assert.ok(v.notes.some((n) => n.includes('mixed signals')));
  });

  it('blocks predictions on a single independent fact', () => {
    const v = aggregateEvidence([ev({ independenceKey: 'K', strength: 1.0 })], {
      domain: 'career',
      charts,
    });
    assert.equal(v.blocked, true);
    assert.equal(v.score, 50);
    assert.equal(v.confidence, 0);
    assert.equal(v.supporting.length, 0);
  });

  it('end-to-end verdicts exist for every domain with audit notes', () => {
    const collected = collectEvidence({ charts, aspects: aspectEngine(charts.D1) });
    const domains: TopicId[] = ['career', 'money', 'marriage', 'relationships', 'education', 'family', 'property', 'children', 'health', 'spirituality', 'personality', 'general'];
    for (const domain of domains) {
      const v = aggregateEvidence(collected, { domain, charts });
      assert.ok(v.score >= 0 && v.score <= 100);
      assert.ok(v.confidence >= 0 && v.confidence <= 1);
      if (!v.blocked) {
        // A live prediction always shows both sides when both exist.
        const hasNeg = collected.some((e) => e.domain === domain && e.direction === 'NEGATIVE');
        const hasPos = collected.some((e) => e.domain === domain && e.direction === 'POSITIVE');
        assert.ok(v.supporting.length > 0 || !hasPos);
        assert.ok(v.contradicting.length > 0 || !hasNeg);
      }
    }
  });
});
