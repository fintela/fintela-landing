import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Header } from '../Header/Header';
import { Footer } from '../Footer/Footer';
import { Section } from '../primitives/Section';
import { HERO_MEASURE, MEASURE, SectionHeader } from '../primitives/SectionHeader';
import { ClosingSection } from './ClosingSection';
import { quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { Seo } from '../../seo/Seo';
import { organization, webPage, webSite } from '../../seo/jsonld';
import { absoluteUrl } from '../../seo/site';

export interface TrustSection {
  /** The section's anchor (`/methodology#isolation`); the home page's trust anchors link to these. */
  id: string;
  /** Key under `pages:<base>.sections.*` for the title, the paragraphs and the link labels. */
  key: string;
  /** Where each statement is documented: label key under `sections.<key>.links.*` → route. */
  links: Record<string, string>;
}

export interface TrustPageProps {
  /** `methodology` or `security`: the key under the `pages` namespace. */
  base: string;
  path: string;
  sections: readonly TrustSection[];
  /** Which call to action leads the closing band. */
  lead?: 'trial' | 'walkthrough';
}

/**
 * The layout of the two trust pages (Methodology, Security): a heading, then
 * short sections of plain statements, each ending in links to the page that
 * documents it. No cards and no icons; the pages are there to be read and
 * checked, and every claim on them is one the documentation makes.
 */
export const TrustPage = ({ base, path, sections, lead = 'trial' }: TrustPageProps) => {
  const { t } = useTranslation('pages');
  const title = t(`${base}.seo.title`);
  const description = t(`${base}.seo.description`);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo title={title} description={description} jsonLd={[organization(), webSite(), webPage({ name: title, description, url: absoluteUrl(path) })]} />
      <Header />

      <Box component="main" id="content">
        <Section size="lg">
          <Box sx={{ maxWidth: HERO_MEASURE }}>
            <SectionHeader level="h1" align="left" eyebrow={t(`${base}.eyebrow`)} title={t(`${base}.title`)} description={t(`${base}.description`)} />
          </Box>

          <Box sx={{ mt: { xs: 6, md: 9 }, display: 'flex', flexDirection: 'column', gap: { xs: 6, md: 8 } }}>
            {sections.map(({ id, key, links }) => (
              <Box
                key={id}
                component="section"
                id={id}
                aria-labelledby={`${id}-title`}
                // Clears the sticky header when the page opens on this anchor.
                sx={{ scrollMarginTop: 96, borderTop: `1px solid ${soft.text}`, pt: { xs: 3, md: 4 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 4fr) minmax(0, 8fr)' }, columnGap: 6, rowGap: 2 }}
              >
                <Typography id={`${id}-title`} component="h2" sx={{ fontSize: { xs: '1.375rem', md: '1.625rem' }, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.25, color: soft.text, textWrap: 'balance' }}>
                  {t(`${base}.sections.${key}.title`)}
                </Typography>
                <Box>
                  {(t(`${base}.sections.${key}.body`, { returnObjects: true }) as string[]).map((paragraph) => (
                    <Typography key={paragraph} sx={{ fontSize: { xs: '1rem', md: '1.0625rem' }, lineHeight: 1.65, color: soft.textSecondary, maxWidth: MEASURE, mb: 2 }}>
                      {paragraph}
                    </Typography>
                  ))}
                  <Box component="ul" role="list" sx={{ listStyle: 'none', m: 0, mt: 2.5, p: 0, display: 'flex', flexWrap: 'wrap', columnGap: 3, rowGap: 1 }}>
                    {Object.entries(links).map(([label, to]) => (
                      <Box component="li" key={label}>
                        <Box
                          component={RouterLink}
                          to={to}
                          sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.9rem', fontWeight: 600, color: soft.linkAccent }]}
                        >
                          {t(`${base}.sections.${key}.links.${label}`)}
                          <ArrowForwardIcon sx={{ fontSize: 15 }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Section>

        <ClosingSection title={t(`${base}.closing.title`)} body={t(`${base}.closing.body`)} lead={lead} placement={`${base}_closing`} />
      </Box>

      <Footer />
    </Box>
  );
};
