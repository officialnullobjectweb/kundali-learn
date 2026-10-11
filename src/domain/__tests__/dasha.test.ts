// Vimshottari tests: balance math, order, 120-year cycle, boundaries.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { antardashas, birthBalance, currentPeriods, dashaEngine } from '../dasha-engine';
import { DASHA_YEARS } from '../constants';

describe('vimshottari', () => {
  it('Ashwini start -> full Ketu balance of 7 years', () => {
    const b = birthBalance(0);
    assert.equal(b.lord, 'Ketu');
    assert.ok(Math.abs(b.years - 7) < 1e-9);
  });

  it('nakshatra end -> ~zero balance; next nakshatra -> next lord', () => {
    const end = birthBalance(40 / 3 - 1e-9);
    assert.ok(end.years < 1e-6);
    const next = birthBalance(40 / 3);
    assert.equal(next.lord, 'Venus');
    assert.ok(Math.abs(next.years - DASHA_YEARS.Venus) < 1e-9);
  });

  it('sequence covers 120 years in classical order from birth lord', () => {
    const seq = dashaEngine(0, '2000-01-01T00:00:00Z');
    assert.equal(seq.birthNakshatra, 0);
    assert.equal(seq.mahadashas[0].lord, 'Ketu');
    assert.equal(seq.mahadashas[1].lord, 'Venus');
    const total =
      (Date.parse(seq.mahadashas[seq.mahadashas.length - 1].end) - Date.parse(seq.mahadashas[0].start)) /
      (365.25 * 86_400_000);
    assert.ok(total >= 120 && total < 140);
    // Periods are contiguous with no gaps.
    for (let i = 1; i < seq.mahadashas.length; i++) {
      assert.equal(seq.mahadashas[i].start, seq.mahadashas[i - 1].end);
    }
  });

  it('antardashas partition the mahadasha starting from its lord', () => {
    const ads = antardashas('Moon', Date.parse('2000-01-01T00:00:00Z'), 10);
    assert.equal(ads.length, 9);
    assert.equal(ads[0].lord, 'Moon');
    assert.equal(ads[1].lord, 'Mars');
    for (let i = 1; i < ads.length; i++) assert.equal(ads[i].start, ads[i - 1].end);
  });

  it('current periods resolve inside known bounds', () => {
    // Moon at 0° Ashwini, born 2000: Ketu MD 2000-2007; mid-2003 -> Ketu/Venus-ish.
    const p = currentPeriods(0, '2000-01-01T00:00:00Z', '2003-06-01T00:00:00Z');
    assert.equal(p.mahadasha, 'Ketu');
    const p2 = currentPeriods(0, '2000-01-01T00:00:00Z', '2010-01-01T00:00:00Z');
    assert.equal(p2.mahadasha, 'Venus');
    assert.throws(() => currentPeriods(0, '2000-01-01T00:00:00Z', '1999-01-01T00:00:00Z'));
  });

  it('deterministic', () => {
    assert.deepEqual(dashaEngine(95.4, '1990-05-05T00:00:00Z'), dashaEngine(95.4, '1990-05-05T00:00:00Z'));
  });
});
