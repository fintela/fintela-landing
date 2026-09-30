import { useSyncExternalStore } from 'react';
import { Box, Link, Typography } from '@mui/material';
import { InlineWidget, useCalendlyEventListener } from 'react-calendly';
import { useTranslation } from 'react-i18next';
import { soft } from '../theme/tokens';

/**
 * The public Calendly booking page, from `VITE_CALENDLY_URL` (see .env.example).
 * Unset means no booking tab: the contact page falls back to the form alone.
 */
export const CALENDLY_URL = (import.meta.env.VITE_CALENDLY_URL ?? '').trim();

const UTM = { utmSource: 'website', utmCampaign: 'contact-section' };

declare global {
  interface Window {
    /** Microsoft Clarity's queue stub from `index.html`; events queue until consent loads the tag. */
    clarity?: (...args: unknown[]) => void;
  }
}

const noopSubscribe = () => () => {};

export const BookWalkthrough = () => {
  const { t } = useTranslation('pages');
  // false on the server and during hydration, true after: the widget injects an
  // iframe and touches `document`, so it must not be in the prerendered HTML.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  useCalendlyEventListener({
    onEventScheduled: () => {
      // The site's only analytics is Clarity; the stub is always defined on
      // fintela.io and the call is only delivered once the visitor has consented.
      // TODO: forward to a conversion/analytics pipeline if one is added.
      window.clarity?.('event', 'calendly_event_scheduled');
    },
  });

  if (!CALENDLY_URL) return null;

  return (
    <Box component="section" aria-labelledby="book-walkthrough-heading">
      <Typography
        variant="h6"
        component="h2"
        id="book-walkthrough-heading"
        sx={{ mb: 1, fontWeight: 700, color: soft.text }}
      >
        {t('contact.booking.heading')}
      </Typography>
      <Typography sx={{ mb: 2, color: soft.textSecondary }}>
        {t('contact.booking.description')}
      </Typography>

      <Box sx={{ width: '100%', minHeight: 700 }}>
        {mounted && (
          <InlineWidget
            url={CALENDLY_URL}
            styles={{ height: 700, width: '100%', minWidth: 0 }}
            pageSettings={{ hideGdprBanner: true, primaryColor: '8247f5' }}
            utm={UTM}
            iframeTitle={t('contact.booking.iframeTitle')}
          />
        )}
      </Box>

      <Typography sx={{ mt: 2, fontSize: '0.9rem', color: soft.textSecondary }}>
        <Link href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
          {t('contact.booking.fallback')}
        </Link>
      </Typography>
    </Box>
  );
};
