import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fonts, motion, palette, soft } from '../../theme/tokens';
import { focusRingSx, forcedColorsFocus } from '../../theme/neu';
import { CALLOUT_SIDE, STACK_LAYERS } from './layers';
import type { StackAnchor } from './layers';
import type { StackScene } from './scene';

/** From lg the callouts hang beside the stack on leader lines; below, they list under it. */
const SIDE_QUERY = '(min-width: 1200px)';
/** px kept clear on each side of the stack for a callout: leader, gap and text. */
const CALLOUT_RESERVE = 290;
const LEADER = 44;

type Status = 'loading' | 'ready' | 'failed';

/**
 * The three-layer isometric stack (interface, engine, intelligence) as a
 * WebGL object, with a callout per layer.
 *
 * The scene (scene.ts, and three.js with it) is fetched a screen before the
 * band arrives and never on the server; until then the canvas box holds its
 * size, so nothing shifts when it paints. The callouts are real text in the
 * DOM from the first render. From lg they follow their plate's corner, fed
 * by the scene through CSS custom properties rather than React state (it
 * moves them every frame); below lg they list under the canvas, with
 * numbered markers on the plates. If WebGL is unavailable the list is all
 * that shows.
 *
 * Hovering or focusing a callout shows its layer, the same as hovering the
 * plate; the scene reports whichever layer is shown back through
 * `onActiveChange`, so the callouts and the plates always agree.
 */
export const PlatformStack = () => {
  const { t } = useTranslation('home');
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const calloutRefs = useRef<Array<HTMLLIElement | null>>([]);
  const markerRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const sceneRef = useRef<StackScene | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    let disposed = false;
    let scene: StackScene | null = null;
    let inView = false;
    let width = 0;
    let height = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const side = window.matchMedia(SIDE_QUERY);

    const onAnchors = (anchors: readonly StackAnchor[]) => {
      anchors.forEach((anchor, i) => {
        for (const el of [calloutRefs.current[i], markerRefs.current[i]]) {
          if (!el) continue;
          el.style.setProperty('--ax', `${anchor.x.toFixed(1)}px`);
          el.style.setProperty('--ay', `${anchor.y.toFixed(1)}px`);
          el.dataset.placed = String(anchor.visible);
        }
      });
    };

    const layout = () => {
      if (scene && width && height) scene.resize(width, height, side.matches ? CALLOUT_RESERVE : 0);
    };
    const run = () => scene?.setRunning(inView && document.visibilityState === 'visible');

    const load = async () => {
      try {
        const { createStackScene } = await import('./scene');
        if (disposed) return;
        const created = await createStackScene({
          canvas,
          reducedMotion: reduced.matches,
          onActiveChange: setActive,
          onAnchors,
        });
        if (disposed) {
          created.dispose();
          return;
        }
        scene = created;
        sceneRef.current = created;
        setStatus('ready');
        layout();
        run();
      } catch {
        // No WebGL (or the chunk failed): the callout list stands on its own.
        if (!disposed) setStatus('failed');
      }
    };

    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        nearby.disconnect();
        void load();
      },
      { rootMargin: '600px 0px' },
    );
    nearby.observe(host);
    // The entrance plays once, bottom plate first, so it waits until enough
    // of the canvas is on screen to be seen; after that any sliver runs it.
    let armed = false;
    const visible = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.4) armed = true;
        inView = armed && entry.isIntersecting;
        run();
      },
      { threshold: [0, 0.4] },
    );
    visible.observe(host);
    const resize = new ResizeObserver((entries) => {
      ({ width, height } = entries[entries.length - 1].contentRect);
      layout();
    });
    resize.observe(host);

    // ResizeObserver is silent when only the pixel ratio changes (the window
    // dragged to a monitor of another density), so watch that too.
    let dprQuery: MediaQueryList | null = null;
    const onDpr = () => {
      watchDpr();
      layout();
    };
    const watchDpr = () => {
      dprQuery?.removeEventListener('change', onDpr);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener('change', onDpr);
    };
    watchDpr();

    const onMotion = () => scene?.setReducedMotion(reduced.matches);
    document.addEventListener('visibilitychange', run);
    reduced.addEventListener('change', onMotion);
    side.addEventListener('change', layout);

    return () => {
      disposed = true;
      nearby.disconnect();
      visible.disconnect();
      resize.disconnect();
      dprQuery?.removeEventListener('change', onDpr);
      document.removeEventListener('visibilitychange', run);
      reduced.removeEventListener('change', onMotion);
      side.removeEventListener('change', layout);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Hover and focus preview a layer; a press pins it (and is how a phone,
  // with no hover, opens one from the list). Letting go falls back to the pin.
  const pinnedRef = useRef<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const show = (layer: number) => sceneRef.current?.setActive(layer);
  const release = () => sceneRef.current?.setActive(pinnedRef.current);
  const togglePin = (layer: number) => {
    const next = pinnedRef.current === layer ? null : layer;
    pinnedRef.current = next;
    setPinned(next);
    // Still under the pointer or focus: keep showing it until that ends.
    show(next ?? layer);
  };
  // With no canvas the list lays out as it does below lg, at every width.
  const failed = status === 'failed';

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        ref={hostRef}
        aria-hidden
        sx={{
          position: 'relative',
          display: failed ? 'none' : 'block',
          height: { xs: 'auto', sm: 620, md: 680, lg: 780 },
          aspectRatio: { xs: '3 / 4', sm: 'auto' },
          '@media print': { display: 'none' },
        }}
      >
        <Box
          component="canvas"
          ref={canvasRef}
          sx={{
            display: 'block',
            width: '100%',
            height: '100%',
            // Vertical swipes still scroll the page; sideways ones turn the stack.
            touchAction: 'pan-y',
            // The ground shadow dissolves into the band instead of meeting the edge.
            maskImage: 'linear-gradient(to bottom, #000 calc(100% - 48px), transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 calc(100% - 48px), transparent)',
            opacity: status === 'ready' ? 1 : 0,
            transition: `opacity ${motion.slow}`,
          }}
        />
        {STACK_LAYERS.map((layer, i) => (
          <Box
            key={layer}
            component="span"
            ref={(el: HTMLSpanElement | null) => {
              markerRefs.current[i] = el;
            }}
            data-placed="false"
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 24,
              height: 24,
              display: { xs: 'flex', lg: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              fontFamily: fonts.mono,
              fontSize: '0.66rem',
              fontWeight: 700,
              color: palette.navy,
              background: active === i ? palette.yellow : soft.white,
              border: `1.5px solid ${palette.navy}`,
              pointerEvents: 'none',
              opacity: 0,
              transform: `translate(calc(var(--ax, 0px) ${CALLOUT_SIDE[layer] === 'right' ? '+ 6px' : '- 30px'}), calc(var(--ay, 0px) - 12px))`,
              transition: `opacity ${motion.base}, background ${motion.fast}`,
              '&[data-placed="true"]': { opacity: 1 },
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </Box>
        ))}
      </Box>

      <Box
        component="ol"
        aria-label={t('stack.listLabel')}
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          mt: failed ? 0 : { xs: 3, lg: 0 },
          display: failed ? 'grid' : { xs: 'grid', lg: 'block' },
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' },
          gap: { xs: 2, md: 3 },
        }}
      >
        {STACK_LAYERS.map((layer, i) => {
          const right = CALLOUT_SIDE[layer] === 'right';
          const isActive = active === i;
          // Above the shown layer, plates are ghosted; their callouts step back further.
          const emphasis = active === null || isActive ? 1 : i < active ? 0.38 : 0.55;
          return (
            <Box
              key={layer}
              component="li"
              ref={(el: HTMLLIElement | null) => {
                calloutRefs.current[i] = el;
              }}
              data-placed="false"
              sx={{
                position: 'relative',
                ...(failed
                  ? {}
                  : {
                      // A zero-size point at the plate's corner; the button hangs off it.
                      '@media (min-width: 1200px)': {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 0,
                        height: 0,
                        transform: 'translate(var(--ax, 0px), var(--ay, 0px))',
                        opacity: 0,
                        transition: `opacity ${motion.slow}`,
                        '&[data-placed="true"]': { opacity: 1 },
                      },
                    }),
              }}
            >
              <Box
                component="button"
                type="button"
                aria-pressed={pinned === i}
                onMouseEnter={() => show(i)}
                onMouseLeave={release}
                onFocus={() => show(i)}
                onBlur={release}
                onClick={() => togglePin(i)}
                sx={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: { xs: 'flex-start', lg: 'center' },
                  gap: 1.5,
                  width: '100%',
                  p: { xs: 2, lg: 0 },
                  borderRadius: 2,
                  borderLeft: { xs: `3px solid ${isActive ? palette.yellow : 'transparent'}`, lg: 'none' },
                  opacity: emphasis,
                  transition: `opacity ${motion.base}, border-color ${motion.fast}`,
                  ...focusRingSx,
                  '@media (forced-colors: active)': { ...forcedColorsFocus },
                  ...(failed
                    ? {}
                    : {
                        '@media (min-width: 1200px)': {
                          position: 'absolute',
                          top: 0,
                          width: 'max-content',
                          maxWidth: CALLOUT_RESERVE - 16,
                          transform: 'translateY(-50%)',
                          flexDirection: right ? 'row' : 'row-reverse',
                          textAlign: right ? 'left' : 'right',
                          ...(right ? { left: -5 } : { right: -5 }),
                        },
                      }),
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    display: failed ? 'none' : { xs: 'none', lg: 'flex' },
                    alignItems: 'center',
                    flexDirection: right ? 'row' : 'row-reverse',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      border: `2px solid ${palette.navy}`,
                      background: isActive ? palette.yellow : soft.ground,
                      transition: `background ${motion.fast}`,
                    }}
                  />
                  <Box
                    sx={{
                      width: LEADER,
                      borderTop: `1.5px ${isActive ? 'solid' : 'dashed'} ${palette.navy}`,
                      opacity: isActive ? 0.9 : 0.4,
                    }}
                  />
                </Box>
                <Box
                  aria-hidden
                  sx={{
                    display: failed ? 'flex' : { xs: 'flex', lg: 'none' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    mt: 0.25,
                    borderRadius: '50%',
                    fontFamily: fonts.mono,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: palette.navy,
                    background: isActive ? palette.yellow : soft.white,
                    border: `1.5px solid ${palette.navy}`,
                    transition: `background ${motion.fast}`,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component="span"
                    sx={{
                      // Below lg (and without the canvas) the round badge carries the number.
                      display: failed ? 'none' : { xs: 'none', lg: 'block' },
                      fontFamily: fonts.mono,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      color: soft.textSecondary,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{ display: 'block', fontSize: '1.05rem', fontWeight: 800, color: soft.text, lineHeight: 1.3 }}
                  >
                    {t(`stack.layers.${layer}.name`)}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      fontSize: '0.86rem',
                      color: soft.textSecondary,
                      lineHeight: 1.55,
                      maxWidth: { lg: 214 },
                      ml: right ? 0 : { lg: 'auto' },
                    }}
                  >
                    {t(`stack.layers.${layer}.desc`)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {!failed && (
        <Typography
          sx={{
            mt: { xs: 2, lg: 1 },
            textAlign: 'center',
            fontFamily: fonts.mono,
            fontSize: '0.72rem',
            letterSpacing: '0.04em',
            color: soft.textSecondary,
            '& > span:first-of-type': { display: 'none' },
            '@media (hover: hover) and (pointer: fine)': {
              '& > span:first-of-type': { display: 'inline' },
              '& > span:last-of-type': { display: 'none' },
            },
          }}
        >
          <span>{t('stack.hintPointer')}</span>
          <span>{t('stack.hintTouch')}</span>
        </Typography>
      )}
    </Box>
  );
};
