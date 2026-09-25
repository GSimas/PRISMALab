'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useApp } from '../../app/AppProviders';
import { prefersReducedMotion } from '../../app/motion';
import { tourText, type TourStep } from './steps';

interface Props {
  steps: TourStep[];
  /** Puts the app in the state a step needs (builder tab, Primi panel). */
  onPrepare: (step: TourStep) => void;
  onClose: (completed: boolean) => void;
}

interface Box { top: number; left: number; width: number; height: number }

const GAP = 14;
const EDGE = 16;
const PAD = 6;

/** First match that is actually rendered (hidden desktop/mobile variants are skipped). */
function findVisible(selector: string): HTMLElement | null {
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return element;
  }
  return null;
}

/** Opens collapsed <details> so the highlighted section is readable. */
function reveal(element: HTMLElement) {
  if (element instanceof HTMLDetailsElement) element.open = true;
  let parent = element.parentElement?.closest('details');
  while (parent) {
    parent.open = true;
    parent = parent.parentElement?.closest('details') ?? null;
  }
}

const sameBox = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5);

/** Places the card next to the highlight, falling back to a docked or centered card. */
function placeCard(target: Box | null, card: { width: number; height: number }): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!target) return { top: Math.max(EDGE, (vh - card.height) / 2), left: Math.max(EDGE, (vw - card.width) / 2) };
  if (vw < 640) return { left: EDGE, right: EDGE, bottom: EDGE };
  const left = Math.min(Math.max(EDGE, target.left), vw - card.width - EDGE);
  if (target.top + target.height + GAP + card.height < vh - EDGE) return { top: target.top + target.height + GAP, left };
  if (target.top - GAP - card.height > EDGE) return { top: target.top - GAP - card.height, left };
  const top = Math.min(Math.max(EDGE, target.top), vh - card.height - EDGE);
  if (target.left + target.width + GAP + card.width < vw - EDGE) return { top, left: target.left + target.width + GAP };
  if (target.left - GAP - card.width > EDGE) return { top, left: target.left - GAP - card.width };
  return { left: vw - card.width - EDGE, bottom: EDGE };
}

export function GuidedTour({ steps, onPrepare, onClose }: Props) {
  const { locale, t } = useApp();
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<Box | null>(null);
  const [card, setCard] = useState({ width: 380, height: 220 });
  const cardRef = useRef<HTMLDivElement>(null);
  const prepareRef = useRef(onPrepare);
  const closeRef = useRef(onClose);
  useEffect(() => {
    prepareRef.current = onPrepare;
    closeRef.current = onClose;
  });

  const step = steps[index];
  const last = index === steps.length - 1;
  const [title, body] = (tourText[locale] ?? tourText['pt-BR'])[step.id];

  // Prepare the step, then track its target every frame (layout shifts, scrolling, resizing).
  useEffect(() => {
    prepareRef.current(step);
    let frame = 0;
    let revealed = false;
    const measure = () => {
      const element = step.target ? findVisible(step.target) : null;
      if (element && !revealed) {
        revealed = true;
        reveal(element);
        // On phones the card docks at the bottom, so bring the target's top into view instead.
        element.scrollIntoView({ block: window.innerWidth < 640 ? 'start' : 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }
      const rect = element?.getBoundingClientRect();
      // Clip to the viewport so tall panels still leave room for the card.
      const next = rect ? (() => {
        const top = Math.max(rect.top - PAD, 0);
        const bottom = Math.min(rect.bottom + PAD, window.innerHeight);
        return { top, left: rect.left - PAD, width: rect.width + PAD * 2, height: Math.max(bottom - top, 0) };
      })() : null;
      setTarget((previous) => (sameBox(previous, next) ? previous : next));
      const node = cardRef.current;
      if (node) setCard((previous) => (previous.width === node.offsetWidth && previous.height === node.offsetHeight ? previous : { width: node.offsetWidth, height: node.offsetHeight }));
    };
    const track = () => {
      measure();
      frame = requestAnimationFrame(track);
    };
    // Measure right away so the previous step's highlight never lingers for a frame.
    measure();
    frame = requestAnimationFrame(track);
    cardRef.current?.focus();
    return () => cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current(false);
      const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]');
      if (typing) return;
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(value + 1, steps.length - 1));
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(value - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steps.length]);

  const progress = t('tourProgress').replace('{current}', String(index + 1)).replace('{total}', String(steps.length));

  return createPortal(
    <div className="guided-tour">
      {target ? <div className="tour-spotlight" style={target} aria-hidden="true" /> : <div className="tour-backdrop" aria-hidden="true" />}
      <div
        ref={cardRef}
        key={step.id}
        className="tour-card"
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        style={placeCard(target, card)}
      >
        <header>
          <span>{progress}</span>
          <button type="button" className="icon-button" onClick={() => onClose(false)} aria-label={t('tourClose')} title={t('tourClose')}>
            <X size={14} aria-hidden="true" />
          </button>
        </header>
        <h2 id="tour-title">{title}</h2>
        <p id="tour-body">{body}</p>
        <div className="tour-progress" aria-hidden="true"><i style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
        <footer>
          {!last && <button type="button" className="text-button" onClick={() => onClose(false)}>{t('tourSkip')}</button>}
          <span />
          {index > 0 && (
            <button type="button" className="secondary-button" onClick={() => setIndex(index - 1)}>
              <ArrowLeft size={14} aria-hidden="true" /> {t('tourBack')}
            </button>
          )}
          {last ? (
            <button type="button" className="primary-button" onClick={() => onClose(true)}>
              <Check size={14} aria-hidden="true" /> {t('tourFinish')}
            </button>
          ) : (
            <button type="button" className="primary-button" onClick={() => setIndex(index + 1)}>
              {t('tourNext')} <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
