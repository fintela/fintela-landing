import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import { Section } from '../primitives/Section';
import { NeuPanel } from '../primitives/NeuPanel';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { eyebrowSx, quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { AUDIENCES } from '../../lib/audience';
import type { Audience } from '../../lib/audience';
import { SOLUTION_PATHS, SOLUTIONS } from '../../solutions/registry';

/**
 * The strip above a solution page's closing band: the two sibling seats, and
 * the one research post that backs this seat's pitch. Each landing page used
 * to reach the others only through the footer, and the blog only through the
 * home page; this is the in-content path both ways.
 *
 * Labels, not headings, so the page's outline stays the one the band
 * headers draw (h2 Why → Chapters → Onboarding → FAQ → Closing).
 */
export const SeatCrossLinks = ({ audience }: { audience: Audience }) => {
  const { t } = useTranslation(['solutions', 'header']);
  const siblings = AUDIENCES.filter((a) => a !== audience);
  const research = SOLUTIONS[audience].research;

  return (
    <Section size="sm" sx={{ pt: 0, pb: { xs: 2, md: 4 } }}>
      <AnimateOnScroll>
        <NeuPanel
          variant="tile"
          sx={{
            p: { xs: 2.5, md: 3 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
            gap: { xs: 3, md: 4 },
            alignItems: 'start',
          }}
        >
          <Box component="nav" aria-label={t('solutions:common.alsoFor.label')}>
            <Typography component="p" sx={{ ...eyebrowSx, mb: 1.5 }}>
              {t('solutions:common.alsoFor.label')}
            </Typography>
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: { xs: 2, md: 3 } }}>
              {siblings.map((a) => (
                <li key={a}>
                  <Box
                    component={RouterLink}
                    to={SOLUTION_PATHS[a]}
                    sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.95rem', fontWeight: 700, color: soft.text }]}
                  >
                    {t(`header:solutions.${a}`)}
                    <ArrowForwardIcon sx={{ fontSize: 16, color: soft.accent }} />
                  </Box>
                </li>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography component="p" sx={{ ...eyebrowSx, mb: 1.5 }}>
              {t('solutions:common.research.label')}
            </Typography>
            <Box
              component={RouterLink}
              to={`/blog/${research}`}
              sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'flex-start', gap: 1, fontSize: '0.95rem', fontWeight: 700, color: soft.text, lineHeight: 1.4 }]}
            >
              <ArticleOutlinedIcon sx={{ fontSize: 18, color: soft.accent, mt: '2px', flexShrink: 0 }} />
              {t(`solutions:${audience}.research.label`)}
            </Box>
          </Box>
        </NeuPanel>
      </AnimateOnScroll>
    </Section>
  );
};
