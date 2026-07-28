import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';

const faqKeys = [
  'assetClasses',
  'vsBacktesting',
  'python',
  'optimization',
  'seedExport',
  'liveTrading',
  'security',
  'poweredBy',
  'speed',
] as const;

export const FAQSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="faq" tone="muted" size="lg">
      <SectionHeader
        eyebrow={t('faq.eyebrow')}
        title={t('faq.title')}
        titleAccent={t('faq.titleAccent')}
        description={t('faq.description')}
      />

      <Box sx={{ maxWidth: 820, mx: 'auto' }}>
        {faqKeys.map((faqKey, idx) => (
          <AnimateOnScroll key={faqKey} delay={(idx % 4) * 40}>
            <Accordion
              disableGutters
              elevation={0}
              sx={{
                bgcolor: 'transparent',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&::before': { display: 'none' },
                '&:first-of-type': { borderTop: '1px solid', borderColor: 'divider' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                sx={{
                  px: 1,
                  py: 1.5,
                  '& .MuiAccordionSummary-content': { my: 1.25 },
                  '&:hover': { bgcolor: 'rgba(102,126,234,0.025)' },
                  transition: 'background 0.18s',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.98rem', md: '1.08rem' },
                    color: 'text.primary',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {t(`faq.items.${faqKey}.q`)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 1, pb: 2.5, pt: 0 }}>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.92rem', md: '0.95rem' },
                    lineHeight: 1.7,
                    maxWidth: 720,
                  }}
                >
                  {t(`faq.items.${faqKey}.a`)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </AnimateOnScroll>
        ))}
      </Box>
    </Section>
  );
};
