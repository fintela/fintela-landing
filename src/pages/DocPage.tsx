import { useCallback, useEffect, useMemo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { SearchOff, UpdateOutlined } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MarkdownContent } from '../blog/MarkdownContent';
import { formatContentDate } from '../content/format';
import { DocsLayout } from '../docs/DocsLayout';
import { extractToc } from '../docs/toc';
import { useDoc, useDocsIndex } from '../docs/useDocs';
import type { DocsIndex } from '../docs/types';
import { gradients, soft } from '../theme/tokens';
import { NeuButton } from '../components/primitives/NeuButton';
import { IconWell } from '../components/primitives/IconWell';
import { TierBadge } from '../components/primitives/TierBadge';

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

  // The page title only becomes known after the fetch, so the tab title is set
  // here rather than in the static index.html.
  useEffect(() => {
    if (!doc) return;
    const previous = document.title;
    document.title = `${doc.title} — Fintela Docs`;
    return () => {
      document.title = previous;
    };
  }, [doc]);

  const toc = useMemo(() => (doc ? extractToc(doc.markdown) : []), [doc]);
  const resolveHref = useDocLinkResolver(index, indexStatus === 'ready');

  // `doc` stands in for its own index entry on the first paint, before the index
  // lands — `DocDetail` is a superset of `DocSummary`, so the layout gets its
  // breadcrumb and highlighted sidebar entry either way.
  return (
    <DocsLayout index={index} current={summary ?? doc} toc={toc}>
      {status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress size={28} sx={{ color: soft.accent }} />
        </Box>
      )}

      {(status === 'notFound' || status === 'error') && (
        <Box sx={{ textAlign: 'center', py: { xs: 8, md: 12 } }}>
          <IconWell size={72} round sx={{ mx: 'auto', mb: 3 }}>
            <SearchOff />
          </IconWell>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: soft.text }}>
            {status === 'notFound' ? t('docs.notFound.title') : t('docs.error.title')}
          </Typography>
          <Typography sx={{ color: soft.textSecondary, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
            {status === 'notFound' ? t('docs.notFound.body') : t('docs.error.body')}
          </Typography>
          <Box sx={{ mt: 4 }}>
            <NeuButton tone="raised" to="/docs">
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

          <MarkdownContent markdown={doc.markdown} headingAnchors resolveHref={resolveHref} />
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
