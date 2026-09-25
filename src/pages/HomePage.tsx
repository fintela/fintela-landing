import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { HeroDiorama } from '../components/sections/HeroDiorama';
import { InstitutionalSection } from '../components/sections/InstitutionalSection';
import { TrustBar } from '../components/sections/TrustBar';
import { WorkflowSection } from '../components/sections/WorkflowSection';
import { CapabilitiesBento } from '../components/sections/CapabilitiesBento';
import { InsightsSection } from '../components/sections/InsightsSection';
import { FAQSection } from '../components/sections/FAQSection';
import { Footer } from '../components/Footer/Footer';
import { ScrollTop } from '../components/common/ScrollTop';
import { scrollToSection as scrollToId } from '../lib/scrollToSection';
import { AudienceContext, useAudienceState } from '../lib/audience';
import { orderFaq } from '../lib/faqOrder';
import { Seo } from '../seo/Seo';
import { faqPage, organization, softwareApplication, webSite } from '../seo/jsonld';

/** Band ids the header's scroll-spy follows, in page order. */
const SCROLL_SECTIONS = ['hero', 'capabilities', 'platform', 'for-funds', 'insights', 'faq'] as const;

/**
 * Where the old band ids went. These hashes are in the app, in mail and in
 * search results, so every one of them keeps landing on the band that
 * replaced its target.
 */
const HASH_ALIASES: Record<string, string> = {
  'use-cases': 'for-funds',
  features: 'capabilities',
  developers: 'capabilities',
  quantum: 'capabilities',
  advantage: 'for-funds',
};

/** Band ids that moved off the home page entirely, and the route they live at now. */
const PAGE_REDIRECTS: Record<string, string> = {
  fintelligent: '/product/agentic-ai',
  fintelagent: '/product/agentic-ai',
};

const resolveTarget = (id: string) => HASH_ALIASES[id] ?? id;

export const HomePage = () => {
  const { t } = useTranslation('home');
  const { t: tPages } = useTranslation('pages');
  const [activeSection, setActiveSection] = useState<string>('hero');
  const location = useLocation();
  const navigate = useNavigate();
  const audienceState = useAudienceState();

  // The FAQ band's questions, in the order it renders them for this audience —
  // the FAQPage markup must mirror the visible text, not a fixed list.
  const faqItems = orderFaq(audienceState.audience).map((key) => ({
    q: t(`faq.items.${key}.q`),
    a: t(`faq.items.${key}.a`),
  }));

  const scrollToSection = useCallback((section: string) => {
    const target = resolveTarget(section);
    scrollToId(target);
    setActiveSection(target);
  }, []);

  // Handle cross-page links: state.scrollTo (Header/Footer nav, set via
  // navigate('/', { state })) and a bare URL hash (direct links, new tabs,
  // hard refreshes — anything that lands here with e.g. "/#platform").
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

  // Scroll-spy: keep the header's active item in sync with what's on-screen.
  useEffect(() => {
    const els = SCROLL_SECTIONS.map((id) => document.getElementById(id)).filter(
      (e): e is HTMLElement => e !== null,
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      {
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <AudienceContext.Provider value={audienceState}>
      <Box sx={{ minHeight: '100vh' }}>
        <Seo
          title={tPages('seo.home.title')}
          description={tPages('seo.home.description')}
          jsonLd={[
            organization(),
            webSite(),
            softwareApplication(tPages('seo.home.description')),
            faqPage(faqItems),
          ]}
        />
        <Header activeSection={activeSection} onNavigate={scrollToSection} />
        <Box component="main" id="content">
          <HeroDiorama onWatch={() => scrollToSection('platform')} />
          <CapabilitiesBento />
          <WorkflowSection />
          {/* PlatformStackSection (the three-layer stack) is on hold; re-add it here, after the platform band. */}
          <InstitutionalSection />
          <TrustBar />
          <InsightsSection />
          <FAQSection />
        </Box>
        <Footer />
        <ScrollTop />
      </Box>
    </AudienceContext.Provider>
  );
};
