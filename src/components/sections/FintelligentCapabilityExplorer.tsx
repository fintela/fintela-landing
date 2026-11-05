import { Box, Typography } from '@mui/material';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CodeIcon from '@mui/icons-material/Code';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import { NeuPanel } from '../primitives/NeuPanel';
import { IconWell } from '../primitives/IconWell';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { fonts, motion, soft } from '../../theme/tokens';
import { useMediaMatch } from '../../lib/useMediaMatch';

/**
 * The ten things Fintelligent does, from `fintelAgent.fullCapabilities.items.*`
 * in i18n. Order matches the source doc: build → think → analyze → research →
 * report → operate → teach → persist → guard → suggest.
 */
const ITEMS = [
  { key: 'strategyBuilder', icon: <CodeIcon /> },
  { key: 'researchMindset', icon: <PsychologyAltOutlinedIcon /> },
  { key: 'evidenceAnalysis', icon: <QueryStatsIcon /> },
  { key: 'marketResearch', icon: <PublicOutlinedIcon /> },
  { key: 'pdfReports', icon: <DescriptionOutlinedIcon /> },
  { key: 'platformOperator', icon: <TouchAppOutlinedIcon /> },
  { key: 'teaches', icon: <SchoolOutlinedIcon /> },
  { key: 'backgroundWork', icon: <CloudSyncOutlinedIcon /> },
  { key: 'safety', icon: <VerifiedUserOutlinedIcon /> },
  { key: 'oneClickIdeas', icon: <TipsAndUpdatesOutlinedIcon /> },
] as const;

const FACT_KEYS = ['where', 'history', 'language', 'suggestions', 'cost', 'who'] as const;

/**
 * The scatter. Cards run down columns in number order (01–04, 05–07, 08–10
 * on wide screens), so the DOM, the tab order and the numbers all agree.
 * Each column starts at its own depth, and each card sits at its own inset
 * inside its column, so no edge lines up with its neighbour's. A card that
 * opens only pushes down the cards under it in the same column.
 */
const WIDE = '(min-width: 1200px)';
const MEDIUM = '(min-width: 900px)';
const LAYOUTS = {
  wide: { columns: [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9]], offsets: [0, 96, 44] },
  medium: { columns: [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], offsets: [0, 56] },
  narrow: { columns: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]], offsets: [0] },
} as const;
/** Left and right inset of each card, in % of its column. */
const INSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 10], [8, 0], [3, 7], [12, 0], [0, 4], [6, 0], [0, 12], [10, 2], [2, 9], [0, 0],
];
/** On a phone there is one column, so the cards zig-zag instead. */
const zigzag = (i: number): readonly [number, number] => (i % 2 ? [7, 0] : [0, 7]);

const OPEN_MS = 280;

/**
 * One capability as a disclosure: the header (number, icon, title) is the
 * button, and the description and its points open below it, in place. The
 * body stays in the DOM while closed (crawlers and in-page search still find
 * it) but hidden from the accessibility tree and the tab order.
 */
const CapabilityCard = ({
  index,
  itemKey,
  icon,
  open,
  onToggle,
}: {
  index: number;
  itemKey: (typeof ITEMS)[number]['key'];
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
}) => {
  const { t } = useTranslation('home');
  const bodyId = useId();
  const base = `fintelAgent.fullCapabilities.items.${itemKey}`;
  const bullets = t(`${base}.bullets`, { returnObjects: true }) as string[];

  return (
    <NeuPanel
      sx={{
        overflow: 'hidden',
        transition: `transform ${motion.base}, outline-color ${motion.fast}`,
        outline: '2px solid transparent',
        outlineOffset: '-2px',
        ...(open
          ? { outlineColor: soft.accent }
          : { '@media (hover: hover)': { '&:hover': { transform: 'translateY(-3px)' } } }),
      }}
    >
      <Typography component="h3" sx={{ m: 0, font: 'inherit' }}>
        <Box
          component="button"
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          sx={{
            all: 'unset',
            boxSizing: 'border-box',
            width: '100%',
            display: 'block',
            cursor: 'pointer',
            p: { xs: 2.25, md: 2.5 },
            borderRadius: 'inherit',
            // Inset: the panel clips its overflow, so an outer ring would be cut off.
            '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: '-4px' },
            '@media (forced-colors: active)': { '&:focus-visible': { outline: '3px solid Highlight' } },
            '@media (hover: hover)': { '&:hover .cap-toggle': { color: soft.accent } },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.75 }}>
            <IconWell size={36}>{icon}</IconWell>
            <Box
              component="span"
              aria-hidden
              sx={{ fontFamily: fonts.mono, fontSize: '0.72rem', fontWeight: 700, color: soft.textSecondary, letterSpacing: '0.04em' }}
            >
              {String(index + 1).padStart(2, '0')}
            </Box>
            <Box
              className="cap-toggle"
              aria-hidden
              sx={{
                ml: 'auto',
                display: 'flex',
                color: open ? soft.accent : soft.textSecondary,
                transition: `transform ${OPEN_MS}ms ease, color ${motion.fast}`,
                transform: open ? 'rotate(45deg)' : 'none',
                '& svg': { fontSize: 22 },
              }}
            >
              <AddRoundedIcon />
            </Box>
          </Box>
          <Box
            component="span"
            sx={{ display: 'block', fontWeight: 700, fontSize: { xs: '1rem', md: '1.05rem' }, lineHeight: 1.35, color: soft.text, textWrap: 'balance' }}
          >
            {t(`${base}.title`)}
          </Box>
        </Box>
      </Typography>

      {/* 0fr → 1fr animates to the body's own height without measuring it.
          Visibility flips after the close finishes, so a closed body can't
          be tabbed into or read, and is there at once when it opens. */}
      <Box
        id={bodyId}
        sx={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          visibility: open ? 'visible' : 'hidden',
          transition: `grid-template-rows ${OPEN_MS}ms ease, visibility 0s linear ${open ? '0s' : `${OPEN_MS}ms`}`,
        }}
      >
        <Box sx={{ overflow: 'hidden', minHeight: 0 }}>
          <Box sx={{ px: { xs: 2.25, md: 2.5 }, pb: { xs: 2.5, md: 3 } }}>
            <Typography sx={{ color: soft.textSecondary, fontSize: '0.92rem', lineHeight: 1.6, mb: 2 }}>
              {t(`${base}.desc`)}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.1 }}>
              {bullets.map((b) => (
                <Box component="li" key={b} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <CheckRoundedIcon sx={{ fontSize: 16, color: soft.accent, mt: '3px', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.86rem', lineHeight: 1.55, color: soft.text }}>{b}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </NeuPanel>
  );
};

/**
 * The full capability surface for the Agentic AI page: ten cards scattered
 * across the band in uneven columns, each opening downward in place to show
 * what it covers, and a fact strip underneath for the practical "how it's
 * used" questions. Deliberately not a Section of its own; it lives inside
 * FintelligentSection, right below the agentic demo it backs up with the
 * complete list.
 */
export const FintelligentCapabilityExplorer = () => {
  const { t } = useTranslation('home');
  // All closed to start: one open card would stretch its column well past
  // the others before the visitor has asked for anything.
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());
  const wide = useMediaMatch(WIDE);
  const medium = useMediaMatch(MEDIUM);
  const layout = LAYOUTS[wide ? 'wide' : medium ? 'medium' : 'narrow'];

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <Box>
      <AnimateOnScroll>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.85rem' }, color: soft.text, mb: 1, letterSpacing: '-0.01em' }}>
          {t('fintelAgent.fullCapabilities.heading')}
        </Typography>
        <Typography sx={{ color: soft.textSecondary, fontSize: '0.98rem', lineHeight: 1.6, maxWidth: 680, mb: { xs: 3, md: 4 } }}>
          {t('fintelAgent.fullCapabilities.subheading')}
        </Typography>
      </AnimateOnScroll>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 2, md: 3 } }}>
        {layout.columns.map((column, c) => (
          <Box
            key={c}
            sx={{ flex: '1 1 0', minWidth: 0, pt: `${layout.offsets[c]}px`, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}
          >
            {column.map((i, row) => {
              const [ml, mr] = layout.columns.length === 1 ? zigzag(i) : INSETS[i];
              return (
                <AnimateOnScroll key={ITEMS[i].key} delay={c * 90 + row * 60}>
                  <Box sx={{ ml: `${ml}%`, mr: `${mr}%` }}>
                    <CapabilityCard
                      index={i}
                      itemKey={ITEMS[i].key}
                      icon={ITEMS[i].icon}
                      open={open.has(i)}
                      onToggle={() => toggle(i)}
                    />
                  </Box>
                </AnimateOnScroll>
              );
            })}
          </Box>
        ))}
      </Box>

      <AnimateOnScroll delay={140} stretch>
        <NeuPanel
          variant="tile"
          sx={{
            mt: { xs: 4, md: 6 },
            p: { xs: 2.5, md: 3 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {FACT_KEYS.map((key) => (
            <Box key={key}>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: soft.textSecondary, mb: 0.6 }}>
                {t(`fintelAgent.fullCapabilities.usage.facts.${key}.label`)}
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.55, color: soft.text }}>
                {t(`fintelAgent.fullCapabilities.usage.facts.${key}.value`)}
              </Typography>
            </Box>
          ))}
        </NeuPanel>
      </AnimateOnScroll>
    </Box>
  );
};
