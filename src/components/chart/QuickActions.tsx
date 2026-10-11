'use client';

import { STRINGS } from '@/i18n/strings';
import { SAMPLE_BIRTH, useChartStore } from '@/state/chart-store';

export function QuickActions({ onOpenBook, onOpenAi, placedCount }: { onOpenBook: () => void; onOpenAi: () => void; placedCount: number }) {
  const mode = useChartStore((s) => s.mode);
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const st = useChartStore.getState();
  return (
    <div className="qa">
      <div className="tray-title">{S.qaTitle}</div>
      <div className="qa-grid">
        <button className="btn" onClick={() => st.loadBirth(SAMPLE_BIRTH)}>
          {S.reset}
        </button>
        <button className="btn" onClick={() => st.autoFill()}>
          {S.qaAutoFill}
        </button>
        {mode === 'birth' ? (
          <button className="btn" onClick={() => st.enterExplore()} aria-pressed="false">
            {S.explore}
          </button>
        ) : (
          <button className="btn active" onClick={() => st.exitExplore()} aria-pressed="true">
            {S.discard}
          </button>
        )}
        <button className="btn" onClick={onOpenBook}>
          {S.bookOpen} ({placedCount}/9)
        </button>
        <button className="btn active" onClick={onOpenAi}>
          {S.qaAi}
        </button>
      </div>
      {mode === 'explore' && <div className="badge qa-badge">{S.exploring}</div>}
    </div>
  );
}
