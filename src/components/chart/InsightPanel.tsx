'use client';

import { useState } from 'react';
import { chartInsights } from '@/domain/insights';
import { DOMAIN_DEFS } from '@/domain/domains';
import type { PredictionSummary } from '@/domain/synthesis';
import type { BuiltChart, DomainAnalysis, Graha, TopicId, YogaResult } from '@/domain/types';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { ReadingPanel } from './ReadingPanel';
import { ChartInfoPanel } from './ChartInfoPanel';

export type Category = TopicId | 'all';

const CATS: Category[] = [
  'career',
  'money',
  'marriage',
  'relationships',
  'health',
  'education',
  'spirituality',
  'all',
];

function MetricCard({ title, value, why }: { title: string; value: string; why: string }) {
  return (
    <div className="metric">
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-why">{why}</div>
    </div>
  );
}

function InsightsView({
  built,
  placed,
  analyses,
  yogas,
}: {
  built: BuiltChart;
  placed: Graha[];
  analyses: Record<TopicId, DomainAnalysis> | null;
  yogas: YogaResult[];
}) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const metrics = chartInsights(built, placed, analyses, yogas);
  const byId = (id: string): string => metrics.find((m) => m.id === id)?.value ?? '—';
  const whyId = (id: string): string => metrics.find((m) => m.id === id)?.why ?? '';

  const health = analyses?.health;
  const moon = built.planets.Moon;
  const healthBlocked = !health || health.blocked;
  const confs = analyses
    ? (Object.keys(DOMAIN_DEFS) as TopicId[])
      .map((d) => analyses[d])
      .filter((a) => !a.blocked)
    : [];
  const meanConf = confs.length > 0
    ? (confs.reduce((a, b) => a + b.confidence, 0) / confs.length).toFixed(2)
    : null;

  return (
    <div className="insights">
      <div className="metric-grid">
        <MetricCard
          title={S.inPhysical}
          value={healthBlocked ? '— / 100' : `${health.score} / 100`}
          why={healthBlocked ? S.inNeedMore : `${health.supporting.length} supporting · ${health.contradicting.length} against`}
        />
        <MetricCard
          title={S.inMental}
          value={`${S.nakshatra[moon.nakshatra]} ${moon.pada}`}
          why={`${S.houseWord} ${moon.bhava} · ${S.rashi[moon.rashi]}${moon.isCombust ? ` · ${S.combust}` : ''}${moon.isRetrograde ? ` · ${S.retro}` : ''}`}
        />
      </div>
      <div className="metric-grid">
        <MetricCard title={S.inComplete} value={`${placed.length}/9`} why={whyId('completeness')} />
        <MetricCard title={S.inHouseCov} value={byId('houseCoverage')} why={whyId('houseCoverage')} />
        <MetricCard title={S.inStrongest} value={byId('strongest')} why={whyId('strongest')} />
        <MetricCard title={S.inWeakest} value={byId('weakest')} why={whyId('weakest')} />
        <MetricCard title={S.inExalted} value={byId('exalted')} why={whyId('exalted')} />
        <MetricCard title={S.inRetro} value={byId('retrograde')} why={whyId('retrograde')} />
        <MetricCard title={S.inDebilitated} value={byId('debilitated')} why={whyId('debilitated')} />
        <MetricCard
          title={S.inYogas}
          value={yogas.length > 0 ? yogas.map((y) => y.name).join(', ') : '—'}
          why={whyId('yogas')}
        />
      </div>
      <div className="conf-card">
        <div className="metric-title">{S.hConfidence}</div>
        <div className="metric-value">{meanConf ?? '—'}</div>
        <div className="metric-why">
          {meanConf
            ? `Mean of ${confs.length} unblocked domain confidences.`
            : S.inNeedMore}
        </div>
      </div>
      <div className="tip-card">
        <div className="metric-title">Tip</div>
        <div className="metric-why">{S.trayHint}</div>
      </div>
    </div>
  );
}

function AllOverview({
  analyses,
  onPick,
}: {
  analyses: Record<TopicId, DomainAnalysis> | null;
  onPick: (d: TopicId) => void;
}) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  if (!analyses) return <div className="panel-empty">{S.panelEmpty}</div>;
  return (
    <div className="all-list">
      {(Object.keys(DOMAIN_DEFS) as TopicId[]).map((d) => {
        const a = analyses[d];
        return (
          <button key={d} className="all-row" onClick={() => onPick(d)}>
            <span>{S.domainName[d]}</span>
            <span className="all-score">{a.blocked ? '—' : `${a.score}`}</span>
          </button>
        );
      })}
    </div>
  );
}

function OverviewTab({ prediction }: { prediction: PredictionSummary | null }) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  if (!prediction) return <div className="panel-empty">{S.panelEmpty}</div>;
  const t = prediction.timing;
  return (
    <div className="reading">
      <div className="score-row">
        <span className="score-big">
          {prediction.overall ?? '—'}
          {prediction.overall !== null && <span className="score-max">/100</span>}
        </span>
        <span className="interp-headline">{S.inOverall}</span>
      </div>
      <div className="panel-empty">
        {prediction.computed} computed · {prediction.blocked} blocked
      </div>
      {prediction.strengths.length > 0 && (
        <>
          <h4>{S.hSupporting}</h4>
          <ul className="ev-list pos">
            {prediction.strengths.map((f, i) => (
              <li key={i}>
                <span className="ev-mark" aria-hidden>
                  +
                </span>
                [{S.domainName[f.domain]}] {f.text}
              </li>
            ))}
          </ul>
        </>
      )}
      {prediction.concerns.length > 0 && (
        <>
          <h4>{S.hAgainst}</h4>
          <ul className="ev-list neg">
            {prediction.concerns.map((f, i) => (
              <li key={i}>
                <span className="ev-mark" aria-hidden>
                  −
                </span>
                [{S.domainName[f.domain]}] {f.text}
              </li>
            ))}
          </ul>
        </>
      )}
      <h4>{S.inYogas}</h4>
      <div className="panel-empty">
        {prediction.yogas.length > 0 ? prediction.yogas.join(', ') : '—'}
      </div>
      <h4>{S.inTimingNow}</h4>
      <div className="panel-empty">
        {t.mahadasha ? `${t.mahadasha} / ${t.antardasha}` : '—'} · {S.inSadeSati}: {t.sadeSati}
      </div>
      {t.activatingDomains.length > 0 && (
        <>
          <h4>{S.inActiveNow}</h4>
          <div className="panel-empty">
            {t.activatingDomains.map((d) => S.domainName[d]).join(', ')}
          </div>
        </>
      )}
    </div>
  );
}

export function InsightPanel({
  built,
  analyses,
  placed,
  yogas,
  prediction,
}: {
  built: BuiltChart | null;
  analyses: Record<TopicId, DomainAnalysis> | null;
  placed: Graha[];
  yogas: YogaResult[];
  prediction: PredictionSummary | null;
}) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const [tab, setTab] = useState<'overview' | 'reading' | 'insights' | 'inspect'>('overview');
  const [cat, setCat] = useState<Category>('all');
  const tabs = [
    { key: 'overview', label: S.sideOverview },
    { key: 'reading', label: S.sideReading },
    { key: 'insights', label: S.sideInsights },
    { key: 'inspect', label: S.sideInspect },
  ] as const;

  return (
    <div className="rail">
      <div className="rail-tabs" role="tablist" aria-label="Panel">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {(tab === 'reading' || tab === 'insights') && (
        <div className="topic-pills" role="group" aria-label="Life area">
          {CATS.map((c) => (
            <button
              key={c}
              className={`pill${cat === c ? ' active' : ''}`}
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
            >
              {c === 'all' ? S.allCats : S.domainName[c]}
            </button>
          ))}
        </div>
      )}
      <div className="rail-body">
        {tab === 'overview' && <OverviewTab prediction={prediction} />}
        {tab === 'reading' &&
          (cat === 'all' ? (
            <AllOverview analyses={analyses} onPick={(d) => setCat(d)} />
          ) : (
            <ReadingPanel analyses={analyses} topic={cat} bare />
          ))}
        {tab === 'insights' && built && (
          <InsightsView built={built} placed={placed} analyses={analyses} yogas={yogas} />
        )}
        {tab === 'inspect' && <ChartInfoPanel built={built} />}
      </div>
    </div>
  );
}
