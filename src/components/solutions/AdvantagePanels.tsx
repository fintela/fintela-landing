import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { Audience } from '../../lib/audience';
import { NeuPanel } from '../primitives/NeuPanel';
import { cellGrooveSx, eyebrowSx, quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';

/**
 * The "What changes" block on every solution page: three or four rows, the
 * buyer's pain on the left and the outcome on the right, from
 * `solutions:<audience>.why`. Each outcome links to the chapter that proves
 * it (`#chapter-<key>`) or, where no chapter does, to the docs page that
 * does, so the block doubles as the page's table of contents.
 *
 * The rows describe what the workspace does for that seat, never how much it
 * changes an outcome: no durations, counts, rates or comparatives. A trading
 * platform's marketing page cannot substantiate "days instead of weeks" for
 * every desk, so the copy stays at the level of the capability itself.
 */

interface ComparisonRow {
  without: string;
  with: string;
  /** `#chapter-<key>` on this page, or a site path. */
  to?: string;
}

const Outcome = ({ row }: { row: ComparisonRow }) => {
  const text = (
    <Typography component="span" sx={{ fontWeight: 600, fontSize: { xs: '0.98rem', md: '1.02rem' }, lineHeight: 1.45, color: 'inherit' }}>
      {row.with}
    </Typography>
  );
  if (!row.to) return <Box sx={{ color: soft.text }}>{text}</Box>;
  const inPage = row.to.startsWith('#');
  const Arrow = inPage ? ArrowDownwardIcon : ArrowForwardIcon;
  return (
    <Box
      {...(inPage ? { component: 'a' as const, href: row.to } : { component: RouterLink, to: row.to })}
      sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, color: soft.text }]}
    >
      {text}
      <Arrow aria-hidden sx={{ fontSize: 16, color: soft.textSecondary }} />
    </Box>
  );
};

export const ComparisonPanel = ({ audience }: { audience: Audience }) => {
  const { t } = useTranslation('solutions');
  const rows = t(`${audience}.why.rows`, { returnObjects: true }) as ComparisonRow[];
  const columnSx = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }, columnGap: 1 } as const;
  return (
    <NeuPanel sx={{ p: { xs: 1, md: 2 } }}>
      {/* Column labels: on a phone each row stacks, pain over outcome, and the labels would only float. */}
      <Box aria-hidden sx={{ ...columnSx, display: { xs: 'none', md: 'grid' } }}>
        <Box sx={{ ...eyebrowSx, px: 2.5, pt: 1.5, pb: 1.25 }}>{t(`${audience}.why.legacyHeader`)}</Box>
        <Box sx={{ ...eyebrowSx, px: 2.5, pt: 1.5, pb: 1.25, color: soft.text }}>{t(`${audience}.why.withHeader`)}</Box>
      </Box>
      <Box component="ul" role="list" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {rows.map((row, idx) => (
          <Box component="li" key={row.without} sx={[columnSx, idx > 0 ? cellGrooveSx : {}]}>
            <Typography sx={{ px: { xs: 1.75, md: 2.5 }, pt: { xs: 1.75, md: 2 }, pb: { xs: 0.5, md: 2 }, color: soft.textSecondary, fontSize: { xs: '0.88rem', md: '0.95rem' }, lineHeight: 1.55 }}>
              {row.without}
            </Typography>
            <Box
              sx={{
                px: { xs: 1.75, md: 2.5 },
                pt: { xs: 0, md: 2 },
                pb: { xs: 1.75, md: 2 },
                display: 'flex',
                alignItems: 'center',
                borderRadius: '10px',
                bgcolor: { md: 'rgba(18, 20, 26, 0.03)' },
              }}
            >
              <Outcome row={row} />
            </Box>
          </Box>
        ))}
      </Box>
    </NeuPanel>
  );
};
