'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RASHI_LORDS } from '@/domain/constants';
import type { Aspect, Bhava, BuiltChart, Graha } from '@/domain/types';
import { toDMS } from '@/domain/astro-math';
import { aspectEngine } from '@/domain/aspect-engine';
import { STRINGS, type UIStrings } from '@/i18n/strings';
import { useChartStore, type HoverTarget } from '@/state/chart-store';
import { GRAHA_ABBR } from './KundaliChart';

interface Info {
  title: string;
  /** Short by default: the 2–3 facts that matter most. */
  rows: [string, string][];
  /** Progressively disclosed under "Why this reading". */
  extra: [string, string][];
  action?: React.ReactNode;
}

/** Human-readable aspect targets for one graha. */
function aspectTargets(S: UIStrings, built: BuiltChart, aspects: Aspect[], g: Graha): string {
  const parts: string[] = [];
  for (const a of aspects) {
    if (a.from !== g) continue;
    if (typeof a.to === 'number') {
      parts.push(`${S.houseWord} ${a.to}`);
    } else {
      parts.push(`${S.graha[a.to]} (${S.houseWord} ${built.planets[a.to].bhava})`);
    }
  }
  return parts.length ? parts.join(', ') : S.empty;
}

function rowsFor(
  S: UIStrings,
  built: BuiltChart,
  aspects: Aspect[],
  target: HoverTarget,
  placed: Set<Graha>,
): Info | null {
  if (target.kind === 'graha') {
    const g = target.key as Graha;
    const p = built.planets[g];
    const varga = built.view.varga;
    const vr = p.vargaRashi[varga];
    const deg = varga === 'D1' ? p.degreeInRashi : p.vargaDegree;
    const flags = [p.isCombust ? S.combust : null, p.isRetrograde ? S.retro : null].filter(Boolean);
    return {
      title: `${S.graha[g]} · ${toDMS(deg)}`,
      rows: [
        [S.fHouse, `${S.houseWord} ${p.bhava}`],
        [S.fNakshatra, `${S.nakshatra[p.nakshatra]} ${p.pada}`],
      ],
      extra: [
        [S.fRashi, `${S.rashi[vr]} (${vr + 1})`],
        [S.fDignity, flags.length ? `${p.dignity} · ${flags.join(' · ')}` : p.dignity],
        [S.fAspects, aspectTargets(S, built, aspects, g)],
      ],
    };
  }
  if (target.kind === 'bhava') {
    const bhava = Number(target.key.split(':')[1]) as Bhava;
    const h = built.houses[bhava];
    const occupants = h.occupants.filter((g) => placed.has(g));
    const opposite = (((bhava + 5) % 12) + 1) as Bhava;
    const related = new Set<number>();
    for (const a of aspects) {
      if (typeof a.to === 'number' && a.to === bhava) {
        related.add(built.planets[a.from].bhava);
      }
      if (occupants.includes(a.from) && typeof a.to === 'number') related.add(a.to);
      if (occupants.includes(a.from) && typeof a.to !== 'number') {
        related.add(built.planets[a.to].bhava);
      }
    }
    related.delete(bhava);
    const relatedList = [...related].sort((x, y) => x - y);
    return {
      title: `${S.houseWord} ${h.bhava}`,
      rows: [
        [S.fLifeAreas, S.themes[bhava].join(', ')],
        [
          S.fOccupants,
          occupants.length ? occupants.map((o) => S.graha[o]).join(', ') : S.empty,
        ],
      ],
      extra: [
        [S.fRashi, `${S.rashi[h.rashi]} (${h.rashi + 1})`],
        [S.fLord, S.graha[h.lord]],
        [S.inOpposite, `${S.houseWord} ${opposite} · ${S.rashi[built.houses[opposite].rashi]}`],
        [S.inRelated, relatedList.length > 0 ? relatedList.map((b) => `${S.houseWord} ${b}`).join(', ') : S.empty],
      ],
    };
  }
  const rashi = Number(target.key.split(':')[1]);
  const inRashi = (Object.keys(built.planets) as Graha[]).filter(
    (g) => placed.has(g) && built.planets[g].vargaRashi[built.view.varga] === rashi,
  );
  const setHouseRashi = useChartStore.getState().setHouseRashi;
  return {
    title: `${S.rashi[rashi]} (${rashi + 1})`,
    rows: [
      [S.fOccupants, inRashi.length ? inRashi.map((g) => S.graha[g]).join(', ') : S.empty],
    ],
    extra: [[S.fLord, S.graha[RASHI_LORDS[rashi as 0]]]],
      action: (
        <button className="btn" onClick={() => setHouseRashi(1, rashi, built.view)}>
          {S.setAsAsc}
        </button>
      ),
  };
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="panel-rows">
      {rows.map(([k, v]) => (
        <div key={k} className="panel-row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ChartInfoPanel({ built }: { built: BuiltChart | null }) {
  const hover = useChartStore((s) => s.hover);
  const selected = useChartStore((s) => s.selected);
  const lang = useChartStore((s) => s.lang);
  const tray = useChartStore((s) => s.tray);
  const S = STRINGS[lang];
  const placedSet = useMemo(
    () =>
      new Set<Graha>(
        (Object.keys(built?.planets ?? {}) as Graha[]).filter((g) => !tray.includes(g)),
      ),
    [built, tray],
  );
  const aspects = useMemo(() => (built ? aspectEngine(built, { exclude: tray }) : []), [built, tray]);
  const target = hover ?? selected;
  const info = built && target ? rowsFor(S, built, aspects, target, placedSet) : null;
  const key = target ? `${hover ? 'h' : 's'}:${target.kind}:${target.key}` : 'none';
  return (
    <div className="panel">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
        >
          {!info || !built ? (
            <div className="panel-empty">{S.panelEmpty}</div>
          ) : (
            <div>
              <div className="panel-title">{info.title}</div>
              <Rows rows={info.rows} />
              {info.extra.length > 0 && (
                <details className="more">
                  <summary>{S.more}</summary>
                  <Rows rows={info.extra} />
                </details>
              )}
              {info.action}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
