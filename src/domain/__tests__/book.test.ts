// Book tests: complete chapters, traceable sentences, honest cover.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAllVargas } from '../chart-engine';
import { aspectEngine } from '../aspect-engine';
import { collectEvidence } from '../rules';
import { analyzeAllDomains } from '../domain-engine';
import { verifyInterpretation } from '../interpretation-engine';
import { buildBook, paginateBook } from '../book';
import { DOMAIN_DEFS } from '../domains';
import type { BuiltChart, ChartState, TopicId, Varga } from '../types';

const chart: ChartState = {
  ascendant: 135.5,
  placements: {
    Sun: 135.2, Moon: 95.4, Mars: 210.8, Mercury: 150.1, Jupiter: 260.3,
    Venus: 180.6, Saturn: 300.9, Rahu: 45.0, Ketu: 225.0,
  },
};

const charts: Record<Varga, BuiltChart> = buildAllVargas(chart, 'Janma');
const INPUT = { charts, aspects: aspectEngine(charts.D1), birthISO: '', dateISO: '2026-10-08T00:00:00Z' };
const pool = collectEvidence({ charts, aspects: aspectEngine(charts.D1) });

describe('buildBook', () => {
  it('covers every domain with traceable chapters and an honest cover', () => {
    const book = buildBook(analyzeAllDomains(INPUT), charts.D1, chart.ascendant, 9);
    assert.equal(book.chapters.length, Object.keys(DOMAIN_DEFS).length);
    assert.deepEqual(
      book.chapters.map((c) => c.domain).sort(),
      (Object.keys(DOMAIN_DEFS) as TopicId[]).sort(),
    );
    for (const ch of book.chapters) {
      assert.equal(ch.interpretation.topic, ch.domain);
      if (!ch.interpretation.blocked) {
        assert.deepEqual(verifyInterpretation(ch.interpretation, pool), [], ch.domain);
      }
    }
    assert.equal(book.cover.ascendantRashi, 4); // 135.5° = Simha
    assert.ok(Math.abs(book.cover.ascendantDegree - 15.5) < 1e-9);
    assert.equal(book.cover.moonRashi, 3);
    assert.equal(book.cover.placedCount, 9);
    assert.equal(book.cover.totalCount, 9);
  });

  it('partial placement is reported, not hidden', () => {
    const book = buildBook(analyzeAllDomains(INPUT), charts.D1, chart.ascendant, 4);
    assert.equal(book.cover.placedCount, 4);
  });

  it('deterministic', () => {
    const a = buildBook(analyzeAllDomains(INPUT), charts.D1, chart.ascendant, 9);
    const b = buildBook(analyzeAllDomains(INPUT), charts.D1, chart.ascendant, 9);
    assert.deepEqual(a, b);
  });

  it('paginates without loss, order, or overflow', () => {
    const book = buildBook(analyzeAllDomains(INPUT), charts.D1, chart.ascendant, 9);
    for (const size of [5, 7, 12]) {
      const pages = paginateBook(book, size);
      assert.ok(pages.length > 1, 'multi-page book');
      const flat = pages.flat();
      const expected = book.chapters.flatMap((ch) => [
        ...ch.interpretation.shortExplanation.map((s) => s.text),
        ...ch.interpretation.whyThisHappened.map((s) => s.text),
        ...ch.interpretation.supporting.map((s) => s.text),
        ...ch.interpretation.contradicting.map((s) => s.text),
        ...ch.interpretation.confidenceNote.map((s) => s.text),
        ...ch.interpretation.technical.map((s) => s.text),
      ]);
      // Title blocks embed "headline — score/100"; headlines checked below.
      const texts = flat.map((b) => b.text);
      for (const t of expected) {
        assert.ok(texts.some((x) => x === t || x.startsWith(t + ' — ')), `kept: ${t.slice(0, 40)}`);
      }
      for (const page of pages) assert.ok(page.length <= size, 'page fits');
      const titles = flat.filter((b) => b.section === 'title');
      assert.equal(titles.length, book.chapters.length);
      for (const t of titles) assert.match(t.text, / — \d+\/100$/);
    }
  });
});
