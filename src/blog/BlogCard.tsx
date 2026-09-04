import { Box, Card, Chip, Typography } from '@mui/material';
import { ArrowForward, CalendarToday, PersonOutline } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatContentDate, truncate } from '../content/format';
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
    <Card
      component={RouterLink}
      to={`/blog/${post.slug}`}
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        border: '2px solid rgba(47, 99, 149, 0.1)',
        transition: 'all 0.3s',
        '&:hover': {
          borderColor: accent,
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 32px ${accent}33`,
          '& .read-more': { opacity: 1, transform: 'translateX(4px)' },
        },
      }}
    >
      <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {formatContentDate(post.date, i18n.language)}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            •
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('blog.readTime', { minutes: post.readingMinutes })}
          </Typography>
        </Box>

        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 1, color: 'text.primary', lineHeight: 1.4 }}
        >
          {post.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
          <PersonOutline sx={{ fontSize: '0.95rem', color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {post.author}
          </Typography>
        </Box>

        <Typography sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.7, flexGrow: 1 }}>
          {truncate(post.excerpt)}
        </Typography>

        {post.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
            {visibleTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.72rem',
                  color: 'text.secondary',
                  borderColor: 'divider',
                }}
              />
            ))}
            {overflowTags > 0 && (
              <Chip
                label={`+${overflowTags}`}
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.72rem',
                  color: 'text.secondary',
                  borderColor: 'divider',
                }}
              />
            )}
          </Box>
        )}

        <Box
          className="read-more"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: accent,
            fontWeight: 600,
            opacity: 0.7,
            transition: 'all 0.3s',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t('blog.readMore')}
          </Typography>
          <ArrowForward sx={{ fontSize: '1rem' }} />
        </Box>
      </Box>
    </Card>
  );
};
