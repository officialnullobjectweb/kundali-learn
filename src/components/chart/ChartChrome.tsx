'use client';

import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { CHART_THEMES } from './themes';

export function Legend() {
  const lang = useChartStore((s) => s.lang);
  const theme = useChartStore((s) => s.theme);
  const S = STRINGS[lang];
  const pal = CHART_THEMES[theme];
  return (
    <div className="legend" aria-label={S.lgLabel}>
      <span style={{ color: pal.exalted }}>▲ {S.lgExalted}</span>
      <span style={{ color: pal.debilitated }}>▼ {S.lgDebilitated}</span>
      <span style={{ color: pal.retro }}>↻ {S.lgRetro}</span>
    </div>
  );
}
