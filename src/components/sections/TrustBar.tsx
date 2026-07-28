import { Box, Typography, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';
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
      sx={{
        py: { xs: 5, md: 6 },
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fafbfc',
      }}
    >
      <Container maxWidth="lg">
        <AnimateOnScroll>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'text.disabled',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textAlign: 'center',
              mb: 3,
            }}
          >
            {t('trustBar.title')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 3, md: 6 },
              flexWrap: 'wrap',
              opacity: 0.7,
            }}
          >
            {partners.map((p) => (
              <Box
                key={p.name}
                component="a"
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: { xs: 48, md: 64 },
                  px: 2,
                  filter: 'grayscale(0.4)',
                  transition: 'filter 0.22s ease, transform 0.22s ease',
                  '&:hover': {
                    filter: 'grayscale(0)',
                    transform: 'translateY(-2px)',
                  },
                }}
                aria-label={p.name}
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  style={{ maxHeight: '100%', maxWidth: 180, objectFit: 'contain' }}
                />
              </Box>
            ))}
          </Box>
        </AnimateOnScroll>
      </Container>
    </Box>
  );
};
