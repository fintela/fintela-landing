import { useRef, useEffect, useState } from 'react';
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

export const AnimateOnScroll = ({
  children,
  delay = 0,
  direction = 'up',
  distance = 32,
  stretch = false,
}: AnimateOnScrollProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useRef<boolean>(prefersReducedMotion());

  useEffect(() => {
    if (reduced.current) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform = () => {
    if (reduced.current) return 'none';
    if (direction === 'up') return `translateY(${distance}px)`;
    if (direction === 'left') return `translateX(-${distance}px)`;
    if (direction === 'right') return `translateX(${distance}px)`;
    return 'none';
  };

  return (
    // Never add overflow:hidden or a persistent transform here: both clip or desynchronize the 34-46px paired shadows of neumorphic children.
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : hiddenTransform(),
        transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: visible ? 'auto' : 'opacity, transform',
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
