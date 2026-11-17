import { memo } from 'react';
import type { CSSProperties } from 'react';
import { domAnimation, LazyMotion, m, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { APP } from '../../components/fintelligentDemo/appTheme';
import { fonts, palette, radii, shadows, soft } from '../../theme/tokens';
import { flatSelector, stageCentre, u } from '../isoKit/flat';
import { FlatSelector } from '../isoKit/FlatSelector';
import { ease, span, track, useSceneTime } from '../isoKit/scrub';
import type { Move } from '../isoKit/scrub';
import type { SceneTime } from '../isoKit/timeline';
import { isoColor, time as kitTime } from '../isoKit/tokens';
import { AT, BEAT, BEATS } from './beats';
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

/** Seconds on the playhead. */
const OPEN = AT[BEAT.open];
const WRITE = AT[BEAT.write];
const CONVERT = AT[BEAT.convert];
const MORPH = AT[BEAT.morph];
/** The finished code stays on screen for a moment before it is converted. */
const WRITE_TIME = BEATS[BEAT.write - 1] - 0.25;
/** How long the shell takes to grow, squeeze and settle. */
const GROW = 0.65;
/** The squeeze passes through a tall narrow box this far through, then settles square. */
const SQUEEZE = 0.6;
/** The bar and the editor's labels show a moment after the editor opens. */
const LABELS_IN = OPEN + 0.15;
const LABEL_FADE = 0.15;
/** The f(x) pops in once the code has gone. */
const FORMULA_IN = CONVERT + 0.32;
const CARD_TEXT_IN = MORPH + 0.3;

const CHARS = STRATEGY_CODE.reduce(
  (sum, runs) => sum + runs.reduce((count, [text]) => count + text.length, 0),
  0
);

/** Each line takes its share of the writing time, by length, so typing keeps one speed. */
const LINES = STRATEGY_CODE.reduce<
  { runs: (typeof STRATEGY_CODE)[number]; length: number; start: number; duration: number }[]
>((lines, runs) => {
  const previous = lines[lines.length - 1];
  const length = runs.reduce((count, [text]) => count + text.length, 0);
  return [
    ...lines,
    {
      runs,
      length,
      start: previous ? previous.start + previous.duration : WRITE,
      duration: (length / CHARS) * WRITE_TIME,
    },
  ];
}, []);

const fill: CSSProperties = { position: 'absolute', inset: 0 };

/**
 * The shell's size through the story, in design units: the selector's window opens into
 * an editor, is squeezed through a tall narrow box into the f(x) box, and settles as the
 * badge. `squeeze` is where it passes through on the way to the box.
 */
const shellTrack = (pill: number, editor: number, squeeze: number, box: number, badge: number) =>
  track(pill, [
    { at: OPEN, to: editor, duration: kitTime.plate, ease: ease.settle },
    { at: CONVERT, to: squeeze, duration: GROW * SQUEEZE, ease: ease.settle },
    { at: CONVERT + GROW * SQUEEZE, to: box, duration: GROW * (1 - SQUEEZE), ease: ease.settle },
    { at: MORPH, to: badge, duration: GROW, ease: ease.settle },
  ]);

const SHELL = {
  width: shellTrack(PILL.width, EDITOR.width, 92, BOX.side, BADGE.side),
  height: shellTrack(PILL.height, EDITOR.height, 150, BOX.side, BADGE.side),
  // The bar starts at its own height and catches up with the shell halfway into the squeeze.
  bar: shellTrack(PILL.height, EDITOR.header, 150, BOX.side, BADGE.side),
  radius: track(PILL.radius, [
    { at: OPEN, to: EDITOR.radius, duration: kitTime.plate, ease: ease.settle },
    { at: CONVERT, to: BOX.radius, duration: GROW, ease: ease.settle },
    { at: MORPH, to: BADGE.radius, duration: GROW, ease: ease.settle },
  ]),
};

/** Shown while the editor is open: in a moment after it opens, out as the code converts. */
const EDITING: Move[] = [
  { at: LABELS_IN, to: 1, duration: LABEL_FADE, ease: ease.out },
  { at: CONVERT, to: 0, duration: LABEL_FADE, ease: ease.out },
];
const editing = track(0, EDITING);

/** One way through `[0, 1]`, as design units. */
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

/**
 * One line of code, typed a character at a time. A cover the colour of the editor slides
 * off the line a whole character at a time, with the caret on its edge, so the two can
 * never drift apart. Only the last line's caret stays, at the end of the finished code.
 */
const CodeLine = ({ index, time }: { index: number; time: MotionValue<number> }) => {
  const { runs, length, start, duration } = LINES[index];
  const last = index === LINES.length - 1;
  const caretEnd = last ? CONVERT : start + duration;

  const typed = useTransform(time, (s) =>
    s < start ? 0 : Math.min(length, Math.floor(((s - start) / duration) * length) + 1)
  );
  const cover = useTransform(typed, (chars) => `${chars}ch`);
  const number = useTransform(time, (s) => (s >= start ? 1 : 0));
  const caret = useTransform(time, (s) => (s >= start && s < caretEnd ? 1 : 0));

  return (
    <div style={{ display: 'flex', height: u(CODE.lineHeight), alignItems: 'center' }}>
      <m.span style={{ width: u(CODE.gutter), flexShrink: 0, color: APP.textDisabled, opacity: number }}>
        {index + 1}
      </m.span>
      <span style={{ position: 'relative', whiteSpace: 'pre' }}>
        {runs.map(([text, color], i) => (
          <span key={i} style={{ color }}>
            {text}
          </span>
        ))}
        <m.span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${length + 1}ch`,
            background: palette.surface,
            x: cover,
          }}
        >
          <m.span
            style={{
              position: 'absolute',
              left: 0,
              top: '8%',
              bottom: '8%',
              width: u(2),
              background: palette.navy,
              opacity: caret,
            }}
          />
        </m.span>
      </span>
    </div>
  );
};

const Art = memo(
  ({
    time,
    names,
    landOn,
    formula,
    label,
  }: {
    time: MotionValue<number>;
    names: readonly string[];
    landOn: number;
    formula: string;
    label: string;
  }) => {
    const name = names[landOn];

    const opened = useTransform(time, (s) => (s >= OPEN ? 1 : 0));
    const carded = useTransform(time, (s) => (s >= MORPH ? 1 : 0));
    const travel = useTransform(time, (s) => u(BADGE_SHIFT * span(s, MORPH, GROW, ease.settle)));

    const cardWidth = useTransform(time, (s) =>
      u(lerp(BOX.side, FINAL.width, span(s, MORPH, GROW, ease.settle)))
    );
    const cardHeight = useTransform(time, (s) =>
      u(lerp(BOX.side, FINAL.height, span(s, MORPH, GROW, ease.settle)))
    );
    const cardText = useTransform(time, (s) => span(s, CARD_TEXT_IN, kitTime.plate, ease.settle));
    const cardTextX = useTransform(cardText, (p) => u(lerp(-10, 0, p)));

    const shellWidth = useTransform(time, (s) => u(SHELL.width(s)));
    const shellHeight = useTransform(time, (s) => u(SHELL.height(s)));
    const shellRadius = useTransform(time, (s) => u(SHELL.radius(s)));
    const bar = useTransform(time, (s) => u(SHELL.bar(s)));

    const squeeze = useTransform(time, (s) => span(s, CONVERT, 0.4, ease.settle));
    const codeOpacity = useTransform(squeeze, (p) => 1 - p);
    const codeScaleX = useTransform(squeeze, (p) => lerp(1, 0.45, p));
    const codeScaleY = useTransform(squeeze, (p) => lerp(1, 0.08, p));

    const named = useTransform(time, (s) => span(s, OPEN, 0.4, ease.settle));
    const nameX = useTransform(named, (p) =>
      u(lerp((PILL.width - name.length * flatSelector.charWidth) / 2, 28, p))
    );
    const nameY = useTransform(named, (p) => u(lerp(0, (EDITOR.header - PILL.height) / 2, p)));
    const nameSize = useTransform(named, (p) => u(lerp(20, 13.5, p)));
    const nameOpacity = useTransform(time, (s) => 1 - span(s, CONVERT, LABEL_FADE, ease.out));

    const labels = useTransform(time, editing);
    // Yellow while the work moves, green once the code is written.
    const status = useTransform(
      time,
      [WRITE + WRITE_TIME, WRITE + WRITE_TIME + LABEL_FADE],
      [isoColor.active, isoColor.done]
    );

    const formulaOpacity = useTransform(time, (s) => span(s, FORMULA_IN, kitTime.cardOut));
    const formulaScale = useTransform(time, (s) => lerp(0.5, 1, span(s, FORMULA_IN, kitTime.packet, ease.pop)));
    const formulaSize = useTransform(time, (s) => u(lerp(42, 24, span(s, MORPH, GROW, ease.settle))));

    return (
      <div style={fill}>
        <FlatSelector
          names={names}
          landOn={landOn}
          time={time}
          at={{ spin: AT[BEAT.spin], land: AT[BEAT.land], gone: OPEN }}
        />

        {/* The strategy card opens out from behind the f(x) box. */}
        <m.div
          style={{
            position: 'absolute',
            left: u(CENTRE.x),
            top: u(CENTRE.y),
            x: '-50%',
            y: '-50%',
            width: cardWidth,
            height: cardHeight,
            opacity: carded,
            borderRadius: u(radii.neuInner),
            background: palette.surface,
            boxShadow: shadows.neuRaisedMd,
          }}
        >
          <m.div
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
              opacity: cardText,
              x: cardTextX,
            }}
          >
            <div style={{ fontSize: u(23), fontWeight: 700, lineHeight: 1.15, color: palette.text }}>
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

        {/* Travels to its place on the card. The shell inside only changes size. It appears
            exactly over the selector's window and then grows, so there's no ghosted double. */}
        <m.div
          style={{
            position: 'absolute',
            left: u(CENTRE.x),
            top: u(CENTRE.y),
            x: travel,
            opacity: opened,
          }}
        >
          <m.div
            style={{
              position: 'absolute',
              x: '-50%',
              y: '-50%',
              width: shellWidth,
              height: shellHeight,
              borderRadius: shellRadius,
              overflow: 'hidden',
              background: palette.surface,
              boxShadow: shadows.neuAccent,
            }}
          >
            {/* The code keeps its width while the shell moves around it, so it never reflows. */}
            <m.div
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
                opacity: codeOpacity,
                scaleX: codeScaleX,
                scaleY: codeScaleY,
              }}
            >
              {LINES.map((_, index) => (
                <CodeLine key={index} index={index} time={time} />
              ))}
            </m.div>

            <m.div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: bar,
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
                style={{ display: 'block', x: nameX, y: nameY, fontSize: nameSize, opacity: nameOpacity }}
              >
                {name}
              </m.span>
            </div>

            <m.span
              style={{
                position: 'absolute',
                left: u(12),
                top: u((EDITOR.header - 8) / 2),
                width: u(8),
                height: u(8),
                borderRadius: '50%',
                opacity: labels,
                backgroundColor: status,
              }}
            />
            <m.div
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
                opacity: labels,
              }}
            >
              {STRATEGY_FILE}
            </m.div>

            <m.div
              style={{
                ...fill,
                display: 'grid',
                placeItems: 'center',
                color: palette.surface,
                fontFamily: fonts.mono,
                fontWeight: 700,
                opacity: formulaOpacity,
                scale: formulaScale,
                fontSize: formulaSize,
              }}
            >
              {formula}
            </m.div>
          </m.div>
        </m.div>
      </div>
    );
  }
);
Art.displayName = 'CreateInvestingStrategyArt';

interface SceneProps {
  time: SceneTime;
  names: readonly string[];
  landOn: number;
  formula: string;
  label: string;
}

/** Everything that needs the motion library, loaded only when the piece comes near the screen. */
const CreateInvestingStrategyScene = ({ time, ...props }: SceneProps) => {
  const playhead = useSceneTime(time);
  return (
    <LazyMotion features={domAnimation} strict>
      <Art time={playhead} {...props} />
    </LazyMotion>
  );
};

export default CreateInvestingStrategyScene;
