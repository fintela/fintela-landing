import { useState } from 'react';
import type { MouseEvent } from 'react';
import { IconButton, Menu, MenuItem, ListItemText, Tooltip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LNGS, LNG_LABELS } from '../i18n/config';
import type { SupportedLng } from '../i18n/config';
import { navPillSx, neuIconButtonSx } from '../theme/neu';
import { soft } from '../theme/tokens';

/** Compact language picker (en/es/pt) for the landing header. Persists via the
 *  language detector's localStorage cache (shared key with the app). */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const current = (i18n.resolvedLanguage ?? i18n.language) as SupportedLng;

  const handleSelect = (lng: SupportedLng) => {
    void i18n.changeLanguage(lng);
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title={t('language.change')}>
        <IconButton
          aria-label={t('language.change')}
          onClick={(e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)}
          sx={[neuIconButtonSx, { fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.5 }]}
        >
          {current?.toUpperCase()}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { elevation: 0 } }}
      >
        {SUPPORTED_LNGS.map((lng) => (
          <MenuItem
            key={lng}
            selected={lng === current}
            onClick={() => handleSelect(lng)}
            sx={[
              navPillSx,
              {
                my: 0.25,
                px: 1.5,
                minHeight: 40,
                '& .MuiListItemText-primary': { fontWeight: 'inherit', fontSize: '0.9rem' },
              },
            ]}
          >
            <ListItemText>{LNG_LABELS[lng]}</ListItemText>
            {lng === current && <CheckIcon fontSize="small" sx={{ ml: 1.5, color: soft.accent }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
