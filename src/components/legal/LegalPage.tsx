import { useState } from 'react';
import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { Header } from '../Header/Header';
import { Footer } from '../Footer/Footer';
import { Section } from '../primitives/Section';
import { NeuPanel } from '../primitives/NeuPanel';
import { cellGrooveSx, eyebrowSx, grooveSx, proseLinkSx, wellSx } from '../../theme/neu';
import { radii, soft } from '../../theme/tokens';
import { inlineCode } from '../../docs/components/Prose';

import termsEn from '@legal/terms-of-use.md?raw';
import termsEs from '@legal/terms-of-use.es.md?raw';
import privacyEn from '@legal/privacy-notice.md?raw';
import privacyEs from '@legal/privacy-notice.es.md?raw';
import riskDisclosuresEn from '@legal/risk-disclosures.md?raw';

export type LegalPageKey = 'terms' | 'privacy' | 'riskDisclosures';

/**
 * Counsel delivered both languages for terms/privacy; the Spanish version legally
 * prevails and the English is a courtesy translation. Serve Spanish to `es-*` UIs,
 * English to the rest (en, pt — counsel did not deliver Portuguese).
 *
 * Risk Disclosures has no Spanish version yet (see STATUS.json), so it serves
 * English to every locale until one is delivered.
 */
const CONTENT: Record<LegalPageKey, { es: string; en: string }> = {
  terms: { es: termsEs, en: termsEn },
  privacy: { es: privacyEs, en: privacyEn },
  riskDisclosures: { es: riskDisclosuresEn, en: riskDisclosuresEn },
};

/**
 * fintela.io/terms, fintela.io/privacy, and fintela.io/risk-disclosures — the
 * canonical public home of the legal documents. /terms and /privacy are also the
 *
 * There is exactly one copy of each document per language, in `docs/legal/`,
 * imported through the `@legal` alias; app.fintela.io renders the same bytes. Each
 * document carries its own heading and "Last updated" line, so this page adds no
 * chrome of its own. `scripts/check-legal-final.mjs` refuses to let a document with
 * placeholders — or one counsel has not signed off on — reach production.
 */
export function LegalPage({ page }: { page: LegalPageKey }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
  const [activeSection, setActiveSection] = useState('');

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    if (section === 'home') window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      <Section size="md" maxWidth="md" sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 8, md: 12 } }}>
        <NeuPanel
          component="article"
          sx={{
            p: { xs: 3, md: 6 },
            overflowWrap: 'anywhere',
            // Mirrors the SPA's legal typography so both hosts read identically.
            '& h1': { fontSize: '1.9rem', mt: 0, mb: 2, letterSpacing: '-0.02em' },
            '& h2': { fontSize: '1.3rem', mt: 4, mb: 1.5 },
            '& h3': { fontSize: '1.1rem', mt: 3, mb: 1 },
            '& h1, & h2, & h3': { color: soft.text },
            '& p, & li': { lineHeight: 1.7 },
            '& ul, & ol': { pl: 3 },
            '& hr': { border: 0, my: { xs: 3, md: 4 }, ...grooveSx },
            '& blockquote': {
              ...wellSx('sm'),
              borderRadius: `${radii.neuWell}px`,
              m: 0,
              my: 2.5,
              px: 2.5,
              py: 1.5,
            },
            // Inline code inside the blockquote well is flat (never well-in-well, §1.2).
            '& blockquote code': { boxShadow: 'none' },
            '& a': proseLinkSx,
            '& table': {
              borderCollapse: 'separate',
              borderSpacing: 0,
              width: '100%',
              my: 2,
              display: 'block',
              overflowX: 'auto',
            },
            '& th, & td': { border: 0, p: 1.25, textAlign: 'left' },
            '& th': eyebrowSx,
            '& tbody tr > *': cellGrooveSx,
            '& code': inlineCode,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{CONTENT[page][lang]}</ReactMarkdown>
        </NeuPanel>
      </Section>

      <Footer />
    </Box>
  );
}
