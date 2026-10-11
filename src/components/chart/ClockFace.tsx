'use client';

import { from12Hour, pad2, to12Hour } from './datetime-utils';

const CX = 110;
const CY = 110;
const R = 84;

function pos(i: number, count = 12): { x: number; y: number } {
  const a = ((i / count) * 2 * Math.PI - Math.PI / 2);
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
}

/**
 * Analog clock dial. Hours mode shows 1–12, minutes mode 00–55 in steps
 * of 5 (± steppers below reach every minute). Selecting an hour flips to
 * minutes automatically.
 */
export function ClockFace({
  hour24,
  minute,
  mode,
  onHour,
  onMinute,
}: {
  hour24: number;
  minute: number;
  mode: 'hours' | 'minutes';
  onHour: (h24: number) => void;
  onMinute: (m: number) => void;
}) {
  const { h12, period } = to12Hour(hour24);
  const active = mode === 'hours' ? h12 : Math.round(minute / 5) * 5 % 60;
  const handTo = mode === 'hours' ? h12 % 12 : Math.floor(active / 5);

  return (
    <svg viewBox="0 0 220 220" className="clock-face" role="group" aria-label="clock">
      <circle cx={CX} cy={CY} r={104} className="clock-disc" />
      {Array.from({ length: 12 }, (_, i) => {
        const p = pos(i);
        const val = mode === 'hours' ? (i === 0 ? 12 : i) : i * 5;
        const isOn = val === active;
        const label = mode === 'hours' ? String(val) : pad2(val);
        return (
          <g key={i}>
            {isOn && <circle cx={p.x} cy={p.y} r={17} className="clock-sel" />}
            <text
              x={p.x}
              y={p.y + 5}
              textAnchor="middle"
              className={`clock-num${isOn ? ' on' : ''}`}
              fontSize={mode === 'hours' ? 15 : 12}
            >
              {label}
            </text>
            <circle
              cx={p.x}
              cy={p.y}
              r={19}
              className="clock-hit"
              onClick={() => {
                if (mode === 'hours') onHour(from12Hour(val, period));
                else onMinute(val);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (mode === 'hours') onHour(from12Hour(val, period));
                  else onMinute(val);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={label}
            />
          </g>
        );
      })}
      {(() => {
        const h = pos(handTo);
        return <line x1={CX} y1={CY} x2={h.x} y2={h.y} className="clock-hand" />;
      })()}
      <circle cx={CX} cy={CY} r={5} className="clock-pin" />
    </svg>
  );
}
