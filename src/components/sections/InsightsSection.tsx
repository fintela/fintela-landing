import { Box, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { useBlogIndex } from '../../blog/useBlog';
import { BlogEmptyState } from '../../blog/BlogEmptyState';
import { PostCard } from '../../blog/PostCard';
import type { BlogPostSummary } from '../../blog/types';

/**
 * The research the home page shows, by slug and in this order. Chosen, not
 * "newest first": the page is where the method is argued, so company news and
 * award posts stay on /blog.
 */
const HOME_RESEARCH = ['deflated-sharpe', 'momentum-research', 'climate-analysis'] as const;
const SHOWN = HOME_RESEARCH.length;

const isResearch = (post: BlogPostSummary) =>
  post.section === 'research' || post.tags.some((tag) => tag.toLowerCase() === 'research');

/** The chosen posts that are published; if one is missing, the newest other research post stands in. */
const pickResearch = (posts: BlogPostSummary[]): BlogPostSummary[] => {
  const chosen = HOME_RESEARCH.map((slug) => posts.find((p) => p.slug === slug)).filter(
    (p): p is BlogPostSummary => p !== undefined,
  );
  const standIns = posts.filter((p) => !chosen.includes(p) && isResearch(p));
  return [...chosen, ...standIns].slice(0, SHOWN);
};

/** Section 6, first part: three research pieces, as the same ruled cards as /blog and /research. */
export const InsightsSection = () => {
  const { t } = useTranslation('home');
  const { status, posts } = useBlogIndex();
  const research = pickResearch(posts);

  return (
    <Section id="research" size="lg">
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: { xs: 4, md: 6 } }}>
        <SectionHeader align="left" gutter={false} title={t('research.title')} />
        <Box
          component={RouterLink}
          to="/research"
          sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.92rem', fontWeight: 600, color: soft.linkAccent, pb: 0.5 }]}
        >
          {t('research.link')}
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </Box>
      </Box>

      {status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} sx={{ color: soft.textSecondary }} />
        </Box>
      )}

      {status !== 'loading' && research.length === 0 && <BlogEmptyState status={status} />}

      {research.length > 0 && (
        <Box
          component="ul"
          role="list"
          sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${SHOWN}, minmax(0, 1fr))` }, columnGap: { md: 5 }, rowGap: 5 }}
        >
          {research.map((post, idx) => (
            <Box component="li" key={post.slug}>
              <AnimateOnScroll delay={idx * 70} stretch>
                <PostCard post={post} />
              </AnimateOnScroll>
            </Box>
          ))}
        </Box>
      )}
    </Section>
  );
};
