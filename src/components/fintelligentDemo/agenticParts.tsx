/**
 * The surfaces only the Agentic AI demo draws, each a pure function of its
 * props, mirroring the app's components (paths in the app repo's
 * frontend/src/features/ai/fintelligent/components): the Confirm card and its
 * receipt (ConfirmActionCard, ConfirmCardParts, ConfirmProposalRow,
 * ConfirmReceiptRow), the creation previews (CreationPreviewParts,
 * StrategyPreviewCard, AssetGroupPreviewCard) and the study run tracker
 * (StudyRunCard, StudyRunStepper, StudyRunBestTrial).
 *
 * Same styling rule as parts.tsx: anything that changes every frame goes
 * through `style`, never `sx`.
 */
import { memo } from 'react';
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorIcon from '@mui/icons-material/Error';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import { APP } from './appTheme';
import {
  ArrowGlyph,
  ChevronGlyph,
  CopyGlyph,
  EntityGlyph,
  PromotedGlyph,
  PulseGlyph,
  RefreshGlyph,
  ShieldCheckGlyph,
  TokenGlyph,
} from './glyphs';
import { AutoScroll, Spinner } from './parts';
import { BEST, GROUP_SIZE, TICKERS } from './agenticScript';

const K = 'fintelligentDemo';

type Entity = 'asset_group' | 'strategy' | 'study';

/** The app's small contained button (navy) and its text button. */
const buttonSx = (contained: boolean) =>
  ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    height: 28,
    px: 1.5,
    borderRadius: '8px',
    fontSize: 12.5,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    color: contained ? '#fff' : APP.textSecondary,
    background: contained ? APP.navy : 'transparent',
    boxShadow: contained ? '0 2px 6px rgba(22,50,92,0.28)' : 'none',
  }) as const;

const Caption = ({ children, color = APP.textSecondary }: { children: ReactNode; color?: string }) => (
  <Box sx={{ fontSize: 11.5, lineHeight: 1.4, color, overflowWrap: 'anywhere' }}>{children}</Box>
);

// ---------------------------------------------------------------------------
// Transcript: the Confirm card and its receipt
// ---------------------------------------------------------------------------

export interface ProposalView {
  entity: Entity;
  title: string;
  description?: string;
  facts?: ReadonlyArray<readonly [string, string]>;
}

/**
 * The Confirm card: a shield-check header and a navy rail (never the
 * warning-railed question card), one row per staged write, the spend notice
 * when it spends, then Cancel and the confirm button. `busy` puts the
 * spinner on the confirm button while the writes run.
 */
export const ConfirmCard = memo(
  ({
    proposals,
    spend,
    confirmLabel,
    busy,
    target,
  }: {
    proposals: ProposalView[];
    spend?: string;
    confirmLabel: string;
    busy: boolean;
    target: string;
  }) => {
    const { t } = useTranslation('home');
    const c = `${K}.app.confirm`;
    return (
      <Box
        sx={{
          mx: 1,
          my: 1.5,
          p: 2,
          borderRadius: '10px',
          border: `1px solid ${APP.navy}`,
          borderLeftWidth: 3,
          background: APP.paper,
          boxShadow: '0 10px 24px -14px rgba(11,26,51,0.35)',
          animation: 'fdFadeIn 0.24s ease both',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Box sx={{ color: APP.navy, mt: '1px', display: 'flex' }}>
            <ShieldCheckGlyph />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ fontSize: 14, fontWeight: 650, color: APP.text }}>{t(`${c}.title`)}</Box>
            <Box sx={{ fontSize: 12, color: APP.textSecondary, mt: 0.25 }}>{t(`${c}.subtitle`, { count: proposals.length })}</Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
          {proposals.map((p) => (
            <Box key={p.title} sx={{ display: 'flex', gap: 1, p: 1, border: `1px solid ${APP.divider}`, borderRadius: '8px' }}>
              <Box sx={{ color: APP.textSecondary, mt: '2px', display: 'flex' }}>
                <EntityGlyph kind={p.entity} size={17} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ fontSize: 13.5, fontWeight: 650, color: APP.text, overflowWrap: 'anywhere' }}>{p.title}</Box>
                {p.description && <Caption>{p.description}</Caption>}
                {p.facts?.map(([label, value]) => (
                  <Box key={label} sx={{ fontSize: 11.5, lineHeight: 1.45, color: APP.text }}>
                    <Box component="span" sx={{ color: APP.textSecondary }}>{`${label}: `}</Box>
                    {value}
                  </Box>
                ))}
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, mt: 0.5, fontSize: 12, fontWeight: 600, color: APP.navy }}>
                  {t(`${c}.showDetails`)}
                  <ChevronGlyph />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
        {spend && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, p: 1, borderRadius: '8px', background: APP.hover, color: APP.warning }}>
            <Box sx={{ display: 'flex', mt: '1px' }}>
              <TokenGlyph />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ fontSize: 12, fontWeight: 650 }}>{t(`${c}.spend`)}</Box>
              <Box sx={{ fontSize: 11.5, color: APP.textSecondary }}>{spend}</Box>
            </Box>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 1.5 }}>
          <Box sx={buttonSx(false)}>{t(`${c}.cancel`)}</Box>
          <Box data-demo={target} sx={buttonSx(true)}>
            {busy && <Spinner size={12} color="#fff" />}
            {confirmLabel}
          </Box>
        </Box>
      </Box>
    );
  },
);
ConfirmCard.displayName = 'ConfirmCard';

/** What the user decided, once the card is gone: a line with a small mark, not a bubble. */
export const ReceiptRow = memo(({ text }: { text: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, animation: 'fdFadeIn 0.24s ease both' }}>
    <CheckCircleOutlineIcon sx={{ fontSize: 15, color: APP.success }} />
    <Box component="span" sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', color: APP.textSecondary }}>
      {text}
    </Box>
  </Box>
));
ReceiptRow.displayName = 'ReceiptRow';

/** A two-column GFM table, as the app renders one in an answer. */
export const KeyValueTable = memo(({ head, rows }: { head: readonly [string, string]; rows: ReadonlyArray<readonly [string, string]> }) => {
  const cell = { px: 1.25, py: 0.75, border: `1px solid ${APP.divider}`, fontSize: 13, lineHeight: 1.4, textAlign: 'left' } as const;
  return (
    <Box component="table" sx={{ borderCollapse: 'collapse', mb: 1.25, width: '100%' }}>
      <thead>
        <tr>
          {head.map((h) => (
            <Box key={h} component="th" sx={{ ...cell, background: APP.hover, fontWeight: 600 }}>
              {h}
            </Box>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <Box component="td" sx={{ ...cell, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {label}
            </Box>
            <Box component="td" sx={{ ...cell, color: APP.textSecondary }}>
              {value}
            </Box>
          </tr>
        ))}
      </tbody>
    </Box>
  );
});
KeyValueTable.displayName = 'KeyValueTable';

// ---------------------------------------------------------------------------
// Thinking panel: pinned sections, steppers
// ---------------------------------------------------------------------------

/**
 * A section pinned above the feed: the run tracker, or the creation previews.
 * Capped, and read from the top (newest first), as the app's scroll box opens
 * — unless it `follow`s, keeping its newest line in view the way the
 * transcript does (the compact window's tracker, whose result is at its foot).
 */
export const PinnedSection = ({ children, maxHeight, follow = false }: { children: ReactNode; maxHeight?: number; follow?: boolean }) => {
  const column = <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</Box>;
  return (
    <Box sx={{ flexShrink: 0, px: 1.5, py: 1, borderBottom: `1px solid ${APP.divider}` }}>
      {follow ? (
        <AutoScroll sx={{ maxHeight }}>{column}</AutoScroll>
      ) : (
        <Box style={{ maxHeight }} sx={{ overflow: 'hidden' }}>
          {column}
        </Box>
      )}
    </Box>
  );
};

const CardShell = ({ children, target }: { children: ReactNode; target?: string }) => (
  <Box
    data-demo={target}
    sx={{
      px: 1.25,
      py: 1,
      borderRadius: '10px',
      border: `1px solid ${APP.divider}`,
      background: APP.paper,
      animation: 'fdFadeIn 0.24s ease both',
    }}
  >
    {children}
  </Box>
);

export type StepStatus = 'pending' | 'active' | 'done' | 'failed';

export interface StepRow {
  key: string;
  label: string;
  status: StepStatus;
  detail?: ReactNode;
}

const INDICATOR = 18;

/** One step's glyph, shared by the run tracker and the previews, so every progress in the panel reads alike. */
const StepIndicator = ({ status, optimize }: { status: StepStatus; optimize: boolean }) => {
  if (status === 'done') return <CheckCircleIcon sx={{ fontSize: INDICATOR, color: APP.success }} />;
  if (status === 'failed') return <ErrorIcon sx={{ fontSize: INDICATOR, color: APP.error }} />;
  if (status === 'active') {
    return optimize ? (
      <Box sx={{ display: 'flex', color: APP.navy, animation: 'fdSpin 1.4s linear infinite' }}>
        <RefreshGlyph size={INDICATOR} />
      </Box>
    ) : (
      <Box sx={{ width: INDICATOR, height: INDICATOR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={14} />
      </Box>
    );
  }
  return <Box sx={{ width: INDICATOR - 6, height: INDICATOR - 6, m: '3px', borderRadius: '50%', border: `2px solid ${APP.divider}` }} />;
};

/** The vertical stepper: an indicator per row, a connector between rows, the row's detail under its label. */
export const Stepper = ({ rows, optimizeKey }: { rows: StepRow[]; optimizeKey?: string }) => (
  <Box sx={{ mt: 1 }}>
    {rows.map(({ key, label, status, detail }, i) => {
      const last = i === rows.length - 1;
      return (
        <Box key={key} sx={{ display: 'flex', gap: 1, minHeight: 24 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: '1px' }}>
            <StepIndicator status={status} optimize={key === optimizeKey} />
            {!last && (
              <Box
                sx={{
                  flex: 1,
                  width: '2px',
                  minHeight: 4,
                  my: '2px',
                  borderRadius: 1,
                  background: status === 'done' ? APP.success : APP.divider,
                  opacity: status === 'done' ? 0.5 : 1,
                }}
              />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, pb: last ? 0 : 0.5 }}>
            <Box
              sx={{
                fontSize: 13,
                lineHeight: '20px',
                fontWeight: status === 'active' ? 650 : 500,
                color: status === 'pending' ? APP.textDisabled : status === 'failed' ? APP.error : APP.text,
                animation: status === 'active' ? 'fdBreathe 2.4s ease-in-out infinite' : 'none',
              }}
            >
              {label}
            </Box>
            {detail}
          </Box>
        </Box>
      );
    })}
  </Box>
);

export const StepCaption = Caption;

/** The Optimizing step's bar: determinate, striped and marching while it runs. */
export const OptimizeBar = ({ progress, active }: { progress: number; active: boolean }) => (
  <Box sx={{ height: 6, mt: 0.5, borderRadius: 3, background: APP.hover, overflow: 'hidden' }}>
    <Box
      style={{ width: `${(progress * 100).toFixed(1)}%` }}
      sx={{
        height: '100%',
        borderRadius: 3,
        background: APP.navy,
        ...(active && {
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0 4px, transparent 4px 8px)',
          backgroundSize: '16px 100%',
          animation: 'fdMarch 0.8s linear infinite',
        }),
      }}
    />
  </Box>
);

// ---------------------------------------------------------------------------
// Creation previews
// ---------------------------------------------------------------------------

export type DecisionState = 'authoring' | 'pending' | 'executing' | 'executed';

const PreviewHeader = ({ entity, name }: { entity: Entity; name: string }) => {
  const { t } = useTranslation('home');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
      <Box sx={{ display: 'flex', color: APP.textSecondary, flexShrink: 0 }}>
        <EntityGlyph kind={entity} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 650, color: APP.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </Box>
      <Box sx={{ fontSize: 11.5, color: APP.textSecondary, flexShrink: 0 }}>{t(`${K}.app.preview.kind.${entity}`)}</Box>
    </Box>
  );
};

/** FINALIZE and Cancel while it waits, "Saving…" while it saves, VIEW once it exists. */
const PreviewActions = ({ state, entity, confirmLabel }: { state: DecisionState; entity: Entity; confirmLabel: string }) => {
  const { t } = useTranslation('home');
  if (state === 'pending') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
        <Box sx={{ ...buttonSx(false), height: 26 }}>{t(`${K}.app.confirm.cancel`)}</Box>
        <Box sx={{ ...buttonSx(true), height: 26, px: 1.25 }}>{confirmLabel}</Box>
      </Box>
    );
  }
  if (state === 'executing') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
        <Spinner size={12} />
        <Caption>{t(`${K}.app.preview.steps.saving`)}</Caption>
      </Box>
    );
  }
  if (state === 'executed') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Box sx={{ ...buttonSx(true), height: 26, px: 1.25 }}>
          {t(`${K}.app.preview.view.${entity}`)}
          <ArrowGlyph />
        </Box>
      </Box>
    );
  }
  return null;
};

/** A saved write, folded to one line: the check, what it is, and the way to it. */
const SavedLine = ({ entity, detail }: { entity: Entity; detail: string }) => {
  const { t } = useTranslation('home');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
      <CheckCircleIcon sx={{ fontSize: 15, color: APP.success }} />
      <Box sx={{ flex: 1, minWidth: 0, fontSize: 11.5, color: APP.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {`${t(`${K}.app.preview.steps.saved`)} · ${detail}`}
      </Box>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12, fontWeight: 650, color: APP.navy, flexShrink: 0 }}>
        {t(`${K}.app.preview.view.${entity}`)}
        <ArrowGlyph />
      </Box>
    </Box>
  );
};

/** The code, monospace and capped; while it streams a caret blinks at its end and the block follows the newest line. */
const CodePreview = ({ code, streaming, open }: { code: string; streaming: boolean; open: boolean }) => {
  const { t } = useTranslation('home');
  return (
    <Box sx={{ mt: 0.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: APP.navy }}>
        <Box sx={{ fontSize: 12, fontWeight: 600 }}>{open ? t(`${K}.app.preview.hideCode`) : t(`${K}.app.preview.showCode`)}</Box>
        <ChevronGlyph up={open} />
        <Box sx={{ ml: 'auto', display: 'flex', color: APP.textSecondary }}>
          <CopyGlyph />
        </Box>
      </Box>
      {open && (
        <AutoScroll sx={{ mt: 0.5, maxHeight: 118, borderRadius: '6px', background: APP.hover }}>
          <Box
            component="pre"
            sx={{ m: 0, p: 1, fontFamily: APP.mono, fontSize: 10, lineHeight: 1.5, fontVariantLigatures: 'none', whiteSpace: 'pre', color: APP.text, overflow: 'hidden' }}
          >
            {code}
            {streaming && (
              <Box
                component="span"
                sx={{ display: 'inline-block', width: '0.55em', height: '1.1em', verticalAlign: 'text-bottom', ml: '1px', background: APP.navy, animation: 'fdBlink 1s steps(1) infinite' }}
              />
            )}
          </Box>
        </AutoScroll>
      )}
    </Box>
  );
};

/** A strategy from its first keystroke to "Saved": the code as it is written, each validation, then the decision. */
export const StrategyPreview = memo(
  ({
    name,
    steps,
    code,
    streaming,
    codeOpen,
    state,
    confirmLabel,
    savedDetail,
  }: {
    name: string;
    steps: StepRow[];
    code: string;
    streaming: boolean;
    codeOpen: boolean;
    state: DecisionState;
    confirmLabel: string;
    savedDetail: string;
  }) => (
    <CardShell>
      <PreviewHeader entity="strategy" name={name} />
      {state === 'executed' ? (
        <SavedLine entity="strategy" detail={savedDetail} />
      ) : (
        <>
          <Stepper rows={steps} />
          {code && <CodePreview code={code} streaming={streaming} open={codeOpen} />}
          <PreviewActions state={state} entity="strategy" confirmLabel={confirmLabel} />
        </>
      )}
    </CardShell>
  ),
);
StrategyPreview.displayName = 'StrategyPreview';

const LOGO_TINTS = ['#2F6395', '#288357', '#B74444', '#5575A8', '#8B6B01'] as const;

const TickerChip = ({ symbol, index }: { symbol: string; index: number }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      height: 22,
      pl: '3px',
      pr: 0.875,
      borderRadius: 999,
      background: APP.paper,
      boxShadow: APP.shadow.raisedXs,
      fontSize: 11.5,
      fontWeight: 650,
      color: APP.text,
      animation: `fdPop 0.32s ease-out ${(index * 0.12).toFixed(2)}s both`,
    }}
  >
    <Box
      sx={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: LOGO_TINTS[index % LOGO_TINTS.length],
        color: '#fff',
        fontSize: 9,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {symbol[0]}
    </Box>
    {symbol}
  </Box>
);

/** An asset group being created: its first tickers popping in, a sheen passing over them while it waits and saves, "+N" for the rest. */
export const AssetGroupPreview = memo(
  ({ name, state, confirmLabel }: { name: string; state: DecisionState; confirmLabel: string }) => {
    const { t } = useTranslation('home');
    const working = state === 'pending' || state === 'executing';
    const count = t(`${K}.app.preview.tickers`, { count: GROUP_SIZE });
    return (
      <CardShell>
        <PreviewHeader entity="asset_group" name={name} />
        <Box sx={{ position: 'relative', overflow: 'hidden', mt: 1, py: '2px', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {TICKERS.map((symbol, i) => (
            <TickerChip key={symbol} symbol={symbol} index={i} />
          ))}
          <Box
            sx={{
              height: 22,
              px: 0.875,
              borderRadius: 999,
              background: APP.well,
              fontSize: 11.5,
              fontWeight: 650,
              color: APP.textSecondary,
              display: 'flex',
              alignItems: 'center',
              animation: `fdPop 0.32s ease-out ${(TICKERS.length * 0.12).toFixed(2)}s both`,
            }}
          >
            {`+${GROUP_SIZE - TICKERS.length}`}
          </Box>
          {working && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                animation: 'fdGlide 1.6s ease-in-out infinite',
              }}
            />
          )}
        </Box>
        {state === 'executed' ? (
          <SavedLine entity="asset_group" detail={count} />
        ) : (
          <>
            <Box sx={{ mt: 0.5 }}>
              <Caption>{count}</Caption>
            </Box>
            <PreviewActions state={state} entity="asset_group" confirmLabel={confirmLabel} />
          </>
        )}
      </CardShell>
    );
  },
);
AssetGroupPreview.displayName = 'AssetGroupPreview';

/** A study staged on a Confirm card: it waits, then the run tracker takes it over once it launches. */
export const StudyPreview = memo(({ name, confirmLabel }: { name: string; confirmLabel: string }) => {
  const { t } = useTranslation('home');
  const s = `${K}.app.preview.steps`;
  return (
    <CardShell>
      <PreviewHeader entity="study" name={name} />
      <Stepper
        rows={[
          { key: 'awaiting', label: t(`${s}.awaiting`), status: 'active' },
          { key: 'saved', label: t(`${s}.saved`), status: 'pending' },
        ]}
      />
      <PreviewActions state="pending" entity="study" confirmLabel={confirmLabel} />
    </CardShell>
  );
});
StudyPreview.displayName = 'StudyPreview';

// ---------------------------------------------------------------------------
// The run tracker
// ---------------------------------------------------------------------------

export type Verdict = 'queued' | 'running' | 'completed';

const StatusBadge = ({ verdict }: { verdict: Verdict }) => {
  const { t } = useTranslation('home');
  const color = verdict === 'completed' ? APP.success : verdict === 'running' ? APP.warning : APP.textSecondary;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.625,
        height: 20,
        px: 0.875,
        borderRadius: '6px',
        background: `${color}1f`,
        color,
        fontSize: 11.5,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {verdict === 'completed' ? (
        <CheckCircleIcon sx={{ fontSize: 13 }} />
      ) : (
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: verdict === 'running' ? 'fdPulse 1.4s ease-in-out infinite' : 'none' }} />
      )}
      {t(`${K}.app.studyRun.badge.${verdict}`)}
    </Box>
  );
};

/** A finished study's best trial: its number, its fitness under the objective's name, its parameters. */
const BestTrial = () => {
  const { t } = useTranslation('home');
  const r = `${K}.app.studyRun.best`;
  return (
    <Box sx={{ mt: 1, animation: 'fdFadeIn 0.24s ease both' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', color: APP.warning }}>
          <PromotedGlyph />
        </Box>
        <Box sx={{ fontSize: 11.5, fontWeight: 650, color: APP.textSecondary }}>{t(`${r}.title`)}</Box>
        <Box sx={{ fontSize: 11.5, fontFamily: APP.mono }}>{t(`${r}.trial`, { number: BEST.trial })}</Box>
        <Box sx={{ fontSize: 11.5, fontWeight: 650 }}>
          {`${t(`${K}.app.studyRun.objective`)} `}
          <Box component="span" sx={{ fontFamily: APP.mono, fontWeight: 700 }}>
            {BEST.value}
          </Box>
        </Box>
      </Box>
      <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 1.5, rowGap: '1px', m: 0, mt: 0.5, pl: 2.5 }}>
        {BEST.params.map(([k, v]) => (
          <Box key={k} sx={{ display: 'contents' }}>
            <Box component="dt" sx={{ fontSize: 11.5, color: APP.textSecondary, fontFamily: APP.mono }}>
              {k}
            </Box>
            <Box component="dd" sx={{ m: 0, fontSize: 11.5, fontFamily: APP.mono, textAlign: 'right' }}>
              {v}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * One launched study, live: its status, elapsed time and ETA, the five-step
 * pipeline, the health line and — once finished — its best trial and the way
 * to its analysis page.
 */
export const StudyRunCard = memo(
  ({
    name,
    verdict,
    timing,
    rows,
    health,
  }: {
    name: string;
    verdict: Verdict;
    timing: string;
    rows: StepRow[];
    health: { waiting: boolean; text: string };
  }) => {
    const { t } = useTranslation('home');
    const done = verdict === 'completed';
    return (
      <CardShell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 650, color: APP.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </Box>
          <StatusBadge verdict={verdict} />
          <Box data-demo="tracker" sx={{ display: 'flex', color: APP.textSecondary }}>
            <ChevronGlyph up />
          </Box>
        </Box>
        <Box sx={{ fontSize: 11.5, color: APP.textSecondary, fontVariantNumeric: 'tabular-nums' }}>{timing}</Box>
        <Stepper rows={rows} optimizeKey="optimize" />
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mt: 1, color: health.waiting ? APP.textSecondary : APP.success }}>
          <Box sx={{ display: 'flex', mt: '1px' }}>{health.waiting ? <HistoryToggleOffIcon sx={{ fontSize: 14 }} /> : <PulseGlyph />}</Box>
          <Box sx={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>{health.text}</Box>
        </Box>
        {done && <BestTrial />}
        {done && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Box data-demo="view-study" sx={{ ...buttonSx(true), height: 26, px: 1.25 }}>
              {t(`${K}.app.studyRun.viewStudy`)}
              <ArrowGlyph />
            </Box>
          </Box>
        )}
      </CardShell>
    );
  },
);
StudyRunCard.displayName = 'StudyRunCard';
