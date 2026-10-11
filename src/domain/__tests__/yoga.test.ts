// Yoga tests: each classical combination fires only on its strict conditions.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildChart } from '../chart-engine';
import { aspectEngine } from '../aspect-engine';
import { yogaEngine } from '../yoga-engine';
import type { BuiltChart, ChartState, Graha, Varga } from '../types';

const base = (over: Partial<Record<Graha, number>>, asc = 15): ChartState => ({
  ascendant: asc,
  placements: {
    Sun: 10, Moon: 95, Mars: 200, Mercury: 150, Jupiter: 260,
    Venus: 180, Saturn: 300, Rahu: 45, Ketu: 225, ...over,
  },
});

const built = (c: ChartState): BuiltChart => buildChart(c, { varga: 'D1', lagna: 'Janma' });
const names = (c: ChartState): string[] =>
  yogaEngine(built(c), aspectEngine(built(c))).map((y) => y.name);

describe('yogaEngine', () => {
  it('Budha-Aditya needs Sun and Mercury together', () => {
    assert.ok(names(base({ Mercury: 12 })).includes('Budha-Aditya'));
    assert.ok(!names(base({})).includes('Budha-Aditya'));
  });

  it('Gajakesari needs Jupiter in kendra from the Moon', () => {
    assert.ok(names(base({ Jupiter: 5 })).includes('Gajakesari')); // 10th from Moon
    assert.ok(!names(base({})).includes('Gajakesari')); // 6th from Moon
  });

  it('Chandra-Mangala needs Moon and Mars together', () => {
    assert.ok(names(base({ Mars: 100 })).includes('Chandra-Mangala'));
    assert.ok(!names(base({})).includes('Chandra-Mangala'));
  });

  it('Amala needs a strong benefic in the 10th (Tula lagna, exalted Jupiter in Karka)', () => {
    assert.ok(names(base({ Jupiter: 100 }, 200)).includes('Amala'));
    assert.ok(!names(base({})).includes('Amala'));
  });

  it('Dharmakarmadhipati joins the 9th and 10th lords', () => {
    assert.ok(names(base({ Saturn: 265 })).includes('Dharmakarmadhipati'));
    assert.ok(!names(base({})).includes('Dharmakarmadhipati'));
  });

  it('Ruchaka needs own/exalted Mars in kendra', () => {
    assert.ok(names(base({ Mars: 5 })).includes('Ruchaka'));
    assert.ok(!names(base({})).includes('Ruchaka'));
  });

  it('Lakshmi, Dhana and Saraswati fire on the base chart — and vanish when broken', () => {
    const b = names(base({}));
    assert.ok(b.includes('Lakshmi'));
    assert.ok(b.includes('Dhana'));
    assert.ok(b.includes('Saraswati'));
    assert.ok(!names(base({ Venus: 160 })).includes('Lakshmi')); // Venus debilitated in Virgo
    assert.ok(!names(base({ Mercury: 200 })).includes('Saraswati')); // Mercury weakens
  });

  it('results are well-formed and deterministic', () => {
    const first = yogaEngine(built(base({})), aspectEngine(built(base({}))));
    const second = yogaEngine(built(base({})), aspectEngine(built(base({}))));
    assert.deepEqual(first, second);
    for (const y of first) {
      assert.ok(y.name.length > 0);
      assert.ok(y.factors.length > 0);
      assert.ok(y.strength > 0 && y.strength <= 1);
    }
  });
});
