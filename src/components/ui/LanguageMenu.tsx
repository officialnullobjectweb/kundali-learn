'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LANG_OPTIONS, type Lang } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <circle cx={12} cy={12} r={9} fill="none" stroke="currentColor" strokeWidth={1.8} />
      <ellipse cx={12} cy={12} rx={4} ry={9} fill="none" stroke="currentColor" strokeWidth={1.4} />
      <line x1={3} y1={12} x2={21} y2={12} stroke="currentColor" strokeWidth={1.4} />
      <line x1={4.5} y1={7.5} x2={19.5} y2={7.5} stroke="currentColor" strokeWidth={1.2} />
      <line x1={4.5} y1={16.5} x2={19.5} y2={16.5} stroke="currentColor" strokeWidth={1.2} />
    </svg>
  );
}

export function LanguageMenu() {
  const lang = useChartStore((s) => s.lang);
  const setLang = useChartStore((s) => s.setLang);
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
  }, [open ]);

  const pick = (l: Lang) => {
    setLang(l);
    setOpen(false);
  };

  return (
    <div className="lang-wrap" ref={ref}>
      <button
        className="lang-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change language"
        title={LANG_OPTIONS.find((o) => o.lang === lang)?.label}
      >
        <GlobeIcon />
        <span className="lang-current">{LANG_OPTIONS.find((o) => o.lang === lang)?.label}</span>
        <span aria-hidden className="lang-caret">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="lang-menu"
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
          >
            {LANG_OPTIONS.map((o) => (
              <button
                key={o.lang}
                role="menuitemradio"
                aria-checked={o.lang === lang}
                className={`lang-item${o.lang === lang ? ' active' : ''}`}
                onClick={() => pick(o.lang)}
              >
                {o.label}
                {o.lang === lang && <span aria-hidden> ✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
