import { Box, Typography, Chip } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { docNav, fullPath, type DocPage } from './nav';

interface DocsSidebarProps {
  /** Called when the user activates a link — used by the mobile drawer to close. */
  onNavigate?: () => void;
}

export const DocsSidebar = ({ onNavigate }: DocsSidebarProps) => {
  const location = useLocation();

  return (
    <Box
      component="nav"
      aria-label="Documentation"
      sx={{
        py: { xs: 2, md: 4 },
        pr: { xs: 1, md: 3 },
        pl: { xs: 1, md: 0 },
      }}
    >
      {docNav.map((group, gi) => (
        <Box key={group.id} sx={{ mb: gi < docNav.length - 1 ? 3 : 0 }}>
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
            {group.title}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {group.pages.map((page) => (
              <SidebarLink
                key={page.id}
                page={page}
                active={location.pathname === fullPath(page)}
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
  page: DocPage;
  active: boolean;
  onNavigate?: () => void;
}) => {
  if (page.comingSoon) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.6,
          fontSize: '0.86rem',
          color: 'text.disabled',
          cursor: 'not-allowed',
        }}
      >
        <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {page.title}
        </Box>
        <Chip
          label="Soon"
          size="small"
          sx={{
            height: 16,
            fontSize: '0.58rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            bgcolor: 'rgba(11,16,32,0.05)',
            color: 'text.disabled',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      component={RouterLink}
      to={fullPath(page)}
      onClick={onNavigate}
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
        background: active
          ? 'linear-gradient(135deg, #667eea 0%, #4a5de8 100%)'
          : 'transparent',
        boxShadow: active ? '0 6px 14px rgba(102,126,234,0.25)' : 'none',
        textDecoration: 'none',
        position: 'relative',
        transition: 'color 0.18s, background 0.18s',
        '&:hover': active
          ? undefined
          : {
              color: 'text.primary',
              bgcolor: 'rgba(102,126,234,0.06)',
            },
      }}
    >
      <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {page.title}
      </Box>
    </Box>
  );
};
