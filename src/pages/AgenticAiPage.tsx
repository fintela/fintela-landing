import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { FintelligentSection } from '../components/sections/FintelligentSection';
import { AlgoAgentBuilder } from '../components/sections/AlgoAgentBuilder';
import { Seo } from '../seo/Seo';

/**
 * The Product menu's "Agentic AI" item — the same band that used to sit on
 * the home page (`FintelligentSection`), now its own page.
 */
export const AgenticAiPage = () => {
  const { t } = useTranslation('pages');

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo title={t('seo.agenticAi.title')} description={t('seo.agenticAi.description')} />
      <Header />

      <Box component="main" id="content">
        <AlgoAgentBuilder />
        <FintelligentSection />
      </Box>

      <Footer />
    </Box>
  );
};
