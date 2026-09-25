import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { Box, GlobalStyles } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { fonts, gradients, motion, palette, shadows, soft } from '../../theme/tokens';
import { focusRingSx, forcedColorsFocus } from '../../theme/neu';
import { NeuPanel } from '../primitives/NeuPanel';
import { useLoopClock } from '../../lib/useLoopClock';
import { CX, CY, FLOOR, LOOP, PLATE, STATIONS, STEP } from './stations';
import type { StationKey } from './stations';
import { Lifted, PlateArt } from './plates';
import { StationSurface } from './Surfaces';

const N = STATIONS.length;
/** Reduced motion opens paused on the first station. */
const STILL = 0.5;
/** The stage's natural box (px, before scaling) and the floor's offset inside it. */
const STAGE = { w: 1100, h: 600, dx: -28, dy: 6 } as const;
/** Pointer tilt, degrees each way. */
const TILT = 3;

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

/** The camera's counter-rotation: a child with this faces the viewer again. */
const BILLBOARD = 'rotateZ(35deg) rotateX(-55deg)';

const points = (upTo: number) =>
  CX.slice(0, upTo + 1)
    .map((x, i) => `${x},${CY[i]}`)
    .join(' ');

/**
 * The isometric line (md and up): five plates on a rising zigzag, the track
 * between them, and the packet — a label that says what the work has become
 * — travelling from plate to plate. Plates are pointer shortcuts only; the
 * rail below is the accessible control, so the plates stay out of the tab
 * order.
 */
const Stage = memo(
  ({
    active,
    scale,
    onPick,
    floorRef,
  }: {
    active: number;
    scale: number;
    onPick: (i: number) => void;
    floorRef: RefObject<HTMLDivElement | null>;
  }) => {
    const { t } = useTranslation('home');
    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: FLOOR.w,
          height: FLOOR.h,
          marginLeft: -FLOOR.w / 2 + STAGE.dx * scale,
          marginTop: -FLOOR.h / 2 + STAGE.dy * scale,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          ref={floorRef}
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: `scale(${scale}) rotateX(calc(55deg + var(--al-ty, 0deg))) rotateZ(calc(-35deg + var(--al-tx, 0deg)))`,
            transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 40,
              width: FLOOR.w - 40,
              height: FLOOR.h - 70,
              borderRadius: 60,
              background: 'rgba(0,0,0,0.10)',
              filter: 'blur(34px)',
              transform: 'translateZ(-30px)',
            }}
          />
          <svg width={FLOOR.w} height={FLOOR.h} viewBox={`0 0 ${FLOOR.w} ${FLOOR.h}`} aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <polyline points={points(N - 1)} fill="none" stroke="#cfcfcf" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
            <polyline
              points={active === 0 ? `${CX[0]},${CY[0]} ${CX[0]},${CY[0]}` : points(active)}
              fill="none"
              stroke={palette.navy}
              strokeWidth="10"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polyline points={points(N - 1)} fill="none" stroke={palette.yellow} strokeWidth="4" strokeLinecap="round" className="alFlow" />
          </svg>

          {STATIONS.map((key, i) => {
            const on = i === active;
            const dark = key === 'connectBroker';
            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  left: CX[i] - PLATE / 2,
                  top: CY[i] - PLATE / 2,
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

          {/* Station names, billboarded under each plate's near corner. */}
          {STATIONS.map((key, i) => (
            <div
              key={key}
              aria-hidden
              style={{
                position: 'absolute',
                left: CX[i] - 70,
                top: CY[i] + 70,
                width: 0,
                height: 0,
                transform: `translateZ(2px) ${BILLBOARD}`,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  transform: 'translate(-50%, 10px)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  fontSize: 15,
                  fontWeight: i === active ? 800 : 600,
                  color: i === active ? palette.text : palette.textMuted,
                  transition: `color ${motion.base}`,
                }}
              >
                <span style={{ fontFamily: fonts.mono, fontSize: 12, color: palette.textSubtle }}>{`0${i + 1}`}</span>
                {t(`workflow.nodes.${key}.label`)}
              </div>
            </div>
          ))}

          {/* Anchors the packet overlay measures: each plate's centre, just above its lifted top. */}
          {STATIONS.map((key, i) => (
            <div
              key={key}
              data-al-anchor={i}
              style={{ position: 'absolute', left: CX[i], top: CY[i], width: 0, height: 0, transform: 'translateZ(34px)' }}
            />
          ))}
        </div>
      </div>
    );
  },
);
Stage.displayName = 'Stage';

/**
 * The packet: what the work has become, riding from plate to plate. It is a
 * flat overlay above the 3D scene, placed over the active plate's anchor —
 * inside the scene it would be depth-sorted behind the pieces lifting off
 * that plate. The travel between stations is a transition on its position.
 */
const Packet = memo(
  ({ active, scale, measureRef }: { active: number; scale: number; measureRef: RefObject<() => void> }) => {
    const { t } = useTranslation('home');
    const el = useRef<HTMLDivElement>(null);
    const measure = useCallback(() => {
      // The overlay's own parent is the stage. (Not stageRef: on the first
      // commit a child's layout effect runs before its parent's ref is set.)
      const stage = el.current?.parentElement;
      const anchor = stage?.querySelector(`[data-al-anchor="${active}"]`);
      if (!stage || !anchor || !el.current) return;
      const s = stage.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      el.current.style.transform = `translate(${(a.left - s.left).toFixed(1)}px, ${(a.top - s.top).toFixed(1)}px)`;
      el.current.style.opacity = '1';
    }, [active]);
    useLayoutEffect(() => {
      measureRef.current = measure;
      measure();
    }, [measure, measureRef, scale]);
    const token = STATIONS[active];
    return (
      <div
        ref={el}
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: 'none',
          transition: 'transform 0.9s cubic-bezier(.65,0,.35,1), opacity 0.3s ease',
          zIndex: 2,
        }}
      >
        <div style={{ position: 'absolute', left: 0, bottom: -5, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            key={token}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 999,
              background: palette.navy,
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 14px 30px rgba(0,0,0,0.28)',
              fontFamily: token === 'strategies' ? fonts.mono : undefined,
              animation: 'alPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.45s both',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: palette.yellow }} />
            {t(`workflow.line.tokens.${token}`)}
          </div>
          <div style={{ width: 2, height: 64 * Math.max(0.7, scale), background: `linear-gradient(180deg, ${palette.navy}, ${palette.yellow})` }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: palette.yellow, boxShadow: '0 0 0 4px rgba(232,185,35,0.25)' }} />
        </div>
      </div>
    );
  },
);
Packet.displayName = 'Packet';

const PlayButton = ({ playing, onToggle, size = 44 }: { playing: boolean; onToggle: () => void; size?: number }) => {
  const { t } = useTranslation('home');
  return (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      aria-label={playing ? t('workflow.line.pause') : t('workflow.line.play')}
      sx={{
        all: 'unset',
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: soft.white,
        background: palette.navy,
        boxShadow: shadows.brand,
        ...focusRingSx,
        '@media (forced-colors: active)': { border: '1px solid ButtonText', ...forcedColorsFocus },
      }}
    >
      {playing ? <PauseIcon sx={{ fontSize: 20 }} /> : <PlayArrowIcon sx={{ fontSize: 20 }} />}
    </Box>
  );
};

/**
 * The rail (md and up): pause, and one button per station — the accessible
 * way through the line. Its fills are advanced through refs, outside React.
 */
const Rail = memo(
  ({
    active,
    playing,
    onToggle,
    onPick,
    fillRefs,
  }: {
    active: number;
    playing: boolean;
    onToggle: () => void;
    onPick: (i: number) => void;
    fillRefs: RefObject<Array<HTMLDivElement | null>>;
  }) => {
    const { t } = useTranslation('home');
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <PlayButton playing={playing} onToggle={onToggle} />
        <Box sx={{ flexGrow: 1, display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gap: 1.5 }}>
          {STATIONS.map((key, i) => {
            const name = t(`workflow.nodes.${key}.label`);
            return (
              <Box
                key={key}
                component="button"
                type="button"
                onClick={() => onPick(i)}
                aria-label={t('workflow.line.stepLabel', { n: i + 1, name })}
                aria-current={i === active ? 'step' : undefined}
                sx={{ all: 'unset', cursor: 'pointer', minWidth: 0, minHeight: 44, py: 1, ...focusRingSx, '@media (forced-colors: active)': { ...forcedColorsFocus } }}
              >
                <Box sx={{ height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  <Box
                    ref={(el: HTMLDivElement | null) => {
                      fillRefs.current[i] = el;
                    }}
                    sx={{ width: 0, height: '100%', borderRadius: 999, background: gradients.gold }}
                  />
                </Box>
                <Box
                  sx={{
                    mt: 1,
                    display: 'flex',
                    gap: 0.75,
                    alignItems: 'baseline',
                    fontSize: 13,
                    fontWeight: i === active ? 700 : 500,
                    color: i === active ? soft.text : soft.textSecondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: `color ${motion.fast}`,
                  }}
                >
                  <Box component="span" sx={{ fontFamily: fonts.mono, fontSize: 11 }}>{`0${i + 1}`}</Box>
                  {name}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  },
);
Rail.displayName = 'Rail';

/**
 * Below md: the line as a compact strip — five small plates on a track, the
 * active one lifted — with pause, the station's progress and its packet.
 * The plates are the step buttons here.
 */
const Strip = memo(
  ({
    active,
    playing,
    onToggle,
    onPick,
    fillRef,
  }: {
    active: number;
    playing: boolean;
    onToggle: () => void;
    onPick: (i: number) => void;
    fillRef: RefObject<HTMLDivElement | null>;
  }) => {
    const { t } = useTranslation('home');
    return (
      <Box>
        <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, alignItems: 'start' }}>
          <Box aria-hidden sx={{ position: 'absolute', left: '10%', right: '10%', top: 27, height: 3, borderRadius: 2, background: '#d0d0d0' }}>
            <Box sx={{ height: '100%', borderRadius: 2, background: palette.navy, width: `${(active / (N - 1)) * 100}%`, transition: `width ${motion.slow}` }} />
          </Box>
          {STATIONS.map((key, i) => {
            const name = t(`workflow.nodes.${key}.label`);
            const on = i === active;
            const dark = key === 'connectBroker';
            return (
              <Box
                key={key}
                component="button"
                type="button"
                onClick={() => onPick(i)}
                aria-label={t('workflow.line.stepLabel', { n: i + 1, name })}
                aria-current={on ? 'step' : undefined}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  pb: 0.5,
                  ...focusRingSx,
                  '@media (forced-colors: active)': { ...forcedColorsFocus },
                }}
              >
                <Box sx={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '7px',
                      background: dark ? '#1a1a1a' : '#ffffff',
                      transform: `rotateX(55deg) rotateZ(-35deg) translateZ(${on ? 8 : 0}px)`,
                      boxShadow: `-2px 3px 0 ${dark ? '#3a3a3a' : '#cfcfcf'}, -6px 12px 14px rgba(0,0,0,0.18)`,
                      outline: on ? `2px solid ${palette.yellow}` : '0 solid transparent',
                      outlineOffset: '3px',
                      transition: `transform ${motion.base}`,
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: 'center', fontSize: 11, lineHeight: 1.25, fontWeight: on ? 800 : 600, color: on ? soft.text : soft.textSecondary }}>
                  <Box component="span" sx={{ display: 'block', fontFamily: fonts.mono, fontWeight: 500 }}>{`0${i + 1}`}</Box>
                  {name}
                </Box>
              </Box>
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
          <PlayButton playing={playing} onToggle={onToggle} size={40} />
          <Box sx={{ flexGrow: 1, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <Box ref={fillRef} sx={{ width: 0, height: '100%', borderRadius: 999, background: gradients.gold }} />
          </Box>
          <Box
            component="span"
            sx={{
              height: 28,
              px: 1.25,
              borderRadius: 999,
              background: palette.navy,
              color: soft.white,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              whiteSpace: 'nowrap',
              fontFamily: STATIONS[active] === 'strategies' ? fonts.mono : undefined,
            }}
          >
            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', background: palette.yellow }} />
            {t(`workflow.line.tokens.${STATIONS[active]}`)}
          </Box>
        </Box>
      </Box>
    );
  },
);
Strip.displayName = 'Strip';

/** The station in words, and the piece of the product it produces. */
const Detail = memo(({ station, index, studyProgress }: { station: StationKey; index: number; studyProgress: number }) => {
  const { t } = useTranslation('home');
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 5fr) minmax(0, 7fr)' },
        gap: { xs: 3, md: 5 },
        alignItems: 'start',
        // The tallest station's content, so the band never jumps as the line plays.
        minHeight: { md: 270 },
      }}
    >
      <Box key={station} sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, animation: 'alDetail 0.35s ease both', '@keyframes alDetail': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } }, '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box
            aria-hidden
            sx={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: soft.white, background: gradients.brand, boxShadow: shadows.brandStrong }}
          >
            {index + 1}
          </Box>
          <Box>
            <Box component="h3" sx={{ m: 0, fontSize: { xs: 22, md: 26 }, fontWeight: 800, letterSpacing: '-0.01em', color: soft.text }}>
              {t(`workflow.nodes.${station}.label`)}
            </Box>
            <Box sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: soft.text }}>{t(`workflow.nodes.${station}.sub`)}</Box>
          </Box>
        </Box>
        <Box component="p" sx={{ m: 0, fontSize: 16, lineHeight: 1.65, color: soft.textSecondary }}>
          {t(`workflow.nodes.${station}.desc`)}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.75,
            py: 1.5,
            borderRadius: '14px',
            background: soft.white,
            boxShadow: shadows.neuRaisedSm,
            fontSize: 14,
            fontWeight: 600,
            color: palette.text,
          }}
        >
          <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', background: palette.yellow, flexShrink: 0 }} />
          {t(`workflow.line.handoff.${station}`)}
        </Box>
      </Box>
      <NeuPanel sx={{ p: { xs: 2.25, md: 3 }, minWidth: 0, overflow: 'hidden' }}>
        <StationSurface station={station} progress={studyProgress} />
      </NeuPanel>
    </Box>
  );
});
Detail.displayName = 'Detail';

/** Everything that changes per station, not per frame. */
const Line = memo(
  ({
    active,
    studyProgress,
    playing,
    scale,
    onPick,
    onToggle,
    stageRef,
    floorRef,
    fillRefs,
    mobileFillRef,
    onTilt,
    onTiltEnd,
    measureRef,
  }: {
    active: number;
    studyProgress: number;
    playing: boolean;
    scale: number;
    onPick: (i: number) => void;
    onToggle: () => void;
    stageRef: RefObject<HTMLDivElement | null>;
    floorRef: RefObject<HTMLDivElement | null>;
    fillRefs: RefObject<Array<HTMLDivElement | null>>;
    mobileFillRef: RefObject<HTMLDivElement | null>;
    onTilt: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onTiltEnd: () => void;
    measureRef: RefObject<() => void>;
  }) => {
    const { t } = useTranslation('home');
    return (
      <>
        <LineKeyframes />
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box
            ref={stageRef}
            role="group"
            aria-label={t('workflow.line.label')}
            onPointerMove={onTilt}
            onPointerLeave={onTiltEnd}
            // Clip sideways only: the unscaled floor's box would widen the page,
            // while the packet above the top plate may rise past the stage.
            sx={{ position: 'relative', width: '100%', userSelect: 'none', overflowX: 'clip', overflowY: 'visible', '@media print': { display: 'none' } }}
            style={{ height: Math.round(STAGE.h * scale) }}
          >
            <Stage active={active} scale={scale} onPick={onPick} floorRef={floorRef} />
            <Packet active={active} scale={scale} measureRef={measureRef} />
          </Box>
          <Box sx={{ mt: 1, mb: 4.5 }}>
            <Rail active={active} playing={playing} onToggle={onToggle} onPick={onPick} fillRefs={fillRefs} />
          </Box>
        </Box>
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3.5 }}>
          <Strip active={active} playing={playing} onToggle={onToggle} onPick={onPick} fillRef={mobileFillRef} />
        </Box>
        <Detail station={STATIONS[active]} index={active} studyProgress={studyProgress} />
      </>
    );
  },
);
Line.displayName = 'Line';

/**
 * The platform band's diagram: the pipeline as an isometric assembly line.
 * One packet travels five stations — asset groups, strategies, studies,
 * portfolios, broker — changing what it is as each step hands its output to
 * the next (11 ETFs → sector_momentum → 1,000 trials → top portfolio → live),
 * while the panel under the line shows that step's surface in the product.
 *
 * It plays only while on screen (the shared loop clock), a station every
 * 4.2 s; a plate or rail step jumps there and pauses; the play button
 * resumes. Under prefers-reduced-motion it starts paused on the first
 * station. Drawn in CSS 3D, like the Fintelligent demo: the plates are HTML,
 * so the art stays crisp and the band prerenders.
 */
export const AssemblyLine = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const fillRefs = useRef<Array<HTMLDivElement | null>>([]);
  const mobileFillRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<() => void>(() => undefined);
  const followUntil = useRef(0);
  const followRaf = useRef(0);
  // Below md the detail panel sits in the reading flow: wait for a tap or play.
  const clock = useLoopClock(rootRef, LOOP, STILL, { holdWhen: '(max-width: 899.95px)' });
  const active = Math.min(N - 1, Math.floor(clock.t / STEP));
  const progress = clock.t / STEP - active;
  // The study's counter moves within its station (~15 steps a second is
  // plenty); paused there, it shows the finished study.
  const studyProgress = STATIONS[active] !== 'studies' ? 0 : clock.playing ? Math.round(progress * 64) / 64 : 1;
  const [width, setWidth] = useState(1152);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(0.92, width / STAGE.w);

  // Per frame, outside React: the rail's fills.
  useLayoutEffect(() => {
    fillRefs.current.forEach((fill, i) => {
      if (fill) fill.style.width = `${i < active ? 100 : i === active ? (progress * 100).toFixed(1) : 0}%`;
    });
    if (mobileFillRef.current) mobileFillRef.current.style.width = `${(progress * 100).toFixed(1)}%`;
  });

  const { playing, setPlaying, seek } = clock;
  const onPick = useCallback(
    (i: number) => {
      setPlaying(false);
      seek(i * STEP + 0.01);
    },
    [setPlaying, seek],
  );
  const onToggle = useCallback(() => setPlaying(!playing), [playing, setPlaying]);

  // The packet re-reads its anchor every frame while the tilt is easing.
  const follow = useCallback(() => {
    followUntil.current = performance.now() + 700;
    if (followRaf.current) return;
    const step = () => {
      measureRef.current();
      followRaf.current = performance.now() < followUntil.current ? requestAnimationFrame(step) : 0;
    };
    followRaf.current = requestAnimationFrame(step);
  }, []);
  useEffect(() => () => cancelAnimationFrame(followRaf.current), []);

  // A few degrees of tilt toward the pointer, written straight to CSS variables.
  const onTilt = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const floor = floorRef.current;
    if (!floor || e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    floor.style.setProperty('--al-tx', `${(x * TILT).toFixed(2)}deg`);
    floor.style.setProperty('--al-ty', `${(-y * TILT).toFixed(2)}deg`);
    follow();
  }, [follow]);
  const onTiltEnd = useCallback(() => {
    floorRef.current?.style.setProperty('--al-tx', '0deg');
    floorRef.current?.style.setProperty('--al-ty', '0deg');
    follow();
  }, [follow]);

  return (
    <div ref={rootRef}>
      <Line
        active={active}
        studyProgress={studyProgress}
        playing={playing}
        scale={scale}
        onPick={onPick}
        onToggle={onToggle}
        stageRef={stageRef}
        floorRef={floorRef}
        fillRefs={fillRefs}
        mobileFillRef={mobileFillRef}
        onTilt={onTilt}
        onTiltEnd={onTiltEnd}
        measureRef={measureRef}
      />
    </div>
  );
};
