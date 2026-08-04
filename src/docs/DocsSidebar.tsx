import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { bySection } from './format';
import type { DocSummary, DocsIndex } from './types';

interface DocsSidebarProps {
  index: DocsIndex;
  /** Slug of the page being read, highlighted in place. */
  currentSlug?: string;
  /** Called when the user activates a link — used by the mobile drawer to close. */
  onNavigate?: () => void;
}

/**
 * The documentation navigation, built from `docs/index.json` rather than a
 * hand-maintained nav array.
 *
 * That is the whole point of the migration: adding `content/docs/thing.md` with a
 * `section:` puts it in this sidebar, in the right group, at its `order` — with no
 * second file to edit and no way for the nav and the content to disagree.
 */
export const DocsSidebar = ({ index, currentSlug, onNavigate }: DocsSidebarProps) => {
  const groups = bySection(index.sections, index.pages);

  return (
    <Box
      component="nav"
      aria-label="Documentation"
      sx={{ py: { xs: 2, md: 4 }, pr: { xs: 1, md: 3 }, pl: { xs: 1, md: 0 } }}
    >
      {groups.map((group, gi) => (
        <Box key={group.section} sx={{ mb: gi < groups.length - 1 ? 3 : 0 }}>
          <Typography
            sx={{
              fontSize: '0.66rem',
              fontWeight: 700,
              color: 'text.disabled',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              px: 1.5,
              mb: 0.75,
            }}
          >
            {group.section}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {group.pages.map((page) => (
              <SidebarLink
                key={page.slug}
                page={page}
                active={page.slug === currentSlug}
                onNavigate={onNavigate}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const SidebarLink = ({
  page,
  active,
  onNavigate,
}: {
  page: DocSummary;
  active: boolean;
  onNavigate?: () => void;
}) => (
  <Box
    component={RouterLink}
    to={`/docs/${page.slug}`}
    onClick={onNavigate}
    aria-current={active ? 'page' : undefined}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      px: 1.5,
      py: 0.7,
      borderRadius: 1.25,
      fontSize: '0.875rem',
      fontWeight: active ? 600 : 500,
      color: active ? '#fff' : 'text.secondary',
      background: active ? 'linear-gradient(135deg, #667eea 0%, #4a5de8 100%)' : 'transparent',
      boxShadow: active ? '0 6px 14px rgba(102,126,234,0.25)' : 'none',
      textDecoration: 'none',
      position: 'relative',
      transition: 'color 0.18s, background 0.18s',
      '&:hover': active
        ? undefined
        : { color: 'text.primary', bgcolor: 'rgba(102,126,234,0.06)' },
    }}
  >
    <Box
      component="span"
      sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
    >
      {page.title}
    </Box>
  </Box>
);
