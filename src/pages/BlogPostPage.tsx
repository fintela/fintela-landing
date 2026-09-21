import { Box, Typography } from '@mui/material';
import { ArrowBack, ArrowForward, CalendarToday, PersonOutline, SearchOff } from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { IconWell } from '../components/primitives/IconWell';
import { TierBadge } from '../components/primitives/TierBadge';
import { Groove } from '../components/primitives/Groove';
import { ArticleSkeleton } from '../components/common/ArticleSkeleton';
import { MarkdownContent } from '../blog/MarkdownContent';
import { TextPostCard } from '../blog/BentoCards';
import { formatContentDate } from '../content/format';
import { useBlogIndex, useBlogPost } from '../blog/useBlog';
import { blogAssetUrl, blogPostImageUrl } from '../blog/api';
import type { BlogPost, BlogPostSummary } from '../blog/types';
import { neuGrid, noMotionPress, quietLinkSx } from '../theme/neu';
import { gradients, motion, soft } from '../theme/tokens';
import { Seo } from '../seo/Seo';
import { pageTitle, truncateDescription } from '../seo/text';
import { blogCrumb, blogPosting, breadcrumbList, homeCrumb, organization, webSite } from '../seo/jsonld';
import { absoluteUrl } from '../seo/site';

const BLOG_OG_IMAGE = '/og/blog.png';
const TITLE_SUFFIX = 'Research Blog';

/** How many related posts sit under an article. */
const MAX_RELATED = 3;

/**
 * The posts that share a tag with `post`, most shared tags first and newest
 * first within a tie (the index is already newest-first, and the sort is
 * stable), never the post itself.
 */
const relatedPosts = (post: BlogPost, posts: BlogPostSummary[]): BlogPostSummary[] => {
  const tags = new Set(post.tags);
  return posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, shared: p.tags.filter((tag) => tags.has(tag)).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, MAX_RELATED)
    .map(({ p }) => p);
};

/** The neighbours by date: the index is newest-first, so `newer` sits before `post`. */
const neighbours = (post: BlogPost, posts: BlogPostSummary[]) => {
  const at = posts.findIndex((p) => p.slug === post.slug);
  if (at === -1) return { newer: undefined, older: undefined };
  return { newer: posts[at - 1], older: posts[at + 1] };
};

/**
 * The post's head: title, excerpt, cover and dates as Open Graph `article:*`
 * tags plus a BlogPosting node. The social image is the generator's 1200×630
 * crop when there is one, else the cover, else the blog's default card; the
 * BlogPosting lists the crop and the full cover so Google can pick an aspect.
 */
const PostSeo = ({ post }: { post: BlogPost }) => {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const social = blogPostImageUrl(post);
  const cover = post.cover ? absoluteUrl(blogAssetUrl(post.cover)) : undefined;
  const images = [...new Set([social, cover].filter((u): u is string => !!u))];
  return (
    <Seo
      title={pageTitle(post.title, TITLE_SUFFIX)}
      description={truncateDescription(post.excerpt)}
      type="article"
      image={social ? { url: social, alt: post.coverAlt } : BLOG_OG_IMAGE}
      article={{
        publishedTime: post.date,
        modifiedTime: post.updated ?? post.date,
        author: post.author,
        section: post.tags[0],
        tags: post.tags,
      }}
      jsonLd={[
        organization(),
        webSite(),
        blogPosting(post, url, images.length ? images : absoluteUrl(BLOG_OG_IMAGE)),
        breadcrumbList([homeCrumb(), blogCrumb(), { name: post.title }]),
      ]}
    />
  );
};

/**
 * `/blog/:slug` — one post, rendered from the Markdown body in its `blog/<slug>.json`.
 *
 * A slug that isn't in the published set renders the not-found state rather than a
 * blank page: posts get renamed or unpublished, and links to them stay in the wild.
 */
export const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation('pages');
  const { status, post } = useBlogPost(slug);
  // The post index feeds the related posts and the prev/next pair. It is
  // seeded alongside the post on a prerendered page and memoized after the
  // first fetch, so the block below either renders on the first pass or, on a
  // cold client-side navigation, once the index arrives — never a mismatch,
  // because `ready` is the only state that renders anything.
  const index = useBlogIndex();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* The head follows the fetch: the post's own metadata once it is in hand,
          a noindex "not found" head for a dead slug, the blog's generic head
          while loading (only ever seen on a client-side navigation — the
          prerendered HTML already carries the post). */}
      {status === 'ready' && post && <PostSeo post={post} />}
      {(status === 'notFound' || status === 'error') && (
        <Seo
          noindex
          title={pageTitle(
            t(status === 'notFound' ? 'blog.notFound.title' : 'blog.error.title'),
            TITLE_SUFFIX,
          )}
          description={t(status === 'notFound' ? 'blog.notFound.body' : 'blog.error.body')}
          image={BLOG_OG_IMAGE}
        />
      )}
      {status === 'loading' && (
        <Seo title={t('seo.blog.title')} description={t('seo.blog.description')} image={BLOG_OG_IMAGE} />
      )}
      <Header />

      <Box component="main" id="content">
        {/* No hero fade: the reading panel below must sit on flat ground. */}
        <Section size="md" maxWidth="md" sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 5, md: 9 } }}>
          <BackToBlog label={t('blog.backToBlog')} />

          {/* The loader reserves the article's height, so the footer never sits
              in the first viewport and jumps a screen down when the body lands.
              Only ever seen on a client-side navigation: the prerendered HTML
              already carries the post. */}
          {status === 'loading' && (
            <NeuPanel component="article" sx={{ p: { xs: 3, md: 6 } }}>
              <ArticleSkeleton label={t('blog.loadingPost')} withTags />
            </NeuPanel>
          )}

          {(status === 'notFound' || status === 'error') && (
            <Box sx={{ textAlign: 'center', py: { xs: 8, md: 12 } }}>
              <IconWell size={72} sx={{ mx: 'auto', mb: 3 }}>
                <SearchOff />
              </IconWell>
              {/* h4 for the size; h1 because it is the only title this state has. */}
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1.5, color: soft.text }}>
                {status === 'notFound' ? t('blog.notFound.title') : t('blog.error.title')}
              </Typography>
              <Typography
                sx={{ color: soft.textSecondary, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}
              >
                {status === 'notFound' ? t('blog.notFound.body') : t('blog.error.body')}
              </Typography>
            </Box>
          )}

          {status === 'ready' && post && (
            <NeuPanel component="article" sx={{ p: { xs: 3, md: 6 } }}>
              {/* Metadata header */}
              <Box sx={{ mb: 4 }}>
                {post.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                    {post.tags.map((tag) => (
                      <TierBadge key={tag}>{tag}</TierBadge>
                    ))}
                  </Box>
                )}

                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 2.5,
                    color: soft.text,
                    fontSize: { xs: '1.9rem', sm: '2.4rem', md: '3rem' },
                    textWrap: 'balance',
                  }}
                >
                  {post.title}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: { xs: 1.5, sm: 2.5 },
                    color: soft.textSecondary,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <PersonOutline sx={{ fontSize: '1.05rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {post.author}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CalendarToday sx={{ fontSize: '0.95rem' }} />
                    <Typography variant="body2">
                      {formatContentDate(post.date, i18n.language)}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {t('blog.readTime', { minutes: post.readingMinutes })}
                  </Typography>
                </Box>
              </Box>

              <Box
                aria-hidden
                sx={{ width: 36, height: 3, borderRadius: '2px', background: gradients.gold, mb: 3 }}
              />

              <MarkdownContent markdown={post.markdown} imageSizes={post.images} />
            </NeuPanel>
          )}

          {/* Outside <article>: site navigation is not part of the post content. */}
          {status === 'ready' && post && (
            <>
              {index.status === 'ready' && <PostFooterNav post={post} posts={index.posts} />}
              <Groove sx={{ mt: 6, mb: 4 }} />
              <BackToBlog label={t('blog.backToBlog')} />
            </>
          )}
        </Section>
      </Box>

      <Footer />
    </Box>
  );
};

/**
 * What follows the article: up to three posts that share a tag, then the
 * older/newer neighbours by date. Rendered only once the index is in hand, so
 * the server and the first client render agree (see `useBlogIndex` above).
 */
const PostFooterNav = ({ post, posts }: { post: BlogPost; posts: BlogPostSummary[] }) => {
  const { t } = useTranslation('pages');
  const related = relatedPosts(post, posts);
  const { newer, older } = neighbours(post, posts);
  if (related.length === 0 && !newer && !older) return null;

  return (
    <>
      {related.length > 0 && (
        <Box component="section" aria-labelledby="related-posts" sx={{ mt: 6 }}>
          <Typography
            id="related-posts"
            component="h2"
            sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, letterSpacing: '-0.02em', color: soft.text, mb: 3 }}
          >
            {t('blog.related.title')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: neuGrid.columns(Math.min(related.length, 3)) },
              gap: neuGrid.gap,
              alignItems: 'stretch',
            }}
          >
            {related.map((p) => (
              <TextPostCard key={p.slug} post={p} titleAs="h3" />
            ))}
          </Box>
        </Box>
      )}

      {(newer || older) && (
        <Box
          component="nav"
          aria-label={t('blog.postNav.label')}
          sx={{
            mt: 5,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(0, 1fr)' },
            gap: 2,
          }}
        >
          {older ? <NeighbourLink post={older} direction="older" /> : <span />}
          {newer && <NeighbourLink post={newer} direction="newer" />}
        </Box>
      )}
    </>
  );
};

/** One neighbour: the direction as an eyebrow, the post's title as the link text. */
const NeighbourLink = ({ post, direction }: { post: BlogPostSummary; direction: 'older' | 'newer' }) => {
  const { t } = useTranslation('pages');
  const forward = direction === 'newer';
  return (
    <NeuPanel
      variant="tile"
      to={`/blog/${post.slug}`}
      sx={{
        p: { xs: 2, md: 2.5 },
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        alignItems: forward ? 'flex-end' : 'flex-start',
        textAlign: forward ? 'right' : 'left',
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: soft.textSecondary,
        }}
      >
        {!forward && <ArrowBack sx={{ fontSize: 14 }} />}
        {t(`blog.postNav.${direction}`)}
        {forward && <ArrowForward sx={{ fontSize: 14 }} />}
      </Box>
      <Typography component="span" sx={{ fontWeight: 700, lineHeight: 1.35, color: soft.text }}>
        {post.title}
      </Typography>
    </NeuPanel>
  );
};

const BackToBlog = ({ label }: { label: string }) => (
  <Box
    component={RouterLink}
    to="/blog"
    sx={[
      quietLinkSx,
      {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        mb: 4,
        fontSize: '0.9rem',
        fontWeight: 600,
        transition: `color ${motion.fast}, transform ${motion.fast}`,
        '@media (hover: hover)': {
          '&:hover': { color: soft.accent, transform: 'translateX(-3px)' },
        },
        ...noMotionPress,
      },
    ]}
  >
    <ArrowBack sx={{ fontSize: '1.05rem' }} />
    {label}
  </Box>
);
