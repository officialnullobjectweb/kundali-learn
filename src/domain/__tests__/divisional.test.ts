// Divisional-view derivation tests: one ChartState feeds every view.
// Proves D1/Chandra/D9/D10 are projections, not independent charts,
// and that houses, lords and aspects recompute per view.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAllVargas, buildChart } from '../chart-engine';
import { aspectEngine } from '../aspect-engine';
import { moveToVargaRashi, vargaDegree, vargaRashi } from '../varga-engine';
import type { ChartState } from '../types';

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

describe('divisional derivation', () => {
  it('all views share the same underlying longitudes', () => {
    const d1 = buildChart(chart, { varga: 'D1', lagna: 'Janma' });
    const d9 = buildChart(chart, { varga: 'D9', lagna: 'Janma' });
    const d10 = buildChart(chart, { varga: 'D10', lagna: 'Janma' });
    for (const g of Object.keys(d1.planets) as (keyof typeof d1.planets)[]) {
      assert.equal(d1.planets[g].longitude, chart.placements[g]);
      assert.equal(d9.planets[g].longitude, chart.placements[g]);
      assert.equal(d10.planets[g].longitude, chart.placements[g]);
    }
  });

  it('varga lagna follows the ascendant mapping; Chandra follows the Moon', () => {
    const d1 = buildChart(chart, { varga: 'D1', lagna: 'Janma' });
    const d9 = buildChart(chart, { varga: 'D9', lagna: 'Janma' });
    assert.equal(d1.lagnaRashi, 0);
    assert.notEqual(d9.lagnaRashi, d1.lagnaRashi); // 15° Mesha -> 5th navamsha -> Simha
    assert.equal(d9.lagnaRashi, 4);
    const chandra = buildChart(chart, { varga: 'D1', lagna: 'Chandra' });
    assert.equal(chandra.lagnaRashi, 3); // Moon at 95° = Karka
    assert.equal(chandra.planets.Moon.bhava, 1);
  });

  it('house lords track the view lagna', () => {
    const d1 = buildChart(chart, { varga: 'D1', lagna: 'Janma' });
    const chandra = buildChart(chart, { varga: 'D1', lagna: 'Chandra' });
    assert.equal(d1.houses[1].lord, 'Mars'); // Mesha lagna
    assert.equal(chandra.houses[1].lord, 'Moon'); // Karka lagna
  });

  it('aspects recompute per view and never target the source graha', () => {
    const d1 = buildChart(chart, { varga: 'D1', lagna: 'Janma' });
    const d9 = buildChart(chart, { varga: 'D9', lagna: 'Janma' });
    const a1 = aspectEngine(d1);
    const a9 = aspectEngine(d9);
    assert.ok(a1.length > 0 && a9.length > 0);
    for (const a of [...a1, ...a9]) {
      assert.notEqual(a.to, a.from);
      assert.equal(a.kind, 'graha');
    }
    // Jupiter at 260°: D1 bhava 9 -> aspects bhavas 1, 3, 5 (5/7/9th from 9th).
    const ju = a1.filter((a) => a.from === 'Jupiter' && typeof a.to === 'number').map((a) => a.to);
    assert.deepEqual([...ju].sort((x, y) => (x as number) - (y as number)), [1, 3, 5]);
    assert.deepEqual(a1, aspectEngine(d1)); // deterministic
  });

  it('D4 follows the kendra rule (offsets 0, 3, 6, 9)', () => {
    assert.equal(vargaRashi(10, 'D4'), 3); // Sun 10° Mesha, 2nd quarter -> Karka
    assert.equal(vargaRashi(95, 'D4'), 3); // Moon 5° Karka, 1st quarter -> Karka
    assert.equal(vargaRashi(200, 'D4'), 0); // Mars 20° Tula, 3rd quarter -> Mesha
    assert.equal(vargaRashi(150, 'D4'), 5); // Mercury 0° Kanya -> Kanya
    assert.equal(vargaRashi(45, 'D4'), 7); // Rahu 15° Vrishabha, 3rd quarter -> Vrishchika
    const d4 = buildChart(chart, { varga: 'D4', lagna: 'Janma' });
    assert.equal(d4.lagnaRashi, 6); // 15° Mesha, 3rd quarter -> Tula
    assert.equal(d4.planets.Sun.bhava, 10); // Karka from Tula lagna
    assert.ok(d4.houses[10].occupants.includes('Sun'));
  });

  it('D6 uses 6 slices of 5° with odd-self / even-7th starts', () => {
    assert.equal(vargaRashi(10, 'D6'), 2); // Sun 10° Mesha -> Mithuna
    assert.equal(vargaRashi(95, 'D6'), 10); // Moon 5° Karka (even) -> Kumbha
    assert.equal(vargaRashi(45, 'D6'), 10); // Rahu 15° Vrishabha, even -> Makara
    assert.equal(vargaRashi(225, 'D6'), 4); // Ketu 15° Vrishchika, even -> Simha
    const d6 = buildChart(chart, { varga: 'D6', lagna: 'Janma' });
    assert.equal(d6.lagnaRashi, 3); // 15° Mesha -> Karka
  });

  it('D7 uses odd-self / even-7th starts over 30/7° slices', () => {
    assert.equal(vargaRashi(10, 'D7'), 2); // Sun 10° Mesha -> Mithuna
    assert.equal(vargaRashi(260, 'D7'), 0); // Jupiter 20° Dhanu -> Mesha
    assert.equal(vargaRashi(45, 'D7'), 10); // Rahu 15° Vrishabha, even -> Makara
    const d7 = buildChart(chart, { varga: 'D7', lagna: 'Janma' });
    assert.equal(d7.lagnaRashi, 3); // 15° Mesha -> Karka
  });

  it('D60 counts 60 half-degree parts from Mesha (odd) / Tula (even)', () => {
    assert.equal(vargaRashi(10, 'D60'), 8); // Sun 10° Mesha, part 21 -> Dhanu
    assert.equal(vargaRashi(95, 'D60'), 4); // Moon 5° Karka (even), part 11 -> Simha
    assert.equal(vargaRashi(200, 'D60'), 4); // Mars 20° Tula, part 41 -> Simha
    assert.equal(vargaRashi(45, 'D60'), 0); // Rahu 15° Vrishabha, even, part 31 -> Mesha
    const d60 = buildChart(chart, { varga: 'D60', lagna: 'Janma' });
    assert.equal(d60.lagnaRashi, 6); // 15° Mesha, part 31 -> Tula
  });

  it('dignity and degrees are evaluated in the active varga', () => {
    const d1 = buildChart(chart, { varga: 'D1', lagna: 'Janma' });
    const d9 = buildChart(chart, { varga: 'D9', lagna: 'Janma' });
    const d4 = buildChart(chart, { varga: 'D4', lagna: 'Janma' });
    assert.equal(d1.planets.Sun.dignity, 'Exalted'); // 10° Mesha in D1
    assert.equal(d9.planets.Sun.dignity, 'Friend'); // D9 Karka, lord Moon
    assert.equal(d4.planets.Sun.dignity, 'Friend'); // D4 Karka, lord Moon
    assert.equal(d4.planets.Mercury.dignity, 'Exalted'); // D4 Kanya: exalted AND own
    assert.equal(d1.planets.Sun.vargaDegree, 10);
    assert.ok(Math.abs(d9.planets.Sun.vargaDegree - 0) < 1e-9); // exact part start
    assert.ok(Math.abs(d4.planets.Mars.vargaDegree - 20) < 1e-9);
  });

  it('moveToVargaRashi lands the varga sign with minimal D1 change', () => {
    assert.equal(moveToVargaRashi(95.4, 6, 'D1'), 185.4); // D1 passthrough
    const same = moveToVargaRashi(10, 3, 'D9'); // already D9 Karka
    assert.ok(Math.abs(same - 10) < 1e-9);
    const moved = moveToVargaRashi(10, 4, 'D9'); // Mesha can reach Simha
    assert.equal(vargaRashi(moved, 'D9'), 4);
    assert.ok(moved >= 10 && moved < 20); // same D1 sign kept
    const far = moveToVargaRashi(10, 10, 'D9'); // Mesha cannot reach Makara
    assert.equal(vargaRashi(far, 'D9'), 10);
    assert.ok(far >= 350 && far < 357); // nearest reachable: Meena 23.5°
  });

  it('vargaDegree snaps float dust at exact part boundaries', () => {
    assert.equal(vargaDegree(135.2, 'D60'), 12); // exact 12.0, not 11.9999999
    assert.equal(vargaDegree(10, 'D9'), 0);
  });

  it('buildAllVargas covers all seven charts from one state', () => {    const all = buildAllVargas(chart, 'Janma');
    assert.deepEqual(Object.keys(all).sort(), ['D1', 'D10', 'D4', 'D6', 'D60', 'D7', 'D9']);
    for (const v of Object.keys(all) as (keyof typeof all)[]) {
      assert.equal(all[v].planets.Sun.longitude, 10);
    }
  });
});
