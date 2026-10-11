'use client';

import { useState } from 'react';
import type { ChartTheme, ChartView } from '@/domain/types';
import type { ViewKey } from '@/i18n/strings';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { THEME_ORDER, CHART_THEMES } from '@/components/chart/themes';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { LanguageMenu } from '../ui/LanguageMenu';

const TABS: { key: ViewKey; short: string; view: ChartView }[] = [
  { key: 'D1', short: 'D1', view: { varga: 'D1', lagna: 'Janma' } },
  { key: 'CHANDRA', short: 'Chandra', view: { varga: 'D1', lagna: 'Chandra' } },
  { key: 'D4', short: 'D4', view: { varga: 'D4', lagna: 'Janma' } },
  { key: 'D6', short: 'D6', view: { varga: 'D6', lagna: 'Janma' } },
  { key: 'D7', short: 'D7', view: { varga: 'D7', lagna: 'Janma' } },
  { key: 'D9', short: 'D9', view: { varga: 'D9', lagna: 'Janma' } },
  { key: 'D10', short: 'D10', view: { varga: 'D10', lagna: 'Janma' } },
  { key: 'D60', short: 'D60', view: { varga: 'D60', lagna: 'Janma' } },
];

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden>
      <path
        d="M12 2.5 14.3 9.2 21.5 9.2 15.9 13.3 17.8 20 12 16.1 6.2 20 8.1 13.3 2.5 9.2 9.7 9.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <circle cx={12} cy={12} r={2.2} fill="currentColor" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={17} height={17} aria-hidden>
      <circle cx={12} cy={12} r={4.4} fill="none" stroke="currentColor" strokeWidth={1.8} />
      <g stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <line x1={12} y1={2.5} x2={12} y2={5.5} />
        <line x1={12} y1={18.5} x2={12} y2={21.5} />
        <line x1={2.5} y1={12} x2={5.5} y2={12} />
        <line x1={18.5} y1={12} x2={21.5} y2={12} />
        <line x1={5.3} y1={5.3} x2={7.4} y2={7.4} />
        <line x1={16.6} y1={16.6} x2={18.7} y2={18.7} />
        <line x1={5.3} y1={18.7} x2={7.4} y2={16.6} />
        <line x1={16.6} y1={7.4} x2={18.7} y2={5.3} />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={17} height={17} aria-hidden>
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

export function Header({ onOpenAi }: { onOpenAi: () => void }) {
  const view = useChartStore((s) => s.view);
  const setView = useChartStore((s) => s.setView);
  const lang = useChartStore((s) => s.lang);
  const appTheme = useChartStore((s) => s.appTheme);
  const setAppTheme = useChartStore((s) => s.setAppTheme);
  const theme = useChartStore((s) => s.theme);
  const setTheme = useChartStore((s) => s.setTheme);
  const S = STRINGS[lang];
  const [settingsOpen, setSettingsOpen] = useState(false);
  const active = TABS.find((t) => t.view.varga === view.varga && t.view.lagna === view.lagna)?.key ?? 'D1';
  const themeNames: Record<ChartTheme, string> = {
    classic: S.tplClassic,
    midnight: S.tplMidnight,
    sand: S.tplSand,
  };
  const cycleTheme = (): void => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
    setTheme(next);
  };
  const dark = appTheme === 'dark';

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-icon" aria-hidden>
          <StarIcon />
        </span>
        <span className="brand-text">
          <strong>{S.title}</strong>
          <small>{S.tagline}</small>
        </span>
      </div>
      <nav className="chartnav" aria-label="Chart type">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`chartnav-btn${active === t.key ? ' active' : ''}`}
            aria-pressed={active === t.key}
            title={S.views[t.key].label}
            onClick={() => setView(t.view)}
          >
            {t.short}
          </button>
        ))}
      </nav>
      <div className="topbar-right">
        <button
          className="icon-btn gear-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label={S.setTitle}
          title={S.setTitle}
        >
          <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
            <circle cx={12} cy={12} r={3.2} fill="none" stroke="currentColor" strokeWidth={1.8} />
            <path
              d="M19.4 13.5c.05-.5.05-1 .05-1.5s0-1-.05-1.5l2-1.5-2-3.4-2.3 1a8 8 0 0 0-2.6-1.5L14 2h-4l-.5 2.6a8 8 0 0 0-2.6 1.5l-2.3-1-2 3.4 2 1.5c-.05.5-.05 1-.05 1.5s0 1 .05 1.5l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 2.6 1.5L10 22h4l.5-2.6a8 8 0 0 0 2.6-1.5l2.3 1 2-3.4-2-1.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          className="style-cycle"
          onClick={cycleTheme}
          title={`${S.tplLabel}: ${themeNames[theme]}`}
          aria-label={`${S.tplLabel}: ${themeNames[theme]}`}
        >
          <span
            className="tpl-dot"
            style={{ background: CHART_THEMES[theme].cell, borderColor: CHART_THEMES[theme].grid }}
          />
          {themeNames[theme]}
        </button>
        <LanguageMenu />
        <button
          className="theme-switch"
          role="switch"
          aria-checked={dark}
          onClick={() => setAppTheme(dark ? 'light' : 'dark')}
          aria-label={S.themeToggle}
          title={S.themeToggle}
        >
          <span className={`ts-icon${!dark ? ' on' : ''}`} aria-hidden>
            <SunIcon />
          </span>
          <span className="ts-knob-track" aria-hidden>
            <span className="ts-knob" />
          </span>
          <span className={`ts-icon${dark ? ' on' : ''}`} aria-hidden>
            <MoonIcon />
          </span>
        </button>
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} onOpenAi={onOpenAi} />}
    </header>
  );
}
