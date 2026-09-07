import { Box, Container, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

/** Asset classes the platform actually trades and that carry a class-specific
 * warning. Options and futures are deliberately absent: Fintela does not support
 * them, and disclosing a risk for a product we don't offer is its own problem. */
const ASSET_CLASSES = ['forex', 'crypto'] as const;

/**
 * Site-wide risk disclosure, rendered on every page beneath the footer.
 *
 * The substance already existed in `content/legal/terms-of-use.md` (§15, §60, §62)
 * and in the live-trading docs, but only there — a visitor reading the marketing
 * pages never saw it. This surfaces the same disclosures where they're read,
 * and adds the per-asset-class warnings that had no equivalent anywhere.
 *
 * Wording is legal copy, not marketing copy: change it with counsel, not in a
 * design pass.
 */
export const RiskDisclosure = () => {
  const { t } = useTranslation('footer');

  return (
    <Box
      component="aside"
      aria-label={t('disclosure.heading')}
      sx={{
        bgcolor: '#f2f4f7',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: { xs: 3.5, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Typography
          component="h2"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'text.disabled',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            mb: 1.5,
          }}
        >
          {t('disclosure.heading')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, maxWidth: 900 }}>
          <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.65, color: 'text.secondary' }}>
            {t('disclosure.general')}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.65, color: 'text.secondary' }}>
            {t('disclosure.hypothetical')}
          </Typography>

          {ASSET_CLASSES.map((key) => (
            <Typography
              key={key}
              sx={{ fontSize: '0.78rem', lineHeight: 1.65, color: 'text.secondary' }}
            >
              <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {t(`disclosure.assetClasses.${key}.label`)}
              </Box>
              {' — '}
              {t(`disclosure.assetClasses.${key}.body`)}
            </Typography>
          ))}

          <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.65, color: 'text.secondary' }}>
            <Trans
              i18nKey="disclosure.moreInfo"
              ns="footer"
              components={[
                <span key="0" />,
                <Link
                  key="1"
                  component={RouterLink}
                  to="/terms"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'underline',
                    '&:hover': { color: '#2f6395' },
                  }}
                />,
              ]}
            />
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
