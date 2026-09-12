import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { NeuButton } from '../primitives/NeuButton';
import { StickyAside } from '../primitives/StickyAside';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { useAudience } from '../../lib/audience';
import { orderFaq } from '../../lib/faqOrder';
import { FAQList } from './FAQList';

/**
 * Band 7. The accordion is unchanged inside; it moves right, and a sticky
 * left column holds the header, a "talk to us" tile and the docs link, so the
 * questions scroll past a fixed point of contact. The audience switch (band 2)
 * promotes that seat's questions to the top.
 */
export const FAQSection = () => {
  const { t } = useTranslation('home');
  const { audience } = useAudience();
  const items = orderFaq(audience).map((key) => ({ key, q: t(`faq.items.${key}.q`), a: t(`faq.items.${key}.a`) }));

  return (
    <Section id="faq" size="lg">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 4fr) minmax(0, 8fr)' },
          gap: { xs: 4, lg: 4 },
          alignItems: 'start',
        }}
      >
        <StickyAside>
          <SectionHeader
            align="left"
            gutter={false}
            eyebrow={t('faq.eyebrow')}
            title={t('faq.title')}
            titleAccent={t('faq.titleAccent')}
            description={t('faq.description')}
          />
          <AnimateOnScroll delay={120}>
            <NeuPanel variant="tile" sx={{ mt: { xs: 3, lg: 4 }, p: { xs: 2.5, md: 2.75 }, maxWidth: { xs: 420, lg: 'none' } }}>
              <Typography sx={{ fontWeight: 700, color: soft.text, fontSize: '1rem' }}>{t('faq.aside.title')}</Typography>
              <Typography sx={{ color: soft.textSecondary, fontSize: '0.88rem', lineHeight: 1.6, mt: 0.5, mb: 2 }}>
                {t('faq.aside.body')}
              </Typography>
              <NeuButton tone="accent" size="sm" to="/contact?intent=walkthrough">
                {t('faq.aside.cta')}
              </NeuButton>
            </NeuPanel>
          </AnimateOnScroll>
          <Box
            component={RouterLink}
            to="/docs/overview"
            sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 2.5, fontSize: '0.9rem', fontWeight: 600, color: soft.accent }]}
          >
            {t('faq.aside.docs')}
            <ArrowForwardIcon sx={{ fontSize: 16 }} />
          </Box>
        </StickyAside>

        <FAQList items={items} />
      </Box>
    </Section>
  );
};
