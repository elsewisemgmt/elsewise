/**
 * Scroll reveal, no dependencies.
 *
 * Three deliberate behaviours rather than one effect applied everywhere:
 *
 *   [data-reveal]        an element rises and fades in as it arrives
 *   [data-reveal-group]  its [data-reveal] children arrive in sequence
 *   .rule[data-reveal]   draws itself in from the leading edge instead
 *
 * The hiding styles only apply once this script marks <html data-reveal-ready>,
 * so content stays visible if JS fails or never runs. Reduced motion opts out
 * entirely rather than shortening anything, since the point is to not move.
 */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Stagger is capped so a long roster never leaves the last card waiting. */
const MAX_STAGGER_INDEX = 6;

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
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-revealed', '');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
  );

  for (const target of targets) observer.observe(target);
}

reveal();
