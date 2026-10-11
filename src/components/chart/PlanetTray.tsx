'use client';

import { useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GRAHAS, type Graha } from '@/domain/types';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { PlanetPhoto } from '@/components/planets/PlanetPhoto';
import { BirthModal } from './BirthForm';

function TrayPlanet({ graha, name }: { graha: Graha; name: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tray:${graha}`,
    data: { type: 'planet', graha },
  });
  const setSelected = useChartStore((s) => s.setSelected);
  const selected = useChartStore((s) => s.selected);
  const isSelected = selected?.kind === 'graha' && selected.key === graha;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`tray-chip${isDragging ? ' dragging' : ''}${isSelected ? ' selected' : ''}`}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      title={`${name} — drag onto a house`}
      onClick={() => setSelected(isSelected ? null : { kind: 'graha', key: graha })}
    >
      <span className="tray-img">
        <PlanetPhoto name={graha} size={64} />
      </span>
      <span className="tray-name">{name}</span>
    </div>
  );
}

export function PlanetTray() {
  const lang = useChartStore((s) => s.lang);
  const tray = useChartStore((s) => s.tray);
  const S = STRINGS[lang];
  const [birthOpen, setBirthOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: 'tray-bin', data: { type: 'tray' } });
  return (
    <div className="tray" ref={setNodeRef} data-over={isOver || undefined}>
      <div className="tray-title">{S.trayTitle}</div>
      <div className="tray-sub">{S.traySub}</div>
      <button type="button" className="link-btn" onClick={() => setBirthOpen(true)}>
        {S.locDontKnow}
      </button>
      {tray.length === 0 ? (
        <div className="tray-empty">{S.trayEmpty}</div>
      ) : (
        <div className="tray-grid">
          {(GRAHAS as readonly Graha[])
            .filter((g) => tray.includes(g))
            .map((g) => (
              <TrayPlanet key={g} graha={g} name={S.graha[g]} />
            ))}
        </div>
      )}
      <div className="tray-hint">{S.trayHint}</div>
      {birthOpen && <BirthModal onClose={() => setBirthOpen(false)} />}
    </div>
  );
}
