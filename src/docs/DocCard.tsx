import { Box, Card, Chip, Typography } from '@mui/material';
import { ArrowForward, DescriptionOutlined, UpdateOutlined } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatContentDate, truncate } from '../content/format';
import { sectionAccent } from './format';
import type { DocSummary } from './types';

/**
 * One preview card in the `/docs` index — the documentation counterpart of
 * `BlogCard`, and deliberately the same object: same border weight, same hover
 * lift, same excerpt truncation, same "read more" affordance.
 *
 * What differs is only what identifies it as documentation: the badge shows the
 * section (coloured from the docs palette, not the blog's), the date is "updated"
 * rather than "published", and the accent band is a compact strip instead of the
 * blog's tall image stand-in — a docs grid runs to 25 cards, and 160px of empty
 * gradient each would bury the content.
 */
export const DocCard = ({ page }: { page: DocSummary }) => {
  const { t, i18n } = useTranslation('pages');
  const accent = sectionAccent(page.section);

  return (
    <Card
      component={RouterLink}
      to={`/docs/${page.slug}`}
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        border: '2px solid rgba(102, 126, 234, 0.1)',
        transition: 'all 0.3s',
        '&:hover': {
          borderColor: accent,
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 32px ${accent}33`,
          '& .read-more': { opacity: 1, transform: 'translateX(4px)' },
        },
      }}
    >
      <Box
        sx={{
          height: 4,
          flexShrink: 0,
          background: `linear-gradient(90deg, ${accent} 0%, ${accent}33 100%)`,
        }}
      />

      <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.75 }}>
          <Chip
            label={page.section}
            size="small"
            icon={<DescriptionOutlined sx={{ fontSize: '0.85rem !important', color: 'inherit' }} />}
            sx={{
              height: 24,
              bgcolor: `${accent}14`,
              color: accent,
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.02em',
              border: `1px solid ${accent}2e`,
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('docs.readTime', { minutes: page.readingMinutes })}
          </Typography>
        </Box>

        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 1.25, color: 'text.primary', lineHeight: 1.4 }}
        >
          {page.title}
        </Typography>

        <Typography sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.7, flexGrow: 1 }}>
          {truncate(page.excerpt)}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
          <UpdateOutlined sx={{ fontSize: '0.95rem', color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('docs.updated', { date: formatContentDate(page.updated, i18n.language) })}
          </Typography>
        </Box>

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
            {t('docs.readDoc')}
          </Typography>
          <ArrowForward sx={{ fontSize: '1rem' }} />
        </Box>
      </Box>
    </Card>
  );
};
