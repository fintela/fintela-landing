import { memo, useEffect, useMemo, useRef } from 'react';
import type { ComponentProps } from 'react';
import { domAnimation, LazyMotion, m, useMotionValue, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { fonts, palette, radii } from '../../theme/tokens';
import { APP } from '../fintelligentDemo/appTheme';
import { flatSelector, flatTransition, stageCentre, u } from '../isoKit/flat';
import { FlatSelector } from '../isoKit/FlatSelector';
import { IsoKeyframes } from '../isoKit/IsoKeyframes';
import { isoColor } from '../isoKit/tokens';
import { BEAT, BEATS } from './beats';

/** Design units. The card is centred on the stage, as the selector is. */
const PILL = flatSelector.window;
const CARD = { width: 352, height: 264 };
const CHART = { left: 14, top: 52, width: 324, height: 188 };
/** The figures sit in the chart's empty top left, which the rising line never reaches. */
const STATS = { left: 18, top: 56, gap: 24 };
const CHART_INDEX = BEAT.chart - 1;

/** Illustrative: an upward line with ordinary pullbacks. */
const CURVE = [166, 158, 162, 147, 151, 134, 125, 131, 112, 104, 110, 87, 79, 63, 55, 32];
const CURVE_STEP = 20;
const CURVE_LEFT = 6;
const BASELINE = 182;
const points = CURVE.map((y, i) => `${CURVE_LEFT + i * CURVE_STEP} ${y}`);
const LINE = `M${points.join(' L')}`;
const LAST_X = CURVE_LEFT + (CURVE.length - 1) * CURVE_STEP;
const LAST_Y = CURVE[CURVE.length - 1];
const AREA = `${LINE} L${LAST_X} ${BASELINE} L${CURVE_LEFT} ${BASELINE} Z`;
const GRID = [46, 92, 138];
const AREA_FILL = 'launchToLiveArea';

/** The illustrative figures the line settles on. */
const RETURN = 0.247;
const SHARPE = 1.68;

/** The accumulated return at each point of the curve: none where it starts, `RETURN` where it ends. */
const RETURNS = CURVE.map((y) => ((CURVE[0] - y) / (CURVE[0] - LAST_Y)) * RETURN);

/**
 * The curve's own running Sharpe at each point, scaled to settle on `SHARPE`. It swings while
 * there is little history and steadies as the history grows, as a real one does.
 */
const SHARPES = (() => {
  const steps = RETURNS.slice(1).map((r, i) => (1 + r) / (1 + RETURNS[i]) - 1);
  const raw = CURVE.map((_, i) => {
    // A ratio needs at least two steps to have a spread.
    if (i < 2) return 0;
    const seen = steps.slice(0, i);
    const mean = seen.reduce((sum, step) => sum + step, 0) / i;
    const spread = Math.sqrt(seen.reduce((sum, step) => sum + (step - mean) ** 2, 0) / (i - 1));
    return mean / spread;
  });
  return raw.map((ratio) => (ratio / raw[raw.length - 1]) * SHARPE);
})();

/** Framer draws a path by its length, so the pen's place along the curve follows length, not x. */
const SEGMENTS = CURVE.slice(1).map((y, i) => Math.hypot(CURVE_STEP, y - CURVE[i]));
const LENGTH = SEGMENTS.reduce((sum, segment) => sum + segment, 0);

/** The pen's place as a fractional index into `CURVE`, from the share of the line drawn. */
const indexAt = (drawn: number) => {
  let left = Math.min(Math.max(drawn, 0), 1) * LENGTH;
  for (let i = 0; i < SEGMENTS.length; i += 1) {
    if (left <= SEGMENTS[i]) return i + left / SEGMENTS[i];
    left -= SEGMENTS[i];
  }
  return SEGMENTS.length;
};

const valueAt = (values: readonly number[], index: number) => {
  const i = Math.min(Math.floor(index), values.length - 2);
  return values[i] + (values[i + 1] - values[i]) * (index - i);
};

/** Month ticks two months apart, the last under the live end of the line. */
const TICKS = 5;
const TICK_MONTHS = 2;
const TICK_GAP = (LAST_X - CURVE_LEFT) / (TICKS - 1);
/** Design units before the pen reaches a month over which its label fades in. */
const TICK_REVEAL = 24;
/**
 * The axis ends this month, so the dates never go stale. The scene loads only in the
 * browser, from an effect, so this never runs during prerendering.
 */
const THIS_MONTH = new Date();

/** Live, the Sharpe ticks around its settled value twice per pulse of the Live dot. */
const SWAY_TICK = 0.7;
const swayAt = (seconds: number) =>
  0.06 * Math.sin((seconds / 5.6) * 2 * Math.PI) +
  0.025 * Math.sin((seconds / 2.1) * 2 * Math.PI + 1);

const Stat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: MotionValue<string>;
  color: string;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: u(4) }}>
    <span style={{ fontSize: u(9.5), fontWeight: 600, lineHeight: 1.2, color: APP.textSecondary }}>
      {label}
    </span>
    {/* A motion value as the child is written straight to the DOM, so counting never re-renders. */}
    <m.span
      initial={false}
      style={{ fontSize: u(21), fontWeight: 800, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums' }}
    >
      {value}
    </m.span>
  </div>
);

/** A month on the time axis. It appears as the pen reaches it. */
const DateTick = ({ x, label, penX }: { x: number; label: string; penX: MotionValue<number> }) => {
  const opacity = useTransform(penX, [x - TICK_REVEAL, x], [0, 1]);
  return (
    <m.g initial={false} style={{ opacity }}>
      <line
        x1={x}
        y1={BASELINE}
        x2={x}
        y2={BASELINE + 4}
        stroke={APP.divider}
        strokeWidth={1}
      />
      <text
        x={x}
        y={BASELINE + 15}
        textAnchor="middle"
        fill={APP.textSecondary}
        fontSize={9}
        fontWeight={600}
      >
        {label}
      </text>
    </m.g>
  );
};

const Art = memo(
  ({
    phase,
    still,
    live,
    brokers,
    landOn,
    liveLabel,
    returnLabel,
    sharpeLabel,
    locale,
  }: {
    phase: number;
    still: boolean;
    live: boolean;
    brokers: readonly string[];
    landOn: number;
    liveLabel: string;
    returnLabel: string;
    sharpeLabel: string;
    locale: string;
  }) => {
    const carded = phase >= BEAT.morph;
    const charted = phase >= BEAT.chart;
    const settled = phase > BEAT.chart;
    const name = brokers[landOn];
    const playState = live ? 'running' : 'paused';
    const grow = { ...flatTransition.settle, duration: 0.65 };

    const formats = useMemo(
      () => ({
        percent: new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
          signDisplay: 'exceptZero',
        }),
        ratio: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      }),
      [locale]
    );
    const months = useMemo(() => {
      const format = new Intl.DateTimeFormat(locale, { month: 'short' });
      const year = THIS_MONTH.getFullYear();
      const month = THIS_MONTH.getMonth();
      return Array.from({ length: TICKS }, (_, i) =>
        format.format(new Date(year, month - (TICKS - 1 - i) * TICK_MONTHS, 1))
      );
    }, [locale]);

    // The share of the line drawn, fed by the line's own animation, so the figures and
    // the months follow the pen exactly. A remount into the settled state starts it full.
    const drawn = useMotionValue(charted ? 1 : 0);
    const sway = useMotionValue(0);
    const pen = useTransform(drawn, indexAt);
    const penX = useTransform(pen, (index) => CURVE_LEFT + index * CURVE_STEP);
    const returnText = useTransform(pen, (index) => formats.percent.format(valueAt(RETURNS, index)));
    const sharpeText = useTransform([pen, sway], ([index, offset]: number[]) =>
      formats.ratio.format(valueAt(SHARPES, index) + offset)
    );

    // Only while live: off screen or in a hidden tab, the figure holds where it is.
    const swayTicks = useRef(0);
    useEffect(() => {
      if (!live || !settled) return undefined;
      const timer = window.setInterval(() => {
        swayTicks.current += 1;
        sway.set(swayAt(swayTicks.current * SWAY_TICK));
      }, SWAY_TICK * 1000);
      return () => window.clearInterval(timer);
    }, [live, settled, sway]);

    return (
      <>
        {!still && <IsoKeyframes />}

        <FlatSelector
          names={brokers}
          landOn={landOn}
          spinning={phase >= BEAT.spin}
          landed={phase >= BEAT.land}
          gone={carded}
        />

        {/* The selector's window grows into the card, so the name is never lost. Now a white card like
            the others, with the live line as its accent. */}
        <m.div
          initial={false}
          animate={{
            opacity: carded ? 1 : 0,
            width: u(carded ? CARD.width : PILL.width),
            height: u(carded ? CARD.height : PILL.height),
            borderRadius: u(carded ? radii.neuCardSm : PILL.radius),
          }}
          // Appears exactly over the selector's window and then grows, so there's no ghosted double.
          transition={{ ...grow, opacity: { duration: 0 } }}
          style={{
            position: 'absolute',
            left: u(stageCentre.x),
            top: u(stageCentre.y),
            x: '-50%',
            y: '-50%',
            overflow: 'hidden',
            background: palette.surface,
            boxShadow: APP.shadow.raisedSm,
            color: APP.text,
            fontFamily: fonts.sans,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: u(PILL.height),
              display: 'flex',
              alignItems: 'center',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <m.span
              initial={false}
              animate={{
                x: u(carded ? 34 : (PILL.width - name.length * flatSelector.charWidth) / 2),
                fontSize: u(carded ? 17 : 20),
              }}
              transition={grow}
              style={{ display: 'block' }}
            >
              {name}
            </m.span>
          </div>

          <m.span
            initial={false}
            animate={{ opacity: carded ? 1 : 0 }}
            transition={{ duration: 0.15, delay: carded ? 0.15 : 0 }}
            style={{
              position: 'absolute',
              left: u(18),
              top: u((PILL.height - 8) / 2),
              width: u(8),
              height: u(8),
              borderRadius: '50%',
              background: isoColor.done,
            }}
          />

          {/* Spaced from the left at the card's final width, so the card's growth never moves it. */}
          <m.div
            initial={false}
            animate={{ opacity: charted ? 1 : 0 }}
            transition={flatTransition.settle}
            style={{
              position: 'absolute',
              left: u(CARD.width - 16),
              top: u(11),
              x: '-100%',
              height: u(30),
              display: 'flex',
              alignItems: 'center',
              gap: u(6),
              paddingInline: u(12),
              borderRadius: u(15),
              background: APP.well,
              fontSize: u(14),
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              className={still ? undefined : 'isoPulse'}
              style={{
                width: u(8),
                height: u(8),
                borderRadius: '50%',
                background: isoColor.done,
                animationPlayState: playState,
              }}
            />
            {liveLabel}
          </m.div>

          {/* The figures count with the pen while the line draws. Illustrative, like the curve. */}
          <m.div
            initial={false}
            animate={{ opacity: charted ? 1 : 0 }}
            transition={flatTransition.settle}
            style={{
              position: 'absolute',
              left: u(STATS.left),
              top: u(STATS.top),
              display: 'flex',
              gap: u(STATS.gap),
              whiteSpace: 'nowrap',
            }}
          >
            <Stat label={returnLabel} value={returnText} color={isoColor.done} />
            <Stat label={sharpeLabel} value={sharpeText} color={APP.text} />
          </m.div>

          <svg
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
            style={{
              position: 'absolute',
              left: u(CHART.left),
              top: u(CHART.top),
              width: u(CHART.width),
              height: u(CHART.height),
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id={AREA_FILL} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isoColor.done} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isoColor.done} stopOpacity={0} />
              </linearGradient>
            </defs>
            <m.g
              initial={false}
              animate={{ opacity: carded ? 1 : 0 }}
              transition={{ ...flatTransition.settle, delay: carded && !charted ? 0.35 : 0 }}
            >
              {GRID.map((y) => (
                <line
                  key={y}
                  x1={0}
                  y1={y}
                  x2={CHART.width}
                  y2={y}
                  stroke={APP.divider}
                  strokeWidth={1}
                />
              ))}
              <line
                x1={0}
                y1={BASELINE}
                x2={CHART.width}
                y2={BASELINE}
                stroke={APP.divider}
                strokeWidth={1}
              />
              {months.map((month, i) => (
                <DateTick key={i} x={CURVE_LEFT + i * TICK_GAP} label={month} penX={penX} />
              ))}
            </m.g>
            <m.path
              d={AREA}
              fill={`url(#${AREA_FILL})`}
              initial={false}
              animate={{ opacity: charted ? 1 : 0 }}
              // Washes in behind the finished line, rather than showing ahead of it.
              transition={{
                duration: 0.5,
                delay: charted ? BEATS[CHART_INDEX] - 0.25 : 0,
                ease: 'easeOut',
              }}
            />
            <m.path
              d={LINE}
              fill="none"
              stroke={isoColor.done}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: charted ? 1 : 0, opacity: charted ? 1 : 0 }}
              transition={{
                pathLength: { duration: BEATS[CHART_INDEX] - 0.1, ease: 'easeInOut' },
                opacity: { duration: 0.1 },
              }}
              onUpdate={(latest) => {
                if (typeof latest.pathLength === 'number') drawn.set(latest.pathLength);
              }}
            />
            {/* The end of the line is what is live. */}
            {settled && !still && (
              <circle
                cx={LAST_X}
                cy={LAST_Y}
                r={8}
                fill="none"
                stroke={isoColor.done}
                strokeWidth={2}
                className="isoRing"
                style={{ animationPlayState: playState }}
              />
            )}
            <m.circle
              cx={LAST_X}
              cy={LAST_Y}
              r={5}
              fill={isoColor.done}
              stroke={palette.surface}
              strokeWidth={2}
              initial={false}
              animate={{ opacity: settled ? 1 : 0 }}
              transition={flatTransition.fade}
            />
          </svg>
        </m.div>
      </>
    );
  }
);
Art.displayName = 'LaunchToLiveArt';

/** Everything that needs the motion library, loaded only when the piece comes near the screen. */
const LaunchToLiveScene = (props: ComponentProps<typeof Art>) => (
  <LazyMotion features={domAnimation} strict>
    <Art {...props} />
  </LazyMotion>
);

export default LaunchToLiveScene;
