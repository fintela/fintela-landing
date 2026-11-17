import { memo } from 'react';
import type { ComponentProps, CSSProperties } from 'react';
import { Box } from '@mui/material';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { APP } from '../../components/fintelligentDemo/appTheme';
import { fonts, palette, radii, shadows, soft } from '../../theme/tokens';
import { flatSelector, flatTransition, stageCentre, u } from '../isoKit/flat';
import { FlatSelector } from '../isoKit/FlatSelector';
import { curve, isoColor } from '../isoKit/tokens';
import { BEAT, BEATS } from './beats';
import { STRATEGY_CODE, STRATEGY_FILE } from './strategyCode';

/** Design units. Everything from the editor on is centred on the stage, as the selector is. */
const CENTRE = stageCentre;
/** The selector's window, which the editor grows out of. */
const PILL = flatSelector.window;
const EDITOR = { width: 372, height: 262, radius: radii.neuInner, header: 30 };
const BOX = { side: 116, radius: 18 };
/** The strategy card, and the f(x) box on it. */
const FINAL = { width: 320, height: 128 };
const BADGE = { side: 72, radius: radii.neuInner, inset: 20 };
const BADGE_SHIFT = BADGE.inset + BADGE.side / 2 - FINAL.width / 2;

const CODE = { fontSize: 12.5, lineHeight: 18, gutter: 18, top: 8, left: 10 };

const WRITE_INDEX = BEAT.write - 1;
const CONVERT_INDEX = BEAT.convert - 1;
/** The finished code stays on screen for a moment before it is converted. */
const WRITE_TIME = BEATS[WRITE_INDEX] - 0.25;

const CHARS = STRATEGY_CODE.reduce(
  (sum, runs) => sum + runs.reduce((count, [text]) => count + text.length, 0),
  0
);

/** Each line takes its share of the writing time, by length, so typing keeps one speed. */
const LINES = STRATEGY_CODE.reduce<
  { runs: (typeof STRATEGY_CODE)[number]; length: number; delay: number; duration: number }[]
>((lines, runs) => {
  const previous = lines[lines.length - 1];
  const length = runs.reduce((count, [text]) => count + text.length, 0);
  return [
    ...lines,
    {
      runs,
      length,
      delay: previous ? previous.delay + previous.duration : 0,
      duration: (length / CHARS) * WRITE_TIME,
    },
  ];
}, []);

const fill: CSSProperties = { position: 'absolute', inset: 0 };

/**
 * One line of code, typed a character at a time. A cover the colour of the editor slides
 * off the line, with the caret on its edge, so the two can never drift apart. It is CSS,
 * not Framer, so it costs React no renders and pauses with the clock when the piece
 * leaves the screen. Monospace makes `steps()` land exactly on each character, and
 * `jump-start` makes the last one reliable: with the default, a progress of 0.99999...
 * from rounding can leave the cover a character short for good.
 */
const CodeLine = ({
  index,
  phase,
  playState,
}: {
  index: number;
  phase: number;
  playState: string;
}) => {
  const { runs, length, delay, duration } = LINES[index];
  const writing = phase === BEAT.write;
  const written = phase > BEAT.write;
  const last = index === LINES.length - 1;

  return (
    <div style={{ display: 'flex', height: u(CODE.lineHeight), alignItems: 'center' }}>
      <span
        style={{
          width: u(CODE.gutter),
          flexShrink: 0,
          color: APP.textDisabled,
          opacity: written ? 1 : 0,
          animation: writing ? `strategyShow 0.01s linear ${delay}s both ${playState}` : undefined,
        }}
      >
        {index + 1}
      </span>
      <span style={{ position: 'relative', whiteSpace: 'pre' }}>
        {runs.map(([text, color], i) => (
          <span key={i} style={{ color }}>
            {text}
          </span>
        ))}
        {!written && (
          <span
            style={
              {
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${length + 1}ch`,
                background: palette.surface,
                '--strategy-line': `${length}ch`,
                animation: writing
                  ? `strategyCover ${duration}s steps(${length}, jump-start) ${delay}s both ${playState}`
                  : undefined,
              } as CSSProperties
            }
          >
            {writing && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '8%',
                  bottom: '8%',
                  width: u(2),
                  background: palette.navy,
                  opacity: 0,
                  // Only the last line's caret stays, at the end of the finished code.
                  animation: `strategyCaret ${duration}s linear ${delay}s ${
                    last ? 'forwards' : 'none'
                  } ${playState}`,
                }}
              />
            )}
          </span>
        )}
      </span>
    </div>
  );
};

/**
 * One black-topped surface through the story: the selector's window opens into an editor,
 * the bar swallows the code as the whole thing is squeezed into the f(x) box, and the
 * box comes to rest as the badge on the strategy card.
 */
const shellShape = (phase: number) => {
  if (phase >= BEAT.morph) {
    return {
      animate: { width: u(BADGE.side), height: u(BADGE.side), borderRadius: u(BADGE.radius) },
      bar: u(BADGE.side),
      transition: { ...flatTransition.settle, duration: 0.65 },
    };
  }
  if (phase >= BEAT.convert) {
    const heights = [EDITOR.height, 150, BOX.side];
    return {
      animate: {
        width: [u(EDITOR.width), u(92), u(BOX.side)],
        height: heights.map(u),
        borderRadius: u(BOX.radius),
      },
      // The bar starts at its own height and catches up with the shell halfway in.
      bar: [u(EDITOR.header), u(heights[1]), u(BOX.side)],
      transition: { duration: BEATS[CONVERT_INDEX], ease: curve.settle, times: [0, 0.6, 1] },
    };
  }
  if (phase >= BEAT.open) {
    return {
      animate: { width: u(EDITOR.width), height: u(EDITOR.height), borderRadius: u(EDITOR.radius) },
      bar: u(EDITOR.header),
      transition: flatTransition.settle,
    };
  }
  return {
    animate: { width: u(PILL.width), height: u(PILL.height), borderRadius: u(PILL.radius) },
    bar: u(PILL.height),
    transition: { duration: 0 },
  };
};

const Art = memo(
  ({
    phase,
    live,
    names,
    landOn,
    formula,
    label,
  }: {
    phase: number;
    live: boolean;
    names: readonly string[];
    landOn: number;
    formula: string;
    label: string;
  }) => {
    const opened = phase >= BEAT.open;
    const converted = phase >= BEAT.convert;
    const final = phase >= BEAT.morph;
    const editing = opened && !converted;
    const shell = shellShape(phase);
    const name = names[landOn];
    const playState = live ? 'running' : 'paused';

    return (
      <Box
        sx={{
          ...fill,
          '@keyframes strategyCover': {
            from: { transform: 'translateX(0)' },
            to: { transform: 'translateX(var(--strategy-line))' },
          },
          '@keyframes strategyShow': { from: { opacity: 0 }, to: { opacity: 1 } },
          '@keyframes strategyCaret': { from: { opacity: 1 }, to: { opacity: 1 } },
        }}
      >
        <FlatSelector
          names={names}
          landOn={landOn}
          spinning={phase >= BEAT.spin}
          landed={phase >= BEAT.land}
          gone={opened}
        />

        {/* The strategy card opens out from behind the f(x) box. */}
        <m.div
          initial={false}
          animate={{
            opacity: final ? 1 : 0,
            width: u(final ? FINAL.width : BOX.side),
            height: u(final ? FINAL.height : BOX.side),
          }}
          transition={{
            ...flatTransition.settle,
            duration: 0.65,
            opacity: { duration: 0 },
          }}
          style={{
            position: 'absolute',
            left: u(CENTRE.x),
            top: u(CENTRE.y),
            x: '-50%',
            y: '-50%',
            borderRadius: u(radii.neuInner),
            background: palette.surface,
            boxShadow: shadows.neuRaisedMd,
          }}
        >
          <m.div
            initial={false}
            animate={{ opacity: final ? 1 : 0, x: u(final ? 0 : -10) }}
            transition={{ ...flatTransition.settle, delay: final ? 0.3 : 0 }}
            style={{
              position: 'absolute',
              left: u(BADGE.inset + BADGE.side + 16),
              top: 0,
              width: u(FINAL.width - BADGE.inset - BADGE.side - 16 - 14),
              height: u(FINAL.height),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: u(7),
              fontFamily: fonts.sans,
            }}
          >
            <div
              style={{ fontSize: u(23), fontWeight: 700, lineHeight: 1.15, color: palette.text }}
            >
              {label}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: u(6),
                fontSize: u(14),
                fontWeight: 600,
                color: palette.textMuted,
              }}
            >
              <span
                style={{
                  width: u(7),
                  height: u(7),
                  borderRadius: '50%',
                  background: isoColor.done,
                  flexShrink: 0,
                }}
              />
              {name}
            </div>
          </m.div>
        </m.div>

        {/* Travels to its place on the card. The shell inside only changes size. */}
        <m.div
          initial={false}
          animate={{ x: u(final ? BADGE_SHIFT : 0), opacity: opened ? 1 : 0 }}
          transition={{
            ...flatTransition.settle,
            duration: 0.65,
            // Appears exactly over the selector's window and then grows, so there's no ghosted double.
            opacity: { duration: 0 },
          }}
          style={{ position: 'absolute', left: u(CENTRE.x), top: u(CENTRE.y) }}
        >
          <m.div
            initial={false}
            animate={shell.animate}
            transition={shell.transition}
            style={{
              position: 'absolute',
              x: '-50%',
              y: '-50%',
              overflow: 'hidden',
              background: palette.surface,
              boxShadow: shadows.neuAccent,
            }}
          >
            {/* The code keeps its width while the shell moves around it, so it never reflows. */}
            <m.div
              initial={false}
              animate={
                converted
                  ? { opacity: 0, scaleX: 0.45, scaleY: 0.08 }
                  : { opacity: 1, scaleX: 1, scaleY: 1 }
              }
              transition={{ ...flatTransition.settle, duration: 0.4 }}
              style={{
                position: 'absolute',
                left: 0,
                top: u(EDITOR.header),
                width: u(EDITOR.width),
                height: u(EDITOR.height - EDITOR.header),
                paddingTop: u(CODE.top),
                paddingLeft: u(CODE.left),
                fontFamily: fonts.mono,
                fontSize: u(CODE.fontSize),
                color: APP.text,
              }}
            >
              {LINES.map((_, index) => (
                <CodeLine key={index} index={index} phase={phase} playState={playState} />
              ))}
            </m.div>

            <m.div
              initial={false}
              animate={{ height: shell.bar }}
              transition={shell.transition}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                background: palette.navy,
              }}
            />

            {/* In its own fixed box, because centring it in the bar would move it as a layout shift. */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: u(PILL.height),
                display: 'flex',
                alignItems: 'center',
                color: palette.surface,
                fontFamily: fonts.sans,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <m.span
                initial={false}
                animate={{
                  x: u(opened ? 28 : (PILL.width - name.length * flatSelector.charWidth) / 2),
                  y: u(opened ? (EDITOR.header - PILL.height) / 2 : 0),
                  fontSize: u(opened ? 13.5 : 20),
                  opacity: converted ? 0 : 1,
                }}
                transition={{
                  ...flatTransition.settle,
                  duration: 0.4,
                  opacity: { duration: 0.15 },
                }}
                style={{ display: 'block' }}
              >
                {name}
              </m.span>
            </div>

            {/* Yellow while the work moves, green once the code is written. */}
            <m.span
              initial={false}
              animate={{
                opacity: editing ? 1 : 0,
                backgroundColor: phase >= BEAT.write ? isoColor.done : isoColor.active,
              }}
              transition={{
                opacity: { duration: 0.15, delay: phase === BEAT.open ? 0.15 : 0 },
                backgroundColor: {
                  duration: 0.15,
                  delay: phase === BEAT.write ? WRITE_TIME : 0,
                },
              }}
              style={{
                position: 'absolute',
                left: u(12),
                top: u((EDITOR.header - 8) / 2),
                width: u(8),
                height: u(8),
                borderRadius: '50%',
              }}
            />
            <m.div
              initial={false}
              animate={{ opacity: editing ? 1 : 0 }}
              transition={{ duration: 0.15, delay: phase === BEAT.open ? 0.15 : 0 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: u(EDITOR.width),
                height: u(EDITOR.header),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: u(14),
                fontFamily: fonts.mono,
                fontSize: u(11.5),
                color: soft.onInk,
                whiteSpace: 'nowrap',
              }}
            >
              {STRATEGY_FILE}
            </m.div>

            <m.div
              initial={false}
              animate={{
                opacity: converted ? 1 : 0,
                scale: converted ? 1 : 0.5,
                fontSize: u(final ? 24 : 42),
              }}
              transition={
                final
                  ? { ...flatTransition.settle, duration: 0.65 }
                  : {
                      ...flatTransition.pop,
                      delay: converted ? 0.32 : 0,
                      opacity: { ...flatTransition.fade, delay: converted ? 0.32 : 0 },
                    }
              }
              style={{
                ...fill,
                display: 'grid',
                placeItems: 'center',
                color: palette.surface,
                fontFamily: fonts.mono,
                fontWeight: 700,
              }}
            >
              {formula}
            </m.div>
          </m.div>
        </m.div>
      </Box>
    );
  }
);
Art.displayName = 'CreateInvestingStrategyArt';

/** Everything that needs the motion library, loaded only when the piece comes near the screen. */
const CreateInvestingStrategyScene = (props: ComponentProps<typeof Art>) => (
  <LazyMotion features={domAnimation} strict>
    <Art {...props} />
  </LazyMotion>
);

export default CreateInvestingStrategyScene;
