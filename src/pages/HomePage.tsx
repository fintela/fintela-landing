import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { HomeHero } from '../components/sections/HomeHero';
import { ProofSection } from '../components/sections/ProofSection';
import { HowItWorks } from '../components/sections/HowItWorks';
import { AiPaths } from '../components/sections/AiPaths';
import { WhoFor } from '../components/sections/WhoFor';
import { InsightsSection } from '../components/sections/InsightsSection';
import { FAQSection } from '../components/sections/FAQSection';
import { ClosingSection } from '../components/sections/ClosingSection';
import { Footer } from '../components/Footer/Footer';
import { ScrollTop } from '../components/common/ScrollTop';
import { scrollToSection as scrollToId } from '../lib/scrollToSection';
import { HOME_FAQ_KEYS } from '../lib/faqOrder';
import { useScrollDepth } from '../lib/useScrollDepth';
import { track } from '../lib/track';
import { Seo } from '../seo/Seo';
import { faqPage, organization, softwareApplication, webSite } from '../seo/jsonld';

/**
 * The page's six sections, by the id of the band that opens each (the sixth
 * is research, the questions and the closing calls to action together). Each
 * sends one `section_view` the first time it reaches the middle of the screen.
 */
const SECTIONS = ['hero', 'proof', 'how-it-works', 'ai', 'who', 'research'] as const;

/**
 * Where the old band ids went. These hashes are in the app, in mail and in
 * search results, so every one of them keeps landing on the section that
 * replaced its target. Keep an entry forever once added.
 */
const HASH_ALIASES: Record<string, string> = {
  // The eight-band page this one replaced.
  'for-funds': 'who',
  'your-agent': 'ai',
  award: 'proof',
  insights: 'research',
  start: 'faq',
  // Older still.
  'use-cases': 'who',
  advantage: 'who',
};

/** Band ids whose content moved off the home page entirely, and the route it lives at now. */
const PAGE_REDIRECTS: Record<string, string> = {
  // The pipeline and the capabilities under it.
  platform: '/product/platform',
  capabilities: '/product/platform',
  features: '/product/platform',
  developers: '/product/fintela-api',
  quantum: '/product/samplers',
  fintelligent: '/product/agentic-ai',
  fintelagent: '/product/agentic-ai',
};

const resolveTarget = (id: string) => HASH_ALIASES[id] ?? id;

export const HomePage = () => {
  const { t } = useTranslation('home');
  const { t: tPages } = useTranslation('pages');
  const location = useLocation();
  const navigate = useNavigate();
  useScrollDepth('home');

  // The FAQ band's questions, in the order it renders them — the FAQPage
  // markup must mirror the visible text.
  const faqItems = HOME_FAQ_KEYS.map((key) => ({
    q: t(`faq.items.${key}.q`),
    a: t(`faq.items.${key}.a`),
  }));

  const scrollToSection = useCallback((section: string) => {
    scrollToId(resolveTarget(section));
  }, []);

  // Handle cross-page links: state.scrollTo (Header/Footer nav, set via
  // navigate('/', { state })) and a bare URL hash (direct links, new tabs,
  // hard refreshes — anything that lands here with e.g. "/#faq").
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    const target = state?.scrollTo ?? (location.hash ? location.hash.slice(1) : undefined);
    if (!target) return;
    const redirect = PAGE_REDIRECTS[target];
    if (redirect) {
      navigate(redirect, { replace: true });
      return;
    }
    setTimeout(() => scrollToSection(target), 60);
  }, [location, scrollToSection, navigate]);

  // One `section_view` per section per visit, the first time it crosses the middle of the screen.
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => e !== null);
    if (els.length === 0) return undefined;
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!entry.isIntersecting || seen.has(id)) continue;
          seen.add(id);
          observer.unobserve(entry.target);
          track('section_view', { section: id });
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo
        title={tPages('seo.home.title')}
        description={tPages('seo.home.description')}
        jsonLd={[organization(), webSite(), softwareApplication(tPages('seo.home.description')), faqPage(faqItems)]}
      />
      <Header onNavigate={scrollToSection} />
      <Box component="main" id="content">
        {/* Six sections, outcomes only: what it is, why to trust it, how it
            works in three verbs, the two ways to work with AI, who it is for,
            and then the research, the questions and the two calls to action
            again. Methods live one click deeper, on the product pages. */}
        <HomeHero />
        <ProofSection />
        <HowItWorks />
        <AiPaths />
        <WhoFor />
        <InsightsSection />
        <FAQSection />
        <ClosingSection title={t('closing.title')} body={t('closing.body')} placement="home_closing" />
      </Box>
      <Footer />
      <ScrollTop />
    </Box>
  );
};
