import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { soft } from '../../theme/tokens';
import { HERO_BACKDROP } from '../../media/registry';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const saveData = () =>
  typeof navigator !== 'undefined' &&
  Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

/**
 * Full-bleed, silent loop behind the hero copy. Covers the whole band at its
 * true colours; the only wash is a fade into the page ground along the bottom
 * edge so the band runs seamlessly into the next section. Under reduced motion or a data-saver
 * connection the poster stands in for the video; off screen the loop pauses.
 */
export const HeroVideoBackdrop = () => {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [attached, setAttached] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || prefersReducedMotion() || saveData()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (entry.isIntersecting) {
          setAttached(true);
          video?.play().catch(() => {});
        } else {
          video?.pause();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!attached) return;
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => {});
  }, [attached]);

  const cover = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 40%',
  } as const;

  return (
    <Box
      ref={frameRef}
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: soft.ground,
        '@media (forced-colors: active)': { display: 'none' },
        '@media print': { display: 'none' },
      }}
    >
      <Box component="img" src={HERO_BACKDROP.poster} alt="" sx={cover} />
      {attached && (
        <Box
          component="video"
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          poster={HERO_BACKDROP.poster}
          sx={cover}
        >
          <source src={HERO_BACKDROP.src} type="video/mp4" />
        </Box>
      )}
      {/* Fade into the ground so the band hands off to the next section without a seam. */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: { xs: 160, md: 200 },
          background: `linear-gradient(180deg, transparent 0%, ${soft.ground}b3 55%, ${soft.ground} 100%)`,
        }}
      />
    </Box>
  );
};
