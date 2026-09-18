import { useState, useSyncExternalStore } from 'react';
import { Box, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NeuButton } from '../primitives/NeuButton';
import { floatPaperSx, quietLinkSx } from '../../theme/neu';
import { radii, soft } from '../../theme/tokens';

declare global {
  interface Window {
    /** Defined in `index.html`'s Clarity snippet; loads the tag once, idempotently. */
    __fintelaEnableAnalytics?: () => void;
  }
}

const CONSENT_KEY = 'fintela-consent';

type Consent = 'accepted' | 'declined';

const readConsent = (): Consent | null => {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'accepted' || value === 'declined' ? value : null;
  } catch {
    return null;
  }
};

const writeConsent = (value: Consent): void => {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage may be blocked (private mode, locked-down settings) — the
    // banner still closes; it just asks again next visit.
  }
};

// `useSyncExternalStore`, not an effect + `setState`: localStorage is exactly
// the "external store" this hook exists for, and its server/client snapshots
// are allowed to differ without a hydration-mismatch warning — the one clean
// way to ask "is there a stored choice yet?" only once the browser can answer.
const noopSubscribe = () => () => {};
const getShouldPromptSnapshot = (): boolean => readConsent() === null;
const getServerShouldPromptSnapshot = (): boolean => false;

/**
 * Gates `window.__fintelaEnableAnalytics` (Microsoft Clarity — see
 * `index.html`) behind a real choice instead of the unconditional production
 * load it shipped with.
 *
 * Never rendered on the server or the first client paint: the choice lives
 * in `localStorage`, which the server cannot read, so showing it based on
 * that would make the prerendered markup and the hydrated markup disagree.
 * `getServerShouldPromptSnapshot` renders "hidden" for that first pass on
 * both sides; `useSyncExternalStore` then re-checks the real client snapshot
 * right after and reveals the banner if no choice is stored yet — the
 * documented way to read a browser-only source without a mismatch warning.
 */
export const CookieConsentBanner = () => {
  const { t } = useTranslation('common');
  const shouldPrompt = useSyncExternalStore(
    noopSubscribe,
    getShouldPromptSnapshot,
    getServerShouldPromptSnapshot,
  );
  const [dismissed, setDismissed] = useState(false);

  const respond = (consent: Consent) => {
    writeConsent(consent);
    if (consent === 'accepted') window.__fintelaEnableAnalytics?.();
    setDismissed(true);
  };

  if (!shouldPrompt || dismissed) return null;

  return (
    <Box
      role="region"
      aria-label={t('cookieConsent.message')}
      sx={{
        position: 'fixed',
        bottom: { xs: 12, md: 20 },
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        width: 'calc(100% - 32px)',
        maxWidth: 640,
        '@media print': { display: 'none' },
      }}
    >
      <Box
        sx={{
          ...floatPaperSx,
          bgcolor: soft.ground,
          borderRadius: `${radii.neuInner}px`,
          p: { xs: 2.5, md: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}
      >
        <Typography sx={{ flex: 1, color: soft.text, fontSize: '0.9rem', lineHeight: 1.6 }}>
          {t('cookieConsent.message')}{' '}
          <Link component={RouterLink} to="/privacy" sx={quietLinkSx}>
            {t('cookieConsent.privacyLink')}
          </Link>
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <NeuButton tone="raised" size="sm" onClick={() => respond('declined')}>
            {t('cookieConsent.decline')}
          </NeuButton>
          <NeuButton tone="accent" size="sm" onClick={() => respond('accepted')}>
            {t('cookieConsent.accept')}
          </NeuButton>
        </Box>
      </Box>
    </Box>
  );
};
