import { Box, Skeleton } from '@mui/material';
import { srOnly } from '../../theme/neu';
import { radii } from '../../theme/tokens';

interface ArticleSkeletonProps {
  /** Announced to screen readers; the shapes themselves are `aria-hidden`. */
  label: string;
  /** A blog post's tag chips; documentation pages have no equivalent row. */
  withTags?: boolean;
}

/** One body paragraph's width rhythm, last line short like real prose. */
const PARAGRAPH_WIDTHS = ['100%', '96%', '88%', '100%', '72%'];

/**
 * Placeholder for a doc page or blog post while its Markdown is in flight —
 * title, byline and a paragraph rhythm at roughly the real article's height,
 * so the footer doesn't jump once the body lands (see the call sites' own
 * comments on why the loading state reserves space).
 */
export const ArticleSkeleton = ({ label, withTags = false }: ArticleSkeletonProps) => (
  <Box role="status">
    <Box sx={srOnly}>{label}</Box>

    <Box aria-hidden="true">
      {withTags && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
          <Skeleton variant="rounded" width={72} height={24} sx={{ borderRadius: `${radii.pill}px` }} />
          <Skeleton variant="rounded" width={88} height={24} sx={{ borderRadius: `${radii.pill}px` }} />
        </Box>
      )}

      <Skeleton variant="text" sx={{ fontSize: '2.4rem', width: '85%', mb: 0.5 }} />
      <Skeleton variant="text" sx={{ fontSize: '2.4rem', width: '55%', mb: 2.5 }} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 4 }}>
        <Skeleton variant="text" width={110} sx={{ fontSize: '0.95rem' }} />
        <Skeleton variant="text" width={90} sx={{ fontSize: '0.95rem' }} />
        <Skeleton variant="text" width={70} sx={{ fontSize: '0.95rem' }} />
      </Box>

      {PARAGRAPH_WIDTHS.map((width, idx) => (
        <Skeleton key={idx} variant="text" width={width} sx={{ fontSize: '1rem', mb: 0.5 }} />
      ))}

      <Skeleton variant="rounded" height={160} sx={{ my: 3, borderRadius: `${radii.neuInner}px` }} />

      {PARAGRAPH_WIDTHS.map((width, idx) => (
        <Skeleton key={idx} variant="text" width={width} sx={{ fontSize: '1rem', mb: 0.5 }} />
      ))}
    </Box>
  </Box>
);
