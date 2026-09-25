'use client';

import { useEffect, useState } from 'react';
import { prefersReducedMotion } from './motion';

/** Exit animation length; keep in sync with --motion-exit in src/styles/motion.css. */
export const EXIT_MS = 180;

/**
 * Keeps the last truthy `value` rendered for EXIT_MS after it is cleared, so
 * overlays can play an exit animation before unmounting. Render while
 * `rendered` is truthy and pass `state` as `data-state`.
 */
export function usePresence<T>(value: T | null | undefined | false) {
  const [rendered, setRendered] = useState<T | null>(value || null);
  if (value && value !== rendered) setRendered(value);
  const closing = !value && rendered !== null;

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => setRendered(null), prefersReducedMotion() ? 0 : EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  return { rendered: value || rendered, state: closing ? 'closing' : 'open' } as const;
}
