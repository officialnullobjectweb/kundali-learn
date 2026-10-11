'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toDMS } from '@/domain/astro-math';
import { paginateBook, type BookBlock, type ChartBook } from '@/domain/book';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';

type S = (typeof STRINGS)['en'];

function SectionHead({ block, dict }: { block: BookBlock; dict: S }) {
  if (block.section === 'pos') return <h4>{dict.hSupporting}</h4>;
  if (block.section === 'neg') return <h4>{dict.hAgainst}</h4>;
  if (block.section === 'conf') return <h4>{dict.hConfidence}</h4>;
  if (block.section === 'tech') return <h4>{dict.hTechnical}</h4>;
  return null;
}

function PageBody({ blocks, dict }: { blocks: BookBlock[]; dict: S }) {
  let lastKey = '';
  return (
    <>
      {blocks.map((b, i) => {
        const headKey = `${b.chapter}:${b.section}`;
        const showHead = ['pos', 'neg', 'conf', 'tech'].includes(b.section) && headKey !== lastKey;
        lastKey = headKey;
        if (b.section === 'title') {
          const [head, score] = b.text.split(' — ');
          return (
            <h3 key={i} className="scripture-title">
              {head}
              <span className="score-inline"> — {score}</span>
            </h3>
          );
        }
        if (b.section === 'lead') {
          return (
            <p key={i} className="dropcap">
              {b.text}
            </p>
          );
        }
        return (
          <div key={i}>
            {showHead && <SectionHead block={b} dict={dict} />}
            <p className={b.section === 'tech' ? 'tech-line' : undefined}>{b.text}</p>
          </div>
        );
      })}
    </>
  );
}

/**
 * True 3D leaf-turning book. The spread shows two static leaves; turning a
 * page animates a real leaf (front + back faces in 3D) over the spread and
 * commits the new spread only when the turn completes.
 */
export function BookView({
  book,
  birthISO,
  placeLabel,
  onClose,
}: {
  book: ChartBook;
  birthISO: string | null;
  placeLabel: string | null;
  onClose: () => void;
}) {
  const lang = useChartStore((s) => s.lang);
  const dict: S = STRINGS[lang];
  const c = book.cover;
  const complete = c.placedCount >= c.totalCount;
  const content = useMemo(() => paginateBook(book), [book]);

  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 760px)');
    const apply = (): void => setWide(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Leaf indices: 0 = cover, 1..N = content, N+1 = method. Wide spreads show
  // (even, odd); narrow shows one leaf. `at` is the right/only visible leaf.
  const last = content.length + 1;
  const step = wide ? 2 : 1;
  const clamp = (n: number): number => Math.max(1, Math.min(last, n));
  const [at, setAt] = useState(1);
  const [turn, setTurn] = useState<null | { dir: 1 | -1 }>(null);

  // Keep the visible leaf valid when the layout or book changes.
  useEffect(() => {
    setAt((a) => {
      const even = wide ? (a % 2 === 1 ? a : Math.min(a + 1, last)) : a;
      return Math.max(1, Math.min(last, even));
    });
    setTurn(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide, last]);

  const go = (dir: 1 | -1): void => {
    if (turn) return;
    const next = clamp(at + dir * step);
    if (next === at) return;
    setTurn({ dir });
  };
  const commit = (): void => {
    if (!turn) return;
    setAt((a) => clamp(a + turn.dir * step));
    setTurn(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, turn, wide]);

  const renderLeaf = (i: number): React.ReactNode => {
    if (i < 0 || i > last) return <div className="scripture-orn large">❦</div>;
    if (i === 0) {
      return (
        <div className="scripture-cover">
          <div className="scripture-orn large">❦</div>
          <p className="cover-kicker">{dict.bookCover}</p>
          <h2>{c.name !== '' ? c.name : dict.bookOpen}</h2>
          <div className="cover-rule" aria-hidden />
          {(birthISO || placeLabel) && (
            <p className="cover-born">
              {[birthISO, placeLabel].filter(Boolean).join(' · ')}
            </p>
          )}
          {!complete && <p className="book-warn">{dict.bookIncomplete}</p>}
          <p>
            {dict.fRashi}: {dict.rashi[c.ascendantRashi]} · {dict.fDegree}: {toDMS(c.ascendantDegree)}
          </p>
          <p>
            {dict.graha.Moon}: {dict.rashi[c.moonRashi]} · {toDMS(c.moonDegree)} ·{' '}
            {dict.nakshatra[c.moonNakshatra]} {c.moonPada}
          </p>
          <p>
            {c.placedCount}/{c.totalCount} {dict.sideReading}
          </p>
          <div className="scripture-orn large">❦</div>
        </div>
      );
    }
    if (i > content.length) {
      return (
        <div>
          <h3 className="scripture-title">{dict.bookMethod}</h3>
          <ul className="ev-list">
            {dict.methodNotes.map((n, k) => (
              <li key={k}>{n}</li>
            ))}
          </ul>
          <div className="scripture-orn large">❦</div>
        </div>
      );
    }
    return <PageBody blocks={content[i - 1]} dict={dict} />;
  };

  // Turning leaf faces. Next: front shows `at` (matches the static right
  // page underneath), back shows `at + step`. Prev: the leaf starts flipped
  // on the left showing the current left page, and lands showing `at - step`.
  const turnFront = turn && turn.dir === 1 ? at : clamp(at - step);
  const turnBack = turn && turn.dir === 1 ? clamp(at + step) : wide ? clamp(at - 1) : at;
  const turnSide = wide ? (turn && turn.dir === 1 ? 'right' : 'left') : 'full';

  const spreadLabel = wide ? `${Math.ceil(at / 2)} / ${Math.ceil(last / 2)}` : `${at} / ${last}`;

  return (
    <div className="book-overlay" role="dialog" aria-modal="true" aria-label={dict.bookOpen}>
      <div className="scripture">
        <div className="scripture-top">
          <span className="scripture-count">{spreadLabel}</span>
          <button className="btn scripture-close" onClick={onClose}>
            {dict.bookClose}
          </button>
        </div>
        <div className="scripture-stage">
          <button className="leaf-nav left" onClick={() => go(-1)} aria-label="←" disabled={at <= 1 || !!turn}>
            ‹
          </button>
          <div className="spread">
            {wide && (
              <div className="book-leaf static left">
                <div className="leaf-stack" aria-hidden />
                {renderLeaf(at - 1)}
              </div>
            )}
            <div className={`book-leaf static${wide ? ' right' : ' solo'}`}>
              {renderLeaf(at)}
            </div>
            {turn && (
              <motion.div
                className={`turn-leaf ${turnSide}`}
                initial={{ rotateY: turn.dir === 1 ? 4 : -176 }}
                animate={{ rotateY: turn.dir === 1 ? -176 : 4 }}
                transition={{ duration: 0.7, ease: [0.4, 0.05, 0.35, 1] }}
                onAnimationComplete={commit}
                style={{ transformOrigin: turnSide === 'left' ? 'right center' : 'left center' }}
              >
                <div className="face front">{renderLeaf(turnFront)}</div>
                <div className="face back">{renderLeaf(turnBack)}</div>
              </motion.div>
            )}
            <div className="spine" aria-hidden />
          </div>
          <button
            className="leaf-nav right"
            onClick={() => go(1)}
            aria-label="→"
            disabled={at >= last || !!turn}
          >
            ›
          </button>
        </div>
        <div className="scripture-progress" aria-hidden>
          <div className="scripture-bar" style={{ width: `${(at / last) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
