import { useMemo } from 'react';
import type { ComponentProps } from 'react';
import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { Header } from '../Header/Header';
import { Footer } from '../Footer/Footer';
import { Section } from '../primitives/Section';
import { NeuPanel } from '../primitives/NeuPanel';
import { cellGrooveSx, eyebrowSx, grooveSx, proseLinkSx, wellSx } from '../../theme/neu';
import { radii, soft } from '../../theme/tokens';
import { inlineCode } from '../../docs/components/inlineCode';

import { Seo } from '../../seo/Seo';
import { organization, webPage, webSite } from '../../seo/jsonld';
import { absoluteUrl } from '../../seo/site';

import termsEn from '@legal/terms-of-use.md?raw';
import termsEs from '@legal/terms-of-use.es.md?raw';
import privacyEn from '@legal/privacy-notice.md?raw';
import privacyEs from '@legal/privacy-notice.es.md?raw';
import riskDisclosuresEn from '@legal/risk-disclosures.md?raw';
import legalStatus from '@legal/STATUS.json';

export type LegalPageKey = 'terms' | 'privacy' | 'riskDisclosures';

/** Each document's route — the canonical, and the `WebPage` node's URL. */
const LEGAL_PATHS: Record<LegalPageKey, string> = {
  terms: '/terms',
  privacy: '/privacy',
  riskDisclosures: '/risk-disclosures',
};

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
 * The 1-based line of the document's subtitle: a `## …` that is the first
 * thing after the `# Title`. Counsel's documents open `# TERMS AND CONDITIONS`
 * / `## Fintela Platform`, and that second line names the product, not a
 * section — rendered as an h2 it is a content-free first heading in the
 * outline. The markdown is counsel-gated (app.fintela.io renders the same
 * bytes), so the demotion happens here at render time instead.
 */
const subtitleLine = (markdown: string): number | null => {
  const lines = markdown.split(/\r?\n/);
  const h1 = lines.findIndex((line) => /^#\s/.test(line));
  if (h1 === -1) return null;
  const next = lines.findIndex((line, i) => i > h1 && line.trim() !== '');
  return next !== -1 && /^##\s/.test(lines[next]) ? next + 1 : null;
};

type H2Props = ComponentProps<'h2'> & { node?: { position?: { start: { line: number } } } };

/** Renders the subtitle line as a paragraph and every other `##` as the h2 it is. */
const legalComponents = (subtitle: number | null): Components => ({
  h2: ({ node, ...props }: H2Props) =>
    subtitle !== null && node?.position?.start.line === subtitle ? (
      <p className="legal-subtitle" {...props} />
    ) : (
      <h2 {...props} />
    ),
});

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
  const { t, i18n } = useTranslation('pages');
  const lang = i18n.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
  const markdown = CONTENT[page][lang];
  const components = useMemo(() => legalComponents(subtitleLine(markdown)), [markdown]);

  // Indexable with a self-referencing canonical: these are trust signals, and
  // a noindex here would hand the app's copies of the same text to the index.
  // `dateModified` is the "Last updated" line, as STATUS.json records it.
  const url = absoluteUrl(LEGAL_PATHS[page]);
  const title = t(`seo.${page}.title`);
  const description = t(`seo.${page}.description`);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo
        title={title}
        description={description}
        path={LEGAL_PATHS[page]}
        jsonLd={[
          organization(),
          webSite(),
          webPage({
            name: title,
            description,
            url,
            dateModified: legalStatus.documents[page].last_updated,
          }),
        ]}
      />
      <Header />

      <Box component="main" id="content">
        <Section size="md" maxWidth="md" sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 8, md: 12 } }}>
          <NeuPanel
            component="article"
            sx={{
              p: { xs: 3, md: 6 },
              overflowWrap: 'anywhere',
              // Mirrors the SPA's legal typography so both hosts read identically.
              '& h1': { fontSize: '1.9rem', mt: 0, mb: 2, letterSpacing: '-0.02em' },
              '& h2': { fontSize: '1.3rem', mt: 4, mb: 1.5 },
              // The demoted subtitle keeps the h2's look (see `subtitleLine`).
              '& .legal-subtitle': { fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.2, mt: 4, mb: 1.5 },
              '& h3': { fontSize: '1.1rem', mt: 3, mb: 1 },
              '& h1, & h2, & h3, & .legal-subtitle': { color: soft.text },
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
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {markdown}
            </ReactMarkdown>
          </NeuPanel>
        </Section>
      </Box>

      <Footer />
    </Box>
  );
}
