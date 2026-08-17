import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { Header } from '../components/Header/Header';
import { HeroSection } from '../components/sections/HeroSection';
import { TrustBar } from '../components/sections/TrustBar';
import { WorkflowSection } from '../components/sections/WorkflowSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { FintelAgentSection } from '../components/sections/FintelAgentSection';
import { UseCasesSection } from '../components/sections/UseCasesSection';
import { FAQSection } from '../components/sections/FAQSection';
import { Footer } from '../components/Footer/Footer';
import { ScrollTop } from '../components/common/ScrollTop';
import { scrollToSection as scrollToId } from '../lib/scrollToSection';

const SCROLL_SECTIONS = [
  'platform',
  'features',
  'fintelagent',
  'developers',
  'use-cases',
  'faq',
] as const;

export const HomePage = () => {
  const [activeSection, setActiveSection] = useState<string>('platform');
  const location = useLocation();

  const scrollToSection = useCallback((section: string) => {
    scrollToId(section);
    setActiveSection(section);
  }, []);

  // Handle cross-page links: state.scrollTo (Header/Footer nav, set via
  // navigate('/', { state })) and a bare URL hash (direct links, new tabs,
  // hard refreshes — anything that lands here with e.g. "/#platform").
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    const target = state?.scrollTo ?? (location.hash ? location.hash.slice(1) : undefined);
    if (target) {
      setTimeout(() => scrollToSection(target), 60);
    }
  }, [location, scrollToSection]);

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header activeSection={activeSection} onNavigate={scrollToSection} />
      <HeroSection />
      <TrustBar />
      <WorkflowSection />
      <FeaturesSection />
      {/* <QuantumSamplersSection /> */}
      <FintelAgentSection />
      {/* <DevExperienceSection /> */}
      {/* <AdvantageSection /> */}
      <UseCasesSection />
      <FAQSection />
      <Footer />
      <ScrollTop />
    </Box>
  );
};
