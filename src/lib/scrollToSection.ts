// Shared by every in-page nav control (Header, Footer, HomePage's own scroll-spy)
// so they all land on the same offset instead of drifting apart over time.
const HEADER_OFFSET = 72;

/** Smoothly scrolls the viewport so the element with `id` clears the sticky header. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top: y, behavior: 'smooth' });
}
