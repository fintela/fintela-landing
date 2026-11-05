import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Box, GlobalStyles } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fonts, gradients, motion, palette, shadows, soft } from '../../theme/tokens';
import { focusRingSx, forcedColorsFocus, wellSx } from '../../theme/neu';
import { NeuPanel } from '../primitives/NeuPanel';
import { HEADER_OFFSET } from '../../lib/scrollToSection';
import { useMediaMatch } from '../../lib/useMediaMatch';
import { LINE, ORIGIN, PLATE, STATIONS, floorAt, screenAt } from './stations';
import type { StationKey } from './stations';
import { Lifted, PlateArt } from './plates';
import { StationSurface } from './Surfaces';

const N = STATIONS.length;
const STUDIES = STATIONS.indexOf('studies');
/** Scroll per station while the band is pinned, in viewport heights. */
const STEP_VH = 55;
/**
 * Pinning needs the line and both cards on one screen, under the header. The
 * cards are about 530 px tall from 1100 px wide and up to 610 px at 900 px
 * (Portuguese, the longest copy), so the window must be 640 px tall in the
 * first case and 720 px in the second. Narrower or shorter windows read the
 * stations one after another in the page's own flow.
 */
const PIN_QUERY = '(min-width: 1100px) and (min-height: 640px), (min-width: 900px) and (min-height: 720px)';
const PIN = `@media ${PIN_QUERY}`;
/** Wide enough for the line but too short to pin: each station's two cards side by side. */
const WIDE_FLOW =
  '@media (min-width: 1100px) and (max-height: 639.95px), (min-width: 900px) and (max-width: 1099.95px) and (max-height: 719.95px)';
const REDUCED = '(prefers-reduced-motion: reduce)';
/** The column of station names beside the line (px), and its gap from the plates. */
const LABELS_W = 190;
const LABELS_GAP = 20;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const LineKeyframes = memo(() => (
  <GlobalStyles
    styles={{
      '@keyframes alFlow': { to: { strokeDashoffset: -28 } },
      '@keyframes alHone': {
        from: { transform: 'translate(var(--dx), var(--dy))', opacity: 0.35 },
        to: { transform: 'translate(0, 0)', opacity: 1 },
      },
      '@keyframes alPulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
      '@keyframes alPop': { from: { transform: 'scale(0.6)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
      '@keyframes alRing': { from: { transform: 'scale(0.6)', opacity: 0.8 }, to: { transform: 'scale(1.9)', opacity: 0 } },
      '.alFlow': { strokeDasharray: '2 12', animation: 'alFlow 1.1s linear infinite' },
      '.alHone': { animation: 'alHone 2.2s cubic-bezier(.2,.8,.2,1) infinite alternate' },
      '.alPulse': { animation: 'alPulse 1.4s ease-in-out infinite' },
      '.alRing': { transformBox: 'fill-box', transformOrigin: 'center', animation: 'alRing 1.8s ease-out infinite' },
    }}
  />
));
LineKeyframes.displayName = 'LineKeyframes';

/** Each plate's centre on the floor, and the box the track's SVG needs to hold them all. */
const PLATES = STATIONS.map((_, i) => {
  const at = screenAt(i);
  return floorAt(at.x - ORIGIN.x, at.y - ORIGIN.y);
});
const TRACK = PLATES.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
const TRACK_BOX = (() => {
  const xs = PLATES.map((p) => p.x);
  const ys = PLATES.map((p) => p.y);
  const x = Math.min(...xs) - 20;
  const y = Math.min(...ys) - 20;
  return { x, y, w: Math.max(...xs) + 20 - x, h: Math.max(...ys) + 20 - y };
})();

/**
 * The isometric line: five plates down a gentle zigzag and the track between
 * them. The navy fill follows the scroll continuously (written straight to
 * `fillRef`, outside React); the active plate rises and its pieces lift off
 * it, and the ones behind it wear a check. Plates are pointer shortcuts only;
 * the station names beside them are the accessible controls.
 */
const Line = memo(
  ({
    active,
    scale,
    onPick,
    fillRef,
  }: {
    active: number;
    scale: number;
    onPick: (i: number) => void;
    fillRef: RefObject<SVGPolylineElement | null>;
  }) => (
    <div
      style={{
        position: 'absolute',
        left: ORIGIN.x * scale,
        top: ORIGIN.y * scale,
        width: 0,
        height: 0,
        transformOrigin: '0 0',
        transformStyle: 'preserve-3d',
        transform: `scale(${scale}) rotateX(55deg) rotateZ(-35deg)`,
      }}
    >
      <svg
        width={TRACK_BOX.w}
        height={TRACK_BOX.h}
        viewBox={`${TRACK_BOX.x} ${TRACK_BOX.y} ${TRACK_BOX.w} ${TRACK_BOX.h}`}
        aria-hidden
        // maxWidth: index.css caps every svg at its container's width, and the floor is 0 wide.
        style={{ position: 'absolute', left: TRACK_BOX.x, top: TRACK_BOX.y, overflow: 'visible', maxWidth: 'none' }}
      >
        <polyline points={TRACK} fill="none" stroke="#cfcfcf" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
        <polyline
          ref={fillRef}
          points={TRACK}
          pathLength={1}
          fill="none"
          stroke={palette.navy}
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="1 1"
          strokeDashoffset={1}
        />
        <polyline points={TRACK} fill="none" stroke={palette.yellow} strokeWidth="4" strokeLinecap="round" className="alFlow" />
      </svg>

      {STATIONS.map((key, i) => {
        const on = i === active;
        const dark = key === 'connectBroker';
        return (
          <div
            key={key}
            style={{
              position: 'absolute',
              left: PLATES[i].x - PLATE / 2,
              top: PLATES[i].y - PLATE / 2,
              width: PLATE,
              height: PLATE,
              transformStyle: 'preserve-3d',
              transform: `translateZ(${on ? 30 : i < active ? 8 : 0}px)`,
              transition: 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            <Box
              component="button"
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => onPick(i)}
              sx={{
                all: 'unset',
                position: 'absolute',
                inset: 0,
                cursor: 'pointer',
                borderRadius: '18px',
                background: dark ? '#1a1a1a' : '#ffffff',
                boxShadow: dark
                  ? '-3px 5px 0 #3a3a3a, -6px 10px 0 #2a2a2a, -18px 32px 40px rgba(0,0,0,0.26)'
                  : '-3px 5px 0 #dedede, -6px 10px 0 #cfcfcf, -18px 32px 40px rgba(0,0,0,0.20)',
                outline: on ? `3px solid ${palette.yellow}` : '0 solid transparent',
                outlineOffset: '6px',
                transformStyle: 'preserve-3d',
                transition: `outline-color ${motion.fast}`,
              }}
            >
              <PlateArt station={key} />
              <Lifted station={key} on={on} />
              {i < active && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: palette.success,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translateZ(2px)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path d="M2.5 6.2 L5 8.6 L9.6 3.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Box>
              )}
            </Box>
          </div>
        );
      })}
    </div>
  ),
);
Line.displayName = 'Line';

/**
 * The station names, one beside each plate's level: the accessible way
 * through the line (each one scrolls the band to its station). The active
 * one carries the packet — what the work has become at that step.
 */
const Labels = memo(({ active, scale, onPick }: { active: number; scale: number; onPick: (i: number) => void }) => {
  const { t } = useTranslation('home');
  return (
    <>
      {STATIONS.map((key, i) => {
        const name = t(`workflow.nodes.${key}.label`);
        const on = i === active;
        return (
          <div
            key={key}
            style={{
              position: 'absolute',
              left: LINE.w * scale + LABELS_GAP,
              top: screenAt(i).y * scale,
              width: LABELS_W,
              transform: 'translateY(-50%)',
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => onPick(i)}
              aria-label={t('workflow.line.stepLabel', { n: i + 1, name })}
              aria-current={on ? 'step' : undefined}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                boxSizing: 'border-box',
                maxWidth: '100%',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: 15,
                fontWeight: on ? 800 : 600,
                color: on ? soft.text : soft.textSecondary,
                transition: `color ${motion.base}`,
                '@media (hover: hover)': { '&:hover': { color: soft.text } },
                ...focusRingSx,
                '@media (forced-colors: active)': { ...forcedColorsFocus },
              }}
            >
              <Box component="span" sx={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 500, color: soft.textSecondary }}>
                {`0${i + 1}`}
              </Box>
              {name}
            </Box>
            {on && (
              <Box
                key={key}
                aria-hidden
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  height: 28,
                  px: 1.25,
                  borderRadius: 999,
                  background: palette.navy,
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 10px 22px rgba(0,0,0,0.22)',
                  fontFamily: key === 'strategies' ? fonts.mono : undefined,
                  transformOrigin: 'left center',
                  animation: 'alPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                }}
              >
                <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', background: palette.yellow }} />
                {t(`workflow.line.tokens.${key}`)}
              </Box>
            )}
          </div>
        );
      })}
    </>
  );
});
Labels.displayName = 'Labels';

/**
 * The pinned frame's left column: the line and its names, scaled to the room
 * the column has (both ways, so a short window shrinks the line rather than
 * cropping it) and centred in it. Only shown while pinned.
 */
const Stage = ({
  active,
  onPick,
  fillRef,
}: {
  active: number;
  onPick: (i: number) => void;
  fillRef: RefObject<SVGPolylineElement | null>;
}) => {
  const { t } = useTranslation('home');
  const boxRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setRoom((r) => (r.w === width && r.h === height ? r : { w: width, h: height }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = room.w
    ? Math.max(0.4, Math.min(1, (room.w - LABELS_W - LABELS_GAP) / LINE.w, room.h / LINE.h))
    : 0.8;
  const width = LINE.w * scale + LABELS_GAP + LABELS_W;
  const height = LINE.h * scale;

  return (
    <Box
      ref={boxRef}
      role="group"
      aria-label={t('workflow.line.label')}
      sx={{ display: 'none', [PIN]: { display: 'block', position: 'relative', alignSelf: 'stretch', minWidth: 0, userSelect: 'none' } }}
    >
      <div
        style={{
          position: 'absolute',
          left: Math.max(0, (room.w - width) / 2),
          top: Math.max(0, (room.h - height) / 2),
          width,
          height,
        }}
      >
        <Line active={active} scale={scale} onPick={onPick} fillRef={fillRef} />
        <Labels active={active} scale={scale} onPick={onPick} />
      </div>
    </Box>
  );
};

/**
 * One station's two cards: what the step is (the description card) above
 * the piece of the product it produces (the example card). While pinned all
 * five sit in one grid cell and cross-fade, so the column is as tall as the
 * tallest station and never jumps; in the flow they simply follow each other.
 */
const StationCards = memo(
  ({ station, index, on, progress }: { station: StationKey; index: number; on: boolean; progress: number }) => {
    const { t } = useTranslation('home');
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 2.5,
          alignContent: 'start',
          [WIDE_FLOW]: { gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)', gap: 4, alignItems: 'start' },
          [PIN]: {
            gridArea: '1 / 1',
            opacity: on ? 1 : 0,
            visibility: on ? 'visible' : 'hidden',
            transform: on ? 'none' : 'translateY(10px)',
            transition: on
              ? 'opacity 0.4s ease 0.08s, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.08s, visibility 0s'
              : 'opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.2s',
          },
        }}
      >
        <NeuPanel sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
            <Box
              aria-hidden
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 16,
                color: soft.white,
                background: gradients.brand,
                boxShadow: shadows.brandStrong,
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box component="h3" sx={{ m: 0, fontSize: { xs: 21, md: 24 }, fontWeight: 800, letterSpacing: '-0.01em', color: soft.text }}>
                {t(`workflow.nodes.${station}.label`)}
              </Box>
              <Box sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: soft.textSecondary }}>
                {t(`workflow.nodes.${station}.sub`)}
              </Box>
            </Box>
          </Box>
          <Box component="p" sx={{ m: 0, fontSize: { xs: 15, md: 16 }, lineHeight: 1.6, color: soft.textSecondary }}>
            {t(`workflow.nodes.${station}.desc`)}
          </Box>
          <Box
            sx={{
              ...wellSx('sm'),
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.75,
              py: 1.25,
              borderRadius: '12px',
              fontSize: 14,
              fontWeight: 600,
              color: soft.text,
            }}
          >
            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', background: palette.yellow, flexShrink: 0 }} />
            {t(`workflow.line.handoff.${station}`)}
          </Box>
        </NeuPanel>
        <NeuPanel sx={{ p: { xs: 2.25, md: 3 }, minWidth: 0, overflow: 'hidden' }}>
          <StationSurface station={station} progress={progress} />
        </NeuPanel>
      </Box>
    );
  },
);
StationCards.displayName = 'StationCards';

/**
 * The platform band's diagram: the pipeline as an isometric line, walked by
 * scrolling. One packet travels five stations — asset groups, strategies,
 * studies, portfolios, broker — changing what it is as each step hands its
 * output to the next (11 ETFs → sector_momentum → 1,000 trials → top
 * portfolio → live), while the cards on the right say what the step is and
 * show the piece of the product it produces.
 *
 * Where there is room (PIN_QUERY) the frame pins under the header: the band
 * is STEP_VH of scroll per station taller than the screen, the frame sticks
 * while that scroll passes, and each slice of it is one station — the track
 * fills with the scroll itself, the study's trials count up through its
 * slice, and once the last station is reached the frame lets go and the page
 * scrolls on. It is plain `position: sticky` over the page's own scroll, so
 * the wheel, keys, scrollbar and touch all drive it and nothing is hijacked;
 * a station name jumps the scroll to that station. Elsewhere — phones, short
 * windows, print — the five stations follow each other in the flow, and the
 * prerendered page carries all five either way.
 *
 * Drawn in CSS 3D, like the Fintelligent demo: the plates are HTML, so the
 * art stays crisp and the band prerenders.
 */
export const AssemblyLine = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGPolylineElement>(null);
  const pinned = useMediaMatch(PIN_QUERY);
  const reduced = useMediaMatch(REDUCED);
  const [active, setActive] = useState(0);
  const [study, setStudy] = useState(0);

  // Scroll → station, read from the track's place under the header.
  useEffect(() => {
    if (!pinned) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const track = trackRef.current;
      const frame = frameRef.current;
      if (!track || !frame) return;
      const span = track.offsetHeight - frame.offsetHeight;
      // Stations walked so far, 0 … N: each station is one slice of the span.
      const at = span > 0 ? clamp01((HEADER_OFFSET - track.getBoundingClientRect().top) / span) * N : 0;
      const i = Math.min(N - 1, Math.floor(at));
      setActive(i);
      // The trials finish four fifths of the way through their slice, in 64 steps.
      setStudy(i < STUDIES ? 0 : i > STUDIES ? 1 : Math.round(clamp01((at - i) / 0.8) * 64) / 64);
      // The track reaches each plate as its station becomes active.
      fillRef.current?.setAttribute('stroke-dashoffset', (1 - clamp01(at / (N - 1))).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pinned]);

  // A station name (or plate) scrolls to the middle of that station's slice.
  const onPick = useCallback((i: number) => {
    const track = trackRef.current;
    const frame = frameRef.current;
    if (!track || !frame) return;
    const span = track.offsetHeight - frame.offsetHeight;
    const top = track.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET + ((i + 0.5) / N) * span;
    window.scrollTo({ top, behavior: window.matchMedia(REDUCED).matches ? 'auto' : 'smooth' });
  }, []);

  // In the flow, and under reduced motion, the study shows finished.
  const studyProgress = pinned && !reduced ? study : 1;

  return (
    <Box ref={trackRef} sx={{ [PIN]: { height: `calc(100vh - ${HEADER_OFFSET}px + ${N * STEP_VH}vh)` } }}>
      <LineKeyframes />
      <Box
        ref={frameRef}
        sx={{
          [PIN]: {
            position: 'sticky',
            top: HEADER_OFFSET,
            height: `calc(100vh - ${HEADER_OFFSET}px)`,
            boxSizing: 'border-box',
            py: 2,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6fr)',
            columnGap: 6,
            alignItems: 'center',
          },
        }}
      >
        <Stage active={active} onPick={onPick} fillRef={fillRef} />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: { xs: 5, md: 6 }, [WIDE_FLOW]: { mt: 3 } }}>
          {STATIONS.map((key, i) => (
            <StationCards key={key} station={key} index={i} on={i === active} progress={i === STUDIES ? studyProgress : 1} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};
