/**
 * What the Fintelligent demos share around the app's own surfaces: the
 * keyframes, the pointer and the per-frame effect that walks it, the player
 * bar, the disclaimer under the composer, and the settled answer's chips.
 * The home page's FintelligentDemo and the Agentic AI page's AgenticDemo are
 * two storyboards played on this one stage.
 */
import { memo } from 'react';
import type { RefObject } from 'react';
import { Box, GlobalStyles } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { fonts, gradients, motion, palette, soft } from '../../theme/tokens';
import { focusRingSx, forcedColorsFocus } from '../../theme/neu';
import { APP } from './appTheme';
import { PointerGlyph } from './glyphs';
import { chapterEnd } from './stageMotion';
import type { Chapter } from './stageMotion';

const K = 'fintelligentDemo';

const KEYFRAMES = {
  '@keyframes fdSpin': { to: { transform: 'rotate(360deg)' } },
  '@keyframes fdFadeIn': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
  '@keyframes fdFade': { from: { opacity: 0 }, to: { opacity: 1 } },
  '@keyframes fdBlink': { '0%, 49%': { opacity: 1 }, '50%, 100%': { opacity: 0 } },
  '@keyframes fdHop': {
    '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.35 },
    '40%': { transform: 'translateY(-3px)', opacity: 1 },
  },
  '@keyframes fdSweep': { from: { left: '-40%' }, to: { left: '100%' } },
  '@keyframes fdSheen': { '0%': { backgroundPosition: '100% 0' }, '100%': { backgroundPosition: '-100% 0' } },
  '@keyframes fdPulse': { '0%, 100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.35, transform: 'scale(0.7)' } },
  '@keyframes fdMenu': { from: { opacity: 0, transform: 'scale(0.96) translateY(-4px)' }, to: { opacity: 1, transform: 'none' } },
  // The run tracker's striped bar, its breathing active step, and the asset chips popping in.
  '@keyframes fdMarch': { from: { backgroundPosition: '0 0' }, to: { backgroundPosition: '16px 0' } },
  '@keyframes fdBreathe': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
  '@keyframes fdPop': { '0%': { opacity: 0, transform: 'scale(0.6)' }, '70%': { opacity: 1, transform: 'scale(1.08)' }, '100%': { opacity: 1, transform: 'none' } },
  '@keyframes fdGlide': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
} as const;

/** The demos' keyframes, injected once rather than re-serialized every frame. */
export const DemoKeyframes = memo(() => <GlobalStyles styles={KEYFRAMES} />);
DemoKeyframes.displayName = 'DemoKeyframes';

export const Disclaimer = memo(({ narrow }: { narrow: boolean }) => {
  const { t } = useTranslation('home');
  return (
    <Box
      sx={{ position: 'absolute', left: narrow ? 0 : -60, right: narrow ? 0 : -60, top: '100%', mt: '7px', textAlign: 'center', fontSize: 10.5, lineHeight: 1.35, color: APP.textDisabled }}
    >
      {t(`${K}.app.disclaimer`)}
    </Box>
  );
});
Disclaimer.displayName = 'Disclaimer';

/** The pointer (a touch dot on the compact window), positioned by `usePointerFrame` (stageMotion.ts). */
export const Cursor = memo(
  ({ narrow, cursorRef, rippleRef }: { narrow: boolean; cursorRef: RefObject<HTMLDivElement | null>; rippleRef: RefObject<HTMLDivElement | null> }) => (
    <Box
      ref={cursorRef}
      aria-hidden
      sx={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 3, opacity: 0, transition: 'opacity 0.3s ease', willChange: 'transform' }}
    >
      <Box ref={rippleRef} sx={{ position: 'absolute', left: 0, top: 0, width: 34, height: 34, borderRadius: '50%', background: APP.navyLight, opacity: 0 }} />
      {narrow ? (
        <Box sx={{ width: 22, height: 22, ml: '-11px', mt: '-11px', borderRadius: '50%', background: 'rgba(11,26,51,0.28)', border: '2px solid rgba(255,255,255,0.9)' }} />
      ) : (
        <Box sx={{ ml: '-2px', mt: '-2px', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' }}>
          <PointerGlyph />
        </Box>
      )}
    </Box>
  ),
);
Cursor.displayName = 'Cursor';

/**
 * Play/pause and the chapters as a segmented track. Static between chapter
 * changes; the fills are advanced through refs by `usePointerFrame`. Its
 * labels live under `prefix` (play, pause, chapterJump, chapters.<key>).
 */
export const PlayerBar = memo(
  ({
    prefix,
    chapters,
    loop,
    playing,
    active,
    onToggle,
    onSeek,
    fillRefs,
  }: {
    prefix: string;
    chapters: readonly Chapter[];
    loop: number;
    playing: boolean;
    active: number;
    onToggle: () => void;
    onSeek: (chapter: number) => void;
    fillRefs: RefObject<Array<HTMLDivElement | null>>;
  }) => {
    const { t } = useTranslation('home');
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, mt: { xs: 1.5, md: 2 } }}>
        <Box
          component="button"
          type="button"
          onClick={onToggle}
          aria-label={playing ? t(`${prefix}.pause`) : t(`${prefix}.play`)}
          sx={{
            all: 'unset',
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: soft.white,
            background: palette.navy,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            ...focusRingSx,
            '@media (forced-colors: active)': { border: '1px solid ButtonText', ...forcedColorsFocus },
          }}
        >
          {playing ? <PauseIcon sx={{ fontSize: 20 }} /> : <PlayArrowIcon sx={{ fontSize: 20 }} />}
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'grid',
            gap: { xs: 0.75, md: 1.25 },
            // minmax(0, …): a bare fr track will not shrink below its no-wrap label.
            gridTemplateColumns: chapters.map((c, i) => `minmax(0, ${(chapterEnd(chapters, loop, i) - c.start).toFixed(1)}fr)`).join(' '),
          }}
        >
          {chapters.map((c, i) => (
            <Box
              key={c.key}
              component="button"
              type="button"
              aria-label={t(`${prefix}.chapterJump`, { chapter: t(`${prefix}.chapters.${c.key}`) })}
              aria-current={i === active ? 'step' : undefined}
              onClick={() => onSeek(i)}
              sx={{ all: 'unset', cursor: 'pointer', minWidth: 0, py: 0.75, ...focusRingSx, '@media (forced-colors: active)': { ...forcedColorsFocus } }}
            >
              <Box sx={{ height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <Box
                  ref={(el: HTMLDivElement | null) => {
                    fillRefs.current[i] = el;
                  }}
                  sx={{ width: 0, height: '100%', background: gradients.gold, borderRadius: 999 }}
                />
              </Box>
              <Box
                sx={{
                  mt: 0.75,
                  fontFamily: fonts.mono,
                  fontSize: '0.68rem',
                  letterSpacing: '0.04em',
                  fontWeight: i === active ? 700 : 500,
                  color: i === active ? soft.text : soft.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: `color ${motion.fast}`,
                }}
              >
                {`${String(i + 1).padStart(2, '0')} ${t(`${prefix}.chapters.${c.key}`)}`}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  },
);
PlayerBar.displayName = 'PlayerBar';
