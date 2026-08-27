/**
 * Featured artist carousel, no dependencies.
 *
 * Auto-advancing content is a genuine accessibility hazard, so it is bounded:
 *
 *  - reduced motion never autoplays; the controls still work manually
 *  - it pauses on hover and on keyboard focus, and while the tab is hidden
 *  - there is a real pause control, because hover is not available on touch
 *  - inactive slides are `inert`, so their links stay out of the tab order
 *
 * Without JS the first slide is shown and the controls stay hidden.
 */
import { prefersReducedMotion } from './motion';

function setupCarousel(root: HTMLElement) {
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dot]'));
  const toggle = root.querySelector<HTMLButtonElement>('[data-toggle]');
  if (slides.length < 2) return;

  const interval = Number(root.dataset.interval) || 7000;
  let index = 0;
  let timer: number | undefined;
  /** The reader asked for it to stop; hover and focus must not undo that. */
  let stoppedByUser = prefersReducedMotion.matches;
  let suspended = false;

  root.setAttribute('data-enhanced', '');

  const show = (next: number) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.toggleAttribute('data-active', active);
      slide.inert = !active;
    });
    dots.forEach((dot, i) => {
      dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  };

  const stop = () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    root.removeAttribute('data-playing');
  };

  const start = () => {
    stop();
    if (stoppedByUser || suspended || prefersReducedMotion.matches) return;
    root.setAttribute('data-playing', '');
    timer = window.setInterval(() => show(index + 1), interval);
  };

  /** Pause for hover, focus or a hidden tab without clearing the user's choice. */
  const suspend = () => {
    suspended = true;
    stop();
  };

  const resume = () => {
    suspended = false;
    start();
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      show(i);
      // Restart the interval so a chosen slide gets its full time.
      if (!stoppedByUser && !suspended) start();
    });
  });

  toggle?.addEventListener('click', () => {
    stoppedByUser = !stoppedByUser;
    toggle.setAttribute('aria-pressed', String(stoppedByUser));
    toggle.textContent = stoppedByUser ? 'Play' : 'Pause';
    if (stoppedByUser) stop();
    else start();
  });

  root.addEventListener('mouseenter', suspend);
  root.addEventListener('mouseleave', resume);
  root.addEventListener('focusin', suspend);
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget as Node | null)) resume();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend();
    else resume();
  });

  prefersReducedMotion.addEventListener('change', () => {
    stoppedByUser = prefersReducedMotion.matches;
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(stoppedByUser));
      toggle.textContent = stoppedByUser ? 'Play' : 'Pause';
    }
    if (stoppedByUser) stop();
    else start();
  });

  if (toggle && stoppedByUser) {
    toggle.setAttribute('aria-pressed', 'true');
    toggle.textContent = 'Play';
  }

  show(0);
  start();
}

for (const root of document.querySelectorAll<HTMLElement>('[data-featured-carousel]')) {
  setupCarousel(root);
}
