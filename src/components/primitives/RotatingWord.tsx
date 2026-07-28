import { Box } from '@mui/material';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SxProps, Theme } from '@mui/material';
import { gradients } from '../../theme/tokens';

interface RotatingWordProps {
  /** Words to cycle through, in order. */
  words: string[];
  /** Time each word stays visible, in ms. */
  interval?: number;
  /** Delay before the first rotation, in ms — offset slots so they don't tick in unison. */
  startDelay?: number;
  /** Where the word sits within its fixed-width slot. */
  align?: 'left' | 'center' | 'right';
  /** Paint the word with the brand gradient. */
  gradient?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * A single inline word slot that cycles through `words`, crossfading the
 * outgoing word out while the incoming word fades in.
 *
 * The slot reserves a fixed width equal to the widest word (measured at the
 * actual rendered font), so the surrounding text never shifts horizontally as
 * words change. `align` controls where the word rests in that slot — e.g. align
 * right so it hugs the text that follows, or left so it hugs the text before.
 * It sits on the text baseline, so it lines up with the rest of the sentence.
 *
 * Both words are absolute overlays stacked on an invisible in-flow spacer:
 * the spacer carries the baseline and line height, the incoming layer sits
 * above the outgoing one, so each fades independently and visibly.
 *
 * Designed to be dropped inline inside a larger phrase — see HeroSection.
 */
export const RotatingWord = ({
  words,
  interval = 2000,
  startDelay = 0,
  align = 'center',
  gradient = false,
  sx,
}: RotatingWordProps) => {
  // Monotonic tick counter — increments once per rotation.
  const [phase, setPhase] = useState(0);
  const [width, setWidth] = useState<number>();
  const measureRef = useRef<HTMLSpanElement>(null);

  const n = words.length;
  const current = words[phase % n];
  const previous = words[(phase - 1 + n) % n];

  // Measure the widest word at the real font so we can pin the slot width.
  useLayoutEffect(() => {
    const node = measureRef.current;
    if (!node) return;
    const widest = Array.from(node.children).reduce(
      (max, el) => Math.max(max, (el as HTMLElement).getBoundingClientRect().width),
      0,
    );
    setWidth(Math.ceil(widest));
  }, [words]);

  useEffect(() => {
    if (n <= 1) return;

    let tick: ReturnType<typeof setInterval>;
    const kickoff = setTimeout(() => {
      tick = setInterval(() => setPhase((p) => p + 1), interval);
    }, startDelay);

    return () => {
      clearTimeout(kickoff);
      clearInterval(tick);
    };
  }, [n, interval, startDelay]);

  const gradientSx: SxProps<Theme> = gradient
    ? {
        background: gradients.brand,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }
    : {};

  const layerSx: SxProps<Theme> = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    textAlign: align,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    ...gradientSx,
  };

  return (
    <Box
      component="span"
      sx={{
        position: 'relative',
        display: 'inline-block',
        width: width ? `${width}px` : 'auto',
        textAlign: align,
        verticalAlign: 'baseline',
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      {/* Hidden measurer: all words at the real font, off the layout flow. */}
      <Box
        component="span"
        ref={measureRef}
        aria-hidden
        sx={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'nowrap' }}
      >
        {words.map((w) => (
          <span key={w} style={{ display: 'inline-block' }}>
            {w}
          </span>
        ))}
      </Box>

      {/* Invisible in-flow spacer — carries the baseline, line height and the
          current word's slot. The visible words are absolute overlays on top. */}
      <Box component="span" aria-hidden sx={{ visibility: 'hidden', whiteSpace: 'nowrap' }}>
        {current}
      </Box>

      {/* Outgoing word — fades out beneath the incoming one. */}
      {phase > 0 && (
        <Box
          key={`out-${phase}`}
          component="span"
          aria-hidden
          sx={{
            ...layerSx,
            zIndex: 1,
            animation: 'rotatingWordOut 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            '@keyframes rotatingWordOut': {
              '0%': { opacity: 1 },
              '100%': { opacity: 0 },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0 },
          }}
        >
          {previous}
        </Box>
      )}

      {/* Incoming word — fades in on top. */}
      <Box
        key={`in-${phase}`}
        component="span"
        sx={{
          ...layerSx,
          zIndex: 2,
          animation: 'rotatingWordIn 0.65s cubic-bezier(0.4, 0, 0.2, 1) both',
          '@keyframes rotatingWordIn': {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
        }}
      >
        {current}
      </Box>
    </Box>
  );
};
