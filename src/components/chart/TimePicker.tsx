'use client';

import { useState } from 'react';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { ClockFace } from './ClockFace';
import { from12Hour, pad2, to12Hour } from './datetime-utils';

/** Time-only picker: readout + analog dial + AM/PM + fine steppers. */
export function TimePicker({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (h: number, mi: number) => void;
}) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const { h12, period } = to12Hour(hour);

  return (
    <div className="dt-clock">
      <div className="dt-readout" aria-live="polite">
        <button
          type="button"
          className={`dt-seg${mode === 'hours' ? ' on' : ''}`}
          onClick={() => setMode('hours')}
        >
          {h12}
        </button>
        <span aria-hidden>:</span>
        <button
          type="button"
          className={`dt-seg${mode === 'minutes' ? ' on' : ''}`}
          onClick={() => setMode('minutes')}
        >
          {pad2(minute)}
        </button>
        <span className="dt-ampm" role="group" aria-label="AM PM">
          {(['AM', 'PM'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`dt-seg sm${period === p ? ' on' : ''}`}
              aria-pressed={period === p}
              onClick={() => onChange(from12Hour(h12, p), minute)}
            >
              {p}
            </button>
          ))}
        </span>
      </div>
      <ClockFace
        hour24={hour}
        minute={minute}
        mode={mode}
        onHour={(h24) => {
          onChange(h24, minute);
          setMode('minutes');
        }}
        onMinute={(m) => onChange(hour, m)}
      />
      <div className="dt-fine">
        <button
          type="button"
          className="dt-step"
          onClick={() => onChange(hour, (minute - 1 + 60) % 60)}
          aria-label="−1 minute"
        >
          −
        </button>
        <span>{S.calTime}</span>
        <button
          type="button"
          className="dt-step"
          onClick={() => onChange(hour, (minute + 1) % 60)}
          aria-label="+1 minute"
        >
          +
        </button>
      </div>
    </div>
  );
}
