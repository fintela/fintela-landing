import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { Box, GlobalStyles } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { fonts, gradients, motion, palette, soft } from '../../theme/tokens';
import { focusRingSx, forcedColorsFocus } from '../../theme/neu';
import { APP } from './appTheme';
import { PointerGlyph } from './glyphs';
import {
  AnsweredChip,
  BetaNotice,
  Composer,
  EvolutionChart,
  LiveRow,
  Pill,
  PipelineStrip,
  QuestionCard,
  RichText,
  SettledRow,
  Sidebar,
  StatusLine,
  StrategiesPage,
  StrategyTable,
  StudyBadge,
  ThinkingPanel,
  Tile,
  UserRow,
  AutoScroll,
} from './parts';
import type { FeedItem, Question, SendState } from './parts';
import {
  CHAPTERS,
  CLICKS,
  CURSOR_PATH,
  LOOP,
  MENU_HOVER,
  STILL,
  T,
  TURNS,
  currentTurn,
  ease,
  groupDigits,
  latest,
  lerp,
  span,
} from './script';
import type { StatusKey, ToolStep } from './script';
import { useLoopClock } from '../../lib/useLoopClock';

const K = 'fintelligentDemo';

/** Below this container width the demo draws the compact window. */
const NARROW_BELOW = 760;

interface Layout {
  w: number;
  h: number;
  transcript: { left: number; top: number; width: number; height: number };
  thinking: number;
  composer: { width: number; top: number; height: number };
  pageLeft: number;
  sidebar: boolean;
  /** Container height as a share of its width. */
  aspect: number;
}

const WIDE: Layout = {
  w: 1120,
  h: 712,
  transcript: { left: 112, top: 20, width: 896, height: 598 },
  thinking: 312,
  composer: { width: 620, top: 632, height: 48 },
  pageLeft: 212,
  sidebar: true,
  aspect: 0.7,
};

const NARROW: Layout = {
  w: 460,
  h: 800,
  transcript: { left: 12, top: 14, width: 436, height: 690 },
  thinking: 0,
  composer: { width: 436, top: 716, height: 48 },
  pageLeft: 18,
  sidebar: false,
  aspect: 1.78,
};

interface Camera {
  rx: number;
  ry: number;
  rz: number;
  zoom: number;
  explode: number;
}

/** The readable 3/4 view the conversation plays in, and the isometric shot that frames it. */
const FRONT: Camera = { rx: 13, ry: -11, rz: 0, zoom: 0.9, explode: 1 };
const ISO: Camera = { rx: 52, ry: 0, rz: -33, zoom: 0.74, explode: 1.6 };
const FRONT_NARROW: Camera = { rx: 8, ry: -7, rz: 0, zoom: 0.94, explode: 0.7 };
const ISO_NARROW: Camera = { rx: 42, ry: 0, rz: -24, zoom: 0.8, explode: 1.3 };

const mixCamera = (a: Camera, b: Camera, k: number): Camera => ({
  rx: lerp(a.rx, b.rx, k),
  ry: lerp(a.ry, b.ry, k),
  rz: lerp(a.rz, b.rz, k),
  zoom: lerp(a.zoom, b.zoom, k),
  explode: lerp(a.explode, b.explode, k),
});

/** The app's panel entrance: a spring that overshoots, then settles. */
const easeOutBack = (x: number) => {
  const c = 1.7;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

/** A seeded, repeatable study: raw scores per sampled trial and the best so far. */
const STUDY_SAMPLES = 120;
const STUDY = (() => {
  let s = 17;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const raw: number[] = [];
  const best: number[] = [];
  let top = 0;
  for (let i = 0; i < STUDY_SAMPLES; i++) {
    // TPE: a wide early spread that tightens toward the good region.
    const focus = Math.min(1, i / 70);
    const v = Math.max(0.05, 0.55 + focus * 0.95 + (rand() - 0.5) * (1.3 - focus * 0.7));
    raw.push(Math.min(1.84, v));
    top = Math.max(top, raw[i]);
    best.push(top);
  }
  return { raw, best };
})();

const Z = (z: number, explode: number): CSSProperties => ({
  transform: `translateZ(${(z * explode).toFixed(2)}px)`,
  transformStyle: 'preserve-3d',
});

/** A soft shadow a lifted layer casts on the plate. */
const Shadow = memo(({ rect, opacity }: { rect: Layout['transcript']; opacity: number }) => (
  <Box
    aria-hidden
    style={{ ...rect, opacity, transform: 'translateZ(1px)' }}
    sx={{ position: 'absolute', borderRadius: '18px', background: 'rgba(11,26,51,0.22)', filter: 'blur(16px)' }}
  />
));
Shadow.displayName = 'Shadow';

/**
 * The messages column. Every visibility and state flag below is a primitive
 * derived from the playhead, so the memoized pieces only re-render when
 * something on screen actually changes.
 */
const Transcript = memo(
  ({
    user1,
    live1,
    settled1,
    card1,
    answered1,
    live2,
    settled2,
    card2,
    answered2,
    live3,
    settled3,
  }: {
    user1: boolean;
    live1: string | null;
    settled1: boolean;
    card1: string | null;
    answered1: boolean;
    live2: string | null;
    settled2: boolean;
    card2: string | null;
    answered2: boolean;
    live3: string | null;
    settled3: boolean;
  }) => {
    const { t } = useTranslation('home');
    const q = `${K}.script.q`;
    const chips = useMemo(() => TURNS.map((turn) => chipsFor(turn.steps, (key) => t(`${K}.app.tools.${key}`))), [t]);

    const questionCard = (state: string) => {
      // state: "active|a0|a1|a2|menu|highlight|pressed"
      const [active, a0, a1, a2, menu, highlight, pressed] = state.split('|').map(Number);
      const questions: Question[] = [
        {
          kind: 'radio',
          tab: t(`${q}.objective.tab`),
          text: t(`${q}.objective.question`),
          options: ['sharpe', 'sortino', 'calmar'].map((o) => ({
            label: t(`${q}.objective.${o}.label`),
            detail: t(`${q}.objective.${o}.detail`),
          })),
          selected: a0 ? 0 : null,
          prefix: 'q0',
        },
        {
          kind: 'select',
          tab: t(`${q}.optimizer.tab`),
          text: t(`${q}.optimizer.question`),
          value: a1 ? 0 : null,
          open: Boolean(menu),
          highlight: highlight >= 0 ? highlight : null,
        },
        {
          kind: 'radio',
          tab: t(`${q}.trials.tab`),
          text: t(`${q}.trials.question`),
          options: ['t100', 't400', 't1000'].map((o) => ({
            label: t(`${q}.trials.${o}.label`),
            detail: t(`${q}.trials.${o}.detail`),
          })),
          selected: a2 ? 2 : null,
          prefix: 'q2',
        },
      ];
      return (
        <QuestionCard
          title={t(`${K}.app.question.title`, { n: 3 })}
          questions={questions}
          active={active}
          answered={[Boolean(a0), Boolean(a1), Boolean(a2)]}
          pressed={Boolean(pressed)}
        />
      );
    };

    const permissionCard = (state: string) => {
      const [picked, pressed] = state.split('|').map(Number);
      const p = `${K}.script.permission`;
      return (
        <QuestionCard
          title={t(`${p}.question`)}
          context={t(`${p}.context`)}
          spend={t(`${K}.app.question.spend`, { summary: t(`${p}.spend`) })}
          questions={[
            {
              kind: 'radio',
              text: '',
              options: ['confirm', 'cancel'].map((o) => ({ label: t(`${p}.${o}.label`), detail: t(`${p}.${o}.detail`) })),
              selected: picked ? 0 : null,
              prefix: 'p',
            },
          ]}
          active={0}
          answered={[Boolean(picked)]}
          pressed={Boolean(pressed)}
        />
      );
    };

    return (
      <>
        <BetaNotice />
        {user1 && <UserRow>{t(`${K}.prompt`)}</UserRow>}
        {live1 !== null && <LiveRow narrationKey={live1 || undefined} />}
        {settled1 && (
          <SettledRow chips={chips[0]}>
            <RichText i18nKey="strategyDone" />
            <StrategyTable />
            <RichText i18nKey="decisionsIntro" />
          </SettledRow>
        )}
        {card1 && questionCard(card1)}
        {answered1 && (
          <UserRow>
            <AnsweredChip
              choice={[t(`${q}.objective.sharpe.label`), 'TPE', t(`${q}.trials.t1000.label`)].join(', ')}
            />
          </UserRow>
        )}
        {live2 !== null && <LiveRow narrationKey={live2 || undefined} />}
        {settled2 && (
          <SettledRow chips={chips[1]}>
            <RichText i18nKey="studySaved" />
          </SettledRow>
        )}
        {card2 && permissionCard(card2)}
        {answered2 && (
          <UserRow>
            <AnsweredChip choice={t(`${K}.script.permission.confirm.label`)} />
          </UserRow>
        )}
        {live3 !== null && <LiveRow narrationKey={live3 || undefined} />}
        {settled3 && (
          <SettledRow chips={chips[2]}>
            <RichText i18nKey="final" linkTarget="study-link" />
          </SettledRow>
        )}
        {/* Room under the last row, as the app keeps above its status line. */}
        <Box sx={{ height: 12 }} />
      </>
    );
  },
);
Transcript.displayName = 'Transcript';

/** The settled answer's tool chips: the app collapses repeats into "×n". */
const chipsFor = (steps: readonly ToolStep[], label: (key: string) => string) => {
  const out: Array<[string, number]> = [];
  for (const s of steps) {
    const name = s.labelKey ? label(s.labelKey) : (s.label ?? s.tool);
    const hit = out.find(([l]) => l === name);
    if (hit) hit[1] += 1;
    else out.push([name, 1]);
  }
  return out;
};

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
} as const;

/** The demo's keyframes, injected once rather than re-serialized every frame. */
const DemoKeyframes = memo(() => <GlobalStyles styles={KEYFRAMES} />);
DemoKeyframes.displayName = 'DemoKeyframes';

/** The window's slab edge — stacked copies beneath it — and its ground shadow. */
const Slab = memo(({ groundZ, groundOpacity }: { groundZ: number; groundOpacity: number }) => (
  <>
    <Box
      style={{ position: 'absolute', inset: 40, transform: `translateZ(${groundZ}px)`, opacity: groundOpacity }}
      sx={{ borderRadius: '30px', background: 'rgba(11,26,51,0.5)', filter: 'blur(40px)' }}
    />
    {[4, 3, 2, 1].map((i) => (
      <Box
        key={i}
        style={{ position: 'absolute', inset: 0, transform: `translateZ(${-i * 4}px)` }}
        sx={{ borderRadius: '20px', background: i === 4 ? '#b4bfcd' : '#cbd3de' }}
      />
    ))}
  </>
));
Slab.displayName = 'Slab';

/** The study page the final link opens; its tiles and chart lift off it in the isometric shot. */
const StudyView = memo(
  ({ narrow, pageLeft, p, lift, explode }: { narrow: boolean; pageLeft: number; p: number; lift: number; explode: number }) => {
    const { t, i18n } = useTranslation('home');
    const samples = Math.max(1, Math.round(p * STUDY_SAMPLES));
    const elapsed = Math.round(12 + p * 208);
    const leftM = Math.max(1, Math.round((1 - p) * 4));
    return (
      <div style={{ position: 'absolute', left: pageLeft, right: 18, top: 20, bottom: 20, transformStyle: 'preserve-3d' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5, animation: 'fdFade 0.3s ease both' }}>
          <Box sx={{ fontSize: narrow ? 18 : 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{t(`${K}.script.studyName`)}</Box>
          <StudyBadge />
        </Box>
        <Box sx={{ fontSize: 12.5, color: APP.textSecondary, mb: 1.75 }}>{t(`${K}.script.studyMeta`)}</Box>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: narrow ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 12,
            transformStyle: 'preserve-3d',
          }}
        >
          <Tile style={Z(14 * lift, explode)} label="Sharpe" value={STUDY.best[samples - 1].toFixed(2)} sub={t(`${K}.app.study.best`)} />
          <Tile
            style={Z(18 * lift, explode)}
            label={t(`${K}.app.study.trials`)}
            value={`${groupDigits(p * 1000, i18n.language)} / ${groupDigits(1000, i18n.language)}`}
          />
          <Tile style={Z(22 * lift, explode)} label={t(`${K}.app.study.progress`)} value={`${Math.round(p * 100)}%`} />
          <Tile style={Z(26 * lift, explode)} label={t(`${K}.app.study.overfit`)} value="—" sub={t(`${K}.app.study.pending`)} />
        </div>
        <PipelineStrip
          style={{ ...Z(8 * lift, explode), marginBottom: 12 }}
          stage={p >= 1 ? 5 : 4}
          elapsed={`${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`}
          left={t(`${K}.app.study.left`, { duration: `${leftM}m` })}
        />
        <EvolutionChart style={Z(30 * lift, explode)} raw={STUDY.raw.slice(0, samples)} curve={STUDY.best.slice(0, samples)} />
      </div>
    );
  },
);
StudyView.displayName = 'StudyView';

/** The transcript column and the status line under it. */
const MessagesColumn = memo(
  ({ status, clock, ...transcript }: { status: StatusKey | undefined; clock: string | null } & Parameters<typeof Transcript>[0]) => (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', pt: 1.5 }}>
      <AutoScroll sx={{ flex: 1, px: 1 }}>
        <Transcript {...transcript} />
      </AutoScroll>
      <StatusLine status={status} clock={clock} />
    </Box>
  ),
);
MessagesColumn.displayName = 'MessagesColumn';

const Disclaimer = memo(({ narrow }: { narrow: boolean }) => {
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

/** The pointer (a touch dot on the compact window), positioned by the frame effect. */
const Cursor = memo(
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

const chapterEnd = (i: number) => (i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].start : LOOP);

/**
 * Play/pause and the four chapters as a segmented track. Static between
 * chapter changes; the fills are advanced through refs by the frame effect.
 */
const PlayerBar = memo(
  ({
    playing,
    active,
    onToggle,
    onSeek,
    fillRefs,
  }: {
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
          aria-label={playing ? t(`${K}.pause`) : t(`${K}.play`)}
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
            gridTemplateColumns: CHAPTERS.map((c, i) => `minmax(0, ${(chapterEnd(i) - c.start).toFixed(1)}fr)`).join(' '),
          }}
        >
          {CHAPTERS.map((c, i) => (
            <Box
              key={c.key}
              component="button"
              type="button"
              aria-label={t(`${K}.chapterJump`, { chapter: t(`${K}.chapters.${c.key}`) })}
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
                {`${String(i + 1).padStart(2, '0')} ${t(`${K}.chapters.${c.key}`)}`}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  },
);
PlayerBar.displayName = 'PlayerBar';

/**
 * The Fintelligent demo: the app's own screens, played as a 30-second loop —
 * a request for a momentum strategy on the sector ETFs becomes a validated
 * strategy, a question card picks the objective, the optimizer (TPE) and a
 * 1,000-trial budget, a permission card confirms the spend, and the study
 * page runs the trials. Drawn in the platform stack's manner: the app window
 * is a slab, the chat, the Thinking feed and the study's cards float above it,
 * and the camera opens and closes on an isometric shot.
 *
 * A player bar under it pauses the loop and jumps between chapters; under
 * prefers-reduced-motion it starts paused on one representative frame.
 */
export const FintelligentDemo = () => {
  const { t } = useTranslation('home');
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const lastCursor = useRef<[number, number]>([0, 0]);
  const fillRefs = useRef<Array<HTMLDivElement | null>>([]);
  const clock = useLoopClock(stageRef, LOOP, STILL);
  const now = clock.t;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const narrow = width > 0 && width < NARROW_BELOW;
  const L = narrow ? NARROW : WIDE;
  const fit = width ? width / L.w : 1;

  // Camera: isometric → 3/4 at the top, back to isometric for the study.
  const k = now < 12 ? 1 - ease(span(now, T.toFront[0], T.toFront[1])) : ease(span(now, T.toIso[0], T.toIso[1]));
  const cam = narrow ? mixCamera(FRONT_NARROW, ISO_NARROW, k) : mixCamera(FRONT, ISO, k);
  const fade = Math.min(span(now, T.fadeIn[0], T.fadeIn[1]), 1 - span(now, T.fadeOut[0], T.fadeOut[1]));

  // Launcher pill → composer, and back once the study link is followed.
  const composerIn = ease(span(now, T.composerOpen, T.composerOpen + 0.3));
  const composerOut = ease(span(now, T.openStudy, T.chatClosed));
  const composerShown = now >= T.composerOpen && now < T.chatClosed;
  const composerWidth = lerp(146, L.composer.width, composerIn * (1 - composerOut));
  const typed = t(`${K}.prompt`);
  const typedCount = Math.round(span(now, T.type[0], T.type[1]) * typed.length);
  const sent = now >= T.send;
  const turnIndex = currentTurn(now);
  const turn = turnIndex >= 0 ? TURNS[turnIndex] : undefined;
  const turnRunning = Boolean(turn && now < turn.settle);
  const send: SendState = turnRunning ? 'stop' : !sent && typedCount > 0 ? 'ready' : 'disabled';

  // Chat panel: spring in on send, out when the study link is followed.
  const openP = span(now, T.panelOpen, T.panelOpen + 0.46);
  const closeP = span(now, T.openStudy, T.chatClosed);
  const panelShown = now >= T.panelOpen && now < T.chatClosed;
  const openE = easeOutBack(openP);
  const panelStyle: CSSProperties = {
    opacity: Math.min(1, openP * 2.5) * (1 - closeP),
    transform: `translateY(${(48 * (1 - openE) + 18 * closeP).toFixed(1)}px) scale(${(0.88 + 0.12 * openE - 0.06 * closeP).toFixed(4)})`,
  };
  const thinkingP = ease(span(now, T.thinkingIn, T.thinkingIn + 0.3));

  // Transcript flags.
  const liveKey = (i: number, from: number) => {
    const tr = TURNS[i];
    if (now < from || now >= tr.settle) return null;
    return latest(tr.narration, now) ?? '';
  };
  const menuHighlight = latest(MENU_HOVER, now) ?? -1;
  const card1 =
    now >= T.cardQ && now < T.submitQ + 0.05
      ? [
          now >= T.tabTrials ? 2 : now >= T.tabOptimizer ? 1 : 0,
          +(now >= T.pickObjective),
          +(now >= T.menuPick),
          +(now >= T.pickTrials),
          +(now >= T.menuOpen && now < T.menuPick),
          now >= T.menuOpen && now < T.menuPick ? menuHighlight : -1,
          +(now >= T.submitQ - 0.1),
        ].join('|')
      : null;
  const card2 =
    now >= T.cardPermission && now < T.submitPermission + 0.05
      ? [+(now >= T.pickConfirm), +(now >= T.submitPermission - 0.1)].join('|')
      : null;

  // Thinking feed for the current turn.
  const feedSig = turn
    ? `${turnIndex}:${turn.steps.map((s) => (now < s.start ? 0 : now < s.end ? 1 : 2)).join('')}:${turn.thoughts.filter(([at]) => at <= now).length}`
    : '';
  const feed = useMemo<FeedItem[]>(() => {
    if (!turn) return [];
    const timed: Array<[number, FeedItem]> = [];
    turn.steps.forEach((s, i) => {
      if (now < s.start) return;
      timed.push([
        s.start + i * 1e-4,
        { kind: 'tool', id: `${turnIndex}-s${i}`, label: s.labelKey ? t(`${K}.app.tools.${s.labelKey}`) : (s.label ?? s.tool), done: now >= s.end, took: s.took },
      ]);
    });
    turn.thoughts.forEach(([at, key], i) => {
      if (at <= now) timed.push([at, { kind: 'thought', id: `${turnIndex}-t${i}`, text: t(`${K}.script.${key}`) }]);
    });
    return timed.sort((a, b) => a[0] - b[0]).map(([, item]) => item);
    // `now` is folded into feedSig: the feed only changes when a step starts, ends, or a thought lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedSig, t]);
  const summary =
    turn && !turnRunning ? `${turn.summary.seconds} s · ${t(`${K}.app.toolCalls`, { count: turn.summary.calls })}` : null;
  const status = turn ? latest(turn.status, now) : undefined;
  const turnClock = turn && turnRunning && now - turn.start > 1.2 ? `0:${String(Math.floor((now - turn.start) * 4)).padStart(2, '0')}` : null;

  // The study, once its link is followed.
  const studyP = 1 - (1 - span(now, T.trials[0], T.trials[1])) ** 2.2;
  const onStudy = now >= T.chatClosed;
  const studyLift = ease(span(now, T.toIso[0] + 0.3, T.toIso[1] + 0.3));
  const activeChapter = CHAPTERS.reduce((acc, c, i) => (now >= c.start ? i : acc), 0);

  const { playing, setPlaying, seek } = clock;
  const onToggle = useCallback(() => setPlaying(!playing), [playing, setPlaying]);
  // Playing, a chapter starts from its top; paused (or reduced motion), it lands on its telling frame.
  const onSeek = useCallback((i: number) => seek(playing ? CHAPTERS[i].start + 0.01 : CHAPTERS[i].still), [playing, seek]);

  // Per frame, outside React: the pointer, eased between the elements the
  // script points at (measured live, through the 3D transforms), and the
  // chapter fills.
  useLayoutEffect(() => {
    CHAPTERS.forEach((c, i) => {
      const fill = fillRefs.current[i];
      if (fill) fill.style.width = `${(span(now, c.start, chapterEnd(i)) * 100).toFixed(1)}%`;
    });
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    const ripple = rippleRef.current;
    if (!stage || !cursor || !ripple) return;
    const box = stage.getBoundingClientRect();
    const at = (id: string): [number, number] | null => {
      if (id === 'enter') return [box.width + 40, box.height * 0.8];
      if (id === 'exit') return [box.width + 40, box.height * 0.92];
      const el = stage.querySelector(`[data-demo="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [r.left - box.left + Math.min(r.width / 2, 60), r.top - box.top + r.height / 2];
    };
    let i = CURSOR_PATH.findIndex(([time]) => time > now);
    if (i === -1) i = CURSOR_PATH.length - 1;
    const [ta, ida] = CURSOR_PATH[Math.max(0, i - 1)];
    const [tb, idb] = CURSOR_PATH[i];
    const a = at(ida) ?? lastCursor.current;
    const b = at(idb) ?? a;
    const kk = ta === tb ? 1 : ease(span(now, ta, tb));
    const x = lerp(a[0], b[0], kk);
    const y = lerp(a[1], b[1], kk);
    lastCursor.current = [x, y];
    const visible = now >= CURSOR_PATH[0][0] && now <= CURSOR_PATH[CURSOR_PATH.length - 1][0];
    const click = CLICKS.find((c) => now >= c && now < c + 0.4);
    const press = click === undefined ? 0 : 1 - span(now, click, click + 0.4);
    cursor.style.opacity = visible ? '1' : '0';
    cursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - press * 0.12).toFixed(3)})`;
    ripple.style.opacity = click === undefined ? '0' : (0.5 * press).toFixed(3);
    ripple.style.transform = `translate(-50%, -50%) scale(${(0.4 + (1 - press) * 1.2).toFixed(3)})`;
  });

  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  const explode = r3(cam.explode);

  // Everything below re-renders every frame, so it is plain elements with
  // inline styles; the styled parts are the memoized components above.
  return (
    <div>
      <DemoKeyframes />
      <div
        ref={stageRef}
        role="img"
        aria-label={t(`${K}.label`)}
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          perspective: '3200px',
          userSelect: 'none',
          height: width ? Math.round(width * L.aspect) : undefined,
          aspectRatio: width ? undefined : `1 / ${L.aspect}`,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: L.w,
            height: L.h,
            marginLeft: -L.w / 2,
            marginTop: -L.h / 2,
            opacity: fade,
            transformStyle: 'preserve-3d',
            transform: `scale(${(fit * cam.zoom).toFixed(4)}) rotateX(${cam.rx.toFixed(2)}deg) rotateY(${cam.ry.toFixed(2)}deg) rotateZ(${cam.rz.toFixed(2)}deg)`,
            fontFamily: APP.font,
            color: APP.text,
            textAlign: 'left',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          <Slab groundZ={Math.round(-60 * explode)} groundOpacity={r3(0.3 + 0.25 * k)} />

          {/* The window: sidebar and the page under the chat. */}
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', borderRadius: 20, background: APP.ground }}>
            {L.sidebar && <Sidebar active={onStudy ? 'studies' : 'library'} />}
            {!onStudy && <StrategiesPage left={L.pageLeft} />}
            {onStudy && <StudyView narrow={narrow} pageLeft={L.pageLeft} p={r3(studyP)} lift={r3(studyLift)} explode={explode} />}

            {/* The resting launcher, bottom centre, until the composer takes its place. */}
            {!composerShown && (
              <div style={{ position: 'absolute', left: '50%', top: L.composer.top - 2, marginLeft: -73, ...Z(22, explode) }}>
                <Pill hover={now >= T.pillHover && now < T.composerOpen} />
              </div>
            )}
          </div>

          {/* The chat: the transcript panel over the page, the Thinking feed lifted off its right edge. */}
          {panelShown && (
            <>
              <Shadow rect={L.transcript} opacity={r3((0.55 + 0.25 * k) * (1 - closeP))} />
              <div style={{ position: 'absolute', ...L.transcript, ...Z(34, explode) }}>
                <div
                  style={{
                    ...panelStyle,
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 16,
                    background: APP.ground,
                    display: 'flex',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <MessagesColumn
                    status={status}
                    clock={turnClock}
                    user1={now >= T.send + 0.05}
                    live1={liveKey(0, T.send + 0.2)}
                    settled1={now >= TURNS[0].settle}
                    card1={card1}
                    answered1={now >= T.submitQ + 0.05}
                    live2={liveKey(1, TURNS[1].start)}
                    settled2={now >= TURNS[1].settle}
                    card2={card2}
                    answered2={now >= T.submitPermission + 0.05}
                    live3={liveKey(2, TURNS[2].start)}
                    settled3={now >= TURNS[2].settle}
                  />
                  {L.thinking > 0 && (
                    <div
                      style={{
                        width: L.thinking,
                        flexShrink: 0,
                        opacity: thinkingP,
                        transform: `translateX(${((1 - thinkingP) * 16).toFixed(1)}px) translateZ(${(26 * explode).toFixed(1)}px)`,
                        borderRadius: '0 16px 16px 0',
                        overflow: 'hidden',
                        boxShadow: '0 18px 40px rgba(11,26,51,0.16)',
                      }}
                    >
                      <ThinkingPanel items={feed} running={turnRunning} summary={summary} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Composer, and the disclaimer under it. */}
          {composerShown && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: L.composer.top,
                width: composerWidth,
                height: L.composer.height,
                marginLeft: -composerWidth / 2,
                ...Z(58, explode),
              }}
            >
              <div style={{ height: '100%', opacity: 0.4 + 0.6 * composerIn * (1 - composerOut) }}>
                <Composer
                  text={sent ? '' : typed.slice(0, typedCount)}
                  focused={now >= 2.25 && !sent}
                  typing={now > T.type[0] && now < T.type[1] + 0.1}
                  send={send}
                  compact={narrow || composerIn < 0.9}
                />
              </div>
              <div style={{ opacity: composerIn * (1 - composerOut) }}>
                <Disclaimer narrow={narrow} />
              </div>
            </div>
          )}
        </div>

        <Cursor narrow={narrow} cursorRef={cursorRef} rippleRef={rippleRef} />
      </div>

      <PlayerBar playing={playing} active={activeChapter} onToggle={onToggle} onSeek={onSeek} fillRefs={fillRefs} />
    </div>
  );
};
