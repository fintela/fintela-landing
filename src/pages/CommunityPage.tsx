import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { CommunitySection } from '../components/sections/CommunitySection';
import { FundingSection } from '../components/sections/FundingSection';
import { usePublishedStrategies } from '../strategies/source';
import { Seo } from '../seo/Seo';

/**
 * `/community` (formerly `/strategies`, which redirects here): the public board
 * of strategies Fintela users publish, and the Fintela Funding invitation under it.
 *
 * The board reads live data from the backend in the browser; the prerendered
 * page carries the shell and the loading line. Public: indexable, in
 * STATIC_ROUTES and linked from the header and footer.
 */
export const CommunityPage = () => {
  const { t } = useTranslation('pages');
  const state = usePublishedStrategies();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo title={t('strategies.seo.title')} description={t('strategies.seo.description')} />
      <Header />
      <Box component="main" id="content">
        <CommunitySection state={state} level="h1" />
        <FundingSection />
      </Box>
      <Footer />
    </Box>
  );
};
