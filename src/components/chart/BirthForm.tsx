'use client';

import { useEffect, useState } from 'react';
import { astronomyEngine } from '@/domain/astronomy-engine';
import type { PlaceResult } from '@/domain/location';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { DateTimePicker } from './DateTimePicker';
import { LocationSearch } from './LocationSearch';

export function BirthFormFields({ onSubmitted }: { onSubmitted?: () => void }) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const [name, setName] = useState('');
  const [when, setWhen] = useState('');
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (): void => {
    setError(null);
    try {
      const ms = Date.parse(when);
      if (!Number.isFinite(ms)) throw new Error('date');
      if (!place) throw new Error('place');
      const dateISO = new Date(ms).toISOString();
      const result = astronomyEngine({ dateISO, lat: place.lat, lon: place.lon });
      const st = useChartStore.getState();
      st.loadBirth({ ascendant: result.ascendant, placements: result.placements });
      st.setRetro(result.retrograde);
      st.setBirthISO(dateISO);
      st.setBirthPlace({ label: place.label, lat: place.lat, lon: place.lon });
      st.setNativeName(name.trim());
      st.autoFill();
      onSubmitted?.();
    } catch {
      setError(S.bdInvalid);
    }
  };

  return (
    <>
      <label className="birth-row">
        <span>{S.bdName}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={S.bdName}
          autoComplete="off"
        />
      </label>
      <div className="birth-row">
        <span>{S.bdDate}</span>
        <DateTimePicker value={when} onChange={setWhen} />
      </div>
      <div className="birth-row">
        <span>{S.bdPlace}</span>
        <LocationSearch value={place} onChange={setPlace} />
      </div>
      <button
        className="btn birth-go"
        onClick={submit}
        disabled={when.trim() === '' || place === null}
      >
        {S.bdSubmit}
      </button>
      {error && (
        <div className="birth-err" role="alert">
          {error}
        </div>
      )}
      <p className="birth-note">{S.bdNote}</p>
    </>
  );
}

export function BirthForm() {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  return (
    <details className="birth">
      <summary>{S.bdTitle}</summary>
      <BirthFormFields />
    </details>
  );
}

/** "Don't know placement?" entry point: the entire birth form in a modal. */
export function BirthModal({ onClose }: { onClose: () => void }) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="modal birth-modal"
        role="dialog"
        aria-modal="true"
        aria-label={S.bdTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="birth-modal-head">
          <h3>{S.bdTitle}</h3>
          <button className="instr-close" onClick={onClose} aria-label={S.bookClose}>
            ×
          </button>
        </div>
        <BirthFormFields onSubmitted={onClose} />
      </div>
    </div>
  );
}
