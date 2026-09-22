import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { soft } from '../../theme/tokens';
import { HERO_BACKDROP } from '../../media/registry';
import { fallbackSrcSet, pictureSources, srcsetEntry } from '../../media/picture';

/** The poster fills the viewport, whatever its width. */
const POSTER_SIZES = '100vw';

/** The rung a preload can name: `<link rel=preload>` takes one URL, and 1280 serves most desktops. */
const PRELOAD_WIDTH = 1280;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * True when the visitor's connection asked for less: the Save-Data hint, or
 * a Network Information API reading below "4g" (2g/3g). Absent API → fine.
 */
const constrainedConnection = () => {
  if (typeof navigator === 'undefined') return false;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return Boolean(connection.effectiveType) && connection.effectiveType !== '4g';
};

/**
 * The loop for this viewport, chosen when the video attaches (never during
 * render: the server has no viewport, and the first client render must match
 * its markup). Widest rung first in the registry; `undefined` below 600 px,
 * where the poster is the backdrop — a phone gains nothing from a loop it
 * cannot see behind the copy, and the bytes come off its LCP.
 */
const pickRung = (): string | undefined => {
  if (typeof window === 'undefined' || !window.matchMedia) return undefined;
  if (!window.matchMedia('(min-width: 600px)').matches) return undefined;
  return HERO_BACKDROP.rungs.find(
    (rung) => window.matchMedia(`(min-width: ${rung.minWidth}px)`).matches
  )?.src;
};

/**
 * Full-bleed, silent loop behind the hero copy. Covers the whole band at its
 * true colours; the only wash is a fade into the page ground along the bottom
 * edge so the band runs seamlessly into the next section.
 *
 * The poster is the home page's LCP image, so it is in the prerendered HTML as
 * a `<picture>` with AVIF/WebP rungs, `fetchpriority="high"` and its intrinsic
 * size, plus a `<link rel="preload">` for the AVIF rungs that React hoists into
 * `<head>` — the browser starts on it before it has parsed the body. The video
 * is the opposite: it waits for the window `load` event (then an idle slot),
 * picks a rung for the viewport, and is skipped altogether on phones, under
 * reduced motion or on a constrained connection, so it never competes with the
 * poster. It fades in over the poster once it is actually playing, and pauses
 * while the band is off screen.
 */
export const HeroVideoBackdrop = () => {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** The rung to play; null until the page has loaded (and always null on the server). */
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const { poster } = HERO_BACKDROP;
  const avifSrcSet = poster.sources.avif;
  const preloadHref = avifSrcSet ? srcsetEntry(avifSrcSet, PRELOAD_WIDTH) : undefined;

  // Attach after load: the loop must not share bandwidth with the poster,
  // the fonts or the route's code. requestIdleCallback with a timeout so a
  // busy main thread still gets the loop within a couple of seconds.
  useEffect(() => {
    if (prefersReducedMotion() || constrainedConnection()) return;
    let cancelled = false;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const attach = () => {
      if (cancelled) return;
      const rung = pickRung();
      if (rung) setSrc(rung);
    };
    const whenIdle = () => {
      if (cancelled) return;
      if ('requestIdleCallback' in window)
        idle = window.requestIdleCallback(attach, { timeout: 2000 });
      else timer = setTimeout(attach, 500);
    };
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', whenIdle);
      if (idle !== undefined && 'cancelIdleCallback' in window) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  // Once attached: load and play, and pause while off screen — a loop nobody
  // sees still burns a core. <source> added after mount does not load itself.
  useEffect(() => {
    if (!src) return;
    const frame = frameRef.current;
    const video = videoRef.current;
    if (!frame || !video) return;
    video.load();
    video.play().catch(() => {});
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.1 }
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [src]);

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
      {preloadHref && (
        // Hoisted into <head> by React (also by renderToString, ahead of the
        // markup). `type` makes a browser without AVIF skip it and take the
        // WebP/JPEG from the <picture> instead; one that has AVIF fetches the
        // same rung the <picture> will pick, since srcset and sizes match.
        <link
          rel="preload"
          as="image"
          href={preloadHref}
          imageSrcSet={avifSrcSet}
          imageSizes={POSTER_SIZES}
          type="image/avif"
          fetchPriority="high"
        />
      )}
      <Box component="picture" sx={{ '& > img': cover }}>
        {pictureSources(poster).map(({ type, srcSet }) => (
          <source key={type} type={type} srcSet={srcSet} sizes={POSTER_SIZES} />
        ))}
        <img
          src={poster.img.src}
          srcSet={fallbackSrcSet(poster)}
          sizes={POSTER_SIZES}
          width={poster.img.w}
          height={poster.img.h}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </Box>
      {src && (
        <Box
          component="video"
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          onPlaying={() => setPlaying(true)}
          sx={{
            ...cover,
            // Transparent until the first frame plays: no poster attribute (it
            // would fetch the JPEG the <picture> already replaced) and no black
            // box in browsers that paint one while a video is still loading.
            opacity: playing ? 1 : 0,
            transition: 'opacity 600ms ease',
          }}
        >
          <source src={src} type="video/mp4" />
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
