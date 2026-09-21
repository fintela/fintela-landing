import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { ScrollTop } from '../components/common/ScrollTop';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { GroundTexture } from '../components/primitives/GroundTexture';
import { ComparisonPanel, SeatPanel } from '../components/solutions/AdvantagePanels';
import { SolutionChapters } from '../components/solutions/SolutionChapters';
import { MediaWell } from '../components/primitives/MediaWell';
import { NotFoundPage } from './NotFoundPage';
import { bandClipSx, clippedGradientSx } from '../theme/neu';
import { gradients, soft } from '../theme/tokens';
import { STILLS } from '../media/registry';
import { SOLUTIONS, SOLUTION_PATHS, audienceFromSlug } from '../solutions/registry';
import { Seo } from '../seo/Seo';
import { breadcrumbList, homeCrumb, organization, webPage, webSite } from '../seo/jsonld';
import { absoluteUrl } from '../seo/site';

/**
 * `/solutions/:slug` — one template for the three seats. What differs is in
 * `src/solutions/registry.ts` and the `solutions` namespace; the layout
 * grammar is the home page's, so the deep page reads as a continuation.
 */
export const SolutionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const audience = audienceFromSlug(slug);
  const { t } = useTranslation(['solutions', 'home']);

  if (!audience) return <NotFoundPage />;
  const config = SOLUTIONS[audience];

  const seoTitle = t(`solutions:${audience}.seo.title`);
  const seoDescription = t(`solutions:${audience}.seo.description`);
  // JPEG, not PNG: the three cards sit on photo backgrounds (see scripts/og/render.mjs).
  const ogImage = `/og/solutions-${config.slug}.jpg`;

  const badge = t(`solutions:${audience}.badge`);
  const badgeAccent = t(`solutions:${audience}.badgeAccent`);
  const badgeLead = badgeAccent && badge.endsWith(badgeAccent) ? badge.slice(0, -badgeAccent.length) : badge;

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
          breadcrumbList([homeCrumb(), { name: t(`solutions:${audience}.badge`) }]),
        ]}
      />
      <Header />

      <Box component="main" id="content">
        {/* Hero: badge and lead, plus a right-hand plate — one photo per seat. */}
        <Section tone="soft" size="lg" sx={[bandClipSx, { pt: { xs: 5, md: 8 }, pb: { xs: 8, md: 11 } }]}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' },
              gap: { xs: 4, md: 5 },
              alignItems: 'center',
            }}
          >
            <Box sx={{ position: 'relative', maxWidth: 640 }}>
              <GroundTexture side="left" sx={{ display: { xs: 'none', md: 'block' } }} />
              <AnimateOnScroll delay={40}>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    color: soft.text,
                    textWrap: 'balance',
                    mb: 2.5,
                  }}
                >
                  {badgeLead}
                  {badgeAccent && (
                    <Box component="span" sx={clippedGradientSx(gradients.goldText)}>
                      {badgeAccent}
                    </Box>
                  )}
                </Typography>
              </AnimateOnScroll>
              <AnimateOnScroll delay={160}>
                <Typography sx={{ color: soft.textSecondary, fontSize: { xs: '1.1rem', md: '1.2rem' }, lineHeight: 1.6 }}>
                  {t(`solutions:${audience}.lead`)}
                </Typography>
              </AnimateOnScroll>
            </Box>
            <AnimateOnScroll delay={100} direction="right">
              <MediaWell
                ratio="4/5"
                src={STILLS.heroPlate[audience]}
                alt={t(`solutions:${audience}.heroImageAlt`)}
                sizes="(min-width: 900px) 420px, (min-width: 600px) 420px, 80vw"
                priority
                sx={{ maxWidth: 420, mx: { xs: 'auto', md: 0 } }}
              />
            </AnimateOnScroll>
          </Box>
        </Section>

        {/* Why they switch: the comparison table left, the seat's summary panel right. */}
        <Section id="why" size="lg">
          <SectionHeader
            align="left"
            eyebrow={t('solutions:common.why.eyebrow')}
            title={t('solutions:common.why.title')}
            titleAccent={t('solutions:common.why.titleAccent')}
            description={t('solutions:common.why.description')}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' }, gap: { xs: 3, md: 4 }, alignItems: 'stretch' }}>
            <AnimateOnScroll direction="left" stretch>
              <ComparisonPanel audience={audience} />
            </AnimateOnScroll>
            <AnimateOnScroll delay={100} direction="right" stretch>
              <SeatPanel audience={audience} />
            </AnimateOnScroll>
          </Box>
        </Section>

        <SolutionChapters chapters={config.chapters} audience={audience} />
      </Box>

      <Footer />
      <ScrollTop />
    </Box>
  );
};
