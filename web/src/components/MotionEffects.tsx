'use client';

import { useEffect } from 'react';

// Keep in sync with the "Hover lighting" selector list in src/styles/motion.css.
const GLOW_TARGETS = [
  '.primary-button', '.secondary-button', '.danger-button', '.header-primary', '.feature-grid article', '.topic-card',
  '.project-card', '.extension-directory article', '.definition-pair article', '.flow-card', '.export-grid button',
  '.checklist-item', '.validation-item', '.independence-note', '.recommendation-panel', '.guideline-form fieldset',
  '.empty-state', '.database-sources-block',
].join(', ');

/** Feeds the cursor position to the hover light of the block under the pointer and to the page tilt. */
export function MotionEffects() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let frame = 0;
    let pointer: PointerEvent | null = null;

    const paint = () => {
      frame = 0;
      if (pointer) {
        // Page-wide pointer position in -1..1, used for parallax tilt (see .diagram-preview).
        const root = document.documentElement.style;
        root.setProperty('--px', ((pointer.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        root.setProperty('--py', ((pointer.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      }
      const target = pointer?.target instanceof Element ? pointer.target.closest<HTMLElement>(GLOW_TARGETS) : null;
      if (!pointer || !target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${pointer.clientX - rect.left}px`);
      target.style.setProperty('--my', `${pointer.clientY - rect.top}px`);
    };
    const onMove = (event: PointerEvent) => {
      pointer = event;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
