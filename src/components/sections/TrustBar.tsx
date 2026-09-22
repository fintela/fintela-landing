import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion, radii } from '../../theme/tokens';
import { eyebrowSx } from '../../theme/neu';
import { Section } from '../primitives/Section';
import { NeuPanel } from '../primitives/NeuPanel';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import momentoCapitalLogo from '../../assets/clients/momento_capital_logo.png';
import edgebridgeCapitalLogo from '../../assets/clients/edgebridge_capital_logo.jpeg';

const partners = [
  { name: 'Momento Capital', logo: momentoCapitalLogo, url: 'https://momentocapital.com/' },
  { name: 'EdgeBridge Capital', logo: edgebridgeCapitalLogo, url: 'https://www.edgebridgecapital.com/' },
];

export const TrustBar = () => {
  const { t } = useTranslation('home');
  return (
    <Section size="sm" sx={{ py: { xs: 5, md: 6 } }}>
      <AnimateOnScroll>
        <Typography
          sx={{ ...eyebrowSx, fontSize: '0.72rem', letterSpacing: '0.14em', textAlign: 'center', mb: 3 }}
        >
          {t('trustBar.title')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 3, md: 4 },
            flexWrap: 'wrap',
          }}
        >
          {partners.map((p) => (
            <NeuPanel
              key={p.name}
              variant="tile"
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: { xs: 64, md: 80 },
                px: 2.5,
                py: 1.5,
                borderRadius: `${radii.neuWell}px`,
                // The tile already lifts (neuControlSx); without this the logo
                // stayed dulled while it rose, so the pillow moved and the
                // thing it holds did not. Paint only — no transform to cancel
                // under reduce, where the 0.01ms clamp just makes it instant.
                '@media (hover: hover)': {
                  '&:hover .partner-logo': { opacity: 1, filter: 'grayscale(0)' },
                },
                '&:focus-visible .partner-logo': { opacity: 1, filter: 'grayscale(0)' },
              }}
            >
              <Box
                component="img"
                className="partner-logo"
                src={p.logo}
                alt={p.name}
                sx={{
                  maxHeight: '100%',
                  maxWidth: 180,
                  objectFit: 'contain',
                  opacity: 0.85,
                  filter: 'grayscale(0.4)',
                  transition: `opacity ${motion.base}, filter ${motion.base}`,
                  // A filter is invisible to forced-colors' own repaint, so the
                  // logo would stay desaturated in a high-contrast theme.
                  '@media (forced-colors: active)': { opacity: 1, filter: 'none' },
                }}
              />
            </NeuPanel>
          ))}
        </Box>
      </AnimateOnScroll>
    </Section>
  );
};
