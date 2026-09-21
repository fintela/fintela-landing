import { Box, Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { soft } from '../../theme/tokens';
import { eyebrowSx } from '../../theme/neu';
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
    <Box
      component="section"
      sx={{
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        background: soft.white,
        py: { xs: 5, md: 6 },
      }}
    >
      <Container maxWidth="lg">
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
              gap: { xs: 5, md: 7 },
              flexWrap: 'wrap',
            }}
          >
            {partners.map((p) => (
              <Box
                key={p.name}
                component="a"
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={p.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: { xs: 40, md: 52 },
                }}
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  style={{
                    maxHeight: '100%',
                    maxWidth: 180,
                    objectFit: 'contain',
                    opacity: 0.75,
                    filter: 'grayscale(1)',
                  }}
                />
              </Box>
            ))}
          </Box>
        </AnimateOnScroll>
      </Container>
    </Box>
  );
};
