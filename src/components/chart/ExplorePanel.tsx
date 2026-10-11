'use client';

import type { WhatIfDiff } from '@/domain/whatif-engine';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';

export function ExplorePanel({ diff }: { diff: WhatIfDiff }) {
  const lang = useChartStore((s) => s.lang);
  const resetDraft = useChartStore((s) => s.resetDraft);
  const S = STRINGS[lang];

  return (
    <section className="explore" aria-label={S.whatIfTitle}>
      <div className="explore-head">
        <h2>{S.whatIfTitle}</h2>
        <button className="btn" onClick={resetDraft}>
          {S.resetExperiment}
        </button>
      </div>
      {!diff.hasChanges ? (
        <p className="explore-empty">{S.noChanges}</p>
      ) : (
        <>
          <ul className="explore-sentences">
            {diff.sentences.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <div className="table-scroll">
          <table className="diff-table">
            <thead>
              <tr>
                <th aria-label="domain" />
                <th>{S.beforeCol}</th>
                <th>{S.afterCol}</th>
                <th aria-label="change" />
              </tr>
            </thead>
            <tbody>
              {diff.deltas.map((d) => (
                <tr key={d.domain} className={d.delta === 0 ? 'dim' : ''}>
                  <td>{S.domainName[d.domain]}</td>
                  <td>{d.before}</td>
                  <td>{d.after}</td>
                  <td className={d.delta > 0 ? 'up' : d.delta < 0 ? 'down' : ''}>
                    {d.delta === 0 ? '—' : `${d.delta > 0 ? '+' : ''}${d.delta}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </section>
  );
}
