import { useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { BentoGrid, BentoTile } from '../components/primitives/BentoGrid';
import { BlogCard } from '../blog/BlogCard';
import { BlogEmptyState } from '../blog/BlogEmptyState';
import { CompactPostCard, FeaturedPostCard, TextPostCard, VerticalPostCard } from '../blog/BentoCards';
import { layoutPuzzle, type PuzzleShape } from '../blog/puzzleLayout';
import { useBlogIndex } from '../blog/useBlog';
import { neuGrid } from '../theme/neu';
import { soft } from '../theme/tokens';
import type { BlogPostSummary } from '../blog/types';

const SHAPE_VARIANT: Record<PuzzleShape, typeof CompactPostCard> = {
  tall: VerticalPostCard,
  standard: TextPostCard,
  wide: CompactPostCard,
};

/**
 * Two alternative grids, not a fallback chain: exactly one is ever in the
 * accessibility tree (`display: none` removes it, unlike `visibility`),
 * switched by breakpoint in CSS rather than `useMediaQuery` — consistent with
 * how every other responsive span in this codebase is done. The puzzle's
 * explicit column/row placement assumes the 3-column desktop grid, so tablet
 * and below get the plain stacked grid instead of trying to reflow it.
 */
const BlogPuzzleGrid = ({ posts }: { posts: BlogPostSummary[] }) => {
  const [hero, second, ...bandPosts] = posts;
  const layout = layoutPuzzle(posts.length);

  return (
    <>
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <BentoGrid columns={3}>
          <BentoTile col={layout.heroCol} row={layout.heroRow}>
            <FeaturedPostCard post={hero} />
          </BentoTile>
          {layout.companion && second && (
            <BentoTile col={layout.companion.col} row={layout.companion.row}>
              <VerticalPostCard post={second} />
            </BentoTile>
          )}
          {layout.bandTiles.map((tile, i) => {
            const post = bandPosts[i];
            const Variant = SHAPE_VARIANT[tile.shape];
            return (
              <BentoTile key={post.slug} col={tile.col} row={tile.row}>
                <Variant post={post} />
              </BentoTile>
            );
          })}
        </BentoGrid>
      </Box>

      <Box
        sx={{
          display: { xs: 'grid', lg: 'none' },
          gridTemplateColumns: { xs: '1fr', md: neuGrid.columns(2) },
          gap: neuGrid.gap,
          alignItems: 'stretch',
        }}
      >
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </Box>
    </>
  );
};

/**
 * `/blog` — the card grid.
 *
 * Posts are Markdown files in `landing/content/blog/`, published as static JSON
 * under `blog/` on the CDN by `blog-publish.yml` (see `BLOG.md`). Adding a
 * post is a sync of that one prefix, not a site deploy — which is why this page
 * fetches at runtime instead of reading posts bundled into the app.
 */
export const BlogPage = () => {
  const { t } = useTranslation('pages');
  const [activeSection, setActiveSection] = useState('blog');
  const { status, posts } = useBlogIndex();

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    if (section === 'home') {
      window.location.href = '/';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header activeSection={activeSection} onNavigate={scrollToSection} />

      {/* Hero */}
      <Section tone="hero" size="sm" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 4, md: 8 } }}>
        <SectionHeader
          level="h2"
          hero
          title={t('blog.hero.title')}
          description={t('blog.hero.subtitle')}
        />
      </Section>

      {/* Grid */}
      <Section size="md" maxWidth="xl" sx={{ pt: { xs: 2, md: 3 }, minHeight: '40vh' }}>
        {status === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={28} sx={{ color: soft.accent }} />
          </Box>
        )}

        {status !== 'loading' && posts.length === 0 && <BlogEmptyState status={status} />}

        {posts.length > 0 && <BlogPuzzleGrid posts={posts} />}
      </Section>

      <Footer />
    </Box>
  );
};
