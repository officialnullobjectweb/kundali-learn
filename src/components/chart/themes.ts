// Kundali visual templates. Presentation only — geometry is shared.
// Three genuinely different designs of the same North Indian chart:
// Classic (clean light), Royal (dark gold luxury), Heritage (ivory + maroon).
// Every theme defines the full palette so no theme can render unreadably.

import type { ChartTheme } from '@/domain/types';

export interface ChartPalette {
  cell: string;
  frame: string;
  grid: string;
  rashi: string;
  planet: string;
  valid: string;
  over: string;
  target: string;
  source: string;
  selected: string;
  asc: string;
  exalted: string;
  debilitated: string;
  retro: string;
}

export interface ChartDecor {
  /** Second inner frame line. */
  doubleFrame: boolean;
  /** Serif rashi numerals. */
  serifRashi: boolean;
  /** Small diamonds on the four outer corners. */
  corners: boolean;
  /** Soft halo behind planet labels. */
  halo: boolean;
}

export const CHART_THEMES: Record<ChartTheme, ChartPalette> = {
  classic: {
    cell: '#ffffff',
    frame: '#3f3a33',
    grid: '#ddd5c4',
    rashi: '#78716c',
    planet: '#1c1917',
    valid: '#eef2ff',
    over: '#c7d2fe',
    target: '#fef3c7',
    source: '#4338ca',
    selected: '#4338ca',
    asc: '#b91c1c',
    exalted: '#15803d',
    debilitated: '#b91c1c',
    retro: '#4338ca',
  },
  midnight: {
    cell: '#211a10',
    frame: '#c9a227',
    grid: '#5c4f2e',
    rashi: '#d4af37',
    planet: '#f5ead2',
    valid: '#3a2f10',
    over: '#574410',
    target: '#5c3d0c',
    source: '#e8c15a',
    selected: '#e8c15a',
    asc: '#e0655f',
    exalted: '#7ddf9a',
    debilitated: '#f08080',
    retro: '#d3b8ff',
  },
  sand: {
    cell: '#faf4e6',
    frame: '#7f1d1d',
    grid: '#c4a97e',
    rashi: '#7f1d1d',
    planet: '#292524',
    valid: '#e3ddf2',
    over: '#c9c2e8',
    target: '#f5dfba',
    source: '#9a3412',
    selected: '#7f1d1d',
    asc: '#b91c1c',
    exalted: '#15803d',
    debilitated: '#b91c1c',
    retro: '#6d28d9',
  },
};

export const CHART_DECOR: Record<ChartTheme, ChartDecor> = {
  classic: { doubleFrame: false, serifRashi: false, corners: false, halo: false },
  midnight: { doubleFrame: true, serifRashi: true, corners: true, halo: true },
  sand: { doubleFrame: true, serifRashi: true, corners: true, halo: false },
};

export const THEME_ORDER: ChartTheme[] = ['classic', 'midnight', 'sand'];
