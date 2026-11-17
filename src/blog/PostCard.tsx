import { Box, Skeleton, Typography } from '@mui/material';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { MediaWell } from '../components/primitives/MediaWell';
import { formatContentDate, truncate } from '../content/format';
import { eyebrowSx } from '../theme/neu';
import { motion, soft } from '../theme/tokens';
import { AuthorByline } from './AuthorByline';
import { blogAssetUrl } from './api';
import { postPath } from './sections';
import type { BlogPostSummary } from './types';

/**
 * The heading level of a card's title: `h3` under a section's `h2` (the home
 * page's research band, "More articles", "Related posts"), `h2` when the card
 * sits straight under the page's `h1` (the lead post).
 */
export type CardTitleLevel = 'h2' | 'h3';

/**
 * The home page's card, for posts: a one-pixel ink rule on top, a title, one
 * sentence, and a link with an arrow. No panel, no shadow, no per-post colour;
 * the whole card is the link, so the hit area is what the hover answers.
 * `.post-arrow` is the hook the hover slides.
 */
const cardLinkSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderTop: `1px solid ${soft.text}`,
  color: soft.text,
  textDecoration: 'none',
  '& .post-arrow': { transition: `transform ${motion.fast}` },
  '& .post-title': { transition: `color ${motion.fast}` },
  '@media (hover: hover)': {
    '&:hover .post-arrow': { transform: 'translateX(4px)' },
    '&:hover .post-title': { color: soft.linkAccent },
  },
  '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 4, borderRadius: '4px' },
  '@media (prefers-reduced-motion: reduce)': { '& .post-arrow': { transform: 'none !important' } },
} as const;

/** The lead tag on the left, the date and reading time on the right. */
const MetaRow = ({ post }: { post: BlogPostSummary }) => {
  const { t, i18n } = useTranslation('pages');
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, minHeight: 20 }}>
      <Typography component="span" sx={{ ...eyebrowSx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {post.tags[0] ?? ''}
      </Typography>
      <Typography component="span" sx={{ flexShrink: 0, fontSize: '0.8rem', color: soft.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
        {formatContentDate(post.date, i18n.language)}
        <Box component="span" aria-hidden sx={{ mx: 0.75 }}>
          ·
        </Box>
        {t('blog.readTime', { minutes: post.readingMinutes })}
      </Typography>
    </Box>
  );
};

/** "Read more", with the arrow that moves on hover. A span: the card around it is the link. */
const ReadMore = () => {
  const { t } = useTranslation('pages');
  return (
    <Box
      component="span"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.9rem', fontWeight: 600, color: soft.linkAccent }}
    >
      {t('blog.readMore')}
      <ArrowForwardIcon aria-hidden className="post-arrow" sx={{ fontSize: 16 }} />
    </Box>
  );
};

interface PostCardProps {
  post: BlogPostSummary;
  titleAs?: CardTitleLevel;
  /** Lets the index move focus to the first card a "See more" revealed. */
  linkRef?: Ref<HTMLAnchorElement>;
}

/** One post in a grid: meta, title, a short excerpt, the author, and the way in. */
export const PostCard = ({ post, titleAs = 'h3', linkRef }: PostCardProps) => (
  <Box component={RouterLink} to={postPath(post)} ref={linkRef} sx={[cardLinkSx, { pt: 2.5 }]}>
    <MetaRow post={post} />
    <Typography
      component={titleAs}
      className="post-title"
      sx={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, mt: 1.75, mb: 1 }}
    >
      {post.title}
    </Typography>
    <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: soft.textSecondary, mb: 2.5 }}>{truncate(post.excerpt, 140)}</Typography>
    <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
      <AuthorByline author={post.author} image={post.authorImage} size="xs" />
      <ReadMore />
    </Box>
  </Box>
);

/**
 * The newest post, across the page: the copy on the left at a larger size and
 * the cover beside it, as the home page sets the award band. A post without a
 * cover keeps the copy at a reading width and nothing beside it.
 */
export const LeadPost = ({ post }: { post: BlogPostSummary }) => {
  const hasCover = Boolean(post.cover);
  return (
    <Box
      component={RouterLink}
      to={postPath(post)}
      sx={[
        cardLinkSx,
        {
          pt: { xs: 3, md: 4 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: hasCover ? 'minmax(0, 5fr) minmax(0, 7fr)' : '1fr' },
          columnGap: { md: 6 },
          rowGap: 3,
          alignItems: 'center',
        },
      ]}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: 560, order: { xs: 2, md: 1 } }}>
        <MetaRow post={post} />
        <Typography
          component="h2"
          className="post-title"
          sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, mt: 2, mb: 1.5, textWrap: 'balance' }}
        >
          {post.title}
        </Typography>
        <Typography sx={{ fontSize: { xs: '1rem', md: '1.0625rem' }, lineHeight: 1.65, color: soft.textSecondary, mb: 3 }}>
          {truncate(post.excerpt, 220)}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2.5 }}>
          <AuthorByline author={post.author} image={post.authorImage} />
          <ReadMore />
        </Box>
      </Box>
      {post.cover && (
        <MediaWell
          ratio="16/9"
          tone="plain"
          src={blogAssetUrl(post.cover)}
          // The title beside it already names the link; the cover adds no words to it.
          alt=""
          priority
          sizes="(min-width: 1200px) 680px, (min-width: 900px) 56vw, calc(100vw - 32px)"
          sx={{ order: { xs: 1, md: 2 } }}
        />
      )}
    </Box>
  );
};

/** The card's outline while the index loads, so the grid does not reflow when posts land. */
export const PostCardSkeleton = () => (
  <Box aria-hidden sx={{ borderTop: `1px solid ${soft.groundSunken}`, pt: 2.5 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.75 }}>
      <Skeleton variant="text" width={70} sx={{ fontSize: '0.75rem' }} />
      <Skeleton variant="text" width={120} sx={{ fontSize: '0.75rem' }} />
    </Box>
    <Skeleton variant="text" sx={{ fontSize: '1.125rem', width: '90%' }} />
    <Skeleton variant="text" sx={{ fontSize: '1.125rem', width: '60%', mb: 1 }} />
    <Skeleton variant="text" sx={{ fontSize: '0.95rem', width: '100%' }} />
    <Skeleton variant="text" sx={{ fontSize: '0.95rem', width: '80%', mb: 2.5 }} />
    <Skeleton variant="text" width={110} sx={{ fontSize: '0.85rem', mb: 2 }} />
    <Skeleton variant="text" width={90} sx={{ fontSize: '0.9rem' }} />
  </Box>
);
