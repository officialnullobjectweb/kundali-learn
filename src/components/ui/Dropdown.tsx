'use client';

// Generic dropdown reusing the app's own menu styling (same look and
// keyboard/outside-click behaviour as the language menu).
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Dropdown({
  value,
  options,
  onPick,
  ariaLabel,
  icon,
}: {
  value: string;
  options: { value: string; label: string }[];
  onPick: (value: string) => void;
  ariaLabel: string;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div className="lang-wrap" ref={ref}>
      <button
        className="lang-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {icon}
        <span className="lang-current">{current?.label ?? value}</span>
        <span aria-hidden className="lang-caret">▾</span>
      </button>
      {open && (
        <div className="lang-menu" role="menu">
          {options.map((o) => (
            <button
              key={o.value}
              role="menuitemradio"
              aria-checked={o.value === value}
              className={`lang-item${o.value === value ? ' active' : ''}`}
              onClick={() => {
                onPick(o.value);
                setOpen(false);
              }}
            >
              {o.label}
              {o.value === value && <span aria-hidden> ✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
