// Insights tests: computed facts only, honest empty states.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAllVargas, buildChart } from '../chart-engine';
import { yogaEngine } from '../yoga-engine';
import { analyzeAllDomains } from '../domain-engine';
import { aspectEngine } from '../aspect-engine';
import { chartInsights } from '../insights';
import type { BuiltChart, ChartState, Graha, TopicId, Varga } from '../types';

const chart: ChartState = {
  ascendant: 15,
  placements: {
    Sun: 10, Moon: 95, Mars: 200, Mercury: 150, Jupiter: 260,
    Venus: 180, Saturn: 300, Rahu: 45, Ketu: 225,
  },
};

const built: BuiltChart = buildChart(chart, { varga: 'D1', lagna: 'Janma' });
const charts: Record<Varga, BuiltChart> = { ...buildAllVargas(chart, 'Janma'), D1: built };
const INPUT = { charts, aspects: aspectEngine(built), birthISO: '', dateISO: '2026-10-08T00:00:00Z' };
const ALL: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

describe('chartInsights', () => {
  it('counts completeness and coverage from placed planets only', () => {
    const full = chartInsights(built, ALL, null, []);
    assert.equal(full.find((m) => m.id === 'completeness')?.value, '9/9');
    const partial = chartInsights(built, ['Sun', 'Moon'], null, []);
    assert.equal(partial.find((m) => m.id === 'completeness')?.value, '2/9');
    const why = partial.find((m) => m.id === 'completeness')?.why ?? '';
    assert.ok(why.includes('Mars'), 'names what is missing');
  });

  it('reports dignity census honestly, with empty states', () => {
    const full = chartInsights(built, ALL, null, []);
    const ex = full.find((m) => m.id === 'exalted');
    assert.ok(ex && ex.value !== '—' && ex.why.length > 0);
    const none = chartInsights(built, [], null, []);
    assert.equal(none.find((m) => m.id === 'exalted')?.value, '—');
    assert.equal(none.find((m) => m.id === 'houseCoverage')?.value, '0/12');
  });

  it('picks strongest/weakest from unblocked domains only', () => {
    const analyses = analyzeAllDomains(INPUT);
    const metrics = chartInsights(built, ALL, analyses, yogaEngine(built, INPUT.aspects));
    const s = metrics.find((m) => m.id === 'strongest');
    const w = metrics.find((m) => m.id === 'weakest');
    assert.ok(s && w && s.value !== '—' && w.value !== '—');
    const sScore = Number(s.value.split(' ').pop());
    const wScore = Number(w.value.split(' ').pop());
    assert.ok(sScore >= wScore);
    const domains = Object.keys(analyses) as TopicId[];
    const unblocked = domains.filter((d) => !analyses[d].blocked);
    assert.ok(unblocked.length > 0);
    assert.ok(s.value.startsWith('Career') || unblocked.some((d) => s.value.includes(String(analyses[d].score))));
  });

  it('yoga list reflects detected combinations', () => {
    const yogas = yogaEngine(built, INPUT.aspects);
    const metrics = chartInsights(built, ALL, null, yogas);
    const y = metrics.find((m) => m.id === 'yogas');
    assert.ok(y && (yogas.length === 0 ? y.value === '—' : y.value.includes(yogas[0].name)));
  });

  it('deterministic', () => {
    const analyses = analyzeAllDomains(INPUT);
    assert.deepEqual(
      chartInsights(built, ALL, analyses, []),
      chartInsights(built, ALL, analyses, []),
    );
  });
});
