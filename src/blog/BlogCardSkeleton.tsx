import { Box, Skeleton } from '@mui/material';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { radii } from '../theme/tokens';

/** Same padding and proportions as `BlogCard`, so the grid doesn't reflow once posts land. */
export const BlogCardSkeleton = () => (
  <NeuPanel sx={{ height: '100%', p: { xs: 3, md: 4 } }} aria-hidden="true">
    <Skeleton
      variant="rounded"
      sx={{ aspectRatio: '16 / 9', width: '100%', mb: 2.5, borderRadius: `${radii.neuInner}px` }}
    />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
      <Skeleton variant="text" width={90} sx={{ fontSize: '0.75rem' }} />
      <Skeleton variant="text" width={70} sx={{ fontSize: '0.75rem' }} />
    </Box>
    <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '92%', mb: 0.25 }} />
    <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '65%', mb: 2 }} />
    <Skeleton variant="text" width={120} sx={{ fontSize: '0.8rem', mb: 2 }} />
    <Skeleton variant="text" sx={{ fontSize: '0.95rem', width: '100%' }} />
    <Skeleton variant="text" sx={{ fontSize: '0.95rem', width: '100%' }} />
    <Skeleton variant="text" sx={{ fontSize: '0.95rem', width: '70%', mb: 2 }} />
    <Box sx={{ display: 'flex', gap: 0.75 }}>
      <Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: `${radii.pill}px` }} />
      <Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: `${radii.pill}px` }} />
    </Box>
  </NeuPanel>
);
