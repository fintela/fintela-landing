import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { PipelineSection } from '../components/sections/PipelineSection';
import { ClosingSection } from '../components/sections/ClosingSection';
import { quietLinkSx } from '../theme/neu';
import { soft } from '../theme/tokens';
import { Seo } from '../seo/Seo';
import { organization, webPage, webSite } from '../seo/jsonld';
import { absoluteUrl } from '../seo/site';

/** The docs page that walks the same five stages step by step. */
const WORKFLOW_GUIDE = '/docs/end-to-end-workflow';

/**
 * Product menu's "Platform" item: the pipeline in full. The home page says
 * what Fintela does in three verbs (build, optimize, validate); this page is
 * one click deeper and shows the five connected stages behind them, from the
 * universe to a live broker, with the docs one click further.
 */
export const PlatformPage = () => {
  const { t } = useTranslation('pages');
  const title = t('platform.seo.title');
  const description = t('platform.seo.description');

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo
        title={title}
        description={description}
        jsonLd={[organization(), webSite(), webPage({ name: title, description, url: absoluteUrl('/product/platform') })]}
      />
      <Header />

      <Box component="main" id="content">
        <PipelineSection />

        <Section size="sm">
          <Box
            component={RouterLink}
            to={WORKFLOW_GUIDE}
            sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.95rem', fontWeight: 600, color: soft.linkAccent }]}
          >
            {t('platform.docsLink')}
            <ArrowForwardIcon sx={{ fontSize: 16 }} />
          </Box>
        </Section>

        <ClosingSection title={t('platform.closing.title')} body={t('platform.closing.body')} placement="platform_closing" />
      </Box>

      <Footer />
    </Box>
  );
};
