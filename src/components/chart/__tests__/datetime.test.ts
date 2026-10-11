// Calendar math tests: leap years, weekday anchors, parse/format roundtrips.

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  MAX_YEAR,
  MIN_YEAR,
  addMonths,
  clampYear,
  daysInMonth,
  firstWeekday,
  from12Hour,
  parseLocalInput,
  to12Hour,
  toLocalInput,
  yearWindow,
} from '../datetime-utils';

describe('calendar helpers', () => {
  it('month lengths incl. leap February', () => {
    assert.equal(daysInMonth(2024, 1), 29);
    assert.equal(daysInMonth(2023, 1), 28);
    assert.equal(daysInMonth(2026, 9), 31);
    assert.equal(daysInMonth(2026, 3), 30);
  });

  it('weekday anchors (0=Sunday)', () => {
    assert.equal(firstWeekday(2026, 0), 4); // 1 Jan 2026 = Thursday
    assert.equal(firstWeekday(2000, 0), 6); // 1 Jan 2000 = Saturday
  });

  it('month stepping clamps at 1900–2100', () => {
    assert.deepEqual(addMonths(2026, 0, -1), { year: 2025, month: 11 });
    assert.deepEqual(addMonths(2026, 11, 1), { year: 2027, month: 0 });
    assert.deepEqual(addMonths(1900, 0, -5), { year: 1900, month: 0 });
    assert.deepEqual(addMonths(2100, 11, 5), { year: 2100, month: 11 });
    assert.equal(clampYear(1800), MIN_YEAR);
    assert.equal(clampYear(2200), MAX_YEAR);
  });

  it('parse/format roundtrip; rejects garbage and out-of-range', () => {    const d = new Date(1990, 4, 5, 14, 30);
    assert.equal(toLocalInput(d), '1990-05-05T14:30');
    assert.deepEqual(parseLocalInput('1990-05-05T14:30'), d);
    assert.deepEqual(parseLocalInput('2026-10-08'), new Date(2026, 9, 8, 0, 0));
    assert.equal(parseLocalInput('not-a-date'), null);
    assert.equal(parseLocalInput('2026-13-01'), null);
    assert.equal(parseLocalInput('2026-02-30'), null); // no rollover accepted
    assert.equal(parseLocalInput('1800-01-01'), null);
  });

  it('12h dial conversion roundtrips (midnight/noon edges)', () => {
    assert.deepEqual(to12Hour(0), { h12: 12, period: 'AM' });
    assert.deepEqual(to12Hour(12), { h12: 12, period: 'PM' });
    assert.deepEqual(to12Hour(14), { h12: 2, period: 'PM' });
    assert.deepEqual(to12Hour(23), { h12: 11, period: 'PM' });
    assert.equal(from12Hour(12, 'AM'), 0);
    assert.equal(from12Hour(12, 'PM'), 12);
    assert.equal(from12Hour(3, 'PM'), 15);
    assert.equal(from12Hour(3, 'AM'), 3);
    for (let h = 0; h < 24; h++) {
      const { h12, period } = to12Hour(h);
      assert.equal(from12Hour(h12, period), h, `roundtrip ${h}`);
    }
  });

  it('year window holds 12 clamped years containing the year', () => {
    const w = yearWindow(1990);
    assert.equal(w.length, 12);
    assert.ok(w.includes(1990));
    assert.deepEqual(yearWindow(1900)[0], MIN_YEAR);
    const top = yearWindow(2100);
    assert.equal(top[top.length - 1], MAX_YEAR);
  });
});
