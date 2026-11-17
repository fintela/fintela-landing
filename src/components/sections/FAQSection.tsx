import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { HOME_FAQ_KEYS } from '../../lib/faqOrder';
import { FAQList } from './FAQList';

/**
 * Section 6, second part: five questions in one column, all closed until
 * opened. The same five, in the same order, go out as the page's FAQPage
 * markup (see HomePage).
 */
export const FAQSection = () => {
  const { t } = useTranslation('home');
  const items = HOME_FAQ_KEYS.map((key) => ({ key, q: t(`faq.items.${key}.q`), a: t(`faq.items.${key}.a`) }));

  return (
    <Section id="faq" size="lg">
      <Box sx={{ maxWidth: 820, mx: 'auto' }}>
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <SectionHeader align="left" gutter={false} title={t('faq.heading')} />
        </Box>
        <FAQList items={items} />
      </Box>
    </Section>
  );
};
