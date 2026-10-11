'use client';

import { useMemo } from 'react';
import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { type Bhava, type BuiltChart, type ChartTheme, type Graha } from '@/domain/types';
import { aspectEngine } from '@/domain/aspect-engine';
import { useChartStore } from '@/state/chart-store';
import { CHART_DECOR, CHART_THEMES, type ChartPalette } from './themes';

export const GRAHA_ABBR: Record<Graha, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

/** Fixed North Indian layout: house 1 = top diamond, kendras 1/4/7/10 = diamonds. */
const HOUSE_POLY: Record<Bhava, string> = {
  1: '200,20 290,110 200,200 110,110',
  2: '200,20 20,20 110,110',
  3: '20,20 20,200 110,110',
  4: '20,200 110,290 200,200 110,110',
  5: '20,200 20,380 110,290',
  6: '20,380 200,380 110,290',
  7: '200,380 290,290 200,200 110,290',
  8: '200,380 380,380 290,290',
  9: '380,380 380,200 290,290',
  10: '380,200 290,290 200,200 290,110',
  11: '380,200 380,20 290,110',
  12: '380,20 200,20 290,110',
};

const HOUSE_ANCHOR: Record<Bhava, { x: number; y: number }> = {
  1: { x: 200, y: 112 },
  2: { x: 110, y: 58 },
  3: { x: 52, y: 110 },
  4: { x: 92, y: 200 },
  5: { x: 52, y: 290 },
  6: { x: 110, y: 336 },
  7: { x: 200, y: 288 },
  8: { x: 290, y: 336 },
  9: { x: 348, y: 290 },
  10: { x: 308, y: 200 },
  11: { x: 348, y: 110 },
  12: { x: 290, y: 58 },
};

const BHAVAS: Bhava[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function StatusIcons({
  exalted,
  debilitated,
  retro,
  pal,
}: {
  exalted: boolean;
  debilitated: boolean;
  retro: boolean;
  pal: ChartPalette;
}) {
  return (
    <>
      {exalted && <tspan fill={pal.exalted}> ▲</tspan>}
      {debilitated && <tspan fill={pal.debilitated}> ▼</tspan>}
      {retro && <tspan fill={pal.retro}> ↻</tspan>}
    </>
  );
}

function PlanetChip({
  graha,
  pal,
  halo,
  x,
  y,
  info,
}: {
  graha: Graha;
  pal: ChartPalette;
  halo: boolean;
  x: number;
  y: number;
  info: { deg: number; dignity: string; retro: boolean; combust: boolean };
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `planet:${graha}`,
    data: { type: 'planet', graha },
  });
  const setHover = useChartStore((s) => s.setHover);
  const setSelected = useChartStore((s) => s.setSelected);
  const selected = useChartStore((s) => s.selected);
  const isSelected = selected?.kind === 'graha' && selected.key === graha;
  return (
    <g
      ref={(node) => {
        setNodeRef(node as unknown as HTMLElement | null);
      }}
      {...listeners}
      {...attributes}
      className="draggable"
      opacity={isDragging ? 0.45 : 1}
      transform={transform ? `translate(${transform.x} ${transform.y})` : undefined}
      onMouseEnter={() => setHover({ kind: 'graha', key: graha })}
      onMouseLeave={() => setHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        setSelected(isSelected ? null : { kind: 'graha', key: graha });
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setSelected(isSelected ? null : { kind: 'graha', key: graha });
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${graha} planet`}
    >
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontSize={11}
        fontWeight={isSelected ? 700 : 500}
        fill={info.combust ? pal.debilitated : isSelected ? pal.selected : pal.planet}
        style={halo ? { paintOrder: 'stroke', stroke: pal.cell, strokeWidth: 2.5 } : undefined}
      >
        {GRAHA_ABBR[graha]} {Math.floor(info.deg)}°
        <StatusIcons
          exalted={info.dignity === 'Exalted'}
          debilitated={info.dignity === 'Debilitated'}
          retro={info.retro}
          pal={pal}
        />
      </text>
    </g>
  );
}

function RashiLabel({ rashi, x, y, pal, serif }: { rashi: number; x: number; y: number; pal: ChartPalette; serif: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `rashi:${rashi}`,
    data: { type: 'rashi', rashi },
  });
  const setHover = useChartStore((s) => s.setHover);
  const setSelected = useChartStore((s) => s.setSelected);
  return (
    <g
      ref={(node) => {
        setNodeRef(node as unknown as HTMLElement | null);
      }}
      {...listeners}
      {...attributes}
      className="draggable"
      opacity={isDragging ? 0.45 : 1}
      transform={transform ? `translate(${transform.x} ${transform.y})` : undefined}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setHover({ kind: 'rashi', key: `rashi:${rashi}` });
      }}
      onMouseLeave={() => setHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        setSelected({ kind: 'rashi', key: `rashi:${rashi}` });
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setSelected({ kind: 'rashi', key: `rashi:${rashi}` });
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Rashi ${rashi + 1}`}
    >
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontSize={12}
        fill={pal.rashi}
        fontFamily={serif ? 'Georgia, "Times New Roman", serif' : undefined}
        fontStyle={serif ? 'italic' : undefined}
      >
        {rashi + 1}
      </text>
    </g>
  );
}

interface Preview {
  sources: Set<Bhava>;
  targets: Set<Bhava>;
  lines: { from: Bhava; to: Bhava }[];
}

function HouseCell({
  built,
  bhava,
  pal,
  halo,
  serif,
  placed,
  preview,
}: {
  built: BuiltChart;
  bhava: Bhava;
  pal: ChartPalette;
  halo: boolean;
  serif: boolean;
  placed: Set<Graha>;
  preview: Preview;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `house:${bhava}`,
    data: { type: 'house', bhava },
  });
  const { active } = useDndContext();
  const activeType = active?.data?.current?.type as string | undefined;
  const setHover = useChartStore((s) => s.setHover);
  const setSelected = useChartStore((s) => s.setSelected);
  const selected = useChartStore((s) => s.selected);

  const house = built.houses[bhava];
  const anchor = HOUSE_ANCHOR[bhava];
  const isLagna = bhava === 1;
  const isSelectedHouse = selected?.kind === 'bhava' && selected.key === `bhava:${bhava}`;
  const occupants = house.occupants.filter((g) => placed.has(g));

  // Drop validity: planets and rashis may land on any house.
  const validTarget = activeType === 'planet' || activeType === 'rashi';
  const isSource = preview.sources.has(bhava);
  const isTarget = preview.targets.has(bhava);
  // Selected house: soft fill tint only — no border drawn, so nothing can render unevenly.
  const fill = isOver && validTarget
    ? pal.over
    : isSelectedHouse
      ? pal.valid
      : isTarget && !validTarget
        ? pal.target
        : validTarget
          ? pal.valid
          : pal.cell;
  const stroke = isSource ? pal.source : pal.grid;

  const handleHouseClick = () => {
    const st = useChartStore.getState();
    if (selected?.kind === 'graha') {
      // Click-to-move fallback (touch): selected planet -> this house's rashi, degree kept.
      // Rahu/Ketu carry their 180° partner automatically.
      const graha = selected.key as Graha;
      st.movePlanetWithAxis(graha, house.rashi, built.view);
      setSelected(null);
    } else if (selected?.kind === 'rashi') {
      // Selected rashi -> this house takes it; all other houses follow.
      st.setHouseRashi(bhava, Number(selected.key.split(':')[1]), built.view);
      setSelected(null);
    } else {
      setSelected({ kind: 'bhava', key: `bhava:${bhava}` });
    }
  };

  return (
    <g
      ref={(node) => {
        setNodeRef(node as unknown as HTMLElement | null);
      }}
    >
      <polygon
        points={HOUSE_POLY[bhava]}
        fill={fill}
        stroke={isSource ? pal.source : pal.grid}
        strokeWidth={isSource ? 2 : 1}
        style={{ transition: 'fill 160ms ease', cursor: validTarget ? 'copy' : 'pointer' }}
        onMouseEnter={() => setHover({ kind: 'bhava', key: `bhava:${bhava}` })}
        onMouseLeave={() => setHover(null)}
        onClick={handleHouseClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleHouseClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`House ${bhava}`}
      />
      <RashiLabel rashi={house.rashi} x={anchor.x} y={anchor.y - 22} pal={pal} serif={serif} />
      {isLagna && (
        <text x={anchor.x} y={anchor.y - 8} textAnchor="middle" fontSize={9} fill={pal.asc} fontWeight={700}>
          Asc {house.rashi + 1}
        </text>
      )}
      {occupants.map((g, i) => {
        const p = built.planets[g];
        return (
          <PlanetChip
            key={g}
            graha={g}
            pal={pal}
            halo={halo}
            x={anchor.x}
            y={anchor.y + 6 + i * 15}
            info={{ deg: built.view.varga === 'D1' ? p.degreeInRashi : p.vargaDegree, dignity: p.dignity, retro: p.isRetrograde, combust: p.isCombust }}
          />
        );
      })}
    </g>
  );
}

export function KundaliChart({ built, theme }: { built: BuiltChart; theme: ChartTheme }) {
  const pal = CHART_THEMES[theme];
  const decor = CHART_DECOR[theme];
  const hover = useChartStore((s) => s.hover);
  const selected = useChartStore((s) => s.selected);
  const tray = useChartStore((s) => s.tray);
  const placed = useMemo(() => new Set<Graha>(BHAVAS.flatMap((b) => built.houses[b].occupants).filter((g) => !tray.includes(g))), [built, tray]);

  // Aspect preview: hovering a house lights up every house its placed
  // occupants aspect; hovering one planet shows only its lines.
  const preview: Preview = useMemo(() => {
    const sources = new Set<Bhava>();
    const targets = new Set<Bhava>();
    const lines: { from: Bhava; to: Bhava }[] = [];
    const target = hover ?? selected;
    if (!target || target.kind === 'rashi') return { sources, targets, lines };
    const aspects = aspectEngine(built, { exclude: tray });
    const fromGrahas: Graha[] =
      target.kind === 'graha'
        ? [target.key as Graha]
        : built.houses[Number(target.key.split(':')[1]) as Bhava].occupants.filter((g) => placed.has(g));
    const single = target.kind === 'graha';
    for (const g of fromGrahas) {
      const from = built.planets[g].bhava;
      sources.add(from);
      for (const a of aspects) {
        if (a.from !== g) continue;
        const toBhava = typeof a.to === 'number' ? a.to : built.planets[a.to].bhava;
        if (toBhava === from) continue;
        targets.add(toBhava);
        if (single) lines.push({ from, to: toBhava });
      }
    }
    return { sources, targets, lines };
  }, [built, hover, selected, tray, placed]);

  return (
    <svg viewBox="0 0 400 400" className="kundali" role="img" aria-label="North Indian kundali chart">
      <rect x={20} y={20} width={360} height={360} fill={pal.cell} stroke={pal.frame} strokeWidth={decor.doubleFrame ? 2.5 : 1.5} rx={decor.doubleFrame ? 2 : 4} />
      {decor.doubleFrame && (
        <rect x={28} y={28} width={344} height={344} fill="none" stroke={pal.frame} strokeWidth={1} />
      )}
      {decor.corners && (
        <g fill={pal.source}>
          <polygon points="20,12 28,20 20,28 12,20" />
          <polygon points="380,12 388,20 380,28 372,20" />
          <polygon points="20,372 28,380 20,388 12,380" />
          <polygon points="380,372 388,380 380,388 372,380" />
        </g>
      )}
      <line x1={20} y1={20} x2={380} y2={380} stroke={pal.grid} strokeWidth={1} />
      <line x1={380} y1={20} x2={20} y2={380} stroke={pal.grid} strokeWidth={1} />
      <polygon points="200,20 380,200 200,380 20,200" fill="none" stroke={pal.grid} strokeWidth={1} />
      {BHAVAS.map((b) => (
        <HouseCell key={b} built={built} bhava={b} pal={pal} halo={decor.halo} serif={decor.serifRashi} placed={placed} preview={preview} />
      ))}
      {/* Selection: crisp overlay border, painted last so every side is identical. */}
      {selected?.kind === 'bhava' && (
        <polygon
          points={HOUSE_POLY[Number(selected.key.split(':')[1]) as Bhava]}
          fill="none"
          stroke={pal.selected}
          strokeWidth={2}
          strokeLinejoin="miter"
          strokeMiterlimit={10}
          shapeRendering="geometricPrecision"
          pointerEvents="none"
        />
      )}
      <g pointerEvents="none">
        {preview.lines.map((l, i) => (
          <line
            key={i}
            x1={HOUSE_ANCHOR[l.from].x}
            y1={HOUSE_ANCHOR[l.from].y}
            x2={HOUSE_ANCHOR[l.to].x}
            y2={HOUSE_ANCHOR[l.to].y}
            stroke={pal.source}
            strokeWidth={1.2}
            strokeDasharray="5 4"
            opacity={0.55}
          />
        ))}
      </g>
    </svg>
  );
}
