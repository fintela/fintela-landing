import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { NeuButton } from '../components/primitives/NeuButton';
import { BlockHeading } from '../components/primitives/BlockHeading';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { FundingRequestForm } from '../components/funding/FundingRequestForm';
import {
  FUNDING_FAQ_ACTIVATION_FEE,
  FUNDING_PLATFORM_PRICE,
  FUNDING_REQUEST_ANCHOR,
  FUNDING_SELECTION_CRITERIA,
} from '../funding/config';
import { FAQList } from '../components/sections/FAQList';
import { track } from '../lib/track';
import { fonts, soft } from '../theme/tokens';
import { Seo } from '../seo/Seo';
import { breadcrumbList, faqPage, homeCrumb, organization, webSite } from '../seo/jsonld';

const BENEFIT_KEYS = ['infrastructure', 'cost', 'record'] as const;
/** Publish, then funding: a real sequence, so it is numbered. */
const STEP_KEYS = ['publish', 'funded'] as const;
/** The FAQ, in display order. `activationFee` is tentative: see `FUNDING_FAQ_ACTIVATION_FEE`. */
const FAQ_KEYS = ['automatic', 'free', ...(FUNDING_FAQ_ACTIVATION_FEE ? (['activationFee'] as const) : [])] as const;

/** Every "Request funding" button: a jump to the form at the foot of the page. */
const RequestButton = ({ placement }: { placement: string }) => {
  const { t } = useTranslation('pages');
  return (
    <NeuButton
      tone="accent"
      size="lg"
      href={`#${FUNDING_REQUEST_ANCHOR}`}
      endIcon={<ArrowForwardIcon />}
      onClick={() => track('funding_cta_click', { cta_placement: placement })}
    >
      {t('getFunding.cta')}
    </NeuButton>
  );
};

/**
 * `/get-funding`: Fintela Funding as its own program page. Hero, three
 * benefits, the two steps, and the request form.
 *
 * What the page must never carry: who owns the strategy's code, a plan name or
 * a plan's benefits, a free option, or anything that reads as a simulation
 * feature. The only price is `FUNDING_PLATFORM_PRICE`, framed as platform usage.
 */
export const GetFundingPage = () => {
  const { t } = useTranslation('pages');
  const costBody = FUNDING_PLATFORM_PRICE
    ? t('getFunding.benefits.items.cost.bodyPrice', { price: FUNDING_PLATFORM_PRICE })
    : t('getFunding.benefits.items.cost.body');
  // The structured data mirrors the visible questions, so both read from this list.
  const faqItems = FAQ_KEYS.map((key) => ({
    key,
    q: t(`getFunding.faq.items.${key}.q`),
    a: t(`getFunding.faq.items.${key}.a`),
  }));

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo
        title={t('getFunding.seo.title')}
        description={t('getFunding.seo.description')}
        jsonLd={[organization(), webSite(), faqPage(faqItems), breadcrumbList([homeCrumb(), { name: t('getFunding.eyebrow') }])]}
      />
      <Header />

      <Box component="main" id="content">
        <Section size="lg">
          <SectionHeader
            level="h1"
            eyebrow={t('getFunding.eyebrow')}
            title={
              <>
                {t('getFunding.title')}
                <br />
              </>
            }
            titleAccent={t('getFunding.titleAccent')}
            description={t('getFunding.description')}
          />
          <Box sx={{ mt: { xs: 3, md: 4 }, display: 'flex', justifyContent: 'center' }}>
            <RequestButton placement="funding_hero" />
          </Box>

          {/* Benefits */}
          <Box sx={{ mt: { xs: 8, md: 11 } }}>
            <BlockHeading eyebrow={t('getFunding.benefits.eyebrow')} title={t('getFunding.benefits.title')} />
            <Box
              component="ul"
              role="list"
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                columnGap: 5,
                rowGap: 3.5,
              }}
            >
              {BENEFIT_KEYS.map((key, i) => (
                <Box component="li" key={key} sx={{ minWidth: 0 }}>
                  <AnimateOnScroll delay={i * 60} stretch>
                    <Box sx={{ height: '100%', borderTop: `1px solid ${soft.text}`, pt: 2.5 }}>
                      <Typography component="h3" sx={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: soft.text, mb: 1 }}>
                        {t(`getFunding.benefits.items.${key}.title`)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: soft.textSecondary }}>
                        {key === 'cost' ? costBody : t(`getFunding.benefits.items.${key}.body`)}
                      </Typography>
                    </Box>
                  </AnimateOnScroll>
                </Box>
              ))}
            </Box>
          </Box>

          {/* How it works */}
          <Box sx={{ mt: { xs: 8, md: 11 } }}>
            <BlockHeading eyebrow={t('getFunding.steps.eyebrow')} title={t('getFunding.steps.title')} />
            <Box
              component="ol"
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: { xs: 2, md: 2.5 },
              }}
            >
              {STEP_KEYS.map((key, i) => (
                <Box component="li" key={key} sx={{ minWidth: 0 }}>
                  <AnimateOnScroll delay={i * 80} stretch>
                    <NeuPanel variant="tile" sx={{ height: '100%', p: { xs: 2.5, md: 3 }, display: 'grid', gap: 1, alignContent: 'start' }}>
                      <Typography component="span" sx={{ fontFamily: fonts.mono, fontSize: '0.8rem', color: soft.textSecondary }}>
                        {String(i + 1).padStart(2, '0')}
                      </Typography>
                      <Typography component="h3" sx={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', color: soft.text }}>
                        {t(`getFunding.steps.items.${key}.title`)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: soft.textSecondary }}>
                        {t(`getFunding.steps.items.${key}.body`)}
                      </Typography>
                    </NeuPanel>
                  </AnimateOnScroll>
                </Box>
              ))}
            </Box>
            <Typography sx={{ mt: 3, fontSize: '0.95rem', lineHeight: 1.6, color: soft.textSecondary, maxWidth: '72ch' }}>
              {t('getFunding.steps.note')}
            </Typography>
            <Box sx={{ mt: 4 }}>
              <RequestButton placement="funding_steps" />
            </Box>
          </Box>

          {/* Selection criteria: exactly three, from FUNDING_SELECTION_CRITERIA. */}
          <Box sx={{ mt: { xs: 8, md: 11 } }}>
            <BlockHeading eyebrow={t('getFunding.criteria.eyebrow')} title={t('getFunding.criteria.title')} />
            <Box
              component="ol"
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                columnGap: 5,
                rowGap: 3,
              }}
            >
              {FUNDING_SELECTION_CRITERIA.map((criterion, i) => (
                <Box component="li" key={criterion} sx={{ minWidth: 0 }}>
                  <AnimateOnScroll delay={i * 60} stretch>
                    <Box sx={{ height: '100%', borderTop: `1px solid ${soft.text}`, pt: 2.5, display: 'grid', gap: 1, alignContent: 'start' }}>
                      <Typography component="span" sx={{ fontFamily: fonts.mono, fontSize: '0.8rem', color: soft.textSecondary }}>
                        {String(i + 1).padStart(2, '0')}
                      </Typography>
                      <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: soft.text }}>
                        {criterion}
                      </Typography>
                    </Box>
                  </AnimateOnScroll>
                </Box>
              ))}
            </Box>
            <Typography sx={{ mt: 3, fontSize: '0.95rem', lineHeight: 1.6, color: soft.textSecondary, maxWidth: '72ch' }}>
              {t('getFunding.criteria.note')}
            </Typography>
          </Box>

          {/* FAQ */}
          <Box sx={{ mt: { xs: 8, md: 11 }, maxWidth: 820 }}>
            <BlockHeading eyebrow={t('getFunding.faq.eyebrow')} title={t('getFunding.faq.title')} />
            <FAQList items={faqItems} />
          </Box>
        </Section>

        {/* The form every "Request funding" button jumps to. scrollMarginTop clears the sticky header. */}
        <Section id={FUNDING_REQUEST_ANCHOR} size="lg" maxWidth="md" sx={{ scrollMarginTop: 72, pt: { xs: 2, md: 3 } }}>
          <SectionHeader title={t('getFunding.request.title')} description={t('getFunding.request.description')} />
          <FundingRequestForm />
          <Typography sx={{ mt: { xs: 4, md: 5 }, fontSize: '0.8rem', lineHeight: 1.6, color: soft.textSecondary }}>
            {t('getFunding.fine')}
          </Typography>
        </Section>
      </Box>

      <Footer />
    </Box>
  );
};

