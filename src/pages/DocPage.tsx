import { useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { SearchOff, UpdateOutlined } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MarkdownContent } from '../blog/MarkdownContent';
import { formatContentDate } from '../content/format';
import { ArticleSkeleton } from '../components/common/ArticleSkeleton';
import { DocsLayout } from '../docs/DocsLayout';
import { extractToc } from '../docs/toc';
import { useDoc, useDocsIndex } from '../docs/useDocs';
import type { DocDetail, DocsIndex } from '../docs/types';
import { gradients, soft } from '../theme/tokens';
import { NeuButton } from '../components/primitives/NeuButton';
import { IconWell } from '../components/primitives/IconWell';
import { TierBadge } from '../components/primitives/TierBadge';
import { Seo } from '../seo/Seo';
import { pageTitle, truncateDescription } from '../seo/text';
import { breadcrumbList, docsCrumb, homeCrumb, organization, techArticle, webSite } from '../seo/jsonld';
import { absoluteUrl } from '../seo/site';
import { DOCS_HOME } from '../seo/routes';

const DOCS_OG_IMAGE = '/og/docs.png';
const TITLE_SUFFIX = 'Fintela Docs';

/** `{Title} · {Section} | Fintela Docs`, the page's excerpt, and a TechArticle node. */
const DocSeo = ({ doc }: { doc: DocDetail }) => {
  const url = absoluteUrl(`/docs/${doc.slug}`);
  return (
    <Seo
      title={pageTitle(`${doc.title} · ${doc.section}`, TITLE_SUFFIX)}
      description={truncateDescription(doc.excerpt)}
      type="article"
      image={DOCS_OG_IMAGE}
      article={{ modifiedTime: doc.updated, section: doc.section, tags: doc.keywords }}
      jsonLd={[
        organization(),
        webSite(),
        techArticle(doc, url),
        breadcrumbList([homeCrumb(), docsCrumb(), { name: doc.title }]),
      ]}
    />
  );
};

/**
 * `/docs/:slug` — one documentation page, rendered from the Markdown body in its
 * `docs/<slug>.json`.
 *
 * Both the index and the page are fetched: the page for its body, the index for the
 * sidebar, the prev/next pair, and to tell a live cross-reference from a dead one.
 * Both are memoized in `src/docs/api.ts`, so moving between pages refetches only
 * the body.
 *
 * A slug that isn't in the published set renders the not-found state rather than a
 * blank page. `published: false` lands here too — a draft emits no JSON at all, so
 * it is unreachable by direct URL and not merely hidden from the index.
 */
export const DocPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation('pages');
  const { status, doc } = useDoc(slug);
  const { status: indexStatus, index } = useDocsIndex();

  const summary = useMemo(
    () => index.pages.find((p) => p.slug === slug) ?? null,
    [index.pages, slug],
  );

  const toc = useMemo(() => (doc ? extractToc(doc.markdown) : []), [doc]);
  const resolveHref = useDocLinkResolver(index, indexStatus === 'ready');

  // `doc` stands in for its own index entry on the first paint, before the index
  // lands — `DocDetail` is a superset of `DocSummary`, so the layout gets its
  // breadcrumb and highlighted sidebar entry either way.
  return (
    <DocsLayout index={index} current={summary ?? doc} toc={toc}>
      {/* The head follows the fetch, as on BlogPostPage: the page's own metadata
          once it is in hand, noindex for a dead slug, the docs' generic head
          while loading. DocsLayout owns the <main> landmark. */}
      {status === 'ready' && doc && <DocSeo doc={doc} />}
      {(status === 'notFound' || status === 'error') && (
        <Seo
          noindex
          title={pageTitle(
            t(status === 'notFound' ? 'docs.notFound.title' : 'docs.error.title'),
            TITLE_SUFFIX,
          )}
          description={t(status === 'notFound' ? 'docs.notFound.body' : 'docs.error.body')}
          image={DOCS_OG_IMAGE}
        />
      )}
      {status === 'loading' && (
        <Seo title={t('seo.docs.title')} description={t('seo.docs.description')} image={DOCS_OG_IMAGE} />
      )}
      {/* The skeleton reserves the article's height. Only ever seen on a
          client-side navigation (the prerendered HTML carries the doc), but
          without the reserve the footer sits in the first viewport during the
          fetch and is pushed a whole screen down when the body lands. */}
      {status === 'loading' && <ArticleSkeleton label={t('docs.loadingPage')} />}

      {(status === 'notFound' || status === 'error') && (
        <Box sx={{ textAlign: 'center', py: { xs: 8, md: 12 } }}>
          <IconWell size={72} round sx={{ mx: 'auto', mb: 3 }}>
            <SearchOff />
          </IconWell>
          {/* h4 for the size; h1 because it is the only title this state has. */}
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1.5, color: soft.text }}>
            {status === 'notFound' ? t('docs.notFound.title') : t('docs.error.title')}
          </Typography>
          <Typography sx={{ color: soft.textSecondary, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
            {status === 'notFound' ? t('docs.notFound.body') : t('docs.error.body')}
          </Typography>
          <Box sx={{ mt: 4 }}>
            <NeuButton tone="raised" to={DOCS_HOME}>
              {t('docs.backToIndex')}
            </NeuButton>
          </Box>
        </Box>
      )}

      {status === 'ready' && doc && (
        <Box component="article">
          <Box sx={{ mb: 3.5 }}>
            <Box sx={{ mb: 2 }}>
              <TierBadge>{doc.section}</TierBadge>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                mb: 2,
                color: soft.text,
                textWrap: 'balance',
                fontSize: { xs: '1.9rem', sm: '2.3rem', md: '2.6rem' },
                letterSpacing: '-0.025em',
              }}
            >
              {doc.title}
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: '1.05rem', md: '1.15rem' },
                color: soft.textSecondary,
                lineHeight: 1.6,
                maxWidth: 720,
                mb: 2.5,
              }}
            >
              {doc.excerpt}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: { xs: 1.5, sm: 2.5 },
                color: soft.textSecondary,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <UpdateOutlined sx={{ fontSize: '1rem' }} />
                <Typography variant="body2">
                  {t('docs.updated', {
                    date: formatContentDate(doc.updated, i18n.language),
                  })}
                </Typography>
              </Box>
              <Typography variant="body2">
                {t('docs.readTime', { minutes: doc.readingMinutes })}
              </Typography>
            </Box>
          </Box>

          <Box
            aria-hidden
            sx={{ width: 36, height: 3, borderRadius: '2px', background: gradients.gold, mb: 3 }}
          />

          <MarkdownContent
            markdown={doc.markdown}
            headingAnchors
            resolveHref={resolveHref}
            imageSizes={doc.images}
          />
        </Box>
      )}
    </DocsLayout>
  );
};

/** Absolute URL, protocol-relative URL, or a bare `#anchor` — never a doc link. */
const IS_ABSOLUTE_OR_HASH = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/**
 * Resolves the links inside a doc body.
 *
 * Two jobs. It normalises the ways an author might point at a sibling page —
 * `/docs/quickstart`, `quickstart.md`, `../api/errors.md` — onto one canonical
 * `/docs/<slug>`, so a link written the natural way while editing a file on GitHub
 * also works on the site. And it returns `null` for a doc that is not in the
 * published set, which makes the renderer drop the anchor and keep the text: a
 * cross-reference to a page that was renamed or unpublished reads as prose instead
 * of promising a 404.
 *
 * `ready` gates the second job. While the index is in flight nothing is known to
 * be missing, and greying out every cross-link for a few hundred milliseconds
 * would be worse than briefly allowing one dead link.
 */
function useDocLinkResolver(index: DocsIndex, ready: boolean) {
  const slugs = useMemo(() => new Set(index.pages.map((p) => p.slug)), [index.pages]);

  return useCallback(
    (href: string | undefined): string | null => {
      if (!href) return null;
      if (IS_ABSOLUTE_OR_HASH.test(href)) return href;

      const [pathPart, hash] = splitHash(href);

      // `/docs/<slug>`, or a repo-relative `.md` path an author wrote while
      // reading the file on GitHub.
      const slug = docSlugFromPath(pathPart);
      if (!slug) return href; // some other site path — /blog, /contact, /terms

      if (ready && !slugs.has(slug)) return null;
      return `/docs/${slug}${hash}`;
    },
    [ready, slugs],
  );
}

function splitHash(href: string): [string, string] {
  const at = href.indexOf('#');
  return at === -1 ? [href, ''] : [href.slice(0, at), href.slice(at)];
}

/**
 * The doc slug a link points at, or `null` if it isn't a doc link.
 *
 * Only `/docs/...` paths and `.md` targets count. A bare relative path without
 * `.md` (`assets/diagram.png`) is left alone — guessing that it means a doc would
 * break every non-doc relative link.
 */
function docSlugFromPath(path: string): string | null {
  if (!path) return null;

  const docsRoute = /^\/docs\/([^/]+)\/?$/.exec(path);
  if (docsRoute) return docsRoute[1].replace(/\.md$/i, '');

  if (/\.md$/i.test(path)) {
    // `./quickstart.md`, `../api/errors.md`, `content/docs/api/errors.md` — the
    // basename is the slug, exactly as the generator derives it.
    return path.replace(/\.md$/i, '').replace(/^.*\//, '') || null;
  }

  return null;
}
