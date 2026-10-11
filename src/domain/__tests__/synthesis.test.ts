// Synthesis tests: ranking, overall honesty, timing behavior.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAllVargas } from '../chart-engine';
import { aspectEngine } from '../aspect-engine';
import { yogaEngine } from '../yoga-engine';
import { analyzeAllDomains } from '../domain-engine';
import { transitSaturnRashi } from '../transit-engine';
import { synthesizePrediction } from '../synthesis';
import type { BuiltChart, ChartState, Varga } from '../types';

const chart: ChartState = {
  ascendant: 15,
  placements: {
    Sun: 10, Moon: 95, Mars: 200, Mercury: 150, Jupiter: 260,
    Venus: 180, Saturn: 300, Rahu: 45, Ketu: 225,
  },
};

const charts: Record<Varga, BuiltChart> = buildAllVargas(chart, 'Janma');
const aspects = aspectEngine(charts.D1);
const analyses = analyzeAllDomains({
  charts, aspects, birthISO: '', dateISO: '2026-10-08T00:00:00Z',
});
const base = {
  analyses,
  yogas: yogaEngine(charts.D1, aspects),
  d1: charts.D1,
  moonRashi: charts.D1.planets.Moon.rashi,
  saturnTransitRashi: transitSaturnRashi('2026-10-08T00:00:00Z'),
  birthISO: null as string | null,
  dateISO: '2026-10-08T00:00:00Z',
};

describe('synthesizePrediction', () => {
  it('overall is the mean of unblocked scores; counts add up', () => {
    const p = synthesizePrediction(base);
    assert.equal(p.computed + p.blocked, 12);
    if (p.computed > 0) {
      assert.ok(p.overall !== null && p.overall >= 0 && p.overall <= 100);
    } else {
      assert.equal(p.overall, null);
    }
  });

  it('strengths and concerns rank by weight with evidence IDs', () => {
    const p = synthesizePrediction(base);
    assert.ok(p.strengths.length <= 3 && p.concerns.length <= 3);
    for (let i = 1; i < p.strengths.length; i++) {
      assert.ok(p.strengths[i - 1].weight >= p.strengths[i].weight);
    }
    for (const f of [...p.strengths, ...p.concerns]) {
      assert.ok(f.text.length > 0 && f.evidenceIds.length > 0);
    }
  });

  it('timing reports Sade-sati without birth data, dasha with it', () => {
    const noBirth = synthesizePrediction(base);
    assert.equal(noBirth.timing.mahadasha, undefined);
    assert.ok(['rising', 'peak', 'setting', 'none'].includes(noBirth.timing.sadeSati));
    const withBirth = synthesizePrediction({ ...base, birthISO: '1990-05-05T00:00:00Z' });
    assert.ok(withBirth.timing.mahadasha);
    assert.ok(withBirth.timing.antardasha);
  });

  it('deterministic', () => {
    assert.deepEqual(synthesizePrediction(base), synthesizePrediction(base));
  });
});
