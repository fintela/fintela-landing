import { Box, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { TierBadge } from '../components/primitives/TierBadge';
import { MediaWell } from '../components/primitives/MediaWell';
import { formatContentDate, truncate } from '../content/format';
import { clippedGradientSx, noMotionPress } from '../theme/neu';
import { gradients, motion, soft } from '../theme/tokens';
import { accentFor } from './format';
import { blogAssetUrl } from './api';
import type { BlogPostSummary } from './types';

/**
 * The heading level of a card's title. The cards sit directly under the `/blog`
 * page's `<h1>` (so `h2`) and under the home page's Insights `<h2>` (so `h3`,
 * the default); the size is the card's own either way.
 */
export type CardTitleLevel = 'h2' | 'h3';

interface CardProps {
  post: BlogPostSummary;
  titleAs?: CardTitleLevel;
}

/**
 * The card's exit line. It rests a touch under full strength and settles to it
 * while the card is hovered, so the arrow acknowledges the pointer that the
 * panel's lift has already answered. `readMoreHoverSx` below is the other half
 * of the pair — every panel that renders a ReadMore must carry it — and the
 * `.read-more` hook is the one BlogCard.tsx already uses on /blog.
 */
const ReadMore = ({ label, accent }: { label: string; accent: string }) => (
  <Box
    className="read-more"
    sx={{
      mt: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 0.75,
      color: accent,
      fontWeight: 600,
      fontSize: '0.88rem',
      // 0.85, not BlogCard's 0.7: this line also renders white on the blurred
      // cover of a CompactPostCard, where a third off full strength is too
      // little contrast to read against a photograph.
      opacity: 0.85,
      transition: `opacity ${motion.fast}, transform ${motion.fast}`,
      // The global reduce rule (index.css) makes the slide instant, not
      // absent; only the pinned transform actually cancels it.
      ...noMotionPress,
    }}
  >
    {label}
    <ArrowForward sx={{ fontSize: 16 }} />
  </Box>
);

/**
 * Merged into the sx of every panel that wraps a ReadMore. Passed as an ARRAY
 * entry, never spread: NeuPanel's interactive recipe already carries a
 * `@media (hover: hover)` block for the panel's own lift, and two spreads of
 * that one key overwrite each other instead of merging (see theme/neu.ts).
 */
const readMoreHoverSx = {
  '@media (hover: hover)': {
    '&:hover .read-more': { opacity: 1, transform: 'translateX(4px)' },
  },
  '&:focus-visible .read-more': { opacity: 1 },
} as const;

const MetaRow = ({
  post,
  tag,
  tone = 'default',
}: {
  post: BlogPostSummary;
  tag?: string;
  /** 'onImage': white-on-dark, for a card whose full background is the cover. */
  tone?: 'default' | 'onImage';
}) => {
  const { t, i18n } = useTranslation(['pages', 'home']);
  const textColor = tone === 'onImage' ? 'rgba(255,255,255,0.85)' : soft.textSecondary;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, fontSize: '0.78rem', color: textColor }}>
      <span>{formatContentDate(post.date, i18n.language)}</span>
      <span aria-hidden>•</span>
      <span>{t('pages:blog.readTime', { minutes: post.readingMinutes })}</span>
      {tag && (
        <>
          <span aria-hidden>•</span>
          <Box component="span" sx={{ fontWeight: 600, color: tone === 'onImage' ? '#fff' : accentFor(post.slug) }}>
            {tag}
          </Box>
        </>
      )}
    </Box>
  );
};

/** The 2×2 slot: cover in a 16/9 well, then the card at a larger type size. */
export const FeaturedPostCard = ({ post, titleAs = 'h3' }: CardProps) => {
  const { t } = useTranslation('home');
  const accent = accentFor(post.slug);
  return (
    <NeuPanel
      to={`/blog/${post.slug}`}
      component="article"
      sx={[{ height: '100%', display: 'flex', flexDirection: 'column' }, readMoreHoverSx]}
    >
      {post.cover ? (
        <MediaWell
          ratio="16/9"
          flush
          src={blogAssetUrl(post.cover)}
          alt={post.coverAlt ?? t('insights.coverAlt', { title: post.title })}
          sizes="(min-width: 1200px) 720px, (min-width: 900px) 60vw, 90vw"
        />
      ) : (
        // No cover yet: a debossed strip carrying the lead tag in the display ramp.
        <MediaWell ratio="4/1" tone="plain" tier="md" flush sx={{ display: 'flex', alignItems: 'flex-end', p: 3 }}>
          <Typography
            sx={{
              position: 'relative',
              zIndex: 1,
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              ...clippedGradientSx(gradients.goldText),
            }}
          >
            {post.tags[0] ?? t('insights.eyebrow')}
          </Typography>
        </MediaWell>
      )}
      <Box sx={{ px: { xs: 3, md: 3.5 }, pt: 2.5, pb: { xs: 3, md: 3 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <MetaRow post={post} tag={post.tags[0]} />
        <Typography component={titleAs} sx={{ fontSize: { xs: '1.3rem', md: '1.5rem' }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, color: soft.text, mt: 1.25, mb: 1 }}>
          {post.title}
        </Typography>
        <Typography sx={{ color: soft.textSecondary, lineHeight: 1.65, fontSize: '0.95rem', maxWidth: 560, mb: 2.5 }}>
          {truncate(post.excerpt)}
        </Typography>
        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {post.tags.slice(0, 3).map((tag) => (
            <TierBadge key={tag}>{tag}</TierBadge>
          ))}
          <Box sx={{ ml: 'auto' }}>
            <ReadMore label={t('insights.read')} accent={accent} />
          </Box>
        </Box>
      </Box>
    </NeuPanel>
  );
};

/**
 * A portrait slot beside the hero. The cover crops to a square rather than a
 * taller ratio — covers are author-supplied at whatever aspect ratio their
 * source image came in (see BLOG.md), and a landscape cover cropped into a
 * true portrait frame loses too much of itself; square is the least
 * destructive middle ground. The excerpt earns its keep the same way: it fills
 * the column's extra height with typography instead of stretching the image.
 */
export const VerticalPostCard = ({ post, titleAs = 'h3' }: CardProps) => {
  const { t } = useTranslation('home');
  return (
    <NeuPanel
      to={`/blog/${post.slug}`}
      component="article"
      sx={[{ height: '100%', display: 'flex', flexDirection: 'column' }, readMoreHoverSx]}
    >
      {post.cover ? (
        <MediaWell
          ratio="1/1"
          flush
          src={blogAssetUrl(post.cover)}
          alt={post.coverAlt ?? t('insights.coverAlt', { title: post.title })}
          sizes="(min-width: 1200px) 320px, 90vw"
        />
      ) : (
        <MediaWell
          ratio="1/1"
          tone="plain"
          tier="md"
          flush
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            p: 2.5,
          }}
        >
          <Typography
            sx={{
              position: 'relative',
              zIndex: 1,
              fontSize: '1.1rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              ...clippedGradientSx(gradients.goldText),
            }}
          >
            {post.tags[0] ?? t('insights.eyebrow')}
          </Typography>
        </MediaWell>
      )}
      <Box sx={{ px: 2.5, pt: 2, pb: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <MetaRow post={post} tag={post.tags[0]} />
        <Typography
          component={titleAs}
          sx={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', color: soft.text, mt: 1, mb: 1 }}
        >
          {post.title}
        </Typography>
        <Typography sx={{ color: soft.textSecondary, fontSize: '0.88rem', lineHeight: 1.6, mb: 'auto' }}>
          {truncate(post.excerpt, 110)}
        </Typography>
        <ReadMore label={t('insights.read')} accent={accentFor(post.slug)} />
      </Box>
    </NeuPanel>
  );
};

/**
 * Beside the feature: meta, title, a line of excerpt. With a cover, the image
 * fills the whole card as a blurred, darkened background instead of sitting in
 * its own well — this tile is too small for a crisp thumbnail to read well
 * next to text, so it becomes texture instead, and every label switches to
 * white for contrast. Without a cover it stays the plain text tile.
 */
export const CompactPostCard = ({ post, titleAs = 'h3' }: CardProps) => {
  const { t } = useTranslation('home');
  const accent = accentFor(post.slug);

  if (!post.cover) {
    return (
      <NeuPanel
        to={`/blog/${post.slug}`}
        component="article"
        sx={[
          { height: '100%', p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', gap: 1 },
          readMoreHoverSx,
        ]}
      >
        <MetaRow post={post} tag={post.tags[0]} />
        <Typography component={titleAs} sx={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', color: soft.text }}>
          {post.title}
        </Typography>
        <Typography sx={{ color: soft.textSecondary, fontSize: '0.88rem', lineHeight: 1.6, mt: 0.5 }}>{truncate(post.excerpt, 120)}</Typography>
        <ReadMore label={t('insights.read')} accent={accent} />
      </NeuPanel>
    );
  }

  return (
    <NeuPanel
      to={`/blog/${post.slug}`}
      component="article"
      sx={[
        {
          position: 'relative',
          height: '100%',
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          p: { xs: 2.5, md: 3 },
        },
        readMoreHoverSx,
      ]}
    >
      <Box
        component="img"
        src={blogAssetUrl(post.cover)}
        alt=""
        aria-hidden
        loading="lazy"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(1px)',
          // Scaled past the blur radius so it never uncovers the panel's crisp edge.
          transform: 'scale(1.15)',
        }}
      />
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(8, 14, 28, 0.6)' }} />
      <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0.75, flex: 1 }}>
        <MetaRow post={post} tag={post.tags[0]} tone="onImage" />
        <Typography component={titleAs} sx={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', color: '#fff' }}>
          {post.title}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', lineHeight: 1.6, mt: 0.5 }}>
          {truncate(post.excerpt, 120)}
        </Typography>
        <ReadMore label={t('insights.read')} accent="#fff" />
      </Box>
    </NeuPanel>
  );
};

/** A text tile: meta with the lead tag, title, one line of excerpt. */
export const TextPostCard = ({ post, titleAs = 'h3' }: CardProps) => (
  <NeuPanel to={`/blog/${post.slug}`} component="article" sx={{ height: '100%', p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
    <MetaRow post={post} tag={post.tags[0]} />
    <Typography component={titleAs} sx={{ fontSize: '1.02rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', color: soft.text }}>
      {post.title}
    </Typography>
    <Typography sx={{ color: soft.textSecondary, fontSize: '0.86rem', lineHeight: 1.55 }}>{truncate(post.excerpt, 110)}</Typography>
  </NeuPanel>
);

/** The exit tile: how many posts there are, and the way to all of them. */
export const PostCountCard = ({ count, newest }: { count: number; newest: string }) => {
  const { t, i18n } = useTranslation('home');
  return (
    <NeuPanel
      to="/blog"
      sx={[
        { height: '100%', p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 3 },
        readMoreHoverSx,
      ]}
    >
      <Box>
        <Typography
          component="span"
          sx={{ display: 'block', fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', ...clippedGradientSx(gradients.goldText) }}
        >
          {count}
        </Typography>
        <Typography sx={{ mt: 0.75, fontSize: '0.86rem', color: soft.textSecondary }}>
          {t('insights.count', { count })} · {t('insights.newest', { date: formatContentDate(newest, i18n.language) })}
        </Typography>
      </Box>
      <ReadMore label={t('insights.browseAll')} accent={soft.accent} />
    </NeuPanel>
  );
};
