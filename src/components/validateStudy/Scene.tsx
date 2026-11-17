import { memo } from 'react';
import type { ComponentProps } from 'react';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { APP } from '../fintelligentDemo/appTheme';
import { fonts } from '../../theme/tokens';
import { flatTransition } from '../isoKit/flat';
import { BEAT } from './beats';
import type { ValidateCopy } from './ValidateStudy';

/** Design units, on the stage's 400 by 300. The report card, then the plot inside it. */
const CARD = { x: 28, y: 26, w: 344, h: 248 };
const PLOT = { x0: 46, x1: 236, y0: 76, y1: 196 };
const SPLIT = [118, 176] as const;

const BEST = 'M46 184 C70 152 96 112 118 94 C138 86 158 92 176 100 C196 112 216 142 236 168';
const ROBUST = 'M46 186 C80 168 110 152 140 140 C175 126 205 114 236 104';
const BAND =
  'M46 186 C80 166 110 146 140 130 C175 112 205 98 236 88 L236 120 C205 130 175 142 140 150 C110 160 80 172 46 186 Z';

const RED = APP.dots[1];
const mono = { fontFamily: fonts.mono } as const;

type Props = ValidateCopy & { phase: number };

const Art = memo(({ phase, ...c }: Props) => {
  const framed = phase >= BEAT.frame;
  const drawn = phase >= BEAT.curves;
  const stats = phase >= BEAT.stats;
  const verdict = phase >= BEAT.verdict;
  const fade = (on: boolean, delay = 0) => ({
    animate: { opacity: on ? 1 : 0 },
    transition: { ...flatTransition.fade, duration: 0.3, delay },
  });
  const bands = [
    { x: PLOT.x0, w: SPLIT[0] - PLOT.x0, label: c.train, fill: APP.well },
    { x: SPLIT[0], w: SPLIT[1] - SPLIT[0], label: c.validation, fill: APP.selected },
    { x: SPLIT[1], w: PLOT.x1 - SPLIT[1], label: c.oos, fill: 'rgba(239,192,60,0.22)' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        style={{
          position: 'absolute',
          left: `${(CARD.x / 400) * 100}%`,
          top: `${(CARD.y / 300) * 100}%`,
          width: `${(CARD.w / 400) * 100}%`,
          height: `${(CARD.h / 300) * 100}%`,
          background: APP.paper,
          borderRadius: '2.6cqw',
          boxShadow: APP.shadow.raisedSm,
        }}
      />
      <svg viewBox="0 0 400 300" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <text x={46} y={50} fontSize={11} fontWeight={600} fill={APP.text}>
          {c.title}
        </text>
        <line x1={46} x2={354} y1={60} y2={60} stroke={APP.divider} />

        <m.g initial={false} {...fade(framed)}>
          {bands.map((b) => (
            <g key={b.label}>
              <rect x={b.x} y={PLOT.y0} width={b.w} height={PLOT.y1 - PLOT.y0} fill={b.fill} />
              <text x={b.x + b.w / 2} y={PLOT.y1 + 11} fontSize={7.5} textAnchor="middle" fill={APP.textSecondary} style={mono}>
                {b.label}
              </text>
            </g>
          ))}
          <line x1={PLOT.x0} x2={PLOT.x1} y1={PLOT.y1} y2={PLOT.y1} stroke={APP.divider} />
        </m.g>

        <m.path d={BAND} fill={APP.info} initial={false} animate={{ opacity: drawn ? 0.14 : 0 }} transition={{ duration: 0.5, delay: drawn ? 0.9 : 0 }} />
        <m.path
          d={BEST}
          fill="none"
          stroke={RED}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
        <m.path
          d={ROBUST}
          fill="none"
          stroke={APP.navy}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.15 }}
        />
        <m.g initial={false} {...fade(drawn, 1.1)}>
          <text x={PLOT.x1 - 2} y={175} fontSize={7.5} textAnchor="end" fill={RED} style={mono}>
            {c.best}
          </text>
          <text x={PLOT.x1 - 2} y={82} fontSize={7.5} textAnchor="end" fill={APP.navy} style={mono}>
            {c.robust}
          </text>
        </m.g>

        {c.stats.map((s, i) => (
          <m.g key={s.label} initial={false} {...fade(stats, i * 0.22)}>
            <text x={254} y={84 + i * 38} fontSize={7.5} fill={APP.textSecondary} style={mono}>
              {s.label}
            </text>
            <text x={254} y={102 + i * 38} fontSize={16} fontWeight={600} fill={APP.text}>
              {s.value}
            </text>
            <line x1={254} x2={354} y1={110 + i * 38} y2={110 + i * 38} stroke={APP.divider} />
          </m.g>
        ))}
        <m.text x={254} y={196} fontSize={7} fill={APP.textSecondary} style={mono} initial={false} {...fade(drawn, 1.2)}>
          {c.interval}
        </m.text>

        <m.g
          initial={false}
          animate={{ opacity: verdict ? 1 : 0, scale: verdict ? 1 : 0.9 }}
          transition={flatTransition.pop}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <rect x={46} y={224} width={308} height={30} rx={15} fill={APP.success} />
          <circle cx={64} cy={239} r={8} fill="#fff" />
          <path d="M60 239.5 L63 242.5 L68.5 236" fill="none" stroke={APP.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <text x={80} y={242.5} fontSize={10.5} fontWeight={600} fill="#fff">
            {c.verdict}
          </text>
        </m.g>
      </svg>
    </div>
  );
});
Art.displayName = 'ValidateStudyArt';

/** Everything that needs the motion library, loaded only when the piece comes near the screen. */
const ValidateStudyScene = (props: ComponentProps<typeof Art>) => (
  <LazyMotion features={domAnimation} strict>
    <Art {...props} />
  </LazyMotion>
);

export default ValidateStudyScene;
