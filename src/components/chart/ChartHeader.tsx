'use client';

import { useEffect, useState } from 'react';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { activeViewKey } from '@/components/chart/ChartSelector';

function ChartGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden>
      <rect x={4} y={4} width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} />
      <path d="M4 4 20 20M20 4 4 20M12 4 20 12 12 20 4 12Z" fill="none" stroke="currentColor" strokeWidth={1.2} />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.2 1.1 2.2h5c0-1 .4-1.6 1.1-2.2A6 6 0 0 0 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChartHeader({
  onOpenBook,
  onOpenAi,
  placedCount,
}: {
  onOpenBook: () => void;
  onOpenAi: () => void;
  placedCount: number;
}) {
  const view = useChartStore((s) => s.view);
  const mode = useChartStore((s) => s.mode);
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const key = activeViewKey(view);
  const [howOpen, setHowOpen] = useState(false);
  const st = useChartStore.getState();

  useEffect(() => {
    if (!howOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setHowOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [howOpen]);

  return (
    <div className="chart-head">
      <div className="chart-head-left">
        <span className="chart-head-icon" aria-hidden>
          <ChartGlyph />
        </span>
        <span>
          <strong>{S.views[key].label}</strong>
          <small>
            {S.views[key].tagline} • {S.views[key].about}
          </small>
        </span>
      </div>
      <button className="btn how-btn" onClick={() => setHowOpen(true)}>
        <span aria-hidden>▶</span> {S.howItWorks}
      </button>
      <span className="head-actions">
        <button className="btn" onClick={onOpenBook}>
          {S.bookOpen} ({placedCount}/9)
        </button>
        <button className="btn active" onClick={onOpenAi}>
          {S.qaAi}
        </button>
        {mode === 'birth' ? (
          <button className="btn ghost" onClick={() => st.enterExplore()} aria-pressed="false">
            {S.explore}
          </button>
        ) : (
          <button className="btn ghost active" onClick={() => st.exitExplore()} aria-pressed="true">
            {S.discard}
          </button>
        )}
      </span>
      {howOpen && (
        <div className="modal-veil" onClick={() => setHowOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={S.howTitle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{S.howTitle}</h3>
            <ol>
              {S.howSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <button className="btn" onClick={() => setHowOpen(false)} autoFocus>
              {S.bookClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const INSTR_KEY = 'kl-instr-dismissed';

export function InstructionCard() {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(INSTR_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);
  if (dismissed) return null;
  const hide = (): void => {
    try {
      window.localStorage.setItem(INSTR_KEY, '1');
    } catch {
      /* private mode: hide for this session only */
    }
    setDismissed(true);
  };
  return (
    <div className="instr">
      <span className="instr-icon" aria-hidden>
        <BulbIcon />
      </span>
      <div className="instr-text">
        <p>{S.instrLine1}</p>
        <p>{S.instrLine2}</p>
      </div>
      <button className="instr-close" onClick={hide} aria-label={S.instrClose}>
        ×
      </button>
    </div>
  );
}
