// Book assembly: all domain analyses -> one ordered, readable chart book.
// Pure assembly over tested engines; every chapter keeps its evidence IDs,
// so the whole book remains traceable. No new astrology is computed here.

import { interpretAnalysis } from './interpretation-engine';
import { DOMAIN_DEFS } from './domains';
import { degreeInRashi, norm360 } from './astro-math';
import type { Lang } from '../i18n/strings';
import type { BuiltChart, DomainAnalysis, Interpretation, TopicId } from './types';

export interface BookCover {
  name: string;  ascendantRashi: number;
  ascendantDegree: number;
  moonRashi: number;
  moonDegree: number;
  moonNakshatra: number;
  moonPada: number;
  placedCount: number;
  totalCount: number;
}

export interface BookChapter {
  domain: TopicId;
  interpretation: Interpretation;
}

export interface ChartBook {
  cover: BookCover;
  chapters: BookChapter[];
}

/** One printable unit. The UI renders section subheads; text is final. */
export interface BookBlock {
  chapter: TopicId;
  section: 'title' | 'lead' | 'body' | 'pos' | 'neg' | 'conf' | 'tech';
  text: string;
}

/**
 * Flatten chapters into fixed-size pages so every page renders completely —
 * nothing is ever cropped or scrolled away inside the book.
 */
export function paginateBook(book: ChartBook, maxBlocksPerPage = 6): BookBlock[][] {
  const blocks: BookBlock[] = [];
  for (const ch of book.chapters) {
    const i = ch.interpretation;
    blocks.push({ chapter: ch.domain, section: 'title', text: `${i.headline} — ${i.score}/100` });
    for (const s of i.shortExplanation) blocks.push({ chapter: ch.domain, section: 'lead', text: s.text });
    for (const s of i.whyThisHappened) blocks.push({ chapter: ch.domain, section: 'body', text: s.text });
    for (const s of i.supporting) blocks.push({ chapter: ch.domain, section: 'pos', text: s.text });
    for (const s of i.contradicting) blocks.push({ chapter: ch.domain, section: 'neg', text: s.text });
    for (const s of i.confidenceNote) blocks.push({ chapter: ch.domain, section: 'conf', text: s.text });
    for (const s of i.technical) blocks.push({ chapter: ch.domain, section: 'tech', text: s.text });
  }
  const pages: BookBlock[][] = [];
  for (let k = 0; k < blocks.length; k += maxBlocksPerPage) {
    pages.push(blocks.slice(k, k + maxBlocksPerPage));
  }
  return pages;
}

export function buildBook(
  analyses: Record<TopicId, DomainAnalysis>,
  d1: BuiltChart,
  ascendantLongitude: number,
  placedCount: number,
  lang: Lang = 'en',
  name = '',
): ChartBook {
  const moon = d1.planets.Moon;
  const chapters = (Object.keys(DOMAIN_DEFS) as TopicId[]).map((domain) => ({
    domain,
    interpretation: interpretAnalysis(analyses[domain], lang),
  }));
  return {
    cover: {
      name,
      ascendantRashi: d1.houses[1].rashi,
      ascendantDegree: degreeInRashi(norm360(ascendantLongitude)),
      moonRashi: moon.rashi,
      moonDegree: moon.degreeInRashi,
      moonNakshatra: moon.nakshatra,
      moonPada: moon.pada,
      placedCount,
      totalCount: 9,
    },
    chapters,
  };
}
