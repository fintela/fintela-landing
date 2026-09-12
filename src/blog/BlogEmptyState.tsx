import { Typography } from '@mui/material';
import { AutoStories, WifiOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { IconWell } from '../components/primitives/IconWell';
import { soft } from '../theme/tokens';
import type { BlogStatus } from './useBlog';

/**
 * The blog with nothing to show. An unreachable CDN payload and a genuinely
 * empty blog look the same to a visitor, but the copy should not pretend a
 * failure is "no posts". Shared by /blog and the home page's Insights band.
 */
export const BlogEmptyState = ({ status }: { status: Exclude<BlogStatus, 'loading'> }) => {
  const { t } = useTranslation('pages');
  const failed = status === 'error';
  return (
    <NeuPanel sx={{ maxWidth: 560, mx: 'auto', px: { xs: 3, md: 6 }, py: { xs: 5, md: 7 }, textAlign: 'center' }}>
      <IconWell size={72} round sx={{ mx: 'auto', mb: 3 }}>
        {failed ? <WifiOff /> : <AutoStories />}
      </IconWell>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: soft.text }}>
        {failed ? t('blog.error.title') : t('blog.empty.title')}
      </Typography>
      <Typography sx={{ color: soft.textSecondary, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
        {failed ? t('blog.error.body') : t('blog.empty.body')}
      </Typography>
    </NeuPanel>
  );
};
