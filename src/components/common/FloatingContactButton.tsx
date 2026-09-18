import { Box, IconButton, Tooltip } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { neuFabSx } from '../../theme/neu';

/**
 * A constant, unobtrusive way to reach support from anywhere on the site —
 * bottom-left, so it never competes with `ScrollTop` (bottom-right, and only
 * on the two pages that use it). Hidden on `/contact` itself: a floating
 * trigger to the page you are already reading is not a shortcut.
 */
export const FloatingContactButton = () => {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  if (pathname === '/contact') return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, md: 24 },
        left: { xs: 16, md: 24 },
        zIndex: 1000,
        '@media print': { display: 'none' },
      }}
    >
      <Tooltip title={t('actions.contactUs')} placement="right">
        <IconButton
          component={RouterLink}
          to="/contact"
          aria-label={t('actions.contactUs')}
          sx={neuFabSx}
        >
          <SupportAgentIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
