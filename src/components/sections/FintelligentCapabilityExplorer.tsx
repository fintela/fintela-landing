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

/**
 * The grid: 5×2 on wide screens, 2×5 on tablets, one column on phones. Ten
 * tiles fill those with no hole in the last row, which 3 or 4 columns can't.
 * Every tile owns two grid rows, its own and a detail row under it that stays
 * zero-height until opened, so an open detail spans the band and pushes the
 * next row down without changing the size of any tile. Placement is CSS, so
 * the prerendered page already has the right layout before it hydrates.
 */
const perLayout = <T,>(place: (columns: number) => T) => ({ xs: place(1), sm: place(2), lg: place(5) });
const tileRow = (i: number, columns: number) => 2 * Math.floor(i / columns) + 1;

/** Half the column gap: two of these, around a zero-height detail row, make one even gutter. */
const HALF_GAP = { xs: 1, md: 1.5 };

const OPEN_MS = 280;

/**
 * Keeps a tile where it is on screen for a moment, scrolling to absorb a
 * detail collapsing above it, so a click never sends its own target away.
 * Instant because the page's global smooth scrolling would lag every step.
 */
const holdOnScreen = (el: HTMLElement, ms: number) => {
  const top = el.getBoundingClientRect().top;
  const end = performance.now() + ms;
  const step = () => {
    if (!el.isConnected) return;
    window.scrollBy({ top: el.getBoundingClientRect().top - top, behavior: 'instant' });
    if (performance.now() < end) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

/**
 * One capability as a disclosure: the tile (number, icon, title) is the
 * button, and the description and its points open in the detail row below.
 * Tile and detail are siblings in the DOM, so the reading and tab order stay
 * 01, 02, 03… while the grid places the detail under the whole row. The body
 * stays in the DOM while closed (crawlers still find it) but hidden from the
 * accessibility tree and the tab order.
 */
const Capability = ({
  index,
  itemKey,
  icon,
  open,
  otherOpen,
  onToggle,
}: {
  index: number;
  itemKey: (typeof ITEMS)[number]['key'];
  icon: ReactNode;
  open: boolean;
  /** Another tile's detail is open, so closing this one is a hand-over. */
  otherOpen: boolean;
  onToggle: (tile: HTMLElement) => void;
}) => {
  const { t } = useTranslation('home');
  const detailId = useId();
  const base = `fintelAgent.fullCapabilities.items.${itemKey}`;
  const bullets = t(`${base}.bullets`, { returnObjects: true }) as string[];

  return (
    <>
      <Box
        sx={{
          gridColumn: perLayout((columns) => (index % columns) + 1),
          gridRow: perLayout((columns) => tileRow(index, columns)),
          aspectRatio: { lg: '1 / 1' },
        }}
      >
        <AnimateOnScroll delay={(index % 5) * 60} stretch>
          <NeuPanel
            sx={{
              display: 'flex',
              transition: `transform ${motion.base}, outline-color ${motion.fast}`,
              outline: '2px solid transparent',
              outlineOffset: '-2px',
              ...(open
                ? { outlineColor: soft.accent }
                : { '@media (hover: hover)': { '&:hover': { transform: 'translateY(-3px)' } } }),
            }}
          >
            <Typography component="h3" sx={{ m: 0, font: 'inherit', flex: 1, minWidth: 0, display: 'flex', borderRadius: 'inherit' }}>
              <Box
                component="button"
                type="button"
                aria-expanded={open}
                aria-controls={detailId}
                onClick={(event) => onToggle(event.currentTarget)}
                sx={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  p: { xs: 2.25, md: 2.5 },
                  borderRadius: 'inherit',
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
                  sx={{ display: 'block', fontWeight: 700, fontSize: { xs: '1rem', md: '1.05rem', lg: '1rem' }, lineHeight: 1.35, color: soft.text, textWrap: 'balance' }}
                >
                  {t(`${base}.title`)}
                </Box>
              </Box>
            </Typography>
          </NeuPanel>
        </AnimateOnScroll>
      </Box>

      {/* 0fr → 1fr animates to the body's own height without measuring it. The
          clip sits inside the panel so it can't cut the panel's shadow, and the
          fade hides that shadow while closed. Visibility flips after the close
          finishes, so a closed body can't be read, and is there at once when
          it opens. Details of one row share a cell, so on a hand-over the old
          one fades at once but keeps its height until the new one has grown:
          shrinking together would dip the row and bounce everything below. */}
      <NeuPanel
        id={detailId}
        sx={{
          gridColumn: '1 / -1',
          gridRow: perLayout((columns) => tileRow(index, columns) + 1),
          alignSelf: 'start',
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          my: open ? HALF_GAP : 0,
          // The panel's transparent border would hold a closed row 2px open.
          borderWidth: open ? '1px' : 0,
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transition: [
            `grid-template-rows ${OPEN_MS}ms ease ${otherOpen ? OPEN_MS : 0}ms`,
            `margin ${OPEN_MS}ms ease ${otherOpen ? OPEN_MS : 0}ms`,
            `opacity ${OPEN_MS}ms ease`,
            `visibility 0s linear ${open ? 0 : OPEN_MS}ms`,
          ].join(', '),
        }}
      >
        <Box sx={{ overflow: 'hidden', minHeight: 0 }}>
          <Box
            sx={{
              p: { xs: 2.25, md: 3 },
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 2fr)' },
              gap: { xs: 2, lg: 4 },
            }}
          >
            <Typography sx={{ color: soft.textSecondary, fontSize: '0.92rem', lineHeight: 1.6 }}>
              {t(`${base}.desc`)}
            </Typography>
            <Box
              component="ul"
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
                gap: { xs: 1.1, md: '12px 24px' },
              }}
            >
              {bullets.map((b) => (
                <Box component="li" key={b} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <CheckRoundedIcon sx={{ fontSize: 16, color: soft.accent, mt: '3px', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.86rem', lineHeight: 1.55, color: soft.text }}>{b}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </NeuPanel>
    </>
  );
};

/**
 * The full capability surface for the Agentic AI page: ten equal tiles in a
 * straight grid, each opening a detail row below to show what it covers.
 * Deliberately not a Section of its own; it lives inside FintelligentSection,
 * right below the agentic demo it backs up with the complete list.
 */
export const FintelligentCapabilityExplorer = () => {
  const { t } = useTranslation('home');
  // All closed to start: the grid reads as a whole before anything is opened.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number, tile: HTMLElement) => {
    // The hand-over runs twice OPEN_MS: the new detail grows, then the old one closes.
    if (openIndex !== null && openIndex !== i) holdOnScreen(tile, 2 * OPEN_MS + 100);
    setOpenIndex(openIndex === i ? null : i);
  };

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

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: perLayout((columns) => `repeat(${columns}, minmax(0, 1fr))`),
          // In an auto-height grid every 1fr track takes the height of the
          // tallest one, so all tile rows match whatever the titles' lengths.
          gridTemplateRows: perLayout((columns) => `repeat(${Math.ceil(ITEMS.length / columns)}, 1fr auto)`),
          columnGap: { xs: 2, md: 3 },
          rowGap: HALF_GAP,
        }}
      >
        {ITEMS.map((item, i) => (
          <Capability
            key={item.key}
            index={i}
            itemKey={item.key}
            icon={item.icon}
            open={openIndex === i}
            otherOpen={openIndex !== null && openIndex !== i}
            onToggle={(tile) => toggle(i, tile)}
          />
        ))}
      </Box>
    </Box>
  );
};
