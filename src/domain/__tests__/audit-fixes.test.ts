// Audit-fix regressions: derived debilitation, per-planet combustion orbs,
// optional lunar-node aspects, degree-preserving moves.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { moveToRashi } from '../astro-math';
import { COMBUST_ORBS, EXALTATION, debilitationRashi } from '../constants';
import { buildChart, dignityOf } from '../chart-engine';
import { aspectEngine } from '../aspect-engine';
import type { ChartState, Graha } from '../types';

const placements = (over: Partial<Record<Graha, number>>): ChartState['placements'] => ({
  Sun: 0, Moon: 0, Mars: 0, Mercury: 0, Jupiter: 0,
  Venus: 0, Saturn: 0, Rahu: 0, Ketu: 180, ...over,
});

describe('audit fixes', () => {
  it('debilitation is exactly opposite exaltation for every graha', () => {
    for (const g of Object.keys(EXALTATION) as Graha[]) {
      assert.equal(debilitationRashi(g), (EXALTATION[g].rashi + 6) % 12, g);
      assert.equal(dignityOf(g, debilitationRashi(g)), 'Debilitated', g);
    }
  });

  it('combustion uses per-planet orbs', () => {
    assert.equal(COMBUST_ORBS.Sun, null);
    assert.equal(COMBUST_ORBS.Moon, 12);
    assert.equal(COMBUST_ORBS.Mars, 17);
    const near = (sun: number, g: Graha, lon: number): boolean => {
      const c: ChartState = { ascendant: 0, placements: placements({ Sun: sun, [g]: lon } as Partial<Record<Graha, number>>) };
      return buildChart(c, { varga: 'D1', lagna: 'Janma' }).planets[g].isCombust;
    };
    assert.equal(near(100, 'Moon', 111.5), true); // 11.5° < 12°
    assert.equal(near(100, 'Venus', 110.5), false); // 10.5° > 10°
    assert.equal(near(100, 'Mars', 116.5), true); // 16.5° < 17°
    assert.equal(near(100, 'Saturn', 115.5), false); // 15.5° > 15°
    assert.equal(near(100, 'Rahu', 105), false); // nodes never combust
  });

  it('lunar-node aspects are optional, on by default', () => {
    const c: ChartState = { ascendant: 15, placements: placements({ Moon: 95 }) };
    const built = buildChart(c, { varga: 'D1', lagna: 'Janma' });
    const withNodes = aspectEngine(built);
    const withoutNodes = aspectEngine(built, { lunarNodesCastAspects: false });
    assert.ok(withNodes.some((a) => a.from === 'Rahu' || a.from === 'Ketu'));
    assert.ok(!withoutNodes.some((a) => a.from === 'Rahu' || a.from === 'Ketu'));
    assert.ok(withoutNodes.length < withNodes.length);
  });

  it('moveToRashi preserves degree and lands in the target rashi', () => {
    const close = (a: number, b: number): void => {
      assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);
    };
    close(moveToRashi(95.4, 6), 185.4); // 5.4° Karka -> 5.4° Tula
    close(moveToRashi(359.9, 0), 29.9);
    close(moveToRashi(30, 11), 330);
  });
});
