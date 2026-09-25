/** Motion helpers shared by components; the visual rules live in src/styles/motion.css. */

export const prefersReducedMotion = () =>
  document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs a DOM update inside a same-document view transition when supported and
 * motion is allowed; otherwise applies it directly.
 */
export function withViewTransition(update: () => void) {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  // A transition is skipped when another starts or the page is hidden; its
  // `ready` promise then rejects, which is expected and safe to ignore.
  document.startViewTransition(update).ready.catch(() => undefined);
}
