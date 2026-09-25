/**
 * The product surfaces the Fintelligent demo draws, each a pure function of
 * its props. They mirror the app's components (paths in the app repo's
 * frontend/src): the launcher pill and composer (layouts/AppShell/), message
 * rows, the Thinking feed and the question card (features/ai/fintelligent/),
 * and the study page header (features/analysis/portfolios/studies/).
 *
 * Styling rule: anything that changes every frame goes through `style`, never
 * `sx` — each distinct `sx` value mints an Emotion class, and a per-frame one
 * would mint thousands. `sx` carries only values that flip between a few
 * discrete states.
 */
import { memo, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Box } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import PersonIcon from '@mui/icons-material/Person';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import { APP, gradientRingSx } from './appTheme';
import {
  ClipGlyph,
  CloseGlyph,
  FintelligentMark,
  HistoryGlyph,
  NavGlyph,
  PanelGlyph,
  PlusGlyph,
  SearchGlyph,
  SendGlyph,
  SlidersGlyph,
  StopGlyph,
} from './glyphs';
import { SAMPLERS, groupDigits } from './script';
import type { StatusKey } from './script';

const K = 'fintelligentDemo';

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

export const Spinner = ({ size = 12, color = APP.navy }: { size?: number; color?: string }) => (
  <Box
    aria-hidden
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: '50%',
      border: `${size > 13 ? 2 : 1.6}px solid ${color}33`,
      borderTopColor: color,
      animation: 'fdSpin 0.8s linear infinite',
    }}
  />
);

/** Mounts with the app's 240ms slide-in; remounting (a new key) replays it. */
const FadeIn = ({ children, sx }: { children: ReactNode; sx?: object }) => (
  <Box sx={{ animation: 'fdFadeIn 0.24s ease both', ...sx }}>{children}</Box>
);

const Wordmark = () => (
  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1px', fontWeight: 700, fontSize: 15, letterSpacing: '0.08em', color: APP.text }}>
    FINTEL
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden style={{ marginBottom: 2 }}>
      <defs>
        <linearGradient id="fdCaret" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EFC03C" />
          <stop offset="0.55" stopColor="#E53540" />
          <stop offset="1" stopColor="#2F6395" />
        </linearGradient>
      </defs>
      <path d="M3 22 L12 3 L21 22" fill="none" stroke="url(#fdCaret)" strokeWidth="4.5" />
    </svg>
  </Box>
);

const Avatar = ({ user }: { user: boolean }) => (
  <Box
    sx={{
      width: 28,
      height: 28,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: APP.navy,
      color: '#fff',
    }}
  >
    {user ? <PersonIcon sx={{ fontSize: 17 }} /> : <FintelligentMark size={15} color="#fff" />}
  </Box>
);

/** The app's small outlined chip: white, raised, 0.75rem. */
const ToolChip = ({ label, count }: { label: string; count: number }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      height: 22,
      px: 1,
      borderRadius: '8px',
      background: APP.paper,
      boxShadow: APP.shadow.raisedXs,
      fontSize: 12,
      fontWeight: 600,
      color: APP.textSecondary,
      whiteSpace: 'nowrap',
    }}
  >
    <CheckCircleOutlineIcon sx={{ fontSize: 14, color: APP.success }} />
    {label}
    {count > 1 && <Box component="span" sx={{ color: APP.textDisabled }}>{`×${count}`}</Box>}
  </Box>
);

/** Keeps the newest content in view, the way the transcript follows a stream. */
export const AutoScroll = ({ children, sx }: { children: ReactNode; sx?: object }) => {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  useLayoutEffect(() => {
    const v = viewport.current;
    const c = content.current;
    if (!v || !c) return undefined;
    const update = () => setOffset(Math.max(0, c.offsetHeight - v.clientHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(c);
    observer.observe(v);
    return () => observer.disconnect();
  }, []);
  return (
    <Box ref={viewport} sx={{ position: 'relative', overflow: 'hidden', minHeight: 0, ...sx }}>
      <Box
        ref={content}
        style={{ transform: `translateY(${-offset}px)`, transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        {children}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// The page under the chat
// ---------------------------------------------------------------------------

const NAV = ['home', 'library', 'studies', 'portfolios', 'markets', 'dataExplorer', 'laboratory'] as const;

export const Sidebar = memo(({ active }: { active: (typeof NAV)[number] }) => {
  const { t } = useTranslation('home');
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 14,
        top: 14,
        bottom: 14,
        width: 178,
        borderRadius: '14px',
        background: APP.paper,
        boxShadow: APP.shadow.raisedSm,
        p: '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <Box sx={{ px: 1, pb: 2 }}>
        <Wordmark />
      </Box>
      {NAV.map((key) => (
        <Box
          key={key}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1,
            height: 34,
            borderRadius: '10px',
            fontSize: 13,
            fontWeight: key === active ? 650 : 500,
            color: key === active ? APP.navy : APP.textSecondary,
            ...(key === active && { background: APP.well, boxShadow: APP.shadow.well }),
          }}
        >
          <NavGlyph kind={key} />
          {t(`${K}.app.nav.${key}`)}
        </Box>
      ))}
      <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 1.25, px: 1, fontSize: 13, fontWeight: 600, color: APP.text }}>
        <Box sx={{ width: 22, height: 22, borderRadius: '50%', background: APP.steel }} />
        {t(`${K}.app.settings`)}
      </Box>
    </Box>
  );
});
Sidebar.displayName = 'Sidebar';

const STRATEGY_ROWS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['momentum_volume_version3', ['fast_period', 'n_top', 'vol_window']],
  ['sortino_invvol_downside', ['lookback', 'target', 'n_top']],
  ['short_overextended', ['z_entry', 'hold_days']],
  ['sma_crossover_top_n', ['fast_period', 'slow_period', 'n_top']],
  ['skewness_long_short', ['window', 'quantile']],
  ['positive_skew_select', ['skew_window', 'min_obs', 'n_top']],
  ['sma_cross_crypto', ['fast_period', 'slow_period']],
  ['alpha_zscore_below_mu', ['alpha_win', 'z_thr', 'n_top']],
  ['volume_fintela', ['vol_window', 'quantile']],
  ['mom_inverse_vol', ['roc_window', 'vol_window', 'freq']],
];

export const StrategiesPage = memo(({ left }: { left: number }) => {
  const { t } = useTranslation('home');
  return (
    <Box sx={{ position: 'absolute', left, right: 18, top: 20, bottom: 20, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ fontSize: 21, fontWeight: 800, color: APP.text, letterSpacing: '-0.02em' }}>{t(`${K}.app.strategies`)}</Box>
        <Box
          sx={{
            flex: 1,
            maxWidth: 300,
            height: 32,
            borderRadius: '10px',
            background: APP.well,
            boxShadow: APP.shadow.well,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.25,
            color: APP.textDisabled,
            fontSize: 13,
          }}
        >
          <SearchGlyph />
          {t(`${K}.app.searchStrategies`)}
        </Box>
        <Box
          sx={{
            ml: 'auto',
            width: 32,
            height: 32,
            borderRadius: '10px',
            background: APP.paper,
            boxShadow: APP.shadow.raisedXs,
            color: APP.navy,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusGlyph />
        </Box>
      </Box>
      <Box sx={{ borderRadius: '14px', background: APP.paper, boxShadow: APP.shadow.raisedSm, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '2fr 3fr',
            gap: 2,
            px: 2,
            height: 34,
            alignItems: 'center',
            background: APP.steel,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <span>{t(`${K}.app.name`)}</span>
          <span>{t(`${K}.app.parameters`)}</span>
        </Box>
        {STRATEGY_ROWS.map(([name, params]) => (
          <Box
            key={name}
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 3fr',
              gap: 2,
              px: 2,
              height: 38,
              alignItems: 'center',
              borderTop: `1px solid ${APP.divider}`,
              fontSize: 13,
              fontWeight: 600,
              color: APP.text,
            }}
          >
            <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Box>
            <Box sx={{ display: 'flex', gap: 0.75, overflow: 'hidden' }}>
              {params.map((p) => (
                <Box
                  key={p}
                  sx={{
                    height: 20,
                    px: 0.875,
                    borderRadius: '8px',
                    background: APP.well,
                    boxShadow: APP.shadow.well,
                    fontSize: 11,
                    fontWeight: 600,
                    color: APP.success,
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: APP.mono,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
});
StrategiesPage.displayName = 'StrategiesPage';

// ---------------------------------------------------------------------------
// Launcher pill and composer
// ---------------------------------------------------------------------------

/** The resting launcher: white pill, gradient contour, mark and name. */
export const Pill = memo(({ hover }: { hover: boolean }) => {
  const { t } = useTranslation('home');
  return (
    <Box
      data-demo="pill"
      sx={{
        position: 'relative',
        width: 146,
        height: 46,
        borderRadius: '999px',
        background: APP.paper,
        boxShadow: APP.shadow.float,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        fontSize: 13.6,
        fontWeight: 600,
        color: APP.text,
        transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hover ? 'translateY(-4px) scale(1.08)' : 'none',
        '&::after': gradientRingSx('999px'),
      }}
    >
      <FintelligentMark size={17} color={APP.navy} />
      {t(`${K}.app.launcher`)}
    </Box>
  );
});
Pill.displayName = 'Pill';

const GhostIcon = ({ children }: { children: ReactNode }) => (
  <Box sx={{ width: 32, height: 32, borderRadius: '10px', color: APP.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    {children}
  </Box>
);

export type SendState = 'disabled' | 'ready' | 'stop';

/** The composer bar: ghost actions, the sunken input, the dock toggle, send. */
export const Composer = memo(
  ({ text, focused, typing, send, compact }: { text: string; focused: boolean; typing: boolean; send: SendState; compact: boolean }) => {
    const { t } = useTranslation('home');
    return (
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          borderRadius: '22px',
          background: APP.paper,
          boxShadow: APP.shadow.float,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          px: 1,
          '&::after': gradientRingSx('22px'),
        }}
      >
        <GhostIcon>
          <HistoryGlyph />
        </GhostIcon>
        {!compact && (
          <>
            <GhostIcon>
              <ClipGlyph />
            </GhostIcon>
            <GhostIcon>
              <SlidersGlyph />
            </GhostIcon>
          </>
        )}
        <Box
          data-demo="input"
          sx={{
            flex: 1,
            minWidth: 0,
            height: 36,
            mx: 0.5,
            borderRadius: '18px',
            background: APP.well,
            boxShadow: APP.shadow.well,
            display: 'flex',
            alignItems: 'center',
            px: 1.75,
            fontSize: 14.4,
            color: text ? APP.text : APP.textDisabled,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', direction: text ? 'rtl' : 'ltr', unicodeBidi: 'plaintext' }}>
            {text || t(`${K}.app.placeholder`)}
          </Box>
          {focused && (
            <Box
              component="span"
              sx={{
                width: '1.5px',
                height: 17,
                ml: text ? '1px' : 0,
                order: text ? 0 : -1,
                background: APP.navy,
                flexShrink: 0,
                animation: typing ? 'none' : 'fdBlink 1s steps(1) infinite',
              }}
            />
          )}
        </Box>
        {!compact && (
          <GhostIcon>
            <PanelGlyph />
          </GhostIcon>
        )}
        <Box
          data-demo="send"
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: send === 'disabled' ? APP.textDisabled : '#fff',
            background: send === 'stop' ? APP.error : send === 'ready' ? APP.navy : APP.well,
            transition: 'background 0.18s ease',
          }}
          title={send === 'stop' ? t(`${K}.app.stop`) : undefined}
        >
          {send === 'stop' ? <StopGlyph /> : <SendGlyph />}
        </Box>
      </Box>
    );
  },
);
Composer.displayName = 'Composer';

// ---------------------------------------------------------------------------
// Transcript
// ---------------------------------------------------------------------------

export const BetaNotice = memo(() => {
  const { t } = useTranslation('home');
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mx: 1,
        mb: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: '10px',
        border: `1px solid ${APP.info}55`,
        color: APP.textSecondary,
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      <InfoOutlinedIcon sx={{ fontSize: 18, color: APP.info }} />
      <Box
        component="span"
        sx={{ height: 20, px: 0.75, borderRadius: '6px', background: APP.info, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        {t(`${K}.app.beta`)}
      </Box>
      {t(`${K}.app.betaMessage`)}
    </Box>
  );
});
BetaNotice.displayName = 'BetaNotice';

export const UserRow = memo(({ children }: { children: ReactNode }) => (
  <FadeIn sx={{ display: 'flex', gap: 1.5, px: 2, py: 1.25 }}>
    <Avatar user />
    <Box sx={{ pt: '4px', fontSize: 15, lineHeight: 1.55, color: APP.text, minWidth: 0 }}>{children}</Box>
  </FadeIn>
));
UserRow.displayName = 'UserRow';

export const AnsweredChip = ({ choice }: { choice: string }) => {
  const { t } = useTranslation('home');
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        minHeight: 26,
        px: 1.25,
        borderRadius: '8px',
        background: APP.paper,
        boxShadow: APP.shadow.raisedXs,
        fontSize: 13,
        fontWeight: 600,
        color: APP.text,
      }}
    >
      <CheckCircleOutlineIcon sx={{ fontSize: 16, color: APP.success }} />
      {t(`${K}.app.question.answered`, { choice })}
    </Box>
  );
};

const AssistantShell = ({ children }: { children: ReactNode }) => (
  <FadeIn sx={{ display: 'flex', gap: 1.5, px: 2, py: 1.5, my: 0.5, borderRadius: '8px', background: APP.hover }}>
    <Avatar user={false} />
    <Box sx={{ minWidth: 0, flex: 1, pt: '3px', fontSize: 15, lineHeight: 1.55, color: APP.text }}>{children}</Box>
  </FadeIn>
);

/** The live bubble: a spinner and "Thinking…", then only the latest narration burst. */
export const LiveRow = memo(({ narrationKey }: { narrationKey: string | undefined }) => {
  const { t } = useTranslation('home');
  return (
    <AssistantShell>
      {narrationKey ? (
        <Box key={narrationKey} sx={{ animation: 'fdFade 0.25s ease both', color: APP.textSecondary }}>
          {t(`${K}.script.${narrationKey}`)}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: APP.textSecondary, fontSize: 14 }}>
          <Spinner />
          {t(`${K}.app.thinking`)}
        </Box>
      )}
    </AssistantShell>
  );
});
LiveRow.displayName = 'LiveRow';

const linkSx = { color: APP.navy, fontWeight: 600, textDecoration: 'none' } as const;

/** A settled answer: the tool chips, then the Markdown. */
export const SettledRow = memo(
  ({ chips, children }: { chips: ReadonlyArray<readonly [string, number]>; children: ReactNode }) => (
    <AssistantShell>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.25 }}>
        {chips.map(([label, count]) => (
          <ToolChip key={label} label={label} count={count} />
        ))}
      </Box>
      {children}
    </AssistantShell>
  ),
);
SettledRow.displayName = 'SettledRow';

export const RichText = ({ i18nKey, linkTarget }: { i18nKey: string; linkTarget?: string }) => {
  const { t } = useTranslation('home');
  return (
    <Box component="p" sx={{ m: 0, mb: 1 }}>
      <Trans
        t={t}
        i18nKey={`${K}.script.${i18nKey}`}
        components={{ 1: <Box component="span" data-demo={linkTarget} sx={linkSx} /> }}
      />
    </Box>
  );
};

const TABLE_ROWS = ['dataSources', 'entryRules', 'entryAllocation', 'exitRules'] as const;

/** The agent's four-row strategy summary, as the app renders a GFM table. */
export const StrategyTable = memo(() => {
  const { t } = useTranslation('home');
  const cell = { px: 1.25, py: 0.75, border: `1px solid ${APP.divider}`, fontSize: 13, lineHeight: 1.4, textAlign: 'left' } as const;
  return (
    <Box component="table" sx={{ borderCollapse: 'collapse', mb: 1.25, width: '100%' }}>
      <thead>
        <tr>
          <Box component="th" sx={{ ...cell, background: APP.hover, fontWeight: 600 }}>
            {t(`${K}.script.table.head.part`)}
          </Box>
          <Box component="th" sx={{ ...cell, background: APP.hover, fontWeight: 600 }}>
            {t(`${K}.script.table.head.rule`)}
          </Box>
        </tr>
      </thead>
      <tbody>
        {TABLE_ROWS.map((row) => (
          <tr key={row}>
            <Box component="td" sx={{ ...cell, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {t(`${K}.script.table.${row}.label`)}
            </Box>
            <Box component="td" sx={{ ...cell, color: APP.textSecondary }}>
              {t(`${K}.script.table.${row}.value`)}
            </Box>
          </tr>
        ))}
      </tbody>
    </Box>
  );
});
StrategyTable.displayName = 'StrategyTable';

// ---------------------------------------------------------------------------
// Question card
// ---------------------------------------------------------------------------

export interface Option {
  label: string;
  detail?: string;
}

const OptionRow = ({ option, selected, target }: { option: Option; selected: boolean; target: string }) => (
  <Box
    data-demo={target}
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1,
      px: 1,
      py: 0.75,
      borderRadius: '8px',
      background: selected ? APP.selected : 'transparent',
      transition: 'background 0.18s ease',
    }}
  >
    {selected ? (
      <RadioButtonCheckedIcon sx={{ fontSize: 19, color: APP.navy, mt: '1px' }} />
    ) : (
      <RadioButtonUncheckedIcon sx={{ fontSize: 19, color: APP.textDisabled, mt: '1px' }} />
    )}
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ fontSize: 13.5, fontWeight: 650, color: APP.text }}>{option.label}</Box>
      {option.detail && <Box sx={{ fontSize: 12.5, color: APP.textSecondary, lineHeight: 1.4 }}>{option.detail}</Box>}
    </Box>
  </Box>
);

export type Question =
  | { kind: 'radio'; tab?: string; text: string; options: Option[]; selected: number | null; prefix: string }
  | { kind: 'select'; tab?: string; text: string; value: number | null; open: boolean; highlight: number | null };

/** The sampler dropdown, open: the app's Menu popover over the field. */
const SamplerMenu = ({ highlight }: { highlight: number | null }) => {
  const { t, i18n } = useTranslation('home');
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 42,
        zIndex: 5,
        py: 0.75,
        borderRadius: '14px',
        background: APP.paper,
        boxShadow: APP.shadow.float,
        animation: 'fdMenu 0.16s ease-out both',
        transformOrigin: 'top center',
      }}
    >
      {SAMPLERS.map((s, i) => (
        <Box
          key={s.label}
          data-demo={`menu-${i}`}
          sx={{
            px: 1.75,
            py: 0.75,
            background: highlight === i ? APP.hover : 'transparent',
          }}
        >
          <Box sx={{ fontSize: 13.5, fontWeight: 600, color: APP.text }}>{s.label}</Box>
          {s.budget !== null && (
            <Box sx={{ fontSize: 11.5, color: APP.textSecondary }}>
              {t(`${K}.app.budgetHint`, { n: groupDigits(s.budget, i18n.language) })}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

const QuestionBody = ({ q }: { q: Question }) => {
  const { t, i18n } = useTranslation('home');
  if (q.kind === 'radio') {
    return (
      <Box>
        {q.text && <Box sx={{ fontSize: 14, fontWeight: 650, color: APP.text, mb: 0.75 }}>{q.text}</Box>}
        {q.options.map((option, i) => (
          <OptionRow key={option.label} option={option} selected={q.selected === i} target={`opt-${q.prefix}-${i}`} />
        ))}
        <OptionRow option={{ label: t(`${K}.app.question.other`) }} selected={false} target={`opt-${q.prefix}-other`} />
      </Box>
    );
  }
  const value = q.value === null ? null : SAMPLERS[q.value];
  return (
    <Box>
      <Box sx={{ fontSize: 14, fontWeight: 650, color: APP.text, mb: 1 }}>{q.text}</Box>
      <Box sx={{ position: 'relative' }}>
        <Box
          data-demo="select"
          sx={{
            height: 38,
            borderRadius: '10px',
            background: APP.well,
            boxShadow: q.open ? `${APP.shadow.well}, 0 0 0 2px ${APP.navyLight}` : APP.shadow.well,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            fontSize: 13.5,
            fontWeight: 600,
            color: APP.text,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value?.label ?? ''}</Box>
          <ArrowDropDownIcon sx={{ color: APP.textSecondary, transform: q.open ? 'rotate(180deg)' : 'none' }} />
        </Box>
        <Box sx={{ minHeight: 20, mt: 0.5, px: 0.5, fontSize: 12, color: APP.textSecondary }}>
          {value?.budget != null && t(`${K}.app.budgetHint`, { n: groupDigits(value.budget, i18n.language) })}
        </Box>
        {q.open && <SamplerMenu highlight={q.highlight} />}
        {/* The popover floats over this room, so the transcript scrolls it into view. */}
        {q.open && <Box aria-hidden sx={{ height: 236 }} />}
      </Box>
    </Box>
  );
};

/**
 * AgentQuestionCard: gold 3px rule, the QuestionAnswer icon and title, a tab
 * per question (radio → green check once answered), the active question,
 * then "n of N answered", Skip and Answer.
 */
export const QuestionCard = memo(
  ({
    title,
    context,
    spend,
    questions,
    active,
    answered,
    pressed,
  }: {
    title: string;
    context?: string;
    spend?: string;
    questions: Question[];
    active: number;
    answered: boolean[];
    pressed: boolean;
  }) => {
    const { t } = useTranslation('home');
    const done = answered.filter(Boolean).length;
    return (
      <FadeIn
        sx={{
          mx: 1,
          my: 2,
          p: 2,
          borderRadius: '10px',
          border: `1px solid ${APP.warning}66`,
          borderLeft: `3px solid ${APP.warning}`,
          background: APP.hover,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: context || spend ? 0.5 : 1.25 }}>
          <QuestionAnswerIcon sx={{ fontSize: 18, color: APP.warning }} />
          <Box sx={{ fontSize: 14.5, fontWeight: 700, color: APP.text }}>{title}</Box>
        </Box>
        {context && <Box sx={{ fontSize: 12.5, color: APP.textSecondary, mb: 0.5 }}>{context}</Box>}
        {spend && <Box sx={{ fontSize: 12.5, fontWeight: 600, color: APP.warning, mb: 1.25 }}>{spend}</Box>}
        {questions.length > 1 && (
          <Box sx={{ display: 'inline-flex', gap: '3px', p: '3px', mb: 1.5, borderRadius: '10px', background: APP.well, boxShadow: APP.shadow.well }}>
            {questions.map((q, i) => (
              <Box
                key={q.tab}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.625,
                  height: 26,
                  px: 1.25,
                  borderRadius: '8px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: i === active ? APP.navy : APP.textSecondary,
                  background: i === active ? APP.paper : 'transparent',
                  boxShadow: i === active ? APP.shadow.raisedXs : 'none',
                  transition: 'background 0.18s ease, color 0.18s ease',
                }}
              >
                {answered[i] ? (
                  <CheckCircleIcon sx={{ fontSize: 14, color: APP.success }} />
                ) : (
                  <RadioButtonUncheckedIcon sx={{ fontSize: 14 }} />
                )}
                {q.tab}
              </Box>
            ))}
          </Box>
        )}
        <QuestionBody q={questions[active]} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
          <Box sx={{ fontSize: 12, color: APP.textSecondary }}>
            {t(`${K}.app.question.progress`, { answered: done, total: questions.length })}
          </Box>
          <Box sx={{ ml: 'auto', fontSize: 13, fontWeight: 600, color: APP.textSecondary, px: 1.25 }}>{t(`${K}.app.question.skip`)}</Box>
          <Box
            data-demo="answer"
            sx={{
              height: 32,
              px: 2,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: done === questions.length ? APP.navy : APP.textDisabled,
              background: APP.paper,
              boxShadow: pressed ? APP.shadow.well : APP.shadow.raisedXs,
              transition: 'box-shadow 0.12s ease, color 0.18s ease',
            }}
          >
            {t(`${K}.app.question.answer`)}
          </Box>
        </Box>
      </FadeIn>
    );
  },
);
QuestionCard.displayName = 'QuestionCard';

// ---------------------------------------------------------------------------
// Status line and Thinking panel
// ---------------------------------------------------------------------------

export const StatusLine = memo(({ status, clock }: { status: StatusKey | undefined; clock: string | null }) => {
  const { t } = useTranslation('home');
  if (!status) return <Box sx={{ height: 34 }} />;
  const waiting = status === 'waiting';
  const finished = status === 'finished';
  return (
    <Box sx={{ height: 34, display: 'flex', alignItems: 'center', gap: 1, px: 2.5, fontSize: 12, color: waiting ? APP.warning : APP.textSecondary, fontWeight: waiting ? 600 : 500 }}>
      {waiting ? (
        <QuestionAnswerIcon sx={{ fontSize: 15 }} />
      ) : finished ? (
        <CheckCircleOutlineIcon sx={{ fontSize: 15, color: APP.textDisabled }} />
      ) : (
        <Spinner />
      )}
      <Box key={status} component="span" sx={{ animation: 'fdFade 0.25s ease both' }}>
        {t(`${K}.app.status.${status}`)}
      </Box>
      {clock && <Box sx={{ ml: 'auto', fontFamily: APP.mono, fontSize: 11, color: APP.textDisabled }}>{clock}</Box>}
    </Box>
  );
});
StatusLine.displayName = 'StatusLine';

export type FeedItem =
  | { kind: 'tool'; id: string; label: string; done: boolean; took: string }
  | { kind: 'thought'; id: string; text: string };

export const ThinkingPanel = memo(
  ({ items, running, summary }: { items: FeedItem[]; running: boolean; summary: string | null }) => {
    const { t } = useTranslation('home');
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${APP.divider}`, background: APP.ground }}>
        <Box sx={{ height: 44, display: 'flex', alignItems: 'center', gap: 1, px: 2, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            {APP.dots.map((c, i) => (
              <Box
                key={c}
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: c,
                  animation: running ? `fdHop 1.2s ease-in-out ${i * 0.15}s infinite` : 'none',
                  opacity: running ? undefined : 0.45,
                }}
              />
            ))}
          </Box>
          <Box
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: APP.text,
              ...(running && {
                backgroundImage: `linear-gradient(90deg, ${APP.text} 40%, ${APP.navyLight} 50%, ${APP.text} 60%)`,
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                animation: 'fdSheen 2.4s linear infinite',
              }),
            }}
          >
            {running ? t(`${K}.app.thinking`) : t(`${K}.app.thinkingTitle`)}
          </Box>
          <Box sx={{ ml: 'auto', color: APP.textDisabled }}>
            <CloseGlyph />
          </Box>
        </Box>
        <Box sx={{ height: 2, position: 'relative', overflow: 'hidden', background: APP.hover, flexShrink: 0 }}>
          {running && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '40%',
                backgroundImage: APP.brand,
                borderRadius: 1,
                animation: 'fdSweep 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              }}
            />
          )}
        </Box>
        <AutoScroll sx={{ flex: 1, px: 1.5, pt: 1 }}>
          {items.map((item) =>
            item.kind === 'tool' ? (
              <FadeIn key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 0.5 }}>
                {item.done ? <CheckCircleIcon sx={{ fontSize: 16, color: APP.success }} /> : <Spinner size={14} />}
                <Box sx={{ fontSize: 13, fontWeight: 500, color: APP.text, minWidth: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </Box>
                {item.done && <Box sx={{ fontSize: 11, color: APP.textDisabled, whiteSpace: 'nowrap' }}>{item.took}</Box>}
              </FadeIn>
            ) : (
              <FadeIn
                key={item.id}
                sx={{ my: 0.75, ml: 0.5, pl: 1.25, borderLeft: `2px solid ${APP.navyLight}`, fontSize: 13, lineHeight: 1.45, color: APP.textSecondary }}
              >
                {item.text}
              </FadeIn>
            ),
          )}
          {summary && (
            <FadeIn sx={{ mt: 1, pt: 1, borderTop: `1px solid ${APP.divider}`, fontSize: 11.5, color: APP.textDisabled, px: 0.5, pb: 1 }}>
              {summary}
            </FadeIn>
          )}
        </AutoScroll>
      </Box>
    );
  },
);
ThinkingPanel.displayName = 'ThinkingPanel';

// ---------------------------------------------------------------------------
// Study page
// ---------------------------------------------------------------------------

export interface StudyProgress {
  trials: number;
  best: number;
  pct: number;
  elapsed: string;
  left: string;
  stage: number;
  /** Best-so-far and raw scores, one per sampled trial shown. */
  curve: readonly number[];
  raw: readonly number[];
}

const STAGES = ['queued', 'provisioning', 'dataLoading', 'preflight', 'optimize', 'robustness'] as const;

export const StudyBadge = () => {
  const { t } = useTranslation('home');
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        height: 22,
        px: 1,
        borderRadius: '6px',
        background: `${APP.warning}1f`,
        color: APP.warning,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: APP.warning, animation: 'fdPulse 1.4s ease-in-out infinite' }} />
      {t(`${K}.app.study.running`)}
    </Box>
  );
};

export const Tile = ({ label, value, sub, style }: { label: string; value: string; sub?: string; style?: CSSProperties }) => (
  <Box
    style={style}
    sx={{ borderRadius: '14px', background: APP.paper, boxShadow: `${APP.shadow.raisedSm}, 0 22px 30px -18px rgba(11,26,51,0.35)`, p: '12px 14px', minWidth: 0 }}
  >
    <Box sx={{ fontSize: 11.5, fontWeight: 600, color: APP.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</Box>
    <Box sx={{ fontSize: 22, fontWeight: 800, color: APP.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>{value}</Box>
    {sub && <Box sx={{ fontSize: 11, color: APP.textDisabled }}>{sub}</Box>}
  </Box>
);

export const PipelineStrip = ({ stage, elapsed, left, style }: { stage: number; elapsed: string; left: string; style?: CSSProperties }) => {
  const { t } = useTranslation('home');
  return (
    <Box
      style={style}
      sx={{ borderRadius: '14px', background: APP.paper, boxShadow: APP.shadow.raisedSm, px: 2, height: 42, display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}
    >
      {STAGES.map((s, i) => (
        <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 12, fontWeight: i === stage ? 700 : 500, color: i <= stage ? APP.text : APP.textDisabled, whiteSpace: 'nowrap' }}>
          {i < stage ? <CheckCircleIcon sx={{ fontSize: 14, color: APP.success }} /> : i === stage ? <Spinner size={12} color={APP.warning} /> : <RadioButtonUncheckedIcon sx={{ fontSize: 14 }} />}
          {t(`${K}.app.study.stages.${s}`)}
        </Box>
      ))}
      <Box sx={{ ml: 'auto', fontSize: 12, color: APP.textSecondary, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {/* The app's elapsed label is an untranslated default, English in every locale. */}
        {`Elapsed: ${elapsed} · ${left}`}
      </Box>
    </Box>
  );
};

/** Optimization Evolution: raw trial scores as dots, best-so-far as a line. */
export const EvolutionChart = ({ raw, curve, style }: { raw: readonly number[]; curve: readonly number[]; style?: CSSProperties }) => {
  const { t } = useTranslation('home');
  const w = 560;
  const h = 150;
  const n = 120;
  const lo = 0;
  const hi = 2.1;
  const x = (i: number) => (i / (n - 1)) * w;
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  return (
    <Box style={style} sx={{ borderRadius: '14px', background: APP.paper, boxShadow: `${APP.shadow.raisedSm}, 0 26px 36px -20px rgba(11,26,51,0.35)`, p: '12px 16px' }}>
      <Box sx={{ fontSize: 13, fontWeight: 700, color: APP.text, mb: 1 }}>
        {t(`${K}.app.study.evolution`, { stage: t(`${K}.app.study.stages.optimize`) })}
      </Box>
      <svg viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
        {[0.5, 1, 1.5, 2].map((v) => (
          <line key={v} x1={0} x2={w} y1={y(v)} y2={y(v)} stroke={APP.divider} strokeWidth={1} />
        ))}
        {raw.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={2.2} fill={APP.navyLight} opacity={0.35} />
        ))}
        {curve.length > 1 && (
          <polyline
            points={curve.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={APP.navy}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
        {curve.length > 0 && <circle cx={x(curve.length - 1)} cy={y(curve[curve.length - 1])} r={4} fill="#EFC03C" stroke="#fff" strokeWidth={1.5} />}
      </svg>
    </Box>
  );
};
