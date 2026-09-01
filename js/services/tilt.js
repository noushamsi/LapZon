/**
 * LapZon Smooth 2D Interaction & Scroll Reveal Engine
 * Clean, lightweight 2D animations and scroll reveals (Zero 3D perspective / zero tilt).
 */

export function init3DTilt() {
  // 3D Tilt disabled as requested; keeping no-op export for module compatibility
}

export function initScrollReveals() {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  document.querySelectorAll('.reveal-on-scroll, .product-modern-card, .brand-clean-card, .advantage-card').forEach((el) => {
    observer.observe(el);
  });
}
