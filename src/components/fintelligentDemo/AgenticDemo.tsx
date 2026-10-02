import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { APP } from './appTheme';
import {
  BetaNotice,
  Composer,
  LiveRow,
  Pill,
  RichText,
  SettledRow,
  Sidebar,
  StatusLine,
  StrategiesPage,
  ThinkingPanel,
  UserRow,
  AutoScroll,
} from './parts';
import type { FeedItem, SendState } from './parts';
import {
  AssetGroupPreview,
  ConfirmCard,
  KeyValueTable,
  OptimizeBar,
  PinnedSection,
  ReceiptRow,
  StepCaption,
  StrategyPreview,
  StudyPreview,
  StudyRunCard,
} from './agenticParts';
import type { DecisionState, ProposalView, StepRow, Verdict } from './agenticParts';
import {
  AUTHORING,
  CHAPTERS,
  CLICKS,
  CODE_ATTEMPT_1,
  CODE_ATTEMPT_2,
  CURSOR_PATH,
  GROUP_SIZE,
  GROUP_STAGED,
  LOOP,
  NAMES,
  RUN,
  STILL,
  STUDY_STAGED,
  T,
  TURNS,
} from './agenticScript';
import { ease, groupDigits, latest, lerp, span } from './script';
import type { StatusKey } from './script';
import { Cursor, DemoKeyframes, Disclaimer, PlayerBar } from './stage';
import { chipsFor, easeOutBack, usePointerFrame } from './stageMotion';
import { useLoopClock } from '../../lib/useLoopClock';

/** The page's own copy; the app's labels stay under fintelligentDemo.app. */
const A = 'agenticDemo';
const K = 'fintelligentDemo';

/** Below this container width the demo draws the compact window. */
const NARROW_BELOW = 760;

interface Layout {
  w: number;
  h: number;
  /** The chat panel: the transcript and the Thinking panel, side by side or stacked. */
  chat: { left: number; top: number; width: number; height: number };
  /** The Thinking panel's width (side by side) or height (stacked under the transcript). */
  thinking: number;
  stacked: boolean;
  composer: { width: number; top: number; height: number };
  sidebar: boolean;
  /** Container height as a share of its width. */
  aspect: number;
  /** Tallest the pinned creations may grow, so the feed keeps a few rows. */
  creationsMax: number;
}

const WIDE: Layout = {
  w: 1100,
  h: 730,
  chat: { left: 112, top: 18, width: 970, height: 612 },
  thinking: 360,
  stacked: false,
  composer: { width: 600, top: 644, height: 48 },
  sidebar: true,
  aspect: 0.69,
  creationsMax: 380,
};

const NARROW: Layout = {
  w: 460,
  h: 890,
  chat: { left: 10, top: 12, width: 440, height: 776 },
  thinking: 360,
  stacked: true,
  composer: { width: 440, top: 800, height: 46 },
  sidebar: false,
  aspect: 1.98,
  creationsMax: 250,
};

/** The window sits a little inside the stage, so its shadow is not clipped. */
const ZOOM = 0.97;

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/**
 * The messages column. Every visibility and state flag is a primitive derived
 * from the playhead, so the memoized rows only re-render when something on
 * screen actually changes.
 */
const Transcript = memo(
  ({
    user1,
    live1,
    settled1,
    card1,
    receipt1,
    live2,
    settled2,
    card2,
    receipt2,
    live3,
    settled3,
  }: {
    user1: boolean;
    live1: string | null;
    settled1: boolean;
    card1: 'pending' | 'busy' | null;
    receipt1: boolean;
    live2: string | null;
    settled2: boolean;
    card2: 'pending' | 'busy' | null;
    receipt2: boolean;
    live3: string | null;
    settled3: boolean;
  }) => {
    const { t, i18n } = useTranslation('home');
    const s = `${A}.script`;
    const c = `${K}.app.confirm`;
    const chips = useMemo(() => TURNS.map((turn) => chipsFor(turn.steps, (key) => t(`${K}.app.tools.${key}`))), [t]);
    const head = [t(`${s}.table.head.part`), t(`${s}.table.head.rule`)] as const;
    const row = (key: string) => [t(`${s}.${key}.label`), t(`${s}.${key}.value`)] as const;
    const named = (verb: string, entity: string, name: string) =>
      t(`${c}.row`, { verb: t(`${c}.verb.${verb}`), entity: t(`${c}.entity.${entity}`), name });
    const past = (verb: string, entity: string, name: string) =>
      t(`${c}.past`, { verb: t(`${c}.pastVerb.${verb}`), entity: t(`${c}.entity.${entity}`), name });
    const studyName = t(`${s}.studyName`);

    const buildCard: ProposalView[] = [
      { entity: 'asset_group', title: named('create', 'asset_group', NAMES.group), description: t(`${s}.proposals.group`) },
      { entity: 'strategy', title: named('create', 'strategy', NAMES.strategy), description: t(`${s}.proposals.strategy`) },
    ];
    const studyCard: ProposalView[] = [
      {
        entity: 'study',
        title: named('saveAndLaunch', 'study', studyName),
        facts: [
          [t(`${c}.entity.strategy`), NAMES.strategy],
          [t(`${c}.entity.asset_group`), NAMES.group],
          [t(`${s}.proposals.searchLabel`), t(`${s}.proposals.search`)],
        ],
      },
    ];

    return (
      <>
        <BetaNotice />
        {user1 && <UserRow>{t(`${A}.prompt`)}</UserRow>}
        {live1 !== null && <LiveRow narrationKey={live1 || undefined} scope={`${A}.script`} />}
        {settled1 && (
          <SettledRow chips={chips[0]}>
            <RichText i18nKey="built" scope={`${A}.script`} />
            <KeyValueTable head={head} rows={['table.universe', 'table.signal', 'table.allocation', 'table.risk'].map(row)} />
            <RichText i18nKey="frozen" scope={`${A}.script`} />
          </SettledRow>
        )}
        {card1 && (
          <ConfirmCard
            proposals={buildCard}
            confirmLabel={t(`${c}.button.create`)}
            busy={card1 === 'busy'}
            target="confirm-1"
          />
        )}
        {receipt1 && (
          <ReceiptRow
            text={t(`${c}.confirmed`, { summary: [past('create', 'asset_group', NAMES.group), past('create', 'strategy', NAMES.strategy)].join(', ') })}
          />
        )}
        {live2 !== null && <LiveRow narrationKey={live2 || undefined} scope={`${A}.script`} />}
        {settled2 && (
          <SettledRow chips={chips[1]}>
            <RichText i18nKey="studyReady" scope={`${A}.script`} />
            <KeyValueTable
              head={[t(`${s}.plan.head.part`), t(`${s}.plan.head.rule`)]}
              rows={['plan.objective', 'plan.space', 'plan.windows', 'plan.criteria'].map(row)}
            />
            <RichText i18nKey="launchAsk" scope={`${A}.script`} />
          </SettledRow>
        )}
        {card2 && (
          <ConfirmCard
            proposals={studyCard}
            spend={t(`${s}.proposals.spend`, { trials: groupDigits(RUN.trials, i18n.language), tickers: GROUP_SIZE })}
            confirmLabel={t(`${c}.button.saveAndLaunch`)}
            busy={card2 === 'busy'}
            target="confirm-2"
          />
        )}
        {receipt2 && <ReceiptRow text={t(`${c}.confirmed`, { summary: past('launch', 'study', studyName) })} />}
        {live3 !== null && <LiveRow narrationKey={live3 || undefined} scope={`${A}.script`} />}
        {settled3 && (
          <SettledRow chips={chips[2]}>
            <RichText i18nKey="final" scope={`${A}.script`} />
          </SettledRow>
        )}
        {/* Room under the last row, as the app keeps above its status line. */}
        <Box sx={{ height: 12 }} />
      </>
    );
  },
);
Transcript.displayName = 'Transcript';

/** The transcript column and the status line under it. */
const MessagesColumn = memo(
  ({ status, clock: turnClock, ...transcript }: { status: StatusKey | undefined; clock: string | null } & Parameters<typeof Transcript>[0]) => (
    <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', pt: 1.5 }}>
      <AutoScroll sx={{ flex: 1, px: 1 }}>
        <Transcript {...transcript} />
      </AutoScroll>
      <StatusLine status={status} clock={turnClock} />
    </Box>
  ),
);
MessagesColumn.displayName = 'MessagesColumn';

/**
 * The Agentic AI demo: the app's own screens, seen straight on, played as a
 * 40-second loop. One message asks for a quality universe, a momentum
 * strategy and a study. Fintelligent screens the S&P 500 into an asset group,
 * writes the strategy, catches its own look-ahead in validation and fixes it,
 * stages both writes on one Confirm card; once confirmed it designs the study,
 * pre-registers its pass criteria and quotes the spend; once launched, the
 * Thinking panel's run tracker streams the study to its best trial.
 *
 * A player bar under it pauses the loop and jumps between chapters; under
 * prefers-reduced-motion it starts paused on the finished run.
 */
export const AgenticDemo = () => {
  const { t, i18n } = useTranslation('home');
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const fillRefs = useRef<Array<HTMLDivElement | null>>([]);
  const loopClock = useLoopClock(stageRef, LOOP, STILL);
  const now = loopClock.t;
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
  const fade = Math.min(span(now, T.fadeIn[0], T.fadeIn[1]), 1 - span(now, T.fadeOut[0], T.fadeOut[1]));

  // Launcher pill → composer.
  const composerIn = ease(span(now, T.composerOpen, T.composerOpen + 0.3));
  const composerShown = now >= T.composerOpen;
  const composerWidth = lerp(146, L.composer.width, composerIn);
  const typed = t(`${A}.prompt`);
  const typedCount = Math.round(span(now, T.type[0], T.type[1]) * typed.length);
  const sent = now >= T.send;
  const turnIndex = TURNS.reduce((acc, turn, i) => (now >= turn.start ? i : acc), -1);
  const turn = turnIndex >= 0 ? TURNS[turnIndex] : undefined;
  const turnRunning = Boolean(turn && now < turn.settle);
  const send: SendState = turnRunning ? 'stop' : !sent && typedCount > 0 ? 'ready' : 'disabled';

  // Chat panel: springs in on send and stays, the Thinking panel sliding in beside (or under) it.
  const openP = span(now, T.panelOpen, T.panelOpen + 0.46);
  const panelShown = now >= T.panelOpen;
  const openE = easeOutBack(openP);
  const panelStyle: CSSProperties = {
    opacity: Math.min(1, openP * 2.5),
    transform: `translateY(${(48 * (1 - openE)).toFixed(1)}px) scale(${(0.88 + 0.12 * openE).toFixed(4)})`,
  };
  const thinkingP = ease(span(now, T.thinkingIn, T.thinkingIn + 0.3));
  const thinkingShift = ((1 - thinkingP) * 16).toFixed(1);

  // Transcript flags.
  const liveKey = (i: number, from: number) => {
    const tr = TURNS[i];
    if (now < from || now >= tr.settle) return null;
    return latest(tr.narration, now) ?? '';
  };
  const cardState = (at: number, click: number, done: number) =>
    now >= at && now < done + 0.05 ? (now >= click ? 'busy' : 'pending') : null;

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
      if (at <= now) timed.push([at, { kind: 'thought', id: `${turnIndex}-t${i}`, text: t(`${A}.script.${key}`) }]);
    });
    return timed.sort((a, b) => a[0] - b[0]).map(([, item]) => item);
    // `now` is folded into feedSig: the feed only changes when a step starts, ends, or a thought lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedSig, t]);
  const summary =
    turn && !turnRunning ? `${turn.summary.seconds} s · ${t(`${K}.app.toolCalls`, { count: turn.summary.calls })}` : null;
  const status = turn ? latest(turn.status, now) : undefined;
  const turnClock = turn && turnRunning && now - turn.start > 1.2 ? `0:${String(Math.floor((now - turn.start) * 4)).padStart(2, '0')}` : null;

  // --- Creation previews -------------------------------------------------
  const pv = `${K}.app.preview.steps`;
  const confirmCreate = t(`${K}.app.confirm.button.create`);
  const decision = (staged: number): DecisionState =>
    now < staged ? 'authoring' : now < T.confirm1 ? 'pending' : now < T.saved1 ? 'executing' : 'executed';
  const strategyState = decision(AUTHORING.staged);
  const groupState = decision(GROUP_STAGED);
  const streaming1 = now >= AUTHORING.code1[0] && now < AUTHORING.code1[1];
  const streaming2 = now >= AUTHORING.code2[0] && now < AUTHORING.code2[1];
  const code =
    now < AUTHORING.code2[0]
      ? CODE_ATTEMPT_1.slice(0, Math.round(span(now, AUTHORING.code1[0], AUTHORING.code1[1]) * CODE_ATTEMPT_1.length))
      : CODE_ATTEMPT_2.slice(0, Math.round(span(now, AUTHORING.code2[0], AUTHORING.code2[1]) * CODE_ATTEMPT_2.length));
  // Keyed on the phase, not the playhead: the memoized card re-renders only when a row changes (and as the code streams).
  const authoring = now >= AUTHORING.start;
  const validating1 = now >= AUTHORING.validate1[0];
  const failed1 = now >= AUTHORING.validate1[1];
  const fixing = now >= AUTHORING.code2[0];
  const validated = now >= AUTHORING.validate2[1];
  const strategySteps = useMemo<StepRow[]>(() => {
    if (!authoring) return [];
    const rows: StepRow[] = [{ key: 'coding', label: t(`${pv}.coding`), status: streaming1 || streaming2 ? 'active' : 'done' }];
    const attempt2 = t(`${K}.app.preview.attempt`, { n: 2 });
    if (validating1) {
      if (streaming2) {
        rows.push({ key: 'validate', label: t(`${pv}.validating`), status: 'pending', detail: <StepCaption>{attempt2}</StepCaption> });
      } else if (!failed1) {
        rows.push({ key: 'validate', label: t(`${pv}.validating`), status: 'active' });
      } else if (!fixing) {
        rows.push({
          key: 'validate',
          label: t(`${pv}.failed`),
          status: 'failed',
          detail: <StepCaption color={APP.error}>{t(`${K}.app.preview.failedAtLine`, { line: 6, message: t(`${A}.script.leakMessage`) })}</StepCaption>,
        });
      } else if (!validated) {
        rows.push({ key: 'validate', label: t(`${pv}.validating`), status: 'active', detail: <StepCaption>{attempt2}</StepCaption> });
      } else {
        rows.push({
          key: 'validate',
          label: t(`${pv}.validated`),
          status: 'done',
          detail: <StepCaption>{`${attempt2} · ${t(`${K}.app.preview.noWarnings`)}`}</StepCaption>,
        });
      }
    }
    const staged = strategyState !== 'authoring';
    rows.push({ key: 'awaiting', label: t(`${pv}.awaiting`), status: !staged ? 'pending' : strategyState === 'pending' ? 'active' : 'done' });
    rows.push({
      key: 'saved',
      label: strategyState === 'executing' ? t(`${pv}.saving`) : t(`${pv}.saved`),
      status: strategyState === 'executing' ? 'active' : strategyState === 'executed' ? 'done' : 'pending',
    });
    return rows;
  }, [authoring, streaming1, streaming2, validating1, failed1, fixing, validated, strategyState, pv, t]);

  // --- Run tracker -------------------------------------------------------
  const verdict: Verdict = now < RUN.prepare[0][0] ? 'queued' : now < RUN.done ? 'running' : 'completed';
  const optP = 1 - (1 - span(now, RUN.optimize[0], RUN.optimize[1])) ** 1.6;
  const trialsDone = Math.round(optP * RUN.trials);
  const found = trialsDone - Math.round(trialsDone * 0.026);
  const runSeconds = (Math.min(now, RUN.done) - RUN.queued) * RUN.pace;
  const etaMinutes = Math.max(1, Math.round(((RUN.done - now) * RUN.pace) / 60));
  const sr = `${K}.app.studyRun`;
  const timing = [
    t(`${sr}.elapsed`, { time: clock(Math.max(0, runSeconds)) }),
    now >= RUN.optimize[0] && verdict === 'running' ? t(`${K}.app.study.left`, { duration: `${etaMinutes}m` }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const phase = (from: number, to: number) => (now < from ? 'pending' : now < to ? 'active' : 'done');
  const stageLabel = (stage: string) => t(`${K}.app.study.stages.${stage}`);
  const optimizeStatus = phase(RUN.optimize[0], RUN.optimize[1]);
  const runRows: StepRow[] = [
    {
      key: 'queue',
      label: t(`${sr}.steps.queue`),
      status: phase(RUN.queued, RUN.prepare[0][0]),
      detail: verdict === 'queued' ? <StepCaption>{t(`${sr}.steps.queueDetail`)}</StepCaption> : undefined,
    },
    {
      key: 'prepare',
      label: t(`${sr}.steps.prepare`),
      status: phase(RUN.prepare[0][0], RUN.optimize[0]),
      detail:
        phase(RUN.prepare[0][0], RUN.optimize[0]) === 'active' ? <StepCaption>{stageLabel(latest(RUN.prepare, now) ?? 'provisioning')}</StepCaption> : undefined,
    },
    {
      key: 'optimize',
      label: t(`${sr}.steps.optimize`),
      status: optimizeStatus,
      detail:
        optimizeStatus === 'pending' ? undefined : (
          <>
            <StepCaption>
              {`${t(`${sr}.trials`, { done: groupDigits(trialsDone, i18n.language), total: groupDigits(RUN.trials, i18n.language) })} · ${t(`${sr}.found`, { count: found })}`}
            </StepCaption>
            <OptimizeBar progress={optP} active={optimizeStatus === 'active'} />
          </>
        ),
    },
    {
      key: 'analyze',
      label: t(`${sr}.steps.analyze`),
      status: phase(RUN.analyze, RUN.done),
      detail: phase(RUN.analyze, RUN.done) === 'active' ? <StepCaption>{stageLabel('robustness')}</StepCaption> : undefined,
    },
    { key: 'finish', label: t(`${sr}.steps.finish`), status: now >= RUN.done ? 'done' : 'pending' },
  ];
  const health =
    verdict === 'queued'
      ? { waiting: true, text: t(`${sr}.health.waiting`) }
      : verdict === 'running'
        ? { waiting: false, text: t(`${sr}.health.heartbeat`, { ago: `${1 + (Math.floor(now * 1.3) % 4)}s` }) }
        : { waiting: false, text: t(`${sr}.health.healthy`) };

  const trackerShown = now >= T.launched;
  const studyName = t(`${A}.script.studyName`);
  const pinned = (
    <>
      {trackerShown && (
        <PinnedSection maxHeight={narrow ? L.thinking - 64 : undefined} follow={narrow}>
          <StudyRunCard name={studyName} verdict={verdict} timing={timing} rows={runRows} health={health} />
        </PinnedSection>
      )}
      {/* On the compact window the tracker takes the whole panel once it runs. */}
      {now >= AUTHORING.start && !(narrow && trackerShown) && (
        <PinnedSection maxHeight={L.creationsMax}>
          {now >= STUDY_STAGED && now < T.launched && <StudyPreview name={studyName} confirmLabel={t(`${K}.app.confirm.button.saveAndLaunch`)} />}
          {now >= GROUP_STAGED && <AssetGroupPreview name={NAMES.group} state={groupState} confirmLabel={confirmCreate} />}
          <StrategyPreview
            name={NAMES.strategy}
            steps={strategySteps}
            code={code}
            streaming={streaming1 || streaming2}
            codeOpen={strategyState === 'authoring'}
            state={strategyState}
            confirmLabel={confirmCreate}
            savedDetail={t(`${A}.script.proposals.strategy`)}
          />
        </PinnedSection>
      )}
    </>
  );

  const activeChapter = CHAPTERS.reduce((acc, c, i) => (now >= c.start ? i : acc), 0);
  const { playing, setPlaying, seek } = loopClock;
  const onToggle = useCallback(() => setPlaying(!playing), [playing, setPlaying]);
  // Playing, a chapter starts from its top; paused (or reduced motion), it lands on its telling frame.
  const onSeek = useCallback((i: number) => seek(playing ? CHAPTERS[i].start + 0.01 : CHAPTERS[i].still), [playing, seek]);

  usePointerFrame({ now, stageRef, cursorRef, rippleRef, fillRefs, chapters: CHAPTERS, loop: LOOP, path: CURSOR_PATH, clicks: CLICKS });

  // Everything below re-renders every frame, so it is plain elements with
  // inline styles; the styled parts are the memoized components above.
  return (
    <div>
      <DemoKeyframes />
      <div
        ref={stageRef}
        role="img"
        aria-label={t(`${A}.label`)}
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
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
            transform: `scale(${(fit * ZOOM).toFixed(4)})`,
            fontFamily: APP.font,
            color: APP.text,
            textAlign: 'left',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {/* The window: the app's ground, its sidebar, the launcher until the composer takes its place. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 20,
              background: APP.ground,
              border: '1px solid rgba(11,26,51,0.06)',
              boxShadow: '0 28px 56px -28px rgba(11,26,51,0.45), 0 10px 22px -14px rgba(11,26,51,0.25)',
            }}
          >
            {L.sidebar && <Sidebar active="library" />}
            {L.sidebar && <StrategiesPage left={212} />}
            {!composerShown && (
              <div style={{ position: 'absolute', left: '50%', top: L.composer.top - 2, marginLeft: -73 }}>
                <Pill hover={now >= T.pillHover && now < T.composerOpen} />
              </div>
            )}
          </div>

          {panelShown && (
            <div
              style={{
                ...panelStyle,
                position: 'absolute',
                ...L.chat,
                borderRadius: 16,
                background: APP.ground,
                boxShadow: '0 22px 48px -18px rgba(11,26,51,0.4), 0 0 0 1px rgba(11,26,51,0.05)',
                display: 'flex',
                flexDirection: L.stacked ? 'column' : 'row',
                overflow: 'hidden',
              }}
            >
              <MessagesColumn
                status={status}
                clock={turnClock}
                user1={now >= T.send + 0.05}
                live1={liveKey(0, T.send + 0.2)}
                settled1={now >= TURNS[0].settle}
                card1={cardState(T.card1, T.confirm1, T.saved1)}
                receipt1={now >= T.saved1 + 0.05}
                live2={liveKey(1, TURNS[1].start)}
                settled2={now >= TURNS[1].settle}
                card2={cardState(T.card2, T.confirm2, T.launched)}
                receipt2={now >= T.launched + 0.05}
                live3={liveKey(2, TURNS[2].start)}
                settled3={now >= TURNS[2].settle}
              />
              <div
                style={{
                  ...(L.stacked ? { height: L.thinking, borderTop: `1px solid ${APP.divider}` } : { width: L.thinking }),
                  flexShrink: 0,
                  minHeight: 0,
                  opacity: thinkingP,
                  transform: L.stacked ? `translateY(${thinkingShift}px)` : `translateX(${thinkingShift}px)`,
                  boxShadow: L.stacked ? 'none' : '-14px 0 30px -22px rgba(11,26,51,0.35)',
                }}
              >
                <ThinkingPanel items={feed} running={turnRunning} summary={summary} pinned={pinned} />
              </div>
            </div>
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
              }}
            >
              <div style={{ height: '100%', opacity: 0.4 + 0.6 * composerIn }}>
                <Composer
                  text={sent ? '' : typed.slice(0, typedCount)}
                  focused={now >= 1.85 && !sent}
                  typing={now > T.type[0] && now < T.type[1] + 0.1}
                  send={send}
                  compact={narrow || composerIn < 0.9}
                />
              </div>
              <div style={{ opacity: composerIn }}>
                <Disclaimer narrow={narrow} />
              </div>
            </div>
          )}
        </div>

        <Cursor narrow={narrow} cursorRef={cursorRef} rippleRef={rippleRef} />
      </div>

      <PlayerBar prefix={A} chapters={CHAPTERS} loop={LOOP} playing={playing} active={activeChapter} onToggle={onToggle} onSeek={onSeek} fillRefs={fillRefs} />
    </div>
  );
};
