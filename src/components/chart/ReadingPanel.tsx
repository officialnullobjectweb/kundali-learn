'use client';

import { useMemo, useState } from 'react';
import { interpretAnalysis } from '@/domain/interpretation-engine';
import { DOMAIN_DEFS } from '@/domain/domains';
import type { BuiltChart, DomainAnalysis, InterpretationSentence, TopicId } from '@/domain/types';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { ChartInfoPanel } from './ChartInfoPanel';

function Sentences({ items, mark }: { items: InterpretationSentence[]; mark?: '+' | '−' }) {
  if (items.length === 0) return null;
  return (
    <ul className={`ev-list${mark === '+' ? ' pos' : mark === '−' ? ' neg' : ''}`}>
      {items.map((s, i) => (
        <li key={i}>
          {mark && (
            <span className="ev-mark" aria-hidden>
              {mark}
            </span>
          )}
          {s.text}
        </li>
      ))}
    </ul>
  );
}

export function ReadingPanel({
  analyses,
  topic,
  onTopic,
  bare,
}: {
  analyses: Record<TopicId, DomainAnalysis> | null;
  topic?: TopicId;
  onTopic?: (t: TopicId) => void;
  /** When true, topic pills are rendered by the parent (no duplication). */
  bare?: boolean;
}) {
  const storeTopic = useChartStore((s) => s.topic);
  const setStoreTopic = useChartStore((s) => s.setTopic);
  const active = topic ?? storeTopic;
  const pick = onTopic ?? setStoreTopic;
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const interp = useMemo(
    () => (analyses ? interpretAnalysis(analyses[active], lang) : null),
    [analyses, active, lang],
  );
  const domains = useMemo(() => Object.keys(DOMAIN_DEFS) as TopicId[], []);
  return (
    <div className="reading">
      {!bare && (
        <div className="topic-pills" role="tablist" aria-label={S.sideReading}>
          {domains.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={active === d}
              className={`pill${active === d ? ' active' : ''}`}
              onClick={() => pick(d)}
            >
              {S.domainName[d]}
            </button>
          ))}
        </div>
      )}
      {!interp ? (
        <div className="panel-empty">{S.panelEmpty}</div>
      ) : (
        <div className="interp">
          <div className="score-row">
            <span className="score-big">
              {interp.score}
              <span className="score-max">/100</span>
            </span>
            <span className="interp-headline">{interp.headline}</span>
          </div>
          {interp.shortExplanation.map((s, i) => (
            <p key={i} className="interp-lead">
              {s.text}
            </p>
          ))}
          <Sentences items={interp.whyThisHappened} />
          {interp.supporting.length > 0 && (
            <>
              <h4>{S.hSupporting}</h4>
              <Sentences items={interp.supporting} mark="+" />
            </>
          )}
          {interp.contradicting.length > 0 && (
            <>
              <h4>{S.hAgainst}</h4>
              <Sentences items={interp.contradicting} mark="−" />
            </>
          )}
          <h4>{S.hConfidence}</h4>
          <Sentences items={interp.confidenceNote} />
          {interp.technical.length > 0 && (
            <details className="more">
              <summary>{S.hTechnical}</summary>
              <Sentences items={interp.technical} />
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export function SideRail({
  built,
  analyses,
}: {
  built: BuiltChart | null;
  analyses: Record<TopicId, DomainAnalysis> | null;
}) {
  const [tab, setTab] = useState<'reading' | 'inspect'>('reading');
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  return (
    <div className="rail">
      <div className="rail-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'reading'}
          className={tab === 'reading' ? 'active' : ''}
          onClick={() => setTab('reading')}
        >
          {S.sideReading}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'inspect'}
          className={tab === 'inspect' ? 'active' : ''}
          onClick={() => setTab('inspect')}
        >
          {S.sideInspect}
        </button>
      </div>
      <div className="rail-body">
        {tab === 'reading' ? <ReadingPanel analyses={analyses} /> : <ChartInfoPanel built={built} />}
      </div>
    </div>
  );
}
