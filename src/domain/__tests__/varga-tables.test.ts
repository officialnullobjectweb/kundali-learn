// Exhaustive classical varga tables: every sign x every part, midpoints.
// Transcribed from Brihat Parashara Hora Shastra rules (NOT computed):
//  D4: kendra rotation [self, 4th, 7th, 10th] for every sign.
//  D6: odd signs from self, even signs from the 7th (user-confirmed Tajika rule).
//  D7: odd signs from self, even signs from the 7th (BPHS 6.10-11).
//  D9: movable from self, fixed from 9th, dual from 5th (BPHS).
//  D10: odd signs from self, even signs from the 9th (BPHS).
// Midpoints dodge all float-boundary dust; exact edges are tested separately
// only where the part size is binary-exact (D4/D6/D10).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { vargaRashi } from '../varga-engine';
import type { Varga } from '../types';

const D9: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 0, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 0, 1, 2],
  [3, 4, 5, 6, 7, 8, 9, 10, 11],
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 0, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 0, 1, 2],
  [3, 4, 5, 6, 7, 8, 9, 10, 11],
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 0, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 0, 1, 2],
  [3, 4, 5, 6, 7, 8, 9, 10, 11],
];

const D10: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [9, 10, 11, 0, 1, 2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  [11, 0, 1, 2, 3, 4, 5, 6, 7, 8],
  [4, 5, 6, 7, 8, 9, 10, 11, 0, 1],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [6, 7, 8, 9, 10, 11, 0, 1, 2, 3],
  [3, 4, 5, 6, 7, 8, 9, 10, 11, 0],
  [8, 9, 10, 11, 0, 1, 2, 3, 4, 5],
  [5, 6, 7, 8, 9, 10, 11, 0, 1, 2],
  [10, 11, 0, 1, 2, 3, 4, 5, 6, 7],
  [7, 8, 9, 10, 11, 0, 1, 2, 3, 4],
];

const D4: number[][] = [
  [0, 3, 6, 9],
  [1, 4, 7, 10],
  [2, 5, 8, 11],
  [3, 6, 9, 0],
  [4, 7, 10, 1],
  [5, 8, 11, 2],
  [6, 9, 0, 3],
  [7, 10, 1, 4],
  [8, 11, 2, 5],
  [9, 0, 3, 6],
  [10, 1, 4, 7],
  [11, 2, 5, 8],
];

const D7: number[][] = [
  [0, 1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 0, 1],
  [2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 0, 1, 2, 3],
  [4, 5, 6, 7, 8, 9, 10],
  [11, 0, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 0],
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 0, 1, 2],
  [3, 4, 5, 6, 7, 8, 9],
  [10, 11, 0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
];

const D6: number[][] = [
  [0, 1, 2, 3, 4, 5],
  [7, 8, 9, 10, 11, 0],
  [2, 3, 4, 5, 6, 7],
  [9, 10, 11, 0, 1, 2],
  [4, 5, 6, 7, 8, 9],
  [11, 0, 1, 2, 3, 4],
  [6, 7, 8, 9, 10, 11],
  [1, 2, 3, 4, 5, 6],
  [8, 9, 10, 11, 0, 1],
  [3, 4, 5, 6, 7, 8],
  [10, 11, 0, 1, 2, 3],
  [5, 6, 7, 8, 9, 10],
];

const PARTS: Record<Varga, { n: number; size: number }> = {
  D1: { n: 1, size: 30 },
  D4: { n: 4, size: 7.5 },
  D6: { n: 6, size: 5 },
  D7: { n: 7, size: 30 / 7 },
  D9: { n: 9, size: 10 / 3 },
  D10: { n: 10, size: 3 },
  D60: { n: 60, size: 0.5 },
};

const TABLES: Partial<Record<Varga, number[][]>> = { D4, D6, D7, D9, D10 };

describe('classical varga tables (every sign x every part)', () => {
  for (const [varga, table] of Object.entries(TABLES) as [Varga, number[][]][]) {
    it(`${varga} matches the classical table at every part midpoint`, () => {
      const { size } = PARTS[varga];
      for (let r = 0; r < 12; r++) {
        for (let k = 0; k < table[r].length; k++) {
          const lon = r * 30 + (k + 0.5) * size;
          assert.equal(vargaRashi(lon, varga), table[r][k], `${varga} r=${r} part=${k}`);
        }
      }
    });
  }

  it('D4/D6/D10 map exact part edges (binary-exact sizes)', () => {
    // Start of each part belongs to that part.
    for (let r = 0; r < 12; r++) {
      for (const [varga, size] of [['D4', 7.5], ['D6', 5], ['D10', 3]] as [Varga, number][]) {
        const table = TABLES[varga]!;
        for (let k = 0; k < table[r].length; k++) {
          assert.equal(vargaRashi(r * 30 + k * size, varga), table[r][k], `${varga} r=${r} edge=${k}`);
        }
      }
    }
    // End of sign belongs to the last part.
    assert.equal(vargaRashi(29.999, 'D4'), D4[0][3]);
    assert.equal(vargaRashi(359.999, 'D10'), D10[11][9]);
    assert.equal(vargaRashi(65, 'D6'), D6[2][1]); // 5° Mithuna -> 2nd part
  });

  it('D60: part 0 and part 59 anchors for every sign', () => {
    for (let r = 0; r < 12; r++) {
      const expectedStart = r % 2 === 0 ? 0 : 6; // Mesha for odd, Tula for even
      assert.equal(vargaRashi(r * 30, 'D60'), expectedStart, `D60 r=${r} part 0`);
      assert.equal(vargaRashi(r * 30 + 29.9, 'D60'), (expectedStart + 59) % 12, `D60 r=${r} part 59`);
    }
  });

  it('D60 spot checks against hand computation', () => {
    assert.equal(vargaRashi(10, 'D60'), 8);
    assert.equal(vargaRashi(95, 'D60'), 4);
    assert.equal(vargaRashi(200, 'D60'), 4);
    assert.equal(vargaRashi(45, 'D60'), 0);
  });
});
