'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { pad2, daysInMonth, parseLocalInput, to12Hour, toLocalInput } from './datetime-utils';

const LOCALE = { en: 'en', hinglish: 'en', hi: 'hi' } as const;

/**
 * DOB + time-of-birth picker as a modal overlay. Draft lives inside the
 * modal: Apply commits, Clear empties, dismissing discards. Value shape
 * matches datetime-local ('YYYY-MM-DDTHH:mm', local time).
 */
export function DateTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseLocalInput(value), [value]);
  const now = useMemo(() => new Date(), []);
  const [dY, setDY] = useState(parsed?.getFullYear() ?? now.getFullYear());
  const [dM, setDM] = useState(parsed?.getMonth() ?? now.getMonth());
  const [dD, setDD] = useState<number | null>(parsed ? parsed.getDate() : null);
  const [dH, setDH] = useState(parsed ? parsed.getHours() : 12);
  const [dMi, setDMi] = useState(parsed ? parsed.getMinutes() : 0);

  // Sync the draft whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    const d = parseLocalInput(value) ?? new Date();
    setDY(d.getFullYear());
    setDM(d.getMonth());
    setDD(parseLocalInput(value) ? d.getDate() : null);
    setDH(d.getHours());
    setDMi(d.getMinutes());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open ]);

  const apply = (): void => {
    if (dD === null) return;
    // Clamp: e.g. 31st picked, then moved to a 30-day month.
    const d = new Date(dY, dM, Math.min(dD, daysInMonth(dY, dM)), dH, dMi, 0, 0);
    onChange(toLocalInput(d));
    setOpen(false);
  };
  const clear = (): void => {
    onChange('');
    setOpen(false);
  };

  const sel = parseLocalInput(value);
  const shown = sel ? to12Hour(sel.getHours()) : null;
  const label = sel
    ? sel.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric' }) +
      ` · ${shown ? shown.h12 : ''}:${pad2(sel.getMinutes())} ${shown ? shown.period : ''}`
    : S.calPlaceholder;

  return (
    <div className="dt-wrap" ref={ref}>
      <button type="button" className="dt-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        {label}
        <span aria-hidden className="lang-caret">▾</span>
      </button>
      {open && (
        <div className="modal-veil" onClick={() => setOpen(false)}>
          <div
            className="modal dt-modal"
            role="dialog"
            aria-modal="true"
            aria-label={S.calPlaceholder}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dt-modal-grid">
              <DatePicker
                viewY={dY}
                viewM={dM}
                selected={dD === null ? null : { y: dY, m: dM, d: dD }}
                onView={(y, m) => {
                  setDY(y);
                  setDM(m);
                  setDD((d) => (d === null ? d : Math.min(d, daysInMonth(y, m))));
                }}
                onPick={(y, m, d) => {
                  setDY(y);
                  setDM(m);
                  setDD(d);
                }}
              />
              <TimePicker hour={dH} minute={dMi} onChange={(h, mi) => { setDH(h); setDMi(mi); }} />
            </div>
            <div className="dt-modal-foot">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const t = new Date();
                  setDY(t.getFullYear());
                  setDM(t.getMonth());
                  setDD(t.getDate());
                }}
              >
                {S.calToday}
              </button>
              <span className="dt-foot-right">
                <button type="button" className="btn ghost" onClick={clear}>
                  {S.calClear}
                </button>
                <button type="button" className="btn active" onClick={apply} disabled={dD === null}>
                  {S.calApply}
                </button>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
