// Transit tests: Sade-sati phases, Sun anchor, determinism.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildChart } from '../chart-engine';
import { sadeSatiPhase, transitEngine, transitSaturnRashi } from '../transit-engine';
import type { BuiltChart, ChartState, Graha, Varga } from '../types';

const chart: ChartState = {
  ascendant: 15,
  placements: {
    Sun: 10, Moon: 95, Mars: 200, Mercury: 150, Jupiter: 260,
    Venus: 180, Saturn: 300, Rahu: 45, Ketu: 225,
  },
};

const natal: BuiltChart = buildChart(chart, { varga: 'D1', lagna: 'Janma' });

describe('transitEngine', () => {
  it('Sade-sati phases from Moon vs Saturn rashis', () => {
    assert.equal(sadeSatiPhase(3, 2), 'rising');
    assert.equal(sadeSatiPhase(3, 3), 'peak');
    assert.equal(sadeSatiPhase(3, 4), 'setting');
    assert.equal(sadeSatiPhase(3, 6), 'none');
    assert.equal(sadeSatiPhase(0, 11), 'rising'); // wraps correctly
  });

  it('Sun transits the 6th on 2026-10-08 for Mesha lagna', () => {
    const hits = transitEngine({ natal, dateISO: '2026-10-08T00:00:00Z' });
    assert.equal(hits.length, 9);
    const sun = hits.find((h) => h.graha === 'Sun');
    assert.equal(sun?.natalBhava, 6); // sidereal Sun ~170.8° = Kanya
    for (const h of hits) {
      assert.ok(h.natalBhava >= 1 && h.natalBhava <= 12);
      assert.ok(Array.isArray(h.aspectToNatal));
    }
  });

  it('transit Saturn rashi feeds Sade-sati consistently', () => {
    const r = transitSaturnRashi('2026-10-08T00:00:00Z');
    assert.ok(r >= 0 && r <= 11);
    const phase = sadeSatiPhase(3, r);
    assert.ok(['rising', 'peak', 'setting', 'none'].includes(phase));
  });

  it('deterministic', () => {
    const a = transitEngine({ natal, dateISO: '2026-10-08T00:00:00Z' });
    const b = transitEngine({ natal, dateISO: '2026-10-08T00:00:00Z' });
    assert.deepEqual(a, b);
  });
});
