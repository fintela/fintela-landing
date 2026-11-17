import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { HERO_MEASURE, SectionHeader } from '../components/primitives/SectionHeader';
import { NeuButton } from '../components/primitives/NeuButton';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { LeadPost, PostCard, PostCardSkeleton } from '../blog/PostCard';
import { BlogEmptyState } from '../blog/BlogEmptyState';
import { useBlogIndex } from '../blog/useBlog';
import { DEFAULT_SECTION, SECTION_OG_IMAGE, sectionPath } from '../blog/sections';
import type { PostSection, PostSectionProps } from '../blog/sections';
import { srOnly } from '../theme/neu';
import { soft } from '../theme/tokens';
import type { BlogPostSummary } from '../blog/types';
import { Seo } from '../seo/Seo';
import { breadcrumbList, homeCrumb, organization, sectionCrumb, webPage, webSite } from '../seo/jsonld';
import { absoluteUrl } from '../seo/site';

/** Each section index's Schema.org page type. */
const SECTION_PAGE_TYPE: Record<PostSection, string> = { blog: 'Blog', research: 'CollectionPage' };

/** How many cards the grid shows at first, and how many more each "See more" adds: three full rows. */
const PAGE_SIZE = 9;

/** The grid: three columns of the home page's card, the same gaps as its bands. */
const gridSx = {
  listStyle: 'none',
  m: 0,
  p: 0,
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
  columnGap: { sm: 4, lg: 5 },
  rowGap: { xs: 5, md: 7 },
} as const;

/**
 * Every post after the lead, a page at a time. "See more" adds the next page
 * and moves focus to the first card it revealed, so a keyboard or screen
 * reader user lands on the new posts instead of on a button that may be gone.
 */
const PostGrid = ({ posts, heading }: { posts: BlogPostSummary[]; heading: string }) => {
  const { t } = useTranslation('pages');
  const [shown, setShown] = useState(PAGE_SIZE);
  const firstRevealed = useRef<number | null>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (firstRevealed.current === null) return;
    linkRefs.current[firstRevealed.current]?.focus();
    firstRevealed.current = null;
  }, [shown]);

  const visible = posts.slice(0, shown);
  const remaining = posts.length - visible.length;

  return (
    <Box component="section" aria-labelledby="more-posts" sx={{ mt: { xs: 8, md: 12 } }}>
      <Typography
        id="more-posts"
        component="h2"
        sx={{ fontSize: { xs: '1.375rem', md: '1.625rem' }, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.25, color: soft.text, mb: { xs: 3, md: 4 } }}
      >
        {heading}
      </Typography>
      <Box component="ul" role="list" sx={gridSx}>
        {visible.map((post, i) => (
          <Box component="li" key={post.slug}>
            <AnimateOnScroll delay={(i % 3) * 60} stretch>
              <PostCard
                post={post}
                linkRef={(el) => {
                  linkRefs.current[i] = el;
                }}
              />
            </AnimateOnScroll>
          </Box>
        ))}
      </Box>
      {remaining > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 6, md: 8 } }}>
          <NeuButton
            tone="raised"
            startIcon={<AddIcon aria-hidden />}
            onClick={() => {
              firstRevealed.current = shown;
              setShown((n) => n + PAGE_SIZE);
            }}
          >
            {t('blog.seeMore')}
          </NeuButton>
        </Box>
      )}
    </Box>
  );
};

/**
 * `/blog` and `/research` — one section's posts (`section`, default `blog`):
 * general articles and company news, or research notes. Laid out like the
 * home page: a left-aligned heading on the plain ground, the newest post
 * across the page, then every other post as the home page's card, three to a
 * row, with "See more" once there are more than three rows.
 *
 * Posts are Markdown files in `landing/content/blog/`, published as static JSON
 * under `blog/` on the CDN by `blog-publish.yml` (see `BLOG.md`); `section:` in
 * a post's frontmatter decides which of the two pages lists it. Adding a post
 * is a sync of that one prefix, not a site deploy — which is why this page
 * fetches at runtime instead of reading posts bundled into the app.
 */
export const BlogPage = ({ section = DEFAULT_SECTION }: PostSectionProps) => {
  const { t } = useTranslation('pages');
  const index = useBlogIndex();
  const status = index.status;
  const posts = index.posts.filter((post) => post.section === section);
  const [lead, ...rest] = posts;
  const ogImage = SECTION_OG_IMAGE[section];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo
        title={t(`seo.${section}.title`)}
        description={t(`seo.${section}.description`)}
        image={ogImage}
        jsonLd={[
          organization(),
          webSite(),
          webPage({
            type: SECTION_PAGE_TYPE[section],
            name: t(`seo.${section}.title`),
            description: t(`seo.${section}.description`),
            url: absoluteUrl(sectionPath(section)),
            image: absoluteUrl(ogImage),
          }),
          breadcrumbList([homeCrumb(), { name: sectionCrumb(section).name }]),
        ]}
      />
      <Header />

      <Box component="main" id="content">
        <Section size="lg" sx={{ minHeight: '60vh' }}>
          <Box sx={{ maxWidth: HERO_MEASURE }}>
            <SectionHeader
              level="h1"
              hero={false}
              gutter={false}
              align="left"
              title={t(`${section}.hero.title`)}
              description={t(`${section}.hero.subtitle`)}
            />
          </Box>

          <Box sx={{ mt: { xs: 6, md: 9 } }}>
            {status === 'loading' && (
              <Box role="status">
                <Box sx={srOnly}>{t('blog.loading')}</Box>
                <Box component="ul" role="list" aria-hidden sx={gridSx}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <Box component="li" key={i}>
                      <PostCardSkeleton />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {status !== 'loading' && posts.length === 0 && <BlogEmptyState status={status} />}

            {lead && (
              <AnimateOnScroll>
                <LeadPost post={lead} />
              </AnimateOnScroll>
            )}

            {rest.length > 0 && <PostGrid posts={rest} heading={t(`${section}.index.more`)} />}
          </Box>
        </Section>
      </Box>

      <Footer />
    </Box>
  );
};
