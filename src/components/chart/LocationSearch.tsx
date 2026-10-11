'use client';

import { useEffect, useRef, useState } from 'react';
import { classifyQuery, searchPlaces, type PlaceResult } from '@/domain/location';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';

export function LocationSearch({
  value,
  onChange,
}: {
  value: PlaceResult | null;
  onChange: (p: PlaceResult | null) => void;
}) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setBusy(true);
    const id = ++reqId.current;
    const t = setTimeout(() => {
      searchPlaces(q)
        .then((r) => {
          if (reqId.current !== id) return;
          setResults(r);
          setActive(0);
          setOpen(true);
        })
        .catch(() => {
          if (reqId.current !== id) return;
          setResults([]);
          setOpen(true);
        })
        .finally(() => {
          if (reqId.current === id) setBusy(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDown = (e: PointerEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  const pick = (r: PlaceResult): void => {
    onChange(r);
    setQ('');
    setResults([]);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && open && results[active]) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const hint = classifyQuery(q) === 'pincode' ? S.pinHint : S.locHint;

  return (
    <div className="loc-wrap" ref={ref}>
      {value ? (
        <div className="loc-picked">
          <span>
            <strong>{value.label}</strong>
            <small>{value.sub}</small>
          </span>
          {value.precision !== 'exact' && <span className="badge">{S.locApprox}</span>}
          <button className="btn ghost" onClick={() => onChange(null)} aria-label={S.locClear}>
            ×
          </button>
        </div>
      ) : (
        <>
          <input
            className="loc-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={S.locPlaceholder}
            aria-label={S.bdPlace}
            aria-expanded={open}
            role="combobox"
            aria-autocomplete="list"
            autoComplete="off"
          />
          <div className="loc-hint">
            {busy ? '…' : hint}
          </div>
          {open && (
            <div className="loc-menu" role="listbox">
              {results.length === 0 && !busy ? (
                <div className="loc-empty">{S.locNone}</div>
              ) : (
                results.map((r, i) => (
                  <button
                    key={`${r.label}|${r.lat},${r.lon}`}
                    role="option"
                    aria-selected={i === active}
                    className={`loc-item${i === active ? ' active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(r)}
                  >
                    <span>
                      <strong>{r.label}</strong>
                      <small>{r.sub}</small>
                    </span>
                    {r.precision !== 'exact' && <span className="badge">{S.locApprox}</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
