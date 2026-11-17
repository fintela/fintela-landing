import { memo } from 'react';
import type { ComponentProps, CSSProperties } from 'react';
import { Box } from '@mui/material';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { fonts, palette, radii, shadows, soft } from '../../theme/tokens';
import { flatTransition, stageCentre, u } from '../isoKit/flat';
import { ease, isoColor } from '../isoKit/tokens';
import { ARRIVALS, BEAT, CLICK, CURSOR_TIME } from './beats';
import { PICKS, TICKERS } from './tickers';

type Point = { x: number; y: number };

/** Design units. The panel, and later the card, are centred on the stage. */
const PANEL = { width: 356, height: 219, pad: 15, search: 30 };
const PANEL_LEFT = stageCentre.x - PANEL.width / 2;
const PANEL_TOP = stageCentre.y - PANEL.height / 2;
const CHIP = { width: 58, height: 30, gap: 9, font: 14 };
const COLUMNS = 5;
const GRID = { left: PANEL_LEFT + PANEL.pad, top: PANEL_TOP + PANEL.pad + PANEL.search + 12 };

/** The box: a body, and two flaps hinged at its outer top corners that swing shut. */
const BOX = { width: 160, height: 96 };
const FLAP = { width: 79, height: 12, open: 125 };
const GROUP = {
  left: stageCentre.x - BOX.width / 2,
  top: 121,
  width: BOX.width,
  height: FLAP.height + BOX.height,
};
const GROUP_CENTRE_Y = GROUP.top + GROUP.height / 2;
const MOUTH = GROUP.top + FLAP.height;

/** The picks wait above the open box, three by two, then drop in bottom row first. */
const HELD = { scale: 0.85, pitchX: 54, pitchY: 30, top: 50 };
const INSIDE = { pitchX: 34, y: MOUTH + 28 };

/** The finished group: the closed box as a badge on the left of a card, the preview on the right. */
const FINAL = { width: 320, height: 140 };
const BADGE = { scale: 0.5, inset: 20 };
const BADGE_WIDTH = BOX.width * BADGE.scale;
const BADGE_SHIFT = {
  x: BADGE.inset + BADGE_WIDTH / 2 - FINAL.width / 2,
  y: stageCentre.y - GROUP_CENTRE_Y,
};
const CONTENT_LEFT = BADGE.inset + BADGE_WIDTH + 16;

/** The six on the box's front: one mark for each pick inside. */
const MARK = { width: 18, height: 10, gap: 5 };

const chipAt = (index: number) => {
  const left = GRID.left + (index % COLUMNS) * (CHIP.width + CHIP.gap);
  const top = GRID.top + Math.floor(index / COLUMNS) * (CHIP.height + CHIP.gap);
  return { left, top, x: left + CHIP.width / 2, y: top + CHIP.height / 2 };
};

/** Each pick's place in the panel. */
const PICKED = PICKS.map(({ symbol }) => TICKERS.indexOf(symbol));

/** The cursor's tip lands just right of each code's middle, so the code stays readable. */
const TIPS: Point[] = PICKED.map((index) => {
  const { x, y } = chipAt(index);
  return { x: x + 17, y: y + 6 };
});
/** Off the stage's bottom right, so the cursor comes in from outside. */
const CURSOR_START: Point = { x: 362, y: 306 };

/** A chip changes as the press bottoms out. */
const PRESSED = ARRIVALS.map((arrival) => arrival + CLICK.press / 2);

/** The arrow's tip sits 1 unit into its own box. */
const at = ({ x, y }: Point, scale = 1) => ({
  transform: `translate(${u(x - 1)}, ${u(y - 1)}) scale(${scale})`,
});
const percent = (seconds: number) => `${((seconds / CURSOR_TIME) * 100).toFixed(2)}%`;

/** One path for the whole pick: settle onto each chip, press, lift, and move on. */
const CURSOR_FRAMES = TIPS.reduce<Record<string, CSSProperties>>(
  (frames, tip, i) => ({
    ...frames,
    [percent(ARRIVALS[i])]: { ...at(tip), animationTimingFunction: 'ease-out' },
    [percent(PRESSED[i])]: { ...at(tip, 0.82), animationTimingFunction: 'ease-out' },
    [percent(ARRIVALS[i] + CLICK.press)]: { ...at(tip), animationTimingFunction: ease.settle },
  }),
  { '0%': { ...at(CURSOR_START), animationTimingFunction: ease.settle } }
);

const fill: CSSProperties = { position: 'absolute', inset: 0 };

/**
 * A ticker on the panel. The click is CSS, so it pauses with the clock when the piece
 * leaves the screen. The flight into the box is Framer.
 */
const Chip = ({ index, phase, playState }: { index: number; phase: number; playState: string }) => {
  const pick = PICKED.indexOf(index);
  const brand = pick >= 0 ? PICKS[pick] : null;
  const { left, top, x, y } = chipAt(index);
  const clicking = pick >= 0 && phase === BEAT.pick;
  const selected = pick >= 0 && phase > BEAT.pick;

  let animate: Record<string, number | string> = { opacity: 1, scale: 1 };
  let transition: object = { duration: 0 };
  if (pick < 0) {
    if (phase >= BEAT.gather) {
      animate = { opacity: 0, scale: 0.85 };
      transition = { ...flatTransition.settle, duration: 0.2 };
    }
  } else {
    const column = pick % 3;
    const row = Math.floor(pick / 3);
    const held = {
      x: stageCentre.x + (column - 1) * HELD.pitchX,
      y: HELD.top + row * HELD.pitchY,
    };
    const inside = { x: stageCentre.x + (column - 1) * INSIDE.pitchX, y: INSIDE.y };
    if (phase >= BEAT.close) {
      // Inside the closed box. Hidden, so they don't trail behind it when it moves.
      animate = { opacity: 0, x: u(inside.x - x), y: u(inside.y - y), scale: HELD.scale };
    } else if (phase >= BEAT.drop) {
      animate = { opacity: 1, x: u(inside.x - x), y: u(inside.y - y), scale: HELD.scale };
      transition = { duration: 0.3, ease: 'easeIn', delay: (1 - row) * 0.16 + column * 0.05 };
    } else if (phase >= BEAT.gather) {
      animate = { opacity: 1, x: u(held.x - x), y: u(held.y - y), scale: HELD.scale };
      transition = { ...flatTransition.settle, delay: pick * 0.03 };
    } else {
      animate = { opacity: 1, x: u(0), y: u(0), scale: 1 };
    }
  }

  return (
    <m.div
      initial={false}
      animate={animate}
      transition={transition}
      style={{
        position: 'absolute',
        left: u(left),
        top: u(top),
        width: u(CHIP.width),
        height: u(CHIP.height),
      }}
    >
      <div
        style={
          {
            ...fill,
            display: 'grid',
            placeItems: 'center',
            borderRadius: u(radii.neuWell),
            backgroundColor: selected && brand ? brand.color : soft.ground,
            color: selected && brand ? brand.ink : palette.text,
            // The click's keyframes read the company's colours from here.
            '--pick-fill': brand?.color,
            '--pick-ink': brand?.ink,
            fontFamily: fonts.mono,
            fontSize: u(CHIP.font),
            fontWeight: 700,
            animation: clicking
              ? `assetPick 0.24s linear ${PRESSED[pick] - 0.02}s both ${playState}`
              : undefined,
          } as CSSProperties
        }
      >
        {TICKERS[index]}
      </div>
    </m.div>
  );
};

const Art = memo(({ phase, live, label }: { phase: number; live: boolean; label: string }) => {
  const picking = phase === BEAT.pick;
  const gathered = phase >= BEAT.gather;
  const closed = phase >= BEAT.close;
  const previewed = phase >= BEAT.preview;
  const playState = live ? 'running' : 'paused';

  const group = previewed
    ? {
        animate: { opacity: 1, x: u(BADGE_SHIFT.x), y: u(BADGE_SHIFT.y), scale: BADGE.scale },
        transition: { ...flatTransition.settle, duration: 0.65 },
      }
    : closed
      ? {
          // A small thunk as the flaps meet.
          animate: { opacity: 1, x: u(0), y: u(0), scale: [1, 0.96, 1] },
          transition: {
            scale: { duration: 0.3, delay: 0.2, times: [0, 0.35, 1], ease: 'easeOut' },
          },
        }
      : gathered
        ? {
            animate: { opacity: 1, x: u(0), y: u(0), scale: 1 },
            transition: {
              ...flatTransition.pop,
              delay: 0.2,
              opacity: { ...flatTransition.fade, delay: 0.2 },
            },
          }
        : {
            animate: { opacity: 0, x: u(0), y: u(14), scale: 0.6 },
            transition: { duration: 0 },
          };

  return (
    <Box
      sx={{
        ...fill,
        '@keyframes assetCursor': CURSOR_FRAMES,
        '@keyframes assetPick': {
          '0%': {
            backgroundColor: soft.ground,
            color: palette.text,
            transform: 'scale(1)',
            animationTimingFunction: 'ease-out',
          },
          // The colour flips in a few frames, since halfway the code would be grey on grey.
          '12%': {
            backgroundColor: 'var(--pick-fill)',
            color: 'var(--pick-ink)',
            transform: 'scale(0.93)',
            animationTimingFunction: 'ease-out',
          },
          '35%': {
            backgroundColor: 'var(--pick-fill)',
            color: 'var(--pick-ink)',
            transform: 'scale(0.88)',
            animationTimingFunction: ease.pop,
          },
          '100%': {
            backgroundColor: 'var(--pick-fill)',
            color: 'var(--pick-ink)',
            transform: 'scale(1)',
          },
        },
        '@keyframes assetRipple': {
          '0%': { opacity: 0, transform: 'scale(0.3)' },
          '1%': { opacity: 0.9, transform: 'scale(0.3)' },
          '100%': { opacity: 0, transform: 'scale(1.3)' },
        },
      }}
    >
      {/* The ticker search. It leaves as the picks lift off it. */}
      <m.div
        initial={false}
        animate={{ opacity: gathered ? 0 : 1, scale: gathered ? 0.95 : 1 }}
        transition={{ ...flatTransition.settle, duration: 0.3 }}
        style={{
          position: 'absolute',
          left: u(PANEL_LEFT),
          top: u(PANEL_TOP),
          width: u(PANEL.width),
          height: u(PANEL.height),
          borderRadius: u(radii.neuInner),
          background: palette.surface,
          boxShadow: shadows.neuRaisedMd,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: u(PANEL.pad),
            top: u(PANEL.pad),
            width: u(PANEL.width - 2 * PANEL.pad),
            height: u(PANEL.search),
            borderRadius: u(PANEL.search / 2),
            background: soft.ground,
            boxShadow: shadows.neuInsetSm,
          }}
        >
          <svg
            viewBox="0 0 16 16"
            style={{
              position: 'absolute',
              left: u(12),
              top: u((PANEL.search - 14) / 2),
              width: u(14),
              height: u(14),
            }}
          >
            <circle
              cx={6.5}
              cy={6.5}
              r={4.5}
              fill="none"
              stroke={palette.textMuted}
              strokeWidth={1.8}
            />
            <line
              x1={10}
              y1={10}
              x2={14}
              y2={14}
              stroke={palette.textMuted}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </m.div>

      {/* The group's card opens out from behind the closed box. */}
      <m.div
        initial={false}
        animate={{ y: u(previewed ? 0 : GROUP_CENTRE_Y - stageCentre.y) }}
        transition={{ ...flatTransition.settle, duration: 0.65 }}
        style={{ position: 'absolute', left: u(stageCentre.x), top: u(stageCentre.y) }}
      >
        <m.div
          initial={false}
          animate={{
            opacity: previewed ? 1 : 0,
            width: u(previewed ? FINAL.width : GROUP.width),
            height: u(previewed ? FINAL.height : GROUP.height),
          }}
          transition={{ ...flatTransition.settle, duration: 0.65, opacity: { duration: 0 } }}
          style={{
            position: 'absolute',
            x: '-50%',
            y: '-50%',
            borderRadius: u(radii.neuInner),
            background: palette.surface,
            boxShadow: shadows.neuRaisedMd,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: u(CONTENT_LEFT),
              top: 0,
              width: u(FINAL.width - CONTENT_LEFT - 18),
              height: u(FINAL.height),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: u(10),
            }}
          >
            <m.div
              initial={false}
              animate={{ opacity: previewed ? 1 : 0, x: u(previewed ? 0 : -10) }}
              transition={{ ...flatTransition.settle, delay: previewed ? 0.3 : 0 }}
              style={{
                fontFamily: fonts.sans,
                fontSize: u(21),
                fontWeight: 700,
                lineHeight: 1.15,
                color: palette.text,
                textWrap: 'balance',
              }}
            >
              {label}
            </m.div>
            {/* The preview: the six picks, in the order they were clicked. */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, max-content)',
                gap: u(5),
              }}
            >
              {PICKS.map(({ symbol, color, ink }, k) => {
                const delay = previewed ? 0.38 + k * 0.04 : 0;
                return (
                  <m.span
                    key={symbol}
                    initial={false}
                    animate={{ opacity: previewed ? 1 : 0, scale: previewed ? 1 : 0.6 }}
                    transition={{
                      ...flatTransition.pop,
                      delay,
                      opacity: { ...flatTransition.fade, delay },
                    }}
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      height: u(23),
                      paddingInline: u(7),
                      borderRadius: u(radii.sm),
                      background: color,
                      color: ink,
                      fontFamily: fonts.mono,
                      fontSize: u(12.5),
                      fontWeight: 700,
                    }}
                  >
                    {symbol}
                  </m.span>
                );
              })}
            </div>
          </div>
        </m.div>
      </m.div>

      {TICKERS.map((symbol, index) => (
        <Chip key={symbol} index={index} phase={phase} playState={playState} />
      ))}

      {/* A ring at each click. */}
      {picking &&
        TIPS.map((tip, k) => (
          <span
            key={k}
            style={{
              position: 'absolute',
              left: u(tip.x - 18),
              top: u(tip.y - 18),
              width: u(36),
              height: u(36),
              borderRadius: '50%',
              border: `${u(2)} solid ${isoColor.active}`,
              opacity: 0,
              animation: `assetRipple 0.45s ${ease.settle} ${PRESSED[k]}s both ${playState}`,
            }}
          />
        ))}

      {/* The box. The picks pass behind its front as they drop in. */}
      <m.div
        initial={false}
        animate={group.animate}
        transition={group.transition}
        style={{
          position: 'absolute',
          left: u(GROUP.left),
          top: u(GROUP.top),
          width: u(GROUP.width),
          height: u(GROUP.height),
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: u(FLAP.height),
            width: u(BOX.width),
            height: u(BOX.height),
            borderRadius: `${u(4)} ${u(4)} ${u(14)} ${u(14)}`,
            background: palette.navy,
            boxShadow: shadows.neuAccent,
          }}
        />
        {PICKS.map(({ symbol, color }, k) => {
          const column = k % 3;
          const row = Math.floor(k / 3);
          const delay = closed && !previewed ? 0.22 + k * 0.035 : 0;
          return (
            <m.span
              key={symbol}
              initial={false}
              animate={{ opacity: closed ? 1 : 0, scale: closed ? 1 : 0.4 }}
              transition={{
                ...flatTransition.pop,
                delay,
                opacity: { ...flatTransition.fade, delay },
              }}
              style={{
                position: 'absolute',
                left: u(
                  BOX.width / 2 -
                    (3 * MARK.width + 2 * MARK.gap) / 2 +
                    column * (MARK.width + MARK.gap)
                ),
                top: u(
                  FLAP.height +
                    BOX.height / 2 -
                    (2 * MARK.height + MARK.gap) / 2 +
                    row * (MARK.height + MARK.gap)
                ),
                width: u(MARK.width),
                height: u(MARK.height),
                borderRadius: u(3),
                background: color,
              }}
            />
          );
        })}
        {[-1, 1].map((side) => (
          <m.div
            key={side}
            initial={false}
            animate={{ rotate: closed ? 0 : side * FLAP.open }}
            transition={closed ? { ...flatTransition.settle, duration: 0.3 } : { duration: 0 }}
            style={{
              position: 'absolute',
              left: u(side < 0 ? 0 : BOX.width - FLAP.width),
              top: 0,
              width: u(FLAP.width),
              height: u(FLAP.height),
              originX: side < 0 ? 0 : 1,
              originY: 1,
              borderRadius: u(4),
              background: palette.blue,
            }}
          />
        ))}
      </m.div>

      {/* The visitor's cursor: in from the edge, six quick clicks, then it leaves. */}
      {phase < BEAT.drop && (
        <m.div
          initial={false}
          animate={{ opacity: gathered ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          <div
            style={{
              width: u(15),
              height: u(22),
              transformOrigin: `${u(1)} ${u(1)}`,
              transform: at(CURSOR_START).transform,
              animation:
                phase >= BEAT.pick
                  ? `assetCursor ${CURSOR_TIME}s linear 0s both ${playState}`
                  : undefined,
              filter: `drop-shadow(${shadows.brand})`,
            }}
          >
            <svg
              viewBox="0 0 15 22"
              width="100%"
              height="100%"
              style={{ display: 'block', overflow: 'visible' }}
            >
              <path
                d="M1 1 V17.5 L5.2 13.6 L8.2 20.4 L11 19.2 L8.1 12.6 H13.6 Z"
                fill={palette.navy}
                stroke={palette.surface}
                strokeWidth={1.4}
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </m.div>
      )}
    </Box>
  );
});
Art.displayName = 'CreateAssetGroupArt';

/** Everything that needs the motion library, loaded only when the piece comes near the screen. */
const CreateAssetGroupScene = (props: ComponentProps<typeof Art>) => (
  <LazyMotion features={domAnimation} strict>
    <Art {...props} />
  </LazyMotion>
);

export default CreateAssetGroupScene;
