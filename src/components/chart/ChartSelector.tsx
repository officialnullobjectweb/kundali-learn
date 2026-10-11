'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ChartView } from '@/domain/types';
import type { ViewKey } from '@/i18n/strings';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';

const OPTIONS: { key: ViewKey; view: ChartView }[] = [
  { key: 'D1', view: { varga: 'D1', lagna: 'Janma' } },
  { key: 'CHANDRA', view: { varga: 'D1', lagna: 'Chandra' } },
  { key: 'D4', view: { varga: 'D4', lagna: 'Janma' } },
  { key: 'D6', view: { varga: 'D6', lagna: 'Janma' } },
  { key: 'D7', view: { varga: 'D7', lagna: 'Janma' } },
  { key: 'D9', view: { varga: 'D9', lagna: 'Janma' } },
  { key: 'D10', view: { varga: 'D10', lagna: 'Janma' } },
  { key: 'D60', view: { varga: 'D60', lagna: 'Janma' } },
];

function DotGrid({ cols, rows }: { cols: number; rows: number }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      {Array.from({ length: cols * rows }, (_, i) => (
        <circle
          key={i}
          cx={12 + ((i % cols) - (cols - 1) / 2) * 5}
          cy={12 + (Math.floor(i / cols) - (rows - 1) / 2) * 5}
          r={1.6}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

function ViewIcon({ viewKey }: { viewKey: ViewKey }) {
  if (viewKey === 'CHANDRA') {
    return (
      <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <path
          d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (viewKey === 'D4') return <DotGrid cols={2} rows={2} />;
  if (viewKey === 'D6') return <DotGrid cols={3} rows={2} />;
  if (viewKey === 'D7') {
    return (
      <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <circle cx={12} cy={12} r={1.8} fill="currentColor" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * 2 * Math.PI - Math.PI / 2;
          return <circle key={i} cx={12 + 6.5 * Math.cos(a)} cy={12 + 6.5 * Math.sin(a)} r={1.6} fill="currentColor" />;
        })}
      </svg>
    );
  }
  if (viewKey === 'D60') return <DotGrid cols={4} rows={4} />;
  if (viewKey === 'D9') {
    return (
      <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={6 + (i % 3) * 6} cy={6 + Math.floor(i / 3) * 6} r={1.8} fill="currentColor" />
        ))}
      </svg>
    );
  }
  if (viewKey === 'D10') {
    return (
      <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        {[5, 9, 13, 17].map((y, i) => (
          <line key={y} x1={4} y1={y} x2={20 - i * 3} y2={y} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path d="M12 3 21 12 12 21 3 12Z" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

export function activeViewKey(view: ChartView): ViewKey {
  const found = OPTIONS.find((o) => o.view.varga === view.varga && o.view.lagna === view.lagna);
  return found ? found.key : 'D1';
}

export function ChartSelector() {
  const view = useChartStore((s) => s.view);
  const lang = useChartStore((s) => s.lang);
  const setView = useChartStore((s) => s.setView);
  const S = STRINGS[lang];
  const active = activeViewKey(view);

  return (
    <div className="view-block">
      <div className="view-grid" role="group" aria-label="Chart view">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            className={`view-card${active === o.key ? ' active' : ''}`}
            onClick={() => setView(o.view)}
            aria-pressed={active === o.key}
          >
            <ViewIcon viewKey={o.key} />
            <span className="view-label">{S.views[o.key].label}</span>
            <span className="view-tag">{S.views[o.key].tagline}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={active + lang}
          className="view-about"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {S.views[active].about}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
