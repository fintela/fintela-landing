import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { BentoGrid, BentoTile } from '../components/primitives/BentoGrid';
import { BlogCard } from '../blog/BlogCard';
import { BlogCardSkeleton } from '../blog/BlogCardSkeleton';
import { BlogEmptyState } from '../blog/BlogEmptyState';
import { CompactPostCard, FeaturedPostCard, TextPostCard, VerticalPostCard } from '../blog/BentoCards';
import { layoutPuzzle, type PuzzleShape } from '../blog/puzzleLayout';
import { useBlogIndex } from '../blog/useBlog';
import { neuGrid, srOnly } from '../theme/neu';
import type { BlogPostSummary } from '../blog/types';
import { Seo } from '../seo/Seo';
import { breadcrumbList, homeCrumb, organization, webPage, webSite } from '../seo/jsonld';
import { absoluteUrl } from '../seo/site';

const BLOG_OG_IMAGE = '/og/blog.png';

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
 *
 * Both stay mounted on purpose. The page is prerendered and hydrated, and a
 * `useMediaQuery` switch would render one grid on the server and possibly the
 * other on the client — a hydration mismatch and a layout shift on first
 * paint. The cost is that every post title is in the DOM twice; both copies
 * are proper `<h2>`s under the page's `<h1>`, so the outline reads the same
 * whichever grid a viewport shows.
 */
const BlogPuzzleGrid = ({ posts }: { posts: BlogPostSummary[] }) => {
  const [hero, second, ...bandPosts] = posts;
  const layout = layoutPuzzle(posts.length);

  return (
    <>
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <BentoGrid columns={3}>
          <BentoTile col={layout.heroCol} row={layout.heroRow}>
            <FeaturedPostCard post={hero} titleAs="h2" />
          </BentoTile>
          {layout.companion && second && (
            <BentoTile col={layout.companion.col} row={layout.companion.row}>
              <VerticalPostCard post={second} titleAs="h2" />
            </BentoTile>
          )}
          {layout.bandTiles.map((tile, i) => {
            const post = bandPosts[i];
            const Variant = SHAPE_VARIANT[tile.shape];
            return (
              <BentoTile key={post.slug} col={tile.col} row={tile.row}>
                <Variant post={post} titleAs="h2" />
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
  const { status, posts } = useBlogIndex();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo
        title={t('seo.blog.title')}
        description={t('seo.blog.description')}
        image={BLOG_OG_IMAGE}
        jsonLd={[
          organization(),
          webSite(),
          webPage({
            type: 'Blog',
            name: t('seo.blog.title'),
            description: t('seo.blog.description'),
            url: absoluteUrl('/blog'),
            image: absoluteUrl(BLOG_OG_IMAGE),
          }),
          breadcrumbList([homeCrumb(), { name: 'Blog' }]),
        ]}
      />
      <Header />

      <Box component="main" id="content">
        {/* Hero */}
        <Section tone="hero" size="sm" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 4, md: 8 } }}>
          <SectionHeader
            level="h1"
            title={t('blog.hero.title')}
            description={t('blog.hero.subtitle')}
          />
        </Section>

        {/* Grid */}
        <Section size="md" maxWidth="xl" sx={{ pt: { xs: 2, md: 3 }, minHeight: '40vh' }}>
          {status === 'loading' && (
            <Box role="status">
              <Box sx={srOnly}>{t('blog.loading')}</Box>
              <Box
                aria-hidden="true"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: neuGrid.columns(2) },
                  gap: neuGrid.gap,
                }}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <BlogCardSkeleton key={i} />
                ))}
              </Box>
            </Box>
          )}

          {status !== 'loading' && posts.length === 0 && <BlogEmptyState status={status} />}

          {posts.length > 0 && <BlogPuzzleGrid posts={posts} />}
        </Section>
      </Box>

      <Footer />
    </Box>
  );
};
