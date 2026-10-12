'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { buildAllVargas, buildChart } from '@/domain/chart-engine';
import { aspectEngine } from '@/domain/aspect-engine';
import { analyzeAllDomains } from '@/domain/domain-engine';
import { yogaEngine } from '@/domain/yoga-engine';
import { transitSaturnRashi } from '@/domain/transit-engine';
import { synthesizePrediction, type PredictionSummary } from '@/domain/synthesis';
import { buildBook } from '@/domain/book';
import { diffCharts } from '@/domain/whatif-engine';
import type { Bhava, BuiltChart, DomainAnalysis, Graha, TopicId, Varga, YogaResult } from '@/domain/types';
import { VARGAS } from '@/domain/varga-engine';
import { ALL_GRAHAS, selectActiveChart, useChartStore } from '@/state/chart-store';
import { STRINGS } from '@/i18n/strings';
import { KundaliChart } from '@/components/chart/KundaliChart';
import { BirthForm } from '@/components/chart/BirthForm';
import { PlanetTray } from '@/components/chart/PlanetTray';
import { InsightPanel } from '@/components/chart/InsightPanel';
import { BookView } from '@/components/chart/BookView';
import { ExplorePanel } from '@/components/chart/ExplorePanel';
import { activeViewKey } from '@/components/chart/ChartSelector';
import { Legend } from '@/components/chart/ChartChrome';
import { AiPromptModal } from '@/components/ai/AiPromptModal';
import type { AiPromptInput } from '@/lib/ai-prompt';
import { ChartHeader, InstructionCard } from '@/components/chart/ChartHeader';
import { Header } from '@/components/layout/Header';
import { Toasts } from '@/components/ui/Toast';

export default function Page() {
  const appTheme = useChartStore((s) => s.appTheme);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('kl-theme');
      if (saved === 'light' || saved === 'dark') useChartStore.getState().setAppTheme(saved);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = appTheme;
    try {
      window.localStorage.setItem('kl-theme', appTheme);
    } catch {
      /* ignore */
    }
  }, [appTheme]);
  const activeChart = useChartStore(selectActiveChart);
  const birth = useChartStore((s) => s.birth);
  const birthISO = useChartStore((s) => s.birthISO);
  const view = useChartStore((s) => s.view);
  const mode = useChartStore((s) => s.mode);
  const lang = useChartStore((s) => s.lang);
  const theme = useChartStore((s) => s.theme);
  const tray = useChartStore((s) => s.tray);
  const nativeName = useChartStore((s) => s.nativeName);
  const retro = useChartStore((s) => s.retro);
  const retroOpts = useMemo(
    () => (retro ? { retrograde: retro } : undefined),
    [retro],
  );
  const built = useMemo(
    () => (activeChart ? buildChart(activeChart, view, retroOpts) : null),
    [activeChart, view, retroOpts],
  );
  const todayISO = useMemo(() => `${new Date().toISOString().slice(0, 10)}T00:00:00Z`, []);
  const beforeCharts = useMemo<Record<Varga, BuiltChart> | null>(
    () => (birth ? buildAllVargas(birth, 'Janma', retroOpts) : null),
    [birth, retroOpts],
  );
  const afterCharts = useMemo<Record<Varga, BuiltChart> | null>(
    () => (activeChart ? buildAllVargas(activeChart, 'Janma', retroOpts) : null),
    [activeChart, retroOpts],
  );
  const diff = useMemo(
    () =>
      beforeCharts && afterCharts
        ? diffCharts({ before: beforeCharts, after: afterCharts, birthISO: birthISO ?? '', dateISO: todayISO, exclude: tray })
        : null,
    [beforeCharts, afterCharts, birthISO, todayISO, tray],
  );
  const analysisAspects = useMemo(
    () => (afterCharts ? aspectEngine(afterCharts.D1, { exclude: tray }) : []),
    [afterCharts, tray],
  );
  const analyses = useMemo<Record<TopicId, DomainAnalysis> | null>(
    () =>
      afterCharts
        ? analyzeAllDomains({ charts: afterCharts, aspects: analysisAspects, birthISO: birthISO ?? '', dateISO: todayISO, exclude: tray })
        : null,
    [afterCharts, analysisAspects, birthISO, todayISO, tray],
  );
  const [bookOpen, setBookOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const birthPlace = useChartStore((s) => s.birthPlace);
  const placedCount = 9 - tray.length;
  const placed = useMemo(() => ALL_GRAHAS.filter((g) => !tray.includes(g)), [tray]);
  const yogas = useMemo<YogaResult[]>(
    () => (afterCharts ? yogaEngine(afterCharts.D1, analysisAspects) : []),
    [afterCharts, analysisAspects],
  );
  const prediction = useMemo<PredictionSummary | null>(
    () =>
      analyses && afterCharts
        ? synthesizePrediction({
          analyses,
          yogas,
          d1: afterCharts.D1,
          moonRashi: afterCharts.D1.planets.Moon.rashi,
          saturnTransitRashi: transitSaturnRashi(todayISO),
          birthISO,
          dateISO: todayISO,
        })
        : null,
    [analyses, afterCharts, yogas, birthISO, todayISO],
  );
  const book = useMemo(
    () =>
      analyses && afterCharts && activeChart
        ? buildBook(analyses, afterCharts.D1, activeChart.ascendant, placedCount, lang, nativeName)
        : null,
    [analyses, afterCharts, activeChart, placedCount, lang, nativeName],
  );
  const aiInput = useMemo<AiPromptInput | null>(() => {
    if (!afterCharts || !activeChart) return null;
    const S = STRINGS[lang];
    return {
      profileName: nativeName,
      lang,
      birthISO,
      placeLabel: birthPlace?.label ?? null,
      moonSign: S.rashi[afterCharts.D1.planets.Moon.rashi],
      vargas: VARGAS.map((v) => {
        const b = afterCharts[v];
        return {
          varga: v,
          lagna: S.rashi[b.lagnaRashi],
          rows: ALL_GRAHAS.map((g) => {
            const p = b.planets[g];
            return {
              graha: S.graha[g],
              sign: S.rashi[p.vargaRashi[v]],
              house: p.bhava,
              dignity: p.dignity,
              retro: p.isRetrograde,
            };
          }),
        };
      }),
      yogas: yogas.map((y) => ({ name: y.name, strength: y.strength, favourable: y.favourable })),
      strengths: (prediction?.strengths ?? []).map((s) => ({ domain: s.domain, text: s.text })),
      concerns: (prediction?.concerns ?? []).map((s) => ({ domain: s.domain, text: s.text })),
      timing: {
        mahadasha: prediction?.timing.mahadasha ?? '—',
        antardasha: prediction?.timing.antardasha ?? '—',
        sadeSati: prediction?.timing.sadeSati ?? 'none',
        activating: prediction && prediction.timing.activatingDomains.length
          ? prediction.timing.activatingDomains.join(', ')
          : '—',
      },
      overall: prediction?.overall ?? null,
      placedCount,
    };
  }, [afterCharts, activeChart, lang, nativeName, birthISO, birthPlace, yogas, prediction, placedCount]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const st = useChartStore.getState();

    // Dropping a chart planet back on the tray removes it from chart + analysis.
    if (String(over.id) === 'tray-bin') {
      const planetMatch = String(active.id).match(/^planet:(\w+)$/);
      if (planetMatch) st.unplacePlanet(planetMatch[1] as Graha);
      return;
    }
    if (!built) return;
    const overMatch = String(over.id).match(/^house:(\d+)$/);
    if (!overMatch) return;
    const bhava = Number(overMatch[1]) as Bhava;

    const planetMatch = String(active.id).match(/^(planet|tray):(\w+)$/);
    if (planetMatch) {
      const graha = planetMatch[2] as Graha;
      // Rahu/Ketu carry their 180° partner automatically.
      st.movePlanetWithAxis(graha, built.houses[bhava].rashi, built.view);
      st.setSelected(null);
      return;
    }
    const rashiMatch = String(active.id).match(/^rashi:(\d+)$/);
    if (rashiMatch) {
      // Any rashi onto any house: that house takes the rashi, all others follow.
      st.setHouseRashi(bhava, Number(rashiMatch[1]), built.view);
      st.setSelected(null);
    }
  }

  const st = useChartStore.getState();
  return (
    <main className="page">
      <Header onOpenAi={() => setAiOpen(true)} />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="board">
          <aside className="sidebar-left" aria-label="Planets and actions">
            <BirthForm />
            <PlanetTray />
          </aside>
          <section className="workspace" aria-label="Chart workspace">
            <ChartHeader onOpenBook={() => setBookOpen(true)} onOpenAi={() => setAiOpen(true)} placedCount={placedCount} />
            <InstructionCard />
            <div className="chart-wrap">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeViewKey(view)}-${theme}`}
                  className="chart-stage"
                  initial={{ opacity: 0.25, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.25, scale: 0.985 }}
                  transition={{ duration: 0.18 }}
                >
                  {built && <KundaliChart built={built} theme={theme} />}
                </motion.div>
              </AnimatePresence>
              <Legend />
            </div>
          </section>
          <aside className="sidebar-right" aria-label="Reading and insights">
            <InsightPanel built={built} analyses={analyses} placed={placed} yogas={yogas} prediction={prediction} />
          </aside>
        </div>
      </DndContext>

      {mode === 'explore' && diff && <ExplorePanel diff={diff} />}

      {bookOpen && book && (
        <BookView
          book={book}
          birthISO={birthISO}
          placeLabel={birthPlace?.label ?? null}
          onClose={() => setBookOpen(false)}
        />
      )}
      {aiOpen && aiInput && <AiPromptModal input={aiInput} onClose={() => setAiOpen(false)} />}
      <Toasts />
    </main>
  );
}
