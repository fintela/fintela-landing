import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { radii } from '../../theme/tokens';
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
              }}
            >
              <img
                src={p.logo}
                alt={p.name}
                style={{
                  maxHeight: '100%',
                  maxWidth: 180,
                  objectFit: 'contain',
                  opacity: 0.8,
                  filter: 'grayscale(0.4)',
                }}
              />
            </NeuPanel>
          ))}
        </Box>
      </AnimateOnScroll>
    </Section>
  );
};
