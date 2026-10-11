// Location engine tests: pure matching/ranking only (no network, no data files).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLabel,
  classifyQuery,
  findDistrict,
  normalize,
  rankLocal,
  type GazetteerRow,
} from '../location';

const ROWS: GazetteerRow[] = [
  { n: 'Varanasi', a: 'Varanasi', la: 25.31, lo: 83.01, p: 1164404, s: 'Uttar Pradesh', d: 'Varanasi', k: 'place' },
  { n: 'Varanasi', a: 'Varanasi', la: 25.38, lo: 82.91, p: 3676841, s: 'Uttar Pradesh', d: 'Varanasi', k: 'district' },
  { n: 'Varangaon', a: 'Varangaon', la: 21.0, lo: 76.0, p: 5000, s: 'Maharashtra', d: 'Jalgaon', k: 'place' },
  { n: 'Uttar Pradesh', a: 'Uttar Pradesh', la: 27.25, lo: 80.75, p: 199812341, s: 'Uttar Pradesh', d: '', k: 'state' },
  { n: 'Jaipur', a: 'Jaipur', la: 26.91, lo: 75.78, p: 3046163, s: 'Rajasthan', d: 'Jaipur', k: 'place' },
  { n: 'New Delhi', a: 'New Delhi', la: 28.61, lo: 77.23, p: 500000, s: 'Delhi', d: 'New Delhi', k: 'district' },
];

describe('location core', () => {
  it('classifies pincode vs text vs empty', () => {
    assert.equal(classifyQuery('110001'), 'pincode');
    assert.equal(classifyQuery(' 110001 '), 'pincode');
    assert.equal(classifyQuery('011001'), 'text'); // leading zero is not an Indian PIN
    assert.equal(classifyQuery('11001'), 'text');
    assert.equal(classifyQuery('Varanasi'), 'text');
    assert.equal(classifyQuery('   '), 'empty');
  });

  it('normalizes names for matching', () => {
    assert.equal(normalize('  Vârânasî! '), 'varanasi');
    assert.equal(normalize('New-Delhi'), 'new delhi');
  });

  it('ranks exact matches first, then prefix, then contains', () => {
    const top = rankLocal('Varanasi', ROWS, 5);
    assert.equal(top.length, 2);
    assert.ok(top.every((r) => r.n === 'Varanasi'));
    const pref = rankLocal('Varan', ROWS, 5);
    assert.ok(pref.every((r) => r.n === 'Varanasi' || r.n === 'Varangaon'));
    assert.ok(!pref.some((r) => r.n === 'Jaipur'));
  });

  it('needs at least 2 characters', () => {
    assert.deepEqual(rankLocal('V', ROWS), []);
  });

  it('builds honest labels with district/state context', () => {
    assert.deepEqual(buildLabel(ROWS[0]), { label: 'Varanasi', sub: 'Uttar Pradesh' });
    assert.deepEqual(buildLabel(ROWS[1]), { label: 'Varanasi (district)', sub: 'Uttar Pradesh' });
    assert.deepEqual(buildLabel(ROWS[3]), { label: 'Uttar Pradesh (state)', sub: 'Uttar Pradesh' });
  });

  it('matches pincode districts tolerantly ("Central Delhi" etc)', () => {
    const hit = findDistrict('Central Delhi', ROWS);
    assert.ok(hit && hit.n === 'New Delhi');
    assert.equal(findDistrict('Varanasi', ROWS)?.k, 'district');
    assert.equal(findDistrict('Atlantis', ROWS), null);
  });
});
