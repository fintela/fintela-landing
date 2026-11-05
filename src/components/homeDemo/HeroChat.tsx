/**
 * The hero's mini Fintelligent: a chat window in the product's own look where a
 * visitor picks one of four pre-written questions (build a strategy, make an
 * asset group, send a study, ask about a deployed portfolio) and watches the
 * answer play out. It is assembled from the surfaces the Fintelligent demos
 * already draw (components/fintelligentDemo), on the storyboards in
 * ./heroChatScript.ts; nothing here calls a model, and the figures are sample
 * data (the note under the composer says so).
 *
 * Every flow row is a pure function of the seconds since its send, so the view
 * re-renders on a ~14 fps tick while a flow runs and stops when it is done.
 * Under prefers-reduced-motion a pick lands on its finished state at once.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { APP, gradientRingSx } from '../fintelligentDemo/appTheme';
import { AssistantShell, Composer, LiveRow, RichText, SettledRow, UserRow } from '../fintelligentDemo/parts';
import {
  AssetGroupPreview,
  ConfirmCard,
  KeyValueTable,
  OptimizeBar,
  ReceiptRow,
  StepCaption,
  StrategyPreview,
  StudyRunCard,
} from '../fintelligentDemo/agenticParts';
import type { DecisionState, StepRow, Verdict } from '../fintelligentDemo/agenticParts';
import { BEST, CODE_ATTEMPT_2, GROUP_SIZE, NAMES } from '../fintelligentDemo/agenticScript';
import { EntityGlyph, FintelligentMark, NavGlyph } from '../fintelligentDemo/glyphs';
import { groupDigits, latest, span } from '../fintelligentDemo/script';
import { DemoKeyframes } from '../fintelligentDemo/stage';
import { END, FLOWS, GROUP, PORTFOLIO, STRATEGY, STUDY } from './heroChatScript';
import type { FlowId } from './heroChatScript';

const K = 'fintelligentDemo';
const C = 'homeChat';
/** The agentic demo's own copy (tables, proposals) is shared, so the two demos never say different things. */
const A = 'agenticDemo.script';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** The first `span`-share of `text`, so a paragraph reads as it streams. */
const reveal = (text: string, s: number, [from, to]: readonly [number, number]) =>
  text.slice(0, Math.round(span(s, from, to) * text.length));

// ---------------------------------------------------------------------------
// Shared copy and small pieces
// ---------------------------------------------------------------------------

/** The Confirm card's sentences, built the way the agentic demo builds them. */
const useConfirmCopy = () => {
  const { t } = useTranslation('home');
  const c = `${K}.app.confirm`;
  return {
    named: (verb: string, entity: string, name: string) =>
      t(`${c}.row`, { verb: t(`${c}.verb.${verb}`), entity: t(`${c}.entity.${entity}`), name }),
    past: (verb: string, entity: string, name: string) =>
      t(`${c}.past`, { verb: t(`${c}.pastVerb.${verb}`), entity: t(`${c}.entity.${entity}`), name }),
    confirmed: (summary: string) => t(`${c}.confirmed`, { summary }),
    button: (key: 'create' | 'saveAndLaunch') => t(`${c}.button.${key}`),
  };
};

const P = ({ children }: { children: ReactNode }) => (
  <Box component="p" sx={{ m: 0, mb: 1 }}>
    {children}
  </Box>
);

/** An in-transcript card (the previews and the run tracker): the product pins these in a side panel; here they sit in the thread. */
const Inline = ({ children }: { children: ReactNode }) => <Box sx={{ mx: 1, my: 0.75 }}>{children}</Box>;

const buttonReset = {
  appearance: 'none',
  border: 0,
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
  '&:focus-visible': { outline: `2px solid ${APP.navy}`, outlineOffset: 2 },
  '&:disabled': { cursor: 'default' },
} as const;

const FlowGlyph = ({ id }: { id: FlowId }) =>
  id === 'portfolio' ? <NavGlyph kind="portfolios" /> : <EntityGlyph kind={id === 'group' ? 'asset_group' : id} size={17} />;

// ---------------------------------------------------------------------------
// The four flows
// ---------------------------------------------------------------------------

const StrategyFlow = ({ s }: { s: number }) => {
  const { t } = useTranslation('home');
  const { named, past, confirmed, button } = useConfirmCopy();
  const S = STRATEGY;
  const pv = `${K}.app.preview.steps`;
  const live = s < S.stage ? (latest(S.narration, s) ?? '') : null;
  const streaming = s >= S.write[0] && s < S.write[1];
  const code = CODE_ATTEMPT_2.slice(0, Math.round(span(s, S.write[0], S.write[1]) * CODE_ATTEMPT_2.length));
  const validated = s >= S.validate[1];
  const executed = s >= S.saved;
  const executing = s >= S.click && !executed;
  const state: DecisionState = executed ? 'executed' : executing ? 'executing' : 'authoring';
  const rows: StepRow[] = [{ key: 'coding', label: t(`${pv}.coding`), status: s < S.validate[0] ? 'active' : 'done' }];
  if (s >= S.validate[0]) {
    rows.push({
      key: 'validate',
      label: t(`${pv}.${validated ? 'validated' : 'validating'}`),
      status: validated ? 'done' : 'active',
      detail: validated ? <StepCaption>{t(`${K}.app.preview.noWarnings`)}</StepCaption> : undefined,
    });
  }
  rows.push(
    { key: 'awaiting', label: t(`${pv}.awaiting`), status: s < S.stage ? 'pending' : s < S.click ? 'active' : 'done' },
    {
      key: 'saved',
      label: t(`${pv}.${executing ? 'saving' : 'saved'}`),
      status: executing ? 'active' : executed ? 'done' : 'pending',
    },
  );
  const row = (key: string) => [t(`${A}.table.${key}.label`), t(`${A}.table.${key}.value`)] as const;

  return (
    <>
      <UserRow>{t(`${C}.suggestions.strategy.prompt`)}</UserRow>
      {live !== null && <LiveRow narrationKey={live || undefined} scope={`${C}.narration.strategy`} />}
      {s >= S.write[0] && (
        <Inline>
          <StrategyPreview
            name={NAMES.strategy}
            steps={rows}
            code={code}
            streaming={streaming}
            codeOpen={s < S.stage}
            state={state}
            confirmLabel={button('create')}
            savedDetail={t(`${A}.proposals.strategy`)}
          />
        </Inline>
      )}
      {s >= S.stage && (
        <SettledRow
          chips={[
            [t(`${C}.tools.strategyApi`), 1],
            [t(`${C}.tools.writeCode`), 1],
            [t(`${C}.tools.validate`), 1],
          ]}
        >
          <RichText i18nKey="built" scope={`${C}.strategy`} />
          <KeyValueTable
            head={[t(`${A}.table.head.part`), t(`${A}.table.head.rule`)]}
            rows={['signal', 'allocation', 'risk'].map(row)}
          />
        </SettledRow>
      )}
      {s >= S.stage && !executed && (
        <ConfirmCard
          proposals={[
            {
              entity: 'strategy',
              title: named('create', 'strategy', NAMES.strategy),
              description: t(`${A}.proposals.strategy`),
            },
          ]}
          confirmLabel={button('create')}
          busy={executing}
          target="confirm"
        />
      )}
      {executed && <ReceiptRow text={confirmed(past('create', 'strategy', NAMES.strategy))} />}
      {s >= S.final && (
        <AssistantShell>
          <RichText i18nKey="saved" scope={`${C}.strategy`} />
        </AssistantShell>
      )}
    </>
  );
};

const GroupFlow = ({ s }: { s: number }) => {
  const { t } = useTranslation('home');
  const { named, past, confirmed, button } = useConfirmCopy();
  const G = GROUP;
  const live = s < G.stage ? (latest(G.narration, s) ?? '') : null;
  const executed = s >= G.saved;
  const executing = s >= G.click && !executed;
  const state: DecisionState = executed ? 'executed' : executing ? 'executing' : 'authoring';

  return (
    <>
      <UserRow>{t(`${C}.suggestions.group.prompt`)}</UserRow>
      {live !== null && <LiveRow narrationKey={live || undefined} scope={`${C}.narration.group`} />}
      {s >= G.preview && (
        <Inline>
          <AssetGroupPreview name={NAMES.group} state={state} confirmLabel={button('create')} />
        </Inline>
      )}
      {s >= G.stage && (
        <SettledRow
          chips={[
            [t(`${C}.tools.screen`), 1],
            [t(`${C}.tools.rank`), 1],
          ]}
        >
          <RichText i18nKey="built" scope={`${C}.group`} />
        </SettledRow>
      )}
      {s >= G.stage && !executed && (
        <ConfirmCard
          proposals={[
            {
              entity: 'asset_group',
              title: named('create', 'asset_group', NAMES.group),
              description: t(`${A}.proposals.group`),
            },
          ]}
          confirmLabel={button('create')}
          busy={executing}
          target="confirm"
        />
      )}
      {executed && <ReceiptRow text={confirmed(past('create', 'asset_group', NAMES.group))} />}
      {s >= G.final && (
        <AssistantShell>
          <P>{t(`${C}.group.saved`)}</P>
        </AssistantShell>
      )}
    </>
  );
};

const StudyFlow = ({ s }: { s: number }) => {
  const { t, i18n } = useTranslation('home');
  const { named, past, confirmed, button } = useConfirmCopy();
  const R = STUDY;
  const live = s < R.stage ? (latest(R.narration, s) ?? '') : null;
  const launched = s >= R.launched;
  const studyName = t(`${A}.studyName`);
  const row = (key: string) => [t(`${A}.plan.${key}.label`), t(`${A}.plan.${key}.value`)] as const;

  // The run tracker, as the agentic demo reads the same lifecycle.
  const sr = `${K}.app.studyRun`;
  const verdict: Verdict = s < R.prepare[0][0] ? 'queued' : s < R.done ? 'running' : 'completed';
  const optP = 1 - (1 - span(s, R.optimize[0], R.optimize[1])) ** 1.6;
  const trialsDone = Math.round(optP * R.trials);
  const found = trialsDone - Math.round(trialsDone * 0.026);
  const runSeconds = (Math.min(s, R.done) - R.launched) * R.pace;
  const etaMinutes = Math.max(1, Math.round(((R.done - s) * R.pace) / 60));
  const timing = [
    t(`${sr}.elapsed`, { time: clock(Math.max(0, runSeconds)) }),
    s >= R.optimize[0] && verdict === 'running' ? t(`${K}.app.study.left`, { duration: `${etaMinutes}m` }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const phase = (from: number, to: number) => (s < from ? 'pending' : s < to ? 'active' : 'done');
  const stageLabel = (key: string) => t(`${K}.app.study.stages.${key}`);
  const optimizeStatus = phase(R.optimize[0], R.optimize[1]);
  const prepareStatus = phase(R.prepare[0][0], R.optimize[0]);
  const analyzeStatus = phase(R.analyze, R.done);
  const runRows: StepRow[] = [
    {
      key: 'queue',
      label: t(`${sr}.steps.queue`),
      status: phase(R.launched, R.prepare[0][0]),
      detail: verdict === 'queued' ? <StepCaption>{t(`${sr}.steps.queueDetail`)}</StepCaption> : undefined,
    },
    {
      key: 'prepare',
      label: t(`${sr}.steps.prepare`),
      status: prepareStatus,
      detail: prepareStatus === 'active' ? <StepCaption>{stageLabel(latest(R.prepare, s) ?? 'provisioning')}</StepCaption> : undefined,
    },
    {
      key: 'optimize',
      label: t(`${sr}.steps.optimize`),
      status: optimizeStatus,
      detail:
        optimizeStatus === 'pending' ? undefined : (
          <>
            <StepCaption>
              {`${t(`${sr}.trials`, { done: groupDigits(trialsDone, i18n.language), total: groupDigits(R.trials, i18n.language) })} · ${t(`${sr}.found`, { count: found })}`}
            </StepCaption>
            <OptimizeBar progress={optP} active={optimizeStatus === 'active'} />
          </>
        ),
    },
    {
      key: 'analyze',
      label: t(`${sr}.steps.analyze`),
      status: analyzeStatus,
      detail: analyzeStatus === 'active' ? <StepCaption>{stageLabel('robustness')}</StepCaption> : undefined,
    },
    { key: 'finish', label: t(`${sr}.steps.finish`), status: s >= R.done ? 'done' : 'pending' },
  ];
  const health =
    verdict === 'queued'
      ? { waiting: true, text: t(`${sr}.health.waiting`) }
      : verdict === 'running'
        ? { waiting: false, text: t(`${sr}.health.heartbeat`, { ago: `${1 + (Math.floor(s * 1.3) % 4)}s` }) }
        : { waiting: false, text: t(`${sr}.health.healthy`) };

  return (
    <>
      <UserRow>{t(`${C}.suggestions.study.prompt`)}</UserRow>
      {live !== null && <LiveRow narrationKey={live || undefined} scope={`${C}.narration.study`} />}
      {s >= R.stage && (
        <SettledRow
          chips={[
            [t(`${C}.tools.design`), 1],
            [t(`${C}.tools.quote`), 1],
          ]}
        >
          <RichText i18nKey="ready" scope={`${C}.study`} />
          <KeyValueTable
            head={[t(`${A}.plan.head.part`), t(`${A}.plan.head.rule`)]}
            rows={['objective', 'space', 'windows', 'criteria'].map(row)}
          />
          <RichText i18nKey="launchAsk" scope={A} />
        </SettledRow>
      )}
      {s >= R.stage && !launched && (
        <ConfirmCard
          proposals={[
            {
              entity: 'study',
              title: named('saveAndLaunch', 'study', studyName),
              facts: [
                [t(`${K}.app.confirm.entity.strategy`), NAMES.strategy],
                [t(`${K}.app.confirm.entity.asset_group`), NAMES.group],
                [t(`${A}.proposals.searchLabel`), t(`${A}.proposals.search`)],
              ],
            },
          ]}
          spend={t(`${A}.proposals.spend`, { trials: groupDigits(R.trials, i18n.language), tickers: GROUP_SIZE })}
          confirmLabel={button('saveAndLaunch')}
          busy={s >= R.click}
          target="confirm"
        />
      )}
      {launched && <ReceiptRow text={confirmed(past('launch', 'study', studyName))} />}
      {launched && (
        <Inline>
          <StudyRunCard name={studyName} verdict={verdict} timing={timing} rows={runRows} health={health} />
        </Inline>
      )}
      {s >= R.final && (
        <AssistantShell>
          <P>{t(`${C}.study.final`, { trial: BEST.trial, value: BEST.value })}</P>
        </AssistantShell>
      )}
    </>
  );
};

const PortfolioFlow = ({ s }: { s: number }) => {
  const { t } = useTranslation('home');
  const Q = PORTFOLIO;
  const live = s < Q.settle ? (latest(Q.narration, s) ?? '') : null;
  const row = (key: string) => [t(`${C}.portfolio.${key}.label`), t(`${C}.portfolio.${key}.value`)] as const;

  return (
    <>
      <UserRow>{t(`${C}.suggestions.portfolio.prompt`)}</UserRow>
      {live !== null && <LiveRow narrationKey={live || undefined} scope={`${C}.narration.portfolio`} />}
      {s >= Q.settle && (
        <SettledRow
          chips={[
            [t(`${C}.tools.listPortfolios`), 1],
            [t(`${C}.tools.portfolioStats`), 1],
          ]}
        >
          <P>{reveal(t(`${C}.portfolio.summary`), s, Q.summary)}</P>
          {s >= Q.table && (
            <Box sx={{ animation: 'fdFadeIn 0.24s ease both' }}>
              <KeyValueTable
                head={[t(`${C}.portfolio.head.metric`), t(`${C}.portfolio.head.value`)]}
                rows={['return', 'relative', 'sharpe', 'drawdown', 'exposure'].map(row)}
              />
            </Box>
          )}
          {s >= Q.outlook[0] && <P>{reveal(t(`${C}.portfolio.outlook`), s, Q.outlook)}</P>}
        </SettledRow>
      )}
    </>
  );
};

const FLOW_VIEW: Record<FlowId, (props: { s: number }) => ReactNode> = {
  strategy: StrategyFlow,
  group: GroupFlow,
  study: StudyFlow,
  portfolio: PortfolioFlow,
};

// ---------------------------------------------------------------------------
// Chrome: header, starter cards, chips, composer
// ---------------------------------------------------------------------------

const ChatHeader = ({ onReset, canReset }: { onReset: () => void; canReset: boolean }) => {
  const { t } = useTranslation('home');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 52, px: 2, flexShrink: 0, borderBottom: `1px solid ${APP.divider}` }}>
      <Box sx={{ width: 28, height: 28, borderRadius: '50%', background: APP.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FintelligentMark size={15} color="#fff" />
      </Box>
      <Box sx={{ fontSize: 14.5, fontWeight: 700, color: APP.text }}>{t(`${K}.app.launcher`)}</Box>
      <Box sx={{ height: 20, px: 0.75, borderRadius: '6px', background: APP.info, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
        {t(`${K}.app.beta`)}
      </Box>
      {canReset && (
        <Box
          component="button"
          type="button"
          onClick={onReset}
          aria-label={t(`${C}.resetLabel`)}
          sx={{ ...buttonReset, ml: 'auto', px: 1, height: 28, borderRadius: '8px', fontSize: 12.5, fontWeight: 600, color: APP.textSecondary, '&:hover': { background: APP.hover, color: APP.navy } }}
        >
          {t(`${C}.reset`)}
        </Box>
      )}
    </Box>
  );
};

/** The empty state: the greeting and one card per question. */
const Welcome = ({ onPick, disabled }: { onPick: (id: FlowId) => void; disabled: boolean }) => {
  const { t } = useTranslation('home');
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, px: 1, py: 1 }}>
      <Box sx={{ textAlign: 'center', pb: 1 }}>
        <Box
          sx={{
            position: 'relative',
            width: 46,
            height: 46,
            mx: 'auto',
            mb: 1.25,
            borderRadius: '50%',
            background: APP.paper,
            color: APP.navy,
            boxShadow: APP.shadow.raisedSm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&::after': gradientRingSx('50%'),
          }}
        >
          <FintelligentMark size={22} color={APP.navy} />
        </Box>
        <Box sx={{ fontSize: 17, fontWeight: 700, color: APP.text }}>{t(`${K}.app.placeholder`)}</Box>
        <Box sx={{ fontSize: 13, color: APP.textSecondary, mt: 0.25 }}>{t(`${C}.hint`)}</Box>
      </Box>
      {FLOWS.map((id) => (
        <Box
          key={id}
          component="button"
          type="button"
          disabled={disabled}
          onClick={() => onPick(id)}
          sx={{
            ...buttonReset,
            display: 'flex',
            gap: 1.25,
            alignItems: 'flex-start',
            p: 1.25,
            borderRadius: '12px',
            background: APP.paper,
            boxShadow: APP.shadow.raisedXs,
            transition: 'transform 0.16s ease, box-shadow 0.16s ease',
            '@media (hover: hover)': { '&:hover:not(:disabled)': { transform: 'translateY(-1px)', boxShadow: APP.shadow.raisedSm } },
          }}
        >
          <Box sx={{ color: APP.navy, mt: '2px', display: 'flex' }}>
            <FlowGlyph id={id} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ fontSize: 14, fontWeight: 650, color: APP.text }}>{t(`${C}.suggestions.${id}.label`)}</Box>
            <Box sx={{ fontSize: 12.5, lineHeight: 1.45, color: APP.textSecondary, mt: 0.25 }}>{t(`${C}.suggestions.${id}.prompt`)}</Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

/** Once a conversation is going, the questions fold into chips above the composer. */
const Chips = ({ used, onPick, onReset, disabled }: { used: readonly FlowId[]; onPick: (id: FlowId) => void; onReset: () => void; disabled: boolean }) => {
  const { t } = useTranslation('home');
  const chip = {
    ...buttonReset,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    height: 30,
    px: 1.25,
    borderRadius: 999,
    background: APP.paper,
    boxShadow: APP.shadow.raisedXs,
    fontSize: 12.5,
    fontWeight: 600,
    color: APP.text,
    whiteSpace: 'nowrap',
  } as const;
  const allUsed = used.length === FLOWS.length;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
      {FLOWS.map((id) => {
        const done = used.includes(id);
        return (
          <Box
            key={id}
            component="button"
            type="button"
            disabled={disabled || done}
            onClick={() => onPick(id)}
            sx={{ ...chip, opacity: done ? 0.6 : disabled ? 0.55 : 1, '@media (hover: hover)': { '&:hover:not(:disabled)': { background: APP.well } } }}
          >
            {done ? <CheckCircleOutlineIcon sx={{ fontSize: 15, color: APP.success }} /> : <FlowGlyph id={id} />}
            {t(`${C}.suggestions.${id}.label`)}
          </Box>
        );
      })}
      {allUsed && !disabled && (
        <Box component="button" type="button" onClick={onReset} sx={{ ...chip, background: APP.navy, color: '#fff', boxShadow: 'none' }}>
          {t(`${C}.reset`)}
        </Box>
      )}
    </Box>
  );
};

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

// ---------------------------------------------------------------------------
// The window
// ---------------------------------------------------------------------------

interface Started {
  id: FlowId;
  /** performance.now() at the send. */
  at: number;
}

export const HeroChat = () => {
  const { t } = useTranslation('home');
  const [started, setStarted] = useState<Started[]>([]);
  const [now, setNow] = useState(0);
  /** A question being typed into the composer before it sends. */
  const [typing, setTyping] = useState<{ id: FlowId; n: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Follow the newest row unless the visitor has scrolled up to read. */
  const follow = useRef(true);

  const seconds = (s: Started) => Math.min(END[s.id], Math.max(0, (now - s.at) / 1000));
  const running = started.some((s) => (now - s.at) / 1000 < END[s.id]);
  const busy = running || typing !== null;
  const used = started.map((s) => s.id);

  const start = useCallback((id: FlowId) => {
    const at = performance.now();
    follow.current = true;
    setNow(at);
    // Reduced motion: back-date the send so the flow is already at its end.
    setStarted((list) => [...list, { id, at: prefersReducedMotion() ? at - END[id] * 1000 - 1 : at }]);
  }, []);

  const onPick = useCallback(
    (id: FlowId) => {
      if (busy || used.includes(id)) return;
      if (prefersReducedMotion()) start(id);
      else setTyping({ id, n: 0 });
    },
    [busy, used, start],
  );

  const onReset = useCallback(() => {
    setStarted([]);
    setTyping(null);
    follow.current = true;
  }, []);

  // The tick: only while a flow is playing.
  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setNow(performance.now()), 70);
    return () => window.clearInterval(id);
  }, [running]);

  // The question types itself into the composer, then sends.
  useEffect(() => {
    if (!typing) return undefined;
    const prompt = t(`${C}.suggestions.${typing.id}.prompt`);
    if (typing.n >= prompt.length) {
      const id = window.setTimeout(() => {
        setTyping(null);
        start(typing.id);
      }, 240);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setTyping({ id: typing.id, n: Math.min(prompt.length, typing.n + 4) }), 20);
    return () => window.clearTimeout(id);
  }, [typing, t, start]);

  // Keep the newest row in view while a flow grows; the empty state reads from its top.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (started.length === 0) el.scrollTop = 0;
    else if (follow.current) el.scrollTop = el.scrollHeight;
  });
  const onScroll = () => {
    const el = scrollRef.current;
    if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 56;
  };

  const finished = started.filter((s) => seconds(s) >= END[s.id]);
  const lastDone = finished[finished.length - 1];
  const typedText = typing ? t(`${C}.suggestions.${typing.id}.prompt`).slice(0, typing.n) : '';

  return (
    <Box
      role="group"
      aria-label={t(`${C}.label`)}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: { xs: 600, md: 640 },
        overflow: 'hidden',
        borderRadius: '20px',
        background: APP.ground,
        color: APP.text,
        fontFamily: APP.font,
        textAlign: 'left',
        colorScheme: 'light',
        WebkitFontSmoothing: 'antialiased',
        boxShadow: '0 30px 60px -28px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)',
      }}
    >
      <DemoKeyframes />
      <ChatHeader onReset={onReset} canReset={started.length > 0 && !typing} />
      <Box
        ref={scrollRef}
        onScroll={onScroll}
        tabIndex={0}
        role="region"
        aria-label={t(`${C}.transcript`)}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', py: 1, '&:focus-visible': { outline: `2px solid ${APP.navy}`, outlineOffset: -2 } }}
      >
        {started.length === 0 ? (
          <Welcome onPick={onPick} disabled={busy} />
        ) : (
          started.map((s) => {
            const View = FLOW_VIEW[s.id];
            return <View key={s.id} s={seconds(s)} />;
          })
        )}
        <Box sx={{ height: 12 }} />
      </Box>
      <Box sx={{ flexShrink: 0, px: 1.5, pt: 1, pb: 1.25, borderTop: started.length ? `1px solid ${APP.divider}` : 'none' }}>
        {started.length > 0 && <Chips used={used} onPick={onPick} onReset={onReset} disabled={busy} />}
        <Box aria-hidden sx={{ height: 46 }}>
          <Composer text={typedText} focused={typing !== null} typing={typing !== null} send={typing ? 'ready' : 'disabled'} compact />
        </Box>
        <Box sx={{ mt: 0.75, textAlign: 'center', fontSize: 10.5, lineHeight: 1.35, color: APP.textDisabled }}>{t(`${C}.note`)}</Box>
      </Box>
      <Box aria-live="polite" sx={visuallyHidden}>
        {lastDone ? t(`${C}.announce`, { label: t(`${C}.suggestions.${lastDone.id}.label`) }) : ''}
      </Box>
    </Box>
  );
};
