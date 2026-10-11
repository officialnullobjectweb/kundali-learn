// Boundary tests for the deterministic chart engine.
// Runner: node:test + node:assert only — no new dependencies.
// Run: tsc --noCheck compile, then `node --test` on the emitted JS.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  bhavaFromLongitude,
  degreeInRashi,
  longitudeFromRashiDegree,
  nakshatraFromLongitude,
  norm360,
  padaFromLongitude,
  rashiFromLongitude,
  toDMS,
} from '../astro-math';
import { ayanamsaForDate, tropicalToSidereal } from '../ayanamsa';
import { vargaRashi } from '../varga-engine';
import { buildChart, dignityOf } from '../chart-engine';
import { LAHIRI_J2000 } from '../constants';
import type { ChartState, Graha } from '../types';

const P40_3 = 40 / 3; // one nakshatra: 13°20'
const P10_3 = 10 / 3; // one pada: 3°20'

const placements = (over: Partial<Record<Graha, number>>): ChartState['placements'] => ({
  Sun: 0,
  Moon: 0,
  Mars: 0,
  Mercury: 0,
  Jupiter: 0,
  Venus: 0,
  Saturn: 0,
  Rahu: 0,
  Ketu: 180,
  ...over,
});

describe('norm360', () => {
  it('maps 0/360/negatives onto [0, 360)', () => {
    assert.equal(norm360(0), 0);
    assert.equal(norm360(360), 0);
    assert.equal(norm360(-0.5), 359.5);
    assert.equal(norm360(725.5), 5.5);
  });
});

describe('0° boundary', () => {
  it('0° = Mesha 0°, Ashwini pada 1', () => {
    assert.equal(rashiFromLongitude(0), 0);
    assert.equal(degreeInRashi(0), 0);
    assert.equal(nakshatraFromLongitude(0), 0);
    assert.equal(padaFromLongitude(0), 1);
  });
});

describe('29°59′ boundary', () => {
  it("29 + 59/60 stays Mesha, Krittika pada 1", () => {
    const lon = 29 + 59 / 60;
    assert.equal(rashiFromLongitude(lon), 0);
    assert.ok(Math.abs(degreeInRashi(lon) - lon) < 1e-9);
    assert.equal(nakshatraFromLongitude(lon), 2); // Krittika
    assert.equal(padaFromLongitude(lon), 1);
    assert.equal(toDMS(lon), "29°59'");
  });
});

describe('rashi transitions', () => {
  it('29.9999 Mesha / 30.0 Vrishabha / 359.999 Meena', () => {
    assert.equal(rashiFromLongitude(29.9999), 0);
    assert.equal(rashiFromLongitude(30), 1);
    assert.equal(degreeInRashi(30), 0);
    assert.equal(rashiFromLongitude(359.999), 11);
    assert.equal(rashiFromLongitude(120), 4); // Simha
  });
});

describe('nakshatra transitions', () => {
  it('Ashwini ends / Bharani starts at exactly 13°20′', () => {
    assert.equal(nakshatraFromLongitude(P40_3 - 1e-6), 0);
    assert.equal(nakshatraFromLongitude(P40_3), 1);
    assert.equal(nakshatraFromLongitude(2 * P40_3), 2); // Krittika
    assert.equal(nakshatraFromLongitude(360 - 1e-6), 26); // Revati tail
  });
});

describe('pada transitions', () => {
  it('padas flip every 3°20′ inside a nakshatra', () => {
    assert.equal(padaFromLongitude(P10_3 - 1e-6), 1);
    assert.equal(padaFromLongitude(P10_3), 2);
    assert.equal(padaFromLongitude(2 * P10_3), 3);
    assert.equal(padaFromLongitude(3 * P10_3), 4);
    assert.equal(padaFromLongitude(4 * P10_3 - 1e-6), 4);
    assert.equal(padaFromLongitude(4 * P10_3), 1); // next nakshatra restarts
  });
});

describe('houses', () => {
  it('same rashi as lagna = house 1; wraps past Meena', () => {
    assert.equal(bhavaFromLongitude(longitudeFromRashiDegree(0, 5), 0), 1);
    assert.equal(bhavaFromLongitude(longitudeFromRashiDegree(9, 0), 0), 10);
    assert.equal(bhavaFromLongitude(longitudeFromRashiDegree(0, 0), 11), 2);
  });
});

describe('ayanamsa', () => {
  it('Lahiri J2000 anchor, custom passthrough, tropical conversion', () => {
    assert.ok(Math.abs(ayanamsaForDate('2000-01-01T12:00:00Z') - LAHIRI_J2000) < 1e-9);
    assert.equal(ayanamsaForDate('1990-06-01T00:00:00Z', { system: 'custom', customOffset: 23.5 }), 23.5);
    assert.ok(ayanamsaForDate('2000-01-01T12:00:00Z', { system: 'raman' }) < LAHIRI_J2000);
    assert.equal(tropicalToSidereal(100, 23.85), 76.15);
    assert.equal(tropicalToSidereal(10, 23.85), 346.15); // wraps
  });
  it('rejects bad input deterministically', () => {
    assert.throws(() => ayanamsaForDate('not-a-date'));
    assert.throws(() => ayanamsaForDate('2000-01-01T00:00:00Z', { system: 'custom' }));
    assert.throws(() => longitudeFromRashiDegree(0, 30));
  });
});

describe('dignity', () => {
  it('exalted / debilitated / own resolve by rashi', () => {
    assert.equal(dignityOf('Sun', 0), 'Exalted');
    assert.equal(dignityOf('Sun', 6), 'Debilitated');
    assert.equal(dignityOf('Sun', 4), 'Moolatrikona'); // Simha: moolatrikona outranks own
    assert.equal(dignityOf('Moon', 3), 'Own'); // Karka: own, moolatrikona is Vrishabha
    assert.equal(dignityOf('Mars', 0), 'Moolatrikona');
    assert.equal(dignityOf('Jupiter', 3), 'Exalted');
  });
});

describe('varga', () => {
  it('D9/D10 spot checks: Sun 10° Mesha -> Karka / Karka', () => {
    assert.equal(vargaRashi(10, 'D1'), 0);
    assert.equal(vargaRashi(10, 'D9'), 3);
    assert.equal(vargaRashi(10, 'D10'), 3);
    assert.equal(vargaRashi(0, 'D9'), 0);
    assert.equal(vargaRashi(29.999, 'D9'), 8); // last navamsha of Mesha
  });
});

describe('buildChart', () => {
  it('derives planets, houses, occupants; Chandra mode rebases lagna', () => {
    const chart: ChartState = { ascendant: 15, placements: placements({ Moon: 95, Jupiter: 200 }) };
    const d1 = buildChart(chart, { varga: 'D1', lagna: 'Janma' });
    assert.equal(d1.lagnaRashi, 0);
    assert.equal(d1.planets.Moon.rashi, 3);
    assert.equal(d1.planets.Moon.bhava, 4);
    assert.equal(d1.planets.Jupiter.rashi, 6);
    assert.equal(d1.houses[1].lord, 'Mars');
    assert.ok(d1.houses[4].occupants.includes('Moon'));
    assert.equal(d1.planets.Rahu.isRetrograde, true);
    assert.equal(d1.planets.Sun.isRetrograde, false);

    const chandra = buildChart(chart, { varga: 'D1', lagna: 'Chandra' });
    assert.equal(chandra.lagnaRashi, 3);
    assert.equal(chandra.planets.Moon.bhava, 1);

    const d9 = buildChart(chart, { varga: 'D9', lagna: 'Janma' });
    assert.equal(d9.lagnaRashi, vargaRashi(15, 'D9'));
  });

  it('flags combustion within 8° of the Sun', () => {
    const chart: ChartState = { ascendant: 0, placements: placements({ Sun: 100, Mercury: 105 }) };
    const built = buildChart(chart, { varga: 'D1', lagna: 'Janma' });
    assert.equal(built.planets.Mercury.isCombust, true);
    assert.equal(built.planets.Sun.isCombust, false);
  });

  it('identical input -> identical output (determinism)', () => {
    const chart: ChartState = { ascendant: 15, placements: placements({ Moon: 95 }) };
    const view = { varga: 'D1', lagna: 'Janma' } as const;
    assert.deepEqual(buildChart(chart, view), buildChart(chart, view));
  });
});
