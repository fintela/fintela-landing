import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { ScrollTop } from '../components/common/ScrollTop';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { Section } from '../components/primitives/Section';
import { HERO_MEASURE, SectionHeader } from '../components/primitives/SectionHeader';
import { ComparisonPanel } from '../components/solutions/AdvantagePanels';
import { SolutionChapters } from '../components/solutions/SolutionChapters';
import { ClosingSection } from '../components/sections/ClosingSection';
import { FAQList } from '../components/sections/FAQList';
import type { FAQItem } from '../components/sections/FAQList';
import { CtaButton } from '../components/primitives/CtaButton';
import { MediaWell } from '../components/primitives/MediaWell';
import { STILLS } from '../media/registry';
import { NotFoundPage } from './NotFoundPage';
import { ctaRowSx, eyebrowSx, quietLinkSx } from '../theme/neu';
import { fonts, soft } from '../theme/tokens';
import { SOLUTIONS, SOLUTION_PATHS, audienceFromSlug } from '../solutions/registry';
import { Seo } from '../seo/Seo';
import { breadcrumbList, faqPage, homeCrumb, organization, webPage, webSite } from '../seo/jsonld';
import { absoluteUrl } from '../seo/site';

/**
 * `/solutions/:slug` — one template for the four seats. What differs is in
 * `src/solutions/registry.ts` and the `solutions` namespace.
 *
 * The page is one promise, three or four proofs, and the objections answered
 * (docs/redesign/SOLUTIONS-PLAN.md): the value headline as the H1 with the
 * audience as its eyebrow; "What changes", whose rows link to the chapters
 * that prove them; the chapters; the FAQ and one research link; the closing
 * offer. The hero pairs the H1 with one black-and-white photograph of the seat at
 * work, beside the title; the proof stays in the chapters.
 */
export const SolutionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const audience = audienceFromSlug(slug);
  const { t } = useTranslation(['solutions', 'common']);

  if (!audience) return <NotFoundPage />;
  const config = SOLUTIONS[audience];
  const k = (key: string) => `solutions:${audience}.${key}`;

  const seoTitle = t(k('seo.title'));
  const seoDescription = t(k('seo.description'));
  // JPEG, not PNG: the four cards sit on photo backgrounds (see scripts/og/render.mjs).
  const ogImage = `/og/solutions-${config.slug}.jpg`;

  const faq: FAQItem[] = config.faq.map((key) => ({ key, q: t(k(`faq.${key}.q`)), a: t(k(`faq.${key}.a`)) }));
  const heroProofLabel = t(k('heroProof.label'), { defaultValue: '' });
  const heroProofTo = t(k('heroProof.to'), { defaultValue: '' });
  const lead = config.lead;

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo
        title={seoTitle}
        description={seoDescription}
        image={ogImage}
        jsonLd={[
          organization(),
          webSite(),
          webPage({
            name: seoTitle,
            description: seoDescription,
            url: absoluteUrl(SOLUTION_PATHS[audience]),
            image: absoluteUrl(ogImage),
          }),
          // Two levels: `/solutions` itself redirects, so it cannot be a crumb.
          breadcrumbList([homeCrumb(), { name: t(k('badge')) }]),
          faqPage(faq.map(({ q, a }) => ({ q, a }))),
        ]}
      />
      <Header />

      <Box component="main" id="content">
        {/* Hero: who it is for as the eyebrow, the promise as the H1, one lead, two calls to action. */}
        <Section size="lg" sx={{ pt: { xs: 5, md: 9 }, pb: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 4fr)' },
              columnGap: { md: 8, lg: 10 },
              rowGap: 5,
              alignItems: 'center',
            }}
          >
          <Box sx={{ maxWidth: HERO_MEASURE }}>
            <SectionHeader
              level="h1"
              align="left"
              eyebrow={t(k('badge'))}
              title={t(k('title'))}
              titleAccent={t(k('titleAccent'))}
              description={t(k('lead'))}
            />
            <AnimateOnScroll delay={160}>
              <Box sx={[ctaRowSx, { mt: 4, justifyContent: 'flex-start' }]}>
                <CtaButton kind={lead} placement="solution_hero" emphasis="primary" />
                <CtaButton kind={lead === 'trial' ? 'walkthrough' : 'trial'} placement="solution_hero" emphasis="secondary" />
              </Box>
              {heroProofLabel && (
                <Box sx={{ mt: 2.5 }}>
                  <Box
                    {...(heroProofTo ? { component: RouterLink, to: heroProofTo } : { component: 'p' as const })}
                    sx={[
                      heroProofTo ? quietLinkSx : {},
                      { display: 'inline-block', m: 0, fontFamily: fonts.mono, fontSize: '0.8rem', lineHeight: 1.5, color: soft.textSecondary },
                    ]}
                  >
                    {heroProofLabel}
                  </Box>
                </Box>
              )}
            </AnimateOnScroll>
          </Box>
          <AnimateOnScroll delay={120} direction="right">
            <MediaWell
              ratio="4/5"
              src={STILLS.heroPlate[audience]}
              alt={t(k('heroImageAlt'))}
              sizes="(min-width: 900px) 360px, 70vw"
              priority
              sx={{
                maxWidth: 360,
                mx: { xs: 'auto', md: 0 },
                ml: { md: 'auto' },
                borderRadius: '20px',
                boxShadow: '0 24px 60px -28px rgba(20, 24, 40, 0.45)',
              }}
            />
          </AnimateOnScroll>
          </Box>
        </Section>

        {/* What changes: the seat's pains and the outcome each chapter below proves. */}
        <Section id="why" size="lg" sx={{ pt: { xs: 3, md: 4 } }}>
          <SectionHeader align="left" title={t(k('why.title'))} />
          <AnimateOnScroll>
            <ComparisonPanel audience={audience} />
          </AnimateOnScroll>
        </Section>

        <SolutionChapters chapters={config.chapters} audience={audience} />

        {/* The objections, answered where the buyer meets them, then the research behind the pitch. */}
        <Section id="faq" size="lg">
          <SectionHeader align="left" title={t(k('faqTitle'))} />
          <Box sx={{ maxWidth: 880 }}>
            <FAQList items={faq} />
          </Box>
          <Box sx={{ mt: { xs: 5, md: 6 } }}>
            <Typography sx={{ ...eyebrowSx, mb: 1 }}>{t('solutions:common.research.label')}</Typography>
            <Box
              component={RouterLink}
              to={config.research}
              sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: { xs: '1rem', md: '1.08rem' }, fontWeight: 600, color: soft.text }]}
            >
              {t(k('research.label'))}
              <ArrowForwardIcon sx={{ fontSize: 17 }} />
            </Box>
          </Box>
        </Section>

        <ClosingSection
          eyebrow={t(k('closing.eyebrow'))}
          title={t(k('closing.title'))}
          titleAccent={t(k('closing.titleAccent'))}
          body={t(k('closing.body'))}
          lead={lead}
          placement="solution_closing"
        />
      </Box>

      <Footer />
      <ScrollTop />
    </Box>
  );
};
