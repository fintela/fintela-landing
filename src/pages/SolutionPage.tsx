import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { ScrollTop } from '../components/common/ScrollTop';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { NeuButton } from '../components/primitives/NeuButton';
import { TierBadge } from '../components/primitives/TierBadge';
import { MediaPlate } from '../components/primitives/MediaPlate';
import { MediaWell } from '../components/primitives/MediaWell';
import { StatTile } from '../components/primitives/StatTile';
import { StickyAside } from '../components/primitives/StickyAside';
import { GroundTexture } from '../components/primitives/GroundTexture';
import { ComparisonPanel, SeatPanel } from '../components/solutions/AdvantagePanels';
import { SolutionChapters } from '../components/solutions/SolutionChapters';
import { OnboardingTimeline } from '../components/solutions/OnboardingTimeline';
import { FAQList } from '../components/sections/FAQList';
import { ClosingSection } from '../components/sections/ClosingSection';
import { NotFoundPage } from './NotFoundPage';
import { bandClipSx } from '../theme/neu';
import { shadows, soft } from '../theme/tokens';
import { scrollToSection } from '../lib/scrollToSection';
import { SOLUTIONS, audienceFromSlug } from '../solutions/registry';

const WALKTHROUGH = '/contact?intent=walkthrough';

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
  const primary = config.primaryCta === 'walkthrough' ? { label: t(`solutions:${audience}.ctaPrimary`), to: WALKTHROUGH } : { label: t(`solutions:${audience}.ctaPrimary`) };

  const faqItems = [
    ...config.faq.map((key) => ({ key, q: t(`home:faq.items.${key}.q`), a: t(`home:faq.items.${key}.a`) })),
    ...config.extraFaq.map((key) => ({ key: `x-${key}`, q: t(`solutions:${audience}.faq.${key}.q`), a: t(`solutions:${audience}.faq.${key}.a`) })),
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />

      {/* Hero: 5/7, the still on a plate that bleeds right, a stat crossing its edge. */}
      <Section tone="soft" size="lg" sx={[bandClipSx, { pt: { xs: 5, md: 8 }, pb: { xs: 8, md: 11 } }]}>
        <Box
          sx={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 6fr) minmax(0, 6fr)', lg: 'minmax(0, 5fr) minmax(0, 7fr)' },
            gap: { xs: 5, md: 4 },
            alignItems: 'center',
          }}
        >
          <GroundTexture side="left" sx={{ display: { xs: 'none', md: 'block' } }} />
          <Box sx={{ position: 'relative' }}>
            <AnimateOnScroll delay={40}>
              <Box sx={{ mb: 2.5 }}>
                <TierBadge featured>{t(`solutions:${audience}.badge`)}</TierBadge>
              </Box>
            </AnimateOnScroll>
            <SectionHeader
              level="h1"
              align="left"
              title={t(`solutions:${audience}.title`)}
              titleAccent={t(`solutions:${audience}.titleAccent`)}
            />
            <AnimateOnScroll delay={160}>
              <Typography sx={{ color: soft.textSecondary, fontSize: { xs: '1.1rem', md: '1.2rem' }, lineHeight: 1.6, maxWidth: 480, mt: 2.5, mb: 4 }}>
                {t(`solutions:${audience}.lead`)}
              </Typography>
            </AnimateOnScroll>
            <AnimateOnScroll delay={240}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, '& > *': { flex: { xs: '1 1 100%', sm: '0 1 auto' } } }}>
                <NeuButton tone="accent" {...(primary.to ? { to: primary.to } : {})}>
                  {primary.label}
                </NeuButton>
                <NeuButton tone="raised" onClick={() => scrollToSection('chapters')} startIcon={<PlayArrowRoundedIcon />}>
                  {t('solutions:common.watch')}
                </NeuButton>
              </Box>
            </AnimateOnScroll>
          </Box>

          <AnimateOnScroll delay={200} direction="right">
            <Box sx={{ position: 'relative' }}>
              <MediaPlate bleed="right" caption={t(`solutions:${audience}.heroCaption`)}>
                <MediaWell
                  ratio="16/10"
                  src={config.hero.still}
                  alt={t(`solutions:${audience}.heroAlt`)}
                  priority
                  sizes="(min-width: 1200px) 60vw, (min-width: 900px) 50vw, 100vw"
                />
              </MediaPlate>
              <StatTile
                variant="float"
                eyebrow={t(`solutions:${audience}.stat.eyebrow`)}
                value={t(`solutions:${audience}.stat.value`)}
                unit={t(`solutions:${audience}.stat.unit`)}
                sub={t(`solutions:${audience}.stat.sub`)}
                sx={{
                  position: { xs: 'static', md: 'absolute' },
                  left: { md: -24, lg: -48 },
                  bottom: { md: 44 },
                  width: { xs: '100%', sm: 260, md: 236 },
                  mt: { xs: 3, md: 0 },
                  boxShadow: { xs: shadows.neuRaisedSm, md: shadows.neuFloat },
                  zIndex: 2,
                }}
              />
            </Box>
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

      <OnboardingTimeline />

      {/* FAQ subset in the home page's 4/8 split. */}
      <Section id="faq" size="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 4fr) minmax(0, 8fr)' }, gap: 4, alignItems: 'start' }}>
          <StickyAside>
            <SectionHeader
              align="left"
              gutter={false}
              eyebrow={t('home:faq.eyebrow')}
              title={t('home:faq.title')}
              titleAccent={t('home:faq.titleAccent')}
              description={t(`solutions:${audience}.faqIntro`)}
            />
          </StickyAside>
          <FAQList items={faqItems} />
        </Box>
      </Section>

      <ClosingSection
        eyebrow={t('solutions:common.closing.eyebrow')}
        title={t(`solutions:${audience}.closing.title`)}
        titleAccent={t(`solutions:${audience}.closing.titleAccent`)}
        body={t(`solutions:${audience}.closing.body`)}
        primary={primary}
        secondary={{ label: t('solutions:common.closing.ctaSecondary'), to: '/pricing' }}
        strip={t('home:closing.strip')}
      />

      <Footer />
      <ScrollTop />
    </Box>
  );
};
