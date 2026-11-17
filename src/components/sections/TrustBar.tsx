import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion, soft } from '../../theme/tokens';
import { eyebrowSx, quietLinkSx } from '../../theme/neu';
import momentoCapitalLogo from '../../assets/clients/momento_capital_logo.png';
import edgebridgeCapitalLogo from '../../assets/clients/edgebridge_capital_logo.jpeg';

const partners = [
  { name: 'Momento Capital', logo: momentoCapitalLogo, url: 'https://momentocapital.com/' },
  { name: 'EdgeBridge Capital', logo: edgebridgeCapitalLogo, url: 'https://www.edgebridgecapital.com/' },
];

/**
 * The teams building with Fintela: each logo once, in a still row. No belt and
 * no repeats — two logos looping read as padding, and moving content with no
 * way to stop it fails touch and keyboard visitors.
 *
 * Just the row; the section it sits in (and the spacing around it) belongs to
 * the caller.
 */
export const PartnerLogos = () => {
  const { t } = useTranslation('home');
  return (
    // The ground is painted here, not only on the page: the section's content
    // sits in its own stacking context, and a multiply blend (the logos, below)
    // only sees what is painted inside that context.
    <Box sx={{ backgroundColor: soft.ground }}>
      <Typography sx={{ ...eyebrowSx, fontSize: '0.72rem', letterSpacing: '0.14em', textAlign: 'center', mb: 2.5 }}>
        {t('proof.logosLabel')}
      </Typography>
      <Box
        component="ul"
        role="list"
        sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: { xs: 3, md: 7 }, rowGap: 2 }}
      >
        {partners.map((partner) => (
          <Box component="li" key={partner.name}>
            <Box
              component="a"
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={partner.name}
              sx={[
                quietLinkSx,
                {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: { xs: 56, md: 68 },
                  px: 2,
                  py: 1,
                  '@media (hover: hover)': { '&:hover .partner-logo': { opacity: 1, filter: 'grayscale(0)' } },
                  '&:focus-visible .partner-logo': { opacity: 1, filter: 'grayscale(0)' },
                },
              ]}
            >
              <Box
                component="img"
                className="partner-logo"
                src={partner.logo}
                alt={partner.name}
                loading="lazy"
                decoding="async"
                sx={{
                  maxHeight: '100%',
                  maxWidth: 180,
                  objectFit: 'contain',
                  opacity: 0.85,
                  filter: 'grayscale(0.4)',
                  // The logo files are flat opaque rectangles with a white fill
                  // behind the mark. Multiply drops the white into whatever
                  // light ground the row sits on, edges antialiased with it.
                  mixBlendMode: 'multiply',
                  transition: `opacity ${motion.base}, filter ${motion.base}`,
                  '@media (forced-colors: active)': { opacity: 1, filter: 'none', mixBlendMode: 'normal' },
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
