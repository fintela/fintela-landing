import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { PartnerLogos } from './TrustBar';
import { AwardBand } from './AwardSection';

/**
 * The two things a careful reader wants to know: any AI can connect, and the
 * analysis holds up. Each is one sentence and a way to the page behind it.
 */
const ANCHORS = [
  { key: 'ai', to: '/product/agentic-ai' },
  { key: 'science', to: '/methodology#isolation' },
  { key: 'cloud', to: '/product/platform' },
] as const;

const TrustAnchors = () => {
  const { t } = useTranslation('home');
  return (
    <Box>
      <SectionHeader align="left" title={t('proof.trust.title')} />
      <Box
        component="ul"
        role="list"
        sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, columnGap: { md: 5 }, rowGap: 4 }}
      >
        {ANCHORS.map(({ key, to }, i) => (
          <Box component="li" key={key}>
            <AnimateOnScroll delay={i * 70}>
              <Box sx={{ borderTop: `1px solid ${soft.text}`, pt: 2.5 }}>
                <Typography component="h3" sx={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: soft.text, mb: 1 }}>
                  {t(`proof.trust.items.${key}.title`)}
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: soft.textSecondary, mb: 1.75 }}>
                  {t(`proof.trust.items.${key}.body`)}
                </Typography>
                <Box
                  component={RouterLink}
                  to={to}
                  sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.9rem', fontWeight: 600, color: soft.linkAccent }]}
                >
                  {t(`proof.trust.items.${key}.link`)}
                  <ArrowForwardIcon sx={{ fontSize: 15 }} />
                </Box>
              </Box>
            </AnimateOnScroll>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Section 2, proof and trust: the teams building with Fintela (two logos,
 * still), the Hedgeweek award in one compact band, and three trust anchors
 * that lead to the methodology and security pages.
 */
export const ProofSection = () => (
  <Section id="proof" size="lg">
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 7, md: 10 } }}>
      <AnimateOnScroll>
        <PartnerLogos />
      </AnimateOnScroll>
      <AnimateOnScroll>
        <AwardBand />
      </AnimateOnScroll>
      <TrustAnchors />
    </Box>
  </Section>
);
