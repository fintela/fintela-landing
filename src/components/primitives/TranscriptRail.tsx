import { Box, ButtonBase, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useEffect, useRef } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { forcedColorsSurface, raisedTileSx, wellSx } from '../../theme/neu';
import { accents, motion, radii, soft } from '../../theme/tokens';
import { formatTime } from '../../media/chapters';
import { AgentCoin } from './AgentCoin';

export interface TranscriptCue {
  /** Seconds into the video. */
  start: number;
  /** Key into `speakers`. */
  speaker: string;
  text: string;
  /** A tool call the turn made, rendered in the mono pill. */
  tool?: string;
}

export interface TranscriptSpeaker {
  name: string;
  role: string;
  /** Index into the accent cycle. */
  tone: number;
  /** One letter for the coin. */
  initial: string;
}

export interface TranscriptRailProps {
  cues: readonly TranscriptCue[];
  speakers: Record<string, TranscriptSpeaker>;
  activeIndex: number;
  onSeek: (index: number) => void;
  label: string;
  /** Scroller height cap (responsive); the plate it sits in sets the rest. */
  maxHeight?: number | string | { [breakpoint: string]: number | string };
  sx?: SxProps<Theme>;
}

/** How long after the reader scrolls the rail before it follows playback again. */
const USER_SCROLL_GRACE_MS = 4000;

/**
 * A conversation as a player: cues in a sunken well; the current turn rises
 * as a tile, past turns rest flat, future turns fade. The well's 16px inner
 * padding is the minimum a neuRaisedSm tile needs so its shadow is not clipped
 * at the scroller's edge.
 */
export const TranscriptRail = ({
  cues,
  speakers,
  activeIndex,
  onSeek,
  label,
  maxHeight = 420,
  sx,
}: TranscriptRailProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastUserScroll = useRef(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (Date.now() - lastUserScroll.current < USER_SCROLL_GRACE_MS) return;
    const item = scroller.querySelector<HTMLElement>(`[data-cue="${activeIndex}"]`);
    if (!item) return;
    const top = item.offsetTop - scroller.offsetTop - 16;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  }, [activeIndex]);

  const markUserScroll = () => {
    lastUserScroll.current = Date.now();
  };

  return (
    <Box
      ref={scrollerRef}
      onWheel={markUserScroll}
      onTouchMove={markUserScroll}
      sx={
        [
          wellSx('md'),
          {
            position: 'relative',
            borderRadius: `${radii.neuInner}px`,
            p: 2,
            maxHeight,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            scrollbarWidth: 'thin',
            scrollbarColor: `${soft.scrollbar} transparent`,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>
      }
    >
      <Box component="ol" aria-label={label} sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {cues.map((cue, idx) => {
          const speaker = speakers[cue.speaker];
          const state = idx === activeIndex ? 'current' : idx < activeIndex ? 'past' : 'future';
          return (
            <li key={`${cue.start}-${idx}`} data-cue={idx}>
              <ButtonBase
                onClick={() => onSeek(idx)}
                aria-current={state === 'current' ? 'true' : undefined}
                sx={[
                  {
                    width: '100%',
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    gap: 1.25,
                    p: 1.25,
                    borderRadius: `${radii.neuWell}px`,
                    fontFamily: 'inherit',
                    opacity: state === 'future' ? 0.6 : state === 'past' ? 0.85 : 1,
                    transition: `opacity ${motion.base}, box-shadow ${motion.base}, background-color ${motion.base}`,
                    '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 2 },
                  },
                  state === 'current' ? raisedTileSx : {},
                ]}
              >
                <AgentCoin tone={speaker?.tone ?? 0} sx={{ mt: 0.25 }}>
                  {speaker?.initial}
                </AgentCoin>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    component="span"
                    sx={{
                      display: 'block',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: state === 'current' ? accents[(speaker?.tone ?? 0) % accents.length] : soft.textSecondary,
                    }}
                  >
                    {speaker?.name} · {speaker?.role} · {formatTime(cue.start)}
                  </Typography>
                  <Typography component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.86rem', lineHeight: 1.55, color: soft.text }}>
                    {cue.text}
                  </Typography>
                  {cue.tool && (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 1,
                        px: 1,
                        py: 0.25,
                        borderRadius: `${radii.pill}px`,
                        bgcolor: state === 'current' ? soft.groundSunken : soft.surfaceRaised,
                        color: soft.textSecondary,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        fontFamily: '"JetBrains Mono", monospace',
                        '& svg': { fontSize: 11, color: soft.accent },
                        ...forcedColorsSurface,
                      }}
                    >
                      <CheckRoundedIcon />
                      {cue.tool}
                    </Box>
                  )}
                </Box>
              </ButtonBase>
            </li>
          );
        })}
      </Box>
    </Box>
  );
};
