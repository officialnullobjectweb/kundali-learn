// Interpretation tests: traceability, plain language, blocked handling.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAllVargas } from '../chart-engine';
import { aspectEngine } from '../aspect-engine';
import { collectEvidence } from '../rules';
import { aggregateEvidence } from '../aggregation';
import { analyzeDomain } from '../domain-engine';
import { interpretAnalysis, simplifyEvidence, verifyInterpretation } from '../interpretation-engine';
import type { BuiltChart, ChartState, TopicId, Varga } from '../types';
import { DOMAIN_DEFS } from '../domains';

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
const pool = collectEvidence({ charts, aspects });

const BANNED = [
  'kendra', 'trikona', 'dusthana', 'drishti', 'lagna', 'bhava', 'graha',
  'dasha', 'mahadasha', 'antardasha', 'navamsha', 'dashamsha', 'vimshottari',
  'exalted', 'debilitated', 'moolatrikona', 'combust', 'retrograde', 'dignity',
  'rashi', 'nakshatra', 'sade', 'sati', 'varga', 'd1', 'd9', 'd10',
];

describe('interpretAnalysis', () => {
  it('every sentence traces to evidence, for every domain', () => {
    for (const d of Object.keys(DOMAIN_DEFS) as TopicId[]) {
      const a = analyzeDomain(d, INPUT);
      const interp = interpretAnalysis(a);
      assert.equal(interp.topic, d);
      assert.equal(interp.score, a.score);
      assert.equal(interp.direction, a.direction);
      assert.equal(interp.blocked, a.blocked);
      if (!a.blocked) {
        assert.deepEqual(verifyInterpretation(interp, pool), [], `${d}: fully cited`);
        assert.ok(interp.shortExplanation.length > 0, `${d}: has summary`);
        assert.ok(interp.technical.length > 0, `${d}: has technical`);
      }
    }
  });

  it('simple sections avoid Sanskrit/technical terms', () => {
    for (const d of Object.keys(DOMAIN_DEFS) as TopicId[]) {
      const interp = interpretAnalysis(analyzeDomain(d, INPUT));
      if (interp.blocked) continue;
      const simple = [
        ...interp.shortExplanation,
        ...interp.whyThisHappened,
        ...interp.supporting,
        ...interp.contradicting,
        ...interp.confidenceNote,
      ].map((s) => s.text).join(' \n');
      for (const word of BANNED) {
        assert.ok(
          !new RegExp(`\\b${word}\\b`, 'i').test(simple),
          `${d}: simple text contains "${word}"`,
        );
      }
    }
  });

  it('technical section keeps the real terms (expandable detail)', () => {
    const interp = interpretAnalysis(analyzeDomain('career', INPUT));
    if (!interp.blocked) {
      const tech = interp.technical.map((s) => s.text).join(' ');
      assert.ok(/rule \S+, chart (D1|D9|D10)/.test(tech));
    }
  });

  it('blocked analyses state no conclusion and verify cleanly', () => {
    const base = analyzeDomain('career', INPUT);
    const blocked = {
      ...base, blocked: true, supporting: [], contradicting: [],
      score: 50, confidence: 0, direction: 'neutral' as const,
    };
    const interp = interpretAnalysis(blocked);
    assert.equal(interp.blocked, true);
    assert.deepEqual(verifyInterpretation(interp, []), []);
    assert.ok(interp.shortExplanation[0].text.includes('not enough'));
  });

  it('verifier catches invented or orphaned citations', () => {
    const interp = interpretAnalysis(analyzeDomain('money', INPUT));
    if (interp.blocked) return;
    const tampered = {
      ...interp,
      supporting: [{ text: interp.supporting[0]?.text ?? 'x', evidenceIds: ['no-such-rule:money:D1:999'] }],
    };
    const problems = verifyInterpretation(tampered, pool);
    assert.ok(problems.some((p) => p.includes('unknown evidence id')));
  });

  it('simplifyEvidence never emits empty text for collected evidence', () => {
    for (const e of pool) {
      const t = simplifyEvidence(e, 'Career');
      assert.ok(t.length > 10, `${e.ruleId}: non-trivial sentence`);
      for (const word of ['kendra', 'drishti', 'lagna', 'exalted', 'debilitated', 'dignity']) {
        assert.ok(!new RegExp(`\\b${word}\\b`, 'i').test(t), `${e.ruleId}: plain wording`);
      }
    }
  });

  it('deterministic', () => {
    const a = analyzeDomain('health', INPUT);
    assert.deepEqual(interpretAnalysis(a), interpretAnalysis(a));
  });

  it('every language traces cleanly and avoids Latin jargon', () => {
    for (const lang of ['en', 'hinglish', 'hi'] as const) {
      for (const d of Object.keys(DOMAIN_DEFS) as TopicId[]) {
        const interp = interpretAnalysis(analyzeDomain(d, INPUT), lang);
        if (interp.blocked) continue;
        assert.deepEqual(verifyInterpretation(interp, pool), [], `${lang}/${d}: cited`);
        const simple = [
          ...interp.shortExplanation,
          ...interp.whyThisHappened,
          ...interp.supporting,
          ...interp.contradicting,
          ...interp.confidenceNote,
        ].map((s) => s.text).join(' \n');
        for (const word of BANNED) {
          assert.ok(
            !new RegExp(`\\b${word}\\b`, 'i').test(simple),
            `${lang}/${d}: simple text contains "${word}"`,
          );
        }
      }
      // Spot-check real translation happened (not English passthrough).
      const h = interpretAnalysis(analyzeDomain('health', INPUT), lang);
      if (!h.blocked && lang !== 'en') {
        assert.ok(!h.shortExplanation[0].text.startsWith('Your '), `${lang}: translated`);
      }
    }
  });

  it('single-rule evidence cannot sneak past via interpretation', () => {
    const one = pool.filter((e) => e.domain === 'career').slice(0, 1);
    const v = aggregateEvidence(one, { domain: 'career', charts });
    assert.equal(v.blocked, true);
  });
});
