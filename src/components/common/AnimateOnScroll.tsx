import { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface AnimateOnScrollProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  distance?: number;
  /**
   * Stretch to the parent grid/flex row height and pass that height down to
   * the single child, so a wrapped card can still fill an equal-height row.
   */
  stretch?: boolean;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Any part of the element inside the viewport at the moment of asking. */
const intersectsViewport = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
};

const EASE = 'cubic-bezier(0.22,1,0.36,1)';

/**
 * Renders visible first, everywhere — the prerendered HTML, the hydrating
 * client, the dev server — and only then decides whether to stage an
 * entrance: content already on screen when the page arrives never fades in
 * (the hero's LCP text used to sit at opacity 0 waiting for an effect), and
 * content below the fold is hidden while it is still off screen, so nobody
 * sees it hide. Keeping the first render identical on server and client is
 * what makes the wrapper hydrate cleanly.
 *
 * The staging is written straight onto the element rather than through state:
 * it is a paint-only change, and going through React would re-render every
 * child twice (once to hide, once to reveal) for nothing. Clearing the inline
 * properties hands the element back to its stylesheet values, which is the
 * visible state; the transition is set only at the reveal, so hiding is
 * instant and only the entrance animates.
 */
export const AnimateOnScroll = ({
  children,
  delay = 0,
  direction = 'up',
  distance = 32,
  stretch = false,
}: AnimateOnScrollProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || intersectsViewport(el)) return;

    const hiddenTransform =
      direction === 'up'
        ? `translateY(${distance}px)`
        : direction === 'left'
          ? `translateX(-${distance}px)`
          : direction === 'right'
            ? `translateX(${distance}px)`
            : 'none';
    const reset = () => {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.willChange = '';
    };

    el.style.opacity = '0';
    el.style.transform = hiddenTransform;
    el.style.willChange = 'opacity, transform';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        el.style.transition = `opacity 0.6s ${EASE} ${delay}ms, transform 0.6s ${EASE} ${delay}ms`;
        reset();
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      reset();
      el.style.transition = '';
    };
  }, [delay, direction, distance]);

  return (
    // Never add overflow:hidden or a persistent transform here: both clip or desynchronize the 34-46px paired shadows of neumorphic children.
    <Box
      ref={ref}
      sx={{
        ...(stretch && {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '& > *': { flex: 1, minHeight: 0 },
        }),
      }}
    >
      {children}
    </Box>
  );
};
