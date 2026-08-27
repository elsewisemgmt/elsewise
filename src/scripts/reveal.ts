/**
 * Scroll reveal, no dependencies.
 *
 * Opt in by putting `data-reveal` on an element. The hiding styles only apply
 * once this script marks <html data-reveal-ready>, so content stays visible if
 * JS fails or never runs. Reduced motion opts out entirely rather than
 * shortening the animation, since the point is to not move things.
 */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function reveal() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (targets.length === 0) return;

  if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) return;

  document.documentElement.setAttribute('data-reveal-ready', '');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-revealed', '');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );

  for (const target of targets) observer.observe(target);
}

reveal();
