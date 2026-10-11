// Astronomy tests. External anchors: JPL Horizons geocentric apparent
// ecliptic longitude, 2026-10-08 00:00 UT (CENTER 500@399, quantity 31):
// Sun 194.7331°, Moon 161.9933°, Mars 125.7178°.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ascendantLongitude,
  astronomyEngine,
  ephemerisDay,
  julianDayUT,
  meanNode,
  tropicalLongitudes,
} from '../astronomy-engine';
import { ayanamsaForDate } from '../ayanamsa';
import { buildChart } from '../chart-engine';

describe('astronomy', () => {
  it('julian day anchor: 2026-10-08 00:00 UT = 2461321.5', () => {
    assert.equal(julianDayUT('2026-10-08T00:00:00Z'), 2461321.5);
    assert.ok(ephemerisDay('2026-10-08T00:00:00Z') - 2461321.5 > 0); // +ΔT
  });

  it('matches JPL Horizons within 0.05° (Sun, Moon, Mars)', () => {
    const t = tropicalLongitudes('2026-10-08T00:00:00Z');
    const close = (a: number, b: number): number => {
      const d = Math.abs(a - b) % 360;
      return d > 180 ? 360 - d : d;
    };
    assert.ok(close(t.Sun, 194.7331) < 0.05, `Sun ${t.Sun}`);
    assert.ok(close(t.Moon, 161.9933) < 0.05, `Moon ${t.Moon}`);
    assert.ok(close(t.Mars, 125.7178) < 0.05, `Mars ${t.Mars}`);
  });

  it('nodes are exactly opposite; mean node sane for 2026', () => {
    const t = tropicalLongitudes('2026-10-08T00:00:00Z');
    const d = Math.abs(t.Rahu - t.Ketu) % 360;
    assert.ok(Math.abs(d - 180) < 1e-9);
    assert.ok(meanNode(2461321.5) > 0 && meanNode(2461321.5) < 360);
  });

  it('Mercury direct 2026-10-08, retrograde 2026-11-01', () => {
    const r1 = astronomyEngine({ dateISO: '2026-10-08T00:00:00Z', lat: 28.61, lon: 77.21 });
    const r2 = astronomyEngine({ dateISO: '2026-11-01T00:00:00Z', lat: 28.61, lon: 77.21 });
    assert.equal(r1.retrograde.Mercury, false);
    assert.equal(r2.retrograde.Mercury, true);
    assert.equal(r1.retrograde.Rahu, true);
    assert.equal(r1.retrograde.Ketu, true);
  });

  it('sidereal = tropical − ayanamsa, all 9 grahas present', () => {
    const r = astronomyEngine({ dateISO: '2026-10-08T00:00:00Z', lat: 28.61, lon: 77.21 });
    const t = tropicalLongitudes('2026-10-08T00:00:00Z');
    const ayan = ayanamsaForDate('2026-10-08T00:00:00Z');
    for (const g of Object.keys(t) as (keyof typeof t)[]) {
      const expected = (((t[g] - ayan) % 360) + 360) % 360;
      assert.ok(Math.abs(r.placements[g] - expected) < 1e-9, g);
    }
  });

  it('ascendant advances ~15°/hour, deterministic, rejects bad latitude', () => {
    const a1 = ascendantLongitude('2026-10-08T00:00:00Z', 28.61, 77.21);
    const a2 = ascendantLongitude('2026-10-08T01:00:00Z', 28.61, 77.21);
    let d = (a2 - a1) % 360;
    if (d < 0) d += 360;
    assert.ok(d > 10 && d < 20, `hourly advance ${d}`);
    assert.equal(ascendantLongitude('2026-10-08T00:00:00Z', 28.61, 77.21), a1);
    assert.throws(() => ascendantLongitude('2026-10-08T00:00:00Z', 91, 0));
    assert.throws(() => julianDayUT('not-a-date'));
  });

  it('ephemeris output builds a complete chart (birth-form path)', () => {
    const r = astronomyEngine({ dateISO: '1990-05-05T00:00:00Z', lat: 28.61, lon: 77.21 });
    const built = buildChart(
      { ascendant: r.ascendant, placements: r.placements },
      { varga: 'D1', lagna: 'Janma' },
      { retrograde: r.retrograde },
    );
    assert.equal(Object.keys(built.planets).length, 9);
    assert.equal(Object.keys(built.houses).length, 12);
    assert.ok(built.planets.Moon.nakshatra >= 0 && built.planets.Moon.nakshatra <= 26);
    const retroCount = (Object.keys(r.retrograde) as (keyof typeof r.retrograde)[])
      .filter((g) => r.retrograde[g]).length;
    assert.ok(retroCount >= 2, 'at least the nodes are retrograde');
    // Same input twice: identical chart (birth form is repeatable).
    const r2 = astronomyEngine({ dateISO: '1990-05-05T00:00:00Z', lat: 28.61, lon: 77.21 });
    assert.deepEqual(r, r2);
  });
});
