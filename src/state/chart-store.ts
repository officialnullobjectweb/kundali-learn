// Chart store. Zustand; thin dispatch only — all astrology math lives in src/domain/*.
//
// Placement model: every graha has a stored longitude, but only planets NOT
// in `tray` render on the chart and feed analysis. Dragging from the tray
// places a planet; the tray accepts drops to unplace. Birth is frozen and is
// never written by explore actions; exitExplore restores the tray snapshot.

import type { ChartState, ChartTheme, ChartView, Graha, TopicId } from '@/domain/types';
import type { Lang } from '@/i18n/strings';

export type Mode = 'birth' | 'explore';

export interface HoverTarget {
  kind: 'graha' | 'rashi' | 'bhava';
  key: string; // e.g. 'Jupiter' | 'rashi:9' | 'bhava:10'
}

export const ALL_GRAHAS: Graha[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

export interface ChartStore {
  birth: ChartState | null;
  draft: ChartState | null;
  mode: Mode;
  view: ChartView;
  topic: TopicId;
  hover: HoverTarget | null;
  selected: HoverTarget | null;
  lang: Lang;
  /** App chrome theme (independent of kundali chart templates). */
  appTheme: 'light' | 'dark';
  /** Planets staged in the tray (not on the chart, excluded from analysis). */
  tray: Graha[];
  savedTray: Graha[] | null;
  /** True once the user has moved the ascendant (guides step 1). */
  ascMoved: boolean;
  theme: ChartTheme;

  loadBirth: (chart: ChartState) => void;
  enterExplore: () => void;
  /** Discards the draft and restores the tray. Birth is never written. */
  exitExplore: () => void;
  /** Reset the draft back to a copy of birth, staying in explore mode. */
  resetDraft: () => void;
  /** Birth moment (ISO) for timing; null = timing unknown. */
  birthISO: string | null;
  setBirthISO: (iso: string | null) => void;
  /** Birth place snapshot (so profiles/prompts never re-ask for it). */
  birthPlace: { label: string; lat: number; lon: number } | null;
  setBirthPlace: (p: { label: string; lat: number; lon: number } | null) => void;
  /** Native's name for the reading cover; empty = unnamed. */
  nativeName: string;
  setNativeName: (name: string) => void;
  /** Real retrograde map from the ephemeris; null = convention defaults. */
  retro: Partial<Record<Graha, boolean>> | null;
  setRetro: (retro: Partial<Record<Graha, boolean>> | null) => void;

  /** Drag planet -> set absolute sidereal longitude (places from tray). */
  movePlanet: (graha: Graha, longitude: number) => void;
  /**
   * Move + keep the Rahu/Ketu 180° axis: placing one places its partner.
   * targetRashi is interpreted in the given view's varga (D1 = exact move).
   */
  movePlanetWithAxis: (graha: Graha, targetRashi: RashiIndex, view?: ChartView) => void;
  /** Stage from tray without moving (keeps stored longitude). */
  placePlanet: (graha: Graha) => void;
  /** Return a planet to the tray (removes from chart + analysis). */
  unplacePlanet: (graha: Graha) => void;
  /** Place every planet at its stored longitude (demo fill). */
  autoFill: () => void;
  /**
   * Assign a rashi to ANY house; every other house follows automatically.
   * E.g. Aries to house 6 -> lagna becomes Scorpio. Ascendant degree kept.
   * rashi is interpreted in the given view's varga (D1 = exact move).
   */
  setHouseRashi: (bhava: number, rashi: number, view?: ChartView) => void;
  /** Degree editor -> set degree-within-rashi for a graha. */
  setDegree: (graha: Graha, degreeInRashi: number) => void;

  setView: (view: Partial<ChartView>) => void;
  setTopic: (topic: TopicId) => void;
  setHover: (hover: HoverTarget | null) => void;
  setSelected: (selected: HoverTarget | null) => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: ChartTheme) => void;
  setAppTheme: (theme: 'light' | 'dark') => void;
}

/** Selector: which chart the UI reads. `birth` unless exploring with a draft. */
export const selectActiveChart = (s: ChartStore): ChartState | null =>
  s.mode === 'explore' && s.draft ? s.draft : s.birth;

export const selectBuiltInput = (s: ChartStore): { chart: ChartState; view: ChartView } | null => {
  const chart = selectActiveChart(s);
  return chart ? { chart, view: s.view } : null;
};

import { create } from 'zustand';
import {
  ascendantForHouseRashi,
  lagnaRashiForHouseRashi,
  moveToRashi,
  norm360,
  rashiFromLongitude,
} from '@/domain/astro-math';
import { moveToVargaRashi } from '@/domain/varga-engine';
import type { Bhava, RashiIndex } from '@/domain/types';

/** Deterministic sample longitudes (staging defaults; all start in the tray). */
export const SAMPLE_BIRTH: ChartState = {
  ascendant: 135.5,
  placements: {
    Sun: 135.2,
    Moon: 95.4,
    Mars: 210.8,
    Mercury: 150.1,
    Jupiter: 260.3,
    Venus: 180.6,
    Saturn: 300.9,
    Rahu: 45.0,
    Ketu: 225.0,
  },
};

const cloneChart = (c: ChartState): ChartState => ({
  ascendant: c.ascendant,
  placements: { ...c.placements },
});

/** Deep-freeze so no code path can mutate a stored chart in place. */
const frozenChart = (c: ChartState): ChartState =>
  Object.freeze({
    ascendant: c.ascendant,
    placements: Object.freeze({ ...c.placements }),
  }) as ChartState;

function patchActive(s: ChartStore, fn: (c: ChartState) => ChartState): Partial<ChartStore> {
  if (s.mode === 'explore') {
    const base = s.draft ?? s.birth;
    if (!base) return {};
    return { draft: frozenChart(fn(base)) };
  }
  if (!s.birth) return {};
  return { birth: frozenChart(fn(s.birth)) };
}

const without = (tray: Graha[], g: Graha): Graha[] => tray.filter((x) => x !== g);

export const useChartStore = create<ChartStore>()((set) => ({
  birth: frozenChart(SAMPLE_BIRTH),
  draft: null,
  mode: 'birth',
  view: { varga: 'D1', lagna: 'Janma' },
  topic: 'general',
  hover: null,
  selected: null,
  lang: 'en',
  appTheme: 'light',
  tray: [...ALL_GRAHAS],
  savedTray: null,
  ascMoved: false,
  theme: 'sand',

  loadBirth: (chart) =>
    set({ birth: frozenChart(chart), draft: null, mode: 'birth', tray: [...ALL_GRAHAS], savedTray: null, ascMoved: false, retro: null, nativeName: '', birthPlace: null }),
  enterExplore: () =>
    set((s) =>
      s.birth
        ? { mode: 'explore', draft: cloneChart(s.birth), savedTray: [...s.tray] }
        : { mode: 'explore' },
    ),
  exitExplore: () => set((s) => ({ draft: null, mode: 'birth', tray: s.savedTray ?? [...ALL_GRAHAS], savedTray: null })),
  resetDraft: () =>
    set((s) => (s.birth ? { draft: cloneChart(s.birth), tray: [...(s.savedTray ?? ALL_GRAHAS)] } : {})),
  birthISO: null,
  setBirthISO: (birthISO) => set({ birthISO }),
  birthPlace: null,
  setBirthPlace: (birthPlace) => set({ birthPlace }),
  nativeName: '',
  setNativeName: (nativeName) => set({ nativeName }),
  retro: null,
  setRetro: (retro) => set({ retro }),

  movePlanet: (graha, longitude) =>
    set((s) => ({
      ...patchActive(s, (c) => ({
        ...c,
        placements: { ...c.placements, [graha]: norm360(longitude) },
      })),
      tray: without(s.tray, graha),
    })),
  movePlanetWithAxis: (graha, targetRashi, view?) =>
    set((s) => {
      const chart = selectActiveChart(s);
      const varga = view?.varga ?? 'D1';
      const cur = chart ? norm360(chart.placements[graha]) : 0;
      const lon = varga === 'D1' ? moveToRashi(cur, targetRashi) : moveToVargaRashi(cur, targetRashi, varga);
      const partner = graha === 'Rahu' ? 'Ketu' : graha === 'Ketu' ? 'Rahu' : null;
      const extra = partner ? { [partner]: norm360(lon + 180) } : {};
      const placed = partner ? [graha, partner] : [graha];
      return {
        ...patchActive(s, (c) => ({
          ...c,
          placements: { ...c.placements, [graha]: lon, ...extra },
        })),
        tray: s.tray.filter((x) => !placed.includes(x)),
      };
    }),
  placePlanet: (graha) => set((s) => ({ tray: without(s.tray, graha) })),
  unplacePlanet: (graha) =>
    set((s) => (s.tray.includes(graha) ? {} : { tray: [...s.tray, graha] })),
  autoFill: () => set({ tray: [] }),
  setHouseRashi: (bhava, rashi, view?) =>
    set((s) => {
      if (!Number.isInteger(bhava) || bhava < 1 || bhava > 12) return {};
      if (!Number.isInteger(rashi) || rashi < 0 || rashi > 11) return {};
      const varga = view?.varga ?? 'D1';
      return {
        ...patchActive(s, (c) => ({
          ...c,
          ascendant:
            varga === 'D1'
              ? ascendantForHouseRashi(bhava as Bhava, rashi as RashiIndex, c.ascendant)
              : moveToVargaRashi(
                  c.ascendant,
                  lagnaRashiForHouseRashi(bhava as Bhava, rashi as RashiIndex),
                  varga,
                ),
        })),
        ascMoved: true,
      };
    }),
  setDegree: (graha, degree) =>
    set((s) => {
      if (!Number.isFinite(degree) || degree < 0 || degree >= 30) return {};
      return {
        ...patchActive(s, (c) => {
          const r = rashiFromLongitude(norm360(c.placements[graha]));
          return { ...c, placements: { ...c.placements, [graha]: r * 30 + degree } };
        }),
        tray: without(s.tray, graha),
      };
    }),

  setView: (view) => set((s) => ({ view: { ...s.view, ...view } })),
  setTopic: (topic) => set({ topic }),
  setHover: (hover) => set({ hover }),
  setSelected: (selected) => set({ selected }),
  setLang: (lang) => set({ lang }),
  setTheme: (theme) => set({ theme }),
  setAppTheme: (appTheme) => set({ appTheme }),
}));
