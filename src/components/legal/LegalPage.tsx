import { useState } from 'react';
import { Box, Container, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { Header } from '../Header/Header';
import { Footer } from '../Footer/Footer';

import termsEn from '@legal/terms-of-use.md?raw';
import termsEs from '@legal/terms-of-use.es.md?raw';
import privacyEn from '@legal/privacy-notice.md?raw';
import privacyEs from '@legal/privacy-notice.es.md?raw';

export type LegalPageKey = 'terms' | 'privacy';

/**
 * Counsel delivered both languages; the Spanish version legally prevails and the
 * English is a courtesy translation. Serve Spanish to `es-*` UIs, English to the
 * rest (en, pt — counsel did not deliver Portuguese).
 */
const CONTENT: Record<LegalPageKey, { es: string; en: string }> = {
  terms: { es: termsEs, en: termsEn },
  privacy: { es: privacyEs, en: privacyEn },
};

/**
 * fintela.io/terms and fintela.io/privacy — the canonical public home of the legal
 * documents, and the URLs submitted on Alpaca's app-registration form.
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      <Box sx={{ pt: 12, pb: { xs: 5, md: 8 } }}>
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 5 },
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              // Mirrors the SPA's legal typography so both hosts read identically.
              overflowWrap: 'anywhere',
              '& h1': { fontSize: '1.9rem', mt: 0, mb: 2 },
              '& h2': { fontSize: '1.3rem', mt: 4, mb: 1.5 },
              '& h3': { fontSize: '1.1rem', mt: 3, mb: 1 },
              '& p, & li': { lineHeight: 1.7 },
              '& blockquote': {
                borderLeft: 4,
                borderColor: 'divider',
                bgcolor: 'action.hover',
                m: 0,
                my: 2,
                px: 2,
                py: 1,
                borderRadius: 1,
              },
              '& a': { color: 'primary.main' },
              '& table': { borderCollapse: 'collapse', width: '100%', my: 2 },
              '& th, & td': { border: 1, borderColor: 'divider', p: 1, textAlign: 'left' },
              '& code': { bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5, fontSize: '0.9em' },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{CONTENT[page][lang]}</ReactMarkdown>
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
