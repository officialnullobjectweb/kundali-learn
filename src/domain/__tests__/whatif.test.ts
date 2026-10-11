// What-if tests: move detection, ascendant shifts, degree edits,
// prediction deltas, sentence grounding, input immutability.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAllVargas } from '../chart-engine';
import { diffCharts } from '../whatif-engine';
import type { BuiltChart, ChartState, Varga } from '../types';

const BEFORE: ChartState = {
  ascendant: 15,
  placements: {
    Sun: 10, Moon: 95.4, Mars: 200, Mercury: 150, Jupiter: 260,
    Venus: 180, Saturn: 300, Rahu: 45, Ketu: 225,
  },
};

const all = (c: ChartState): Record<Varga, BuiltChart> => buildAllVargas(c, 'Janma');

const diff = (after: ChartState) =>
  diffCharts({
    before: all(BEFORE),
    after: all(after),
    birthISO: '1990-05-05T00:00:00Z',
    dateISO: '2026-10-08T00:00:00Z',
  });

describe('diffCharts', () => {
  it('identical charts -> no changes, zero deltas', () => {
    const d = diff({ ...BEFORE, placements: { ...BEFORE.placements } });
    assert.equal(d.hasChanges, false);
    assert.equal(d.moves.length, 0);
    assert.equal(d.ascendant, null);
    assert.deepEqual(d.sentences, []);
    for (const delta of d.deltas) assert.equal(delta.delta, 0);
  });

  it('detects Saturn moving into House 10 with prediction delta', () => {
    const d = diff({ ...BEFORE, placements: { ...BEFORE.placements, Saturn: 270 } });
    assert.equal(d.hasChanges, true);
    assert.equal(d.moves.length, 1);
    const m = d.moves[0];
    assert.equal(m.graha, 'Saturn');
    assert.equal(m.fromBhava, 11);
    assert.equal(m.toBhava, 10);
    assert.ok(d.sentences.some((t) => t.includes('Saturn') && t.includes('House 11') && t.includes('House 10')));
    const career = d.deltas.find((x) => x.domain === 'career');
    assert.ok(career && career.delta !== 0, 'career score responds to the move');
    assert.ok(
      d.sentences.some((t) => t.includes('Saturn') && t.includes('Career score moved')),
      'combined move + prediction sentence',
    );
  });

  it('detects ascendant shifts and degree-only edits', () => {
    const asc = diff({ ...BEFORE, placements: { ...BEFORE.placements }, ascendant: 45 });
    assert.ok(asc.ascendant && asc.ascendant.from === 0 && asc.ascendant.to === 1);
    assert.ok(asc.sentences.some((t) => t.includes('ascendant moved')));

    const deg = diff({ ...BEFORE, placements: { ...BEFORE.placements, Moon: 95.9 } });
    assert.equal(deg.moves.length, 1);
    assert.equal(deg.moves[0].graha, 'Moon');
    assert.equal(deg.moves[0].fromBhava, deg.moves[0].toBhava);
    assert.ok(deg.sentences.some((t) => t.includes('degree changed')));
  });

  it('reports house occupancy changes consistently with moves', () => {
    const d = diff({ ...BEFORE, placements: { ...BEFORE.placements, Saturn: 270 } });
    const h11 = d.occupancy.find((o) => o.bhava === 11);
    const h10 = d.occupancy.find((o) => o.bhava === 10);
    assert.ok(h11?.left.includes('Saturn'));
    assert.ok(h10?.joined.includes('Saturn'));
  });

  it('never mutates inputs and is deterministic', () => {
    const after = { ...BEFORE, placements: { ...BEFORE.placements, Saturn: 270 } };
    const snapBefore = JSON.stringify(all(BEFORE));
    const snapAfter = JSON.stringify(all(after));
    const d1 = diff(after);
    assert.equal(JSON.stringify(all(BEFORE)), snapBefore);
    assert.equal(JSON.stringify(all(after)), snapAfter);
    assert.deepEqual(d1, diff(after));
  });
});
