'use client';

import { useState } from 'react';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import {
  addMonths,
  clampYear,
  daysInMonth,
  firstWeekday,
  yearWindow,
} from './datetime-utils';

const LOCALE = { en: 'en', hinglish: 'en', hi: 'hi' } as const;

type CalView = 'days' | 'months' | 'years';

function monthName(y: number, m: number, lang: keyof typeof LOCALE): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { month: 'long', year: 'numeric' }).format(new Date(y, m, 1));
}

function monthShort(m: number, lang: keyof typeof LOCALE): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { month: 'short' }).format(new Date(2026, m, 1));
}

function weekdayNames(lang: keyof typeof LOCALE): string[] {
  const fmt = new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2026, 0, 4 + i)));
}

/**
 * Date-only calendar: drill-down title (days → months → years) for fast
 * jumps. Controlled view year/month so the parent owns the draft.
 */
export function DatePicker({
  viewY,
  viewM,
  selected,
  onView,
  onPick,
}: {
  viewY: number;
  viewM: number;
  selected: { y: number; m: number; d: number } | null;
  onView: (y: number, m: number) => void;
  onPick: (y: number, m: number, d: number) => void;
}) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const [view, setView] = useState<CalView>('days');

  const stepMonth = (delta: number): void => {
    const next = addMonths(viewY, viewM, delta);
    onView(next.year, next.month);
  };

  const onGridKey = (e: React.KeyboardEvent, day: number): void => {
    const dim = daysInMonth(viewY, viewM);
    let target: number | null = null;
    if (e.key === 'ArrowRight') target = day + 1;
    else if (e.key === 'ArrowLeft') target = day - 1;
    else if (e.key === 'ArrowDown') target = day + 7;
    else if (e.key === 'ArrowUp') target = day - 7;
    if (target === null || target < 1 || target > dim) return;
    e.preventDefault();
    (e.currentTarget.parentElement as HTMLElement | null)
      ?.querySelector<HTMLButtonElement>(`button[data-day="${target}"]`)
      ?.focus();
  };

  const dim = daysInMonth(viewY, viewM);
  const lead = firstWeekday(viewY, viewM);
  const years = yearWindow(viewY);
  const today = new Date();

  return (
    <div className="dt-date">
      <div className="dt-head">
        {/* days: step months · months: back / to years · years: travel ±12 */}
        {view === 'days' ? (
          <button type="button" className="dt-nav" onClick={() => stepMonth(-1)} aria-label="Previous month">
            ‹
          </button>
        ) : view === 'months' ? (
          <button type="button" className="dt-nav" onClick={() => setView('days')} aria-label="Back to days">
            ‹
          </button>
        ) : (
          <button type="button" className="dt-nav" onClick={() => onView(clampYear(viewY - 12), viewM)} aria-label="Previous 12 years">
            ‹‹
          </button>
        )}
        <button
          type="button"
          className="dt-title-btn"
          title={S.calPickHint}
          onClick={() => setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'months')}
        >
          {view === 'years' ? `${years[0]}–${years[years.length - 1]}` : monthName(viewY, viewM, lang)}
        </button>
        {view === 'days' ? (
          <button type="button" className="dt-nav" onClick={() => stepMonth(1)} aria-label="Next month">
            ›
          </button>
        ) : view === 'months' ? (
          <button type="button" className="dt-nav" onClick={() => setView('years')} aria-label="Choose year">
            ›
          </button>
        ) : (
          <button type="button" className="dt-nav" onClick={() => onView(clampYear(viewY + 12), viewM)} aria-label="Next 12 years">
            ››
          </button>
        )}
      </div>
      <div className="dt-hint">{S.calPickHint}</div>

      {view === 'days' && (
        <div className="dt-grid" role="row">
          {weekdayNames(lang).map((w, i) => (
            <span key={i} className="dt-dow" aria-hidden>
              {w}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`e${i}`} />
          ))}
          {Array.from({ length: dim }, (_, i) => {
            const day = i + 1;
            const isSel = !!selected && selected.y === viewY && selected.m === viewM && selected.d === day;
            const isToday = today.getFullYear() === viewY && today.getMonth() === viewM && today.getDate() === day;
            return (
              <button
                key={day}
                type="button"
                data-day={day}
                className={`dt-day${isSel ? ' sel' : ''}${isToday ? ' today' : ''}`}
                aria-pressed={isSel}
                onClick={() => onPick(viewY, viewM, day)}
                onKeyDown={(e) => onGridKey(e, day)}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}

      {view === 'months' && (
        <div className="dt-months">
          {Array.from({ length: 12 }, (_, m) => (
            <button
              key={m}
              type="button"
              className={`dt-cell${m === viewM ? ' sel' : ''}`}
              onClick={() => {
                onView(viewY, m);
                setView('days');
              }}
            >
              {monthShort(m, lang)}
            </button>
          ))}
        </div>
      )}

      {view === 'years' && (
        <div className="dt-months">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className={`dt-cell${y === viewY ? ' sel' : ''}`}
              onClick={() => {
                onView(y, viewM);
                setView('months');
              }}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
