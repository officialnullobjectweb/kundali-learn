// Placement model tests: tray exclusions, axis math, theme/i18n completeness.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { norm360 } from '../astro-math';
import { ascendantForHouseRashi, lagnaRashiForHouseRashi } from '../astro-math';
import { buildAllVargas } from '../chart-engine';
import { aspectEngine } from '../aspect-engine';
import { analyzeDomain } from '../domain-engine';
import { CHART_THEMES, THEME_ORDER } from '../../components/chart/themes';
import { LANG_OPTIONS, STRINGS, type Lang } from '../../i18n/strings';
import type { BuiltChart, ChartState, Graha, TopicId, Varga } from '../types';
import { DOMAIN_DEFS } from '../domains';

const chart: ChartState = {
  ascendant: 15,
  placements: {
    Sun: 10, Moon: 95, Mars: 200, Mercury: 150, Jupiter: 260,
    Venus: 180, Saturn: 300, Rahu: 45, Ketu: 225,
  },
};

const charts: Record<Varga, BuiltChart> = buildAllVargas(chart, 'Janma');
const INPUT = { charts, aspects: [], birthISO: '1990-05-05T00:00:00Z', dateISO: '2026-10-08T00:00:00Z' };

describe('placement model', () => {
  it('Rahu/Ketu axis: partner is always exactly 180° away', () => {    for (let lon = 0; lon < 360; lon += 7.5) {
      const partner = norm360(lon + 180);
      const d = Math.abs(partner - lon) % 360;
      assert.ok(Math.abs(d - 180) < 1e-9, `${lon}`);
    }
  });

  it('aspectEngine excludes tray planets as sources and targets', () => {
    const full = aspectEngine(charts.D1);
    const excl = aspectEngine(charts.D1, { exclude: ['Jupiter', 'Saturn'] });
    assert.ok(full.some((a) => a.from === 'Jupiter'));
    assert.ok(!excl.some((a) => a.from === 'Jupiter' || a.from === 'Saturn'));
    assert.ok(!excl.some((a) => a.to === 'Jupiter' || a.to === 'Saturn'));
    assert.ok(excl.length < full.length);
  });

  it('analyzeDomain drops evidence touching excluded planets', () => {
    const base = analyzeDomain('money', { ...INPUT, aspects: aspectEngine(charts.D1) });
    const excl = analyzeDomain('money', {
      ...INPUT,
      aspects: aspectEngine(charts.D1, { exclude: ['Venus'] }),
      exclude: ['Venus'],
    });
    const mentions = (list: { affectedFactors: string[] }[]): boolean =>
      list.some((e) => e.affectedFactors.includes('Venus'));
    assert.ok(
      mentions([...base.supporting, ...base.contradicting, ...base.neutral]),
      'baseline money mentions Venus (2nd lord, own in Tula)',
    );
    for (const e of [...excl.supporting, ...excl.contradicting, ...excl.neutral]) {
      assert.ok(!e.affectedFactors.includes('Venus' as Graha), e.id);
    }
    assert.ok(excl.score !== base.score || excl.blocked, 'verdict responds to exclusion');
  });

  it('every theme defines the complete palette', () => {
    const keys = Object.keys(CHART_THEMES.classic).sort();
    assert.deepEqual([...THEME_ORDER].sort(), ['classic', 'midnight', 'sand']);
    for (const t of THEME_ORDER) {
      assert.deepEqual(Object.keys(CHART_THEMES[t]).sort(), keys, t);
      for (const k of keys) {
        assert.match(CHART_THEMES[t][k as keyof typeof CHART_THEMES.classic], /^#[0-9a-f]{6}$/i, `${t}.${k}`);
      }
    }
  });

  it('every language names every domain and labels every chrome string', () => {    const domains = Object.keys(DOMAIN_DEFS) as TopicId[];
    for (const { lang } of LANG_OPTIONS) {
      const S = STRINGS[lang as Lang];
      for (const d of domains) assert.ok(S.domainName[d]?.length > 0, `${lang}.${d}`);
      for (const k of ['guideStep1', 'guideStep2', 'tplClassic', 'lgExalted', 'trayEmpty', 'more'] as const) {
        assert.ok(S[k].length > 0, `${lang}.${k}`);
      }
    }
  });

  it('assigning a rashi to any house determines every house (Aries->6th => Scorpio lagna)', () => {
    assert.equal(lagnaRashiForHouseRashi(1, 0), 0);
    assert.equal(lagnaRashiForHouseRashi(6, 0), 7);
    assert.equal(lagnaRashiForHouseRashi(10, 3), 6);
    assert.equal(lagnaRashiForHouseRashi(12, 11), 0);
    // Degree preserved through reassignment.
    const asc = ascendantForHouseRashi(6, 0, 135.5);
    assert.ok(Math.abs(asc - 225.5) < 1e-9);
  });
});
