/**
 * One source of truth for the reduced-motion preference, shared by every
 * script that animates. Live, so a reader changing the system setting is
 * honoured without a reload.
 */
export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
