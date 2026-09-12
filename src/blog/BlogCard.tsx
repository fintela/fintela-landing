import { Box, Typography } from '@mui/material';
import { ArrowForward, CalendarToday, PersonOutline } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { TierBadge } from '../components/primitives/TierBadge';
import { MediaWell } from '../components/primitives/MediaWell';
import { blogAssetUrl } from './api';
import { formatContentDate, truncate } from '../content/format';
import { noMotionPress } from '../theme/neu';
import { motion, soft } from '../theme/tokens';
import { accentFor } from './format';
import type { BlogPostSummary } from './types';

/** How many tag chips fit on a card before the rest collapse into "+N". */
const MAX_VISIBLE_TAGS = 3;

/**
 * One preview card in the `/blog` grid. The whole card is the link target, so the
 * hit area matches what the hover lift implies.
 */
export const BlogCard = ({ post }: { post: BlogPostSummary }) => {
  const { t, i18n } = useTranslation('pages');
  const accent = accentFor(post.slug);
  const visibleTags = post.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowTags = post.tags.length - visibleTags.length;

  return (
    <NeuPanel
      to={`/blog/${post.slug}`}
      sx={{
        height: '100%',
        p: { xs: 3, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        '@media (hover: hover)': {
          '&:hover .read-more': { opacity: 1, transform: 'translateX(4px)' },
        },
        '&:focus-visible .read-more': { opacity: 1 },
      }}
    >
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {post.cover && (
          <MediaWell
            ratio="16/9"
            src={blogAssetUrl(post.cover)}
            alt={post.coverAlt ?? ''}
            sizes="(min-width: 1200px) 360px, (min-width: 900px) 45vw, 90vw"
            sx={{ mb: 2.5 }}
          />
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: '0.875rem', color: soft.textSecondary }} />
            <Typography variant="caption" sx={{ color: soft.textSecondary }}>
              {formatContentDate(post.date, i18n.language)}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: soft.textSecondary }}>
            •
          </Typography>
          <Typography variant="caption" sx={{ color: soft.textSecondary }}>
            {t('blog.readTime', { minutes: post.readingMinutes })}
          </Typography>
        </Box>

        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 1, color: soft.text, lineHeight: 1.4 }}
        >
          {post.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
          <PersonOutline sx={{ fontSize: '0.95rem', color: soft.textSecondary }} />
          <Typography variant="caption" sx={{ color: soft.textSecondary, fontWeight: 600 }}>
            {post.author}
          </Typography>
        </Box>

        <Typography sx={{ color: soft.textSecondary, mb: 2.5, lineHeight: 1.7, flexGrow: 1 }}>
          {truncate(post.excerpt)}
        </Typography>

        {post.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
            {visibleTags.map((tag) => (
              <TierBadge key={tag}>{tag}</TierBadge>
            ))}
            {overflowTags > 0 && <TierBadge>{`+${overflowTags}`}</TierBadge>}
          </Box>
        )}

        <Box
          className="read-more"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            // The six-way accent cycle as ink on a white surface: every step >= 4.5:1.
            color: accent,
            fontWeight: 600,
            opacity: 0.7,
            transition: `opacity ${motion.fast}, transform ${motion.fast}`,
            ...noMotionPress,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t('blog.readMore')}
          </Typography>
          <ArrowForward sx={{ fontSize: '1rem' }} />
        </Box>
      </Box>
    </NeuPanel>
  );
};
