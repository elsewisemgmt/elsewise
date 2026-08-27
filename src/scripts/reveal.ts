/**
 * Scroll reveal, no dependencies.
 *
 * Three deliberate behaviours rather than one effect applied everywhere:
 *
 *   [data-reveal]        an element rises and fades in as it arrives
 *   [data-reveal-group]  its [data-reveal] children arrive in sequence
 *   .rule[data-reveal]   draws itself in from the leading edge instead
 *
 * Reveals are reversible: an element that leaves the viewport returns to its
 * hidden state, so scrolling back up replays the arrival rather than showing
 * everything already settled.
 *
 * The hiding styles only apply once this script marks <html data-reveal-ready>,
 * so content stays visible if JS fails or never runs. Reduced motion opts out
 * entirely rather than shortening anything, since the point is to not move.
 */
import { prefersReducedMotion } from './motion';

/** Stagger is capped so a long roster never leaves the last card waiting. */
const MAX_STAGGER_INDEX = 6;

/**
 * Separate enter and exit points. Revealing at 6% visible while only hiding
 * once an element is fully gone leaves a dead band between the two, so a
 * reader resting near the boundary cannot flicker the animation on and off.
 */
const ENTER_RATIO = 0.06;

function assignStagger() {
  for (const group of document.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    const children = group.querySelectorAll<HTMLElement>(':scope > [data-reveal]');
    children.forEach((child, index) => {
      child.style.setProperty('--reveal-i', String(Math.min(index, MAX_STAGGER_INDEX)));
    });
  }
}

function reveal() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (targets.length === 0) return;

  if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) return;

  document.documentElement.setAttribute('data-reveal-ready', '');
  assignStagger();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;

        if (entry.intersectionRatio >= ENTER_RATIO) {
          target.setAttribute('data-revealed', '');
        } else if (!entry.isIntersecting) {
          // Fully out of view, in either direction — reset so the next
          // approach animates again.
          target.removeAttribute('data-revealed');
        }
        // Between the two: leave whatever state it is already in.
      }
    },
    { threshold: [0, ENTER_RATIO] },
  );

  for (const target of targets) observer.observe(target);
}

reveal();
