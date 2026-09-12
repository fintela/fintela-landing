import { Box, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { BandHeader } from '../primitives/BandHeader';
import { NeuButton } from '../primitives/NeuButton';
import { BentoGrid, BentoTile } from '../primitives/BentoGrid';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { soft } from '../../theme/tokens';
import { useBlogIndex } from '../../blog/useBlog';
import { BlogEmptyState } from '../../blog/BlogEmptyState';
import { CompactPostCard, FeaturedPostCard, PostCountCard, TextPostCard } from '../../blog/BentoCards';
import type { BlogPostSummary } from '../../blog/types';

/** The featured slot goes to a pinned post if there is one, else the newest. */
const pickFeatured = (posts: BlogPostSummary[]): BlogPostSummary[] => {
  const pinned = posts.find((p) => p.featured);
  if (!pinned) return posts;
  return [pinned, ...posts.filter((p) => p !== pinned)];
};

/**
 * Band 6. The blog on the home page as a bento: the newest (or pinned) post
 * in a 2×2 plate with its cover, two compact rows beside it, two text tiles
 * under it, and a counter that is also the way to /blog. Degrades by count:
 * one post spans the row; up to three fill the first two rows; the counter
 * takes whatever cell is left.
 */
export const InsightsSection = () => {
  const { t } = useTranslation('home');
  const { status, posts } = useBlogIndex();
  const ordered = pickFeatured(posts);
  const [featured, ...rest] = ordered;
  const compact = rest.slice(0, 2);
  const text = rest.slice(2, 4);
  const newest = posts.reduce((max, p) => (p.date > max ? p.date : max), posts[0]?.date ?? '');
  // The counter fills whatever the last row has left.
  const counterCol = text.length === 0 ? '1 / 4' : text.length === 1 ? 'span 2' : 'auto';

  return (
    <Section id="insights" size="lg">
      <BandHeader
        eyebrow={t('insights.eyebrow')}
        title={t('insights.title')}
        titleAccent={t('insights.titleAccent')}
        exit={
          <NeuButton tone="raised" to="/blog" endIcon={<ArrowForwardIcon />}>
            {t('insights.exit')}
          </NeuButton>
        }
      />

      {status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} sx={{ color: soft.accent }} />
        </Box>
      )}

      {status !== 'loading' && posts.length === 0 && <BlogEmptyState status={status} />}

      {featured && (
        <BentoGrid columns={{ xs: 1, md: 3 }}>
          <BentoTile col={{ md: compact.length ? '1 / 3' : '1 / 4' }} row={{ md: compact.length ? '1 / 3' : 'auto' }}>
            <AnimateOnScroll direction="left" stretch>
              <FeaturedPostCard post={featured} />
            </AnimateOnScroll>
          </BentoTile>
          {compact.map((post, idx) => (
            <BentoTile key={post.slug}>
              <AnimateOnScroll delay={100 + idx * 80} direction="right" stretch>
                <CompactPostCard post={post} />
              </AnimateOnScroll>
            </BentoTile>
          ))}
          {text.map((post, idx) => (
            <BentoTile key={post.slug}>
              <AnimateOnScroll delay={200 + idx * 80} stretch>
                <TextPostCard post={post} />
              </AnimateOnScroll>
            </BentoTile>
          ))}
          {posts.length > 1 && (
            <BentoTile col={{ md: counterCol }}>
              <AnimateOnScroll delay={360} stretch>
                <PostCountCard count={posts.length} newest={newest} />
              </AnimateOnScroll>
            </BentoTile>
          )}
        </BentoGrid>
      )}
    </Section>
  );
};
