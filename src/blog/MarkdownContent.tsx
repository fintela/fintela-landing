import { Box, Typography } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { isValidElement, useMemo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Link as RouterLink } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { slugify } from '../content/frontmatter';
import { remarkCallouts } from '../content/remarkCallouts';
import { CodeBlock } from '../docs/components/CodeBlock';
import { Callout } from '../docs/components/Callout';
import type { Language } from '../docs/syntax/highlight';
import { inlineCode } from '../docs/components/Prose';
import { palette } from '../theme/tokens';

/**
 * Renders a Markdown body from `content/` — a blog post, or a documentation page.
 *
 * One renderer for both collections by design: the docs migration off hand-written
 * TSX pages would otherwise have produced a second Markdown pipeline to keep in
 * sync. Docs turn on two extra behaviours through props (`headingAnchors` for the
 * right-rail table of contents, `resolveHref` for cross-page links); with neither
 * passed, this behaves exactly as the blog always has.
 *
 * ## Why this is safe against XSS
 *
 * Bodies are treated as untrusted even though they are reviewed in the repo — the
 * renderer must stay safe if the content source ever changes again:
 *
 *  1. **Raw HTML never renders.** `rehype-raw` is deliberately NOT installed;
 *     without it react-markdown drops embedded HTML instead of parsing it, so
 *     `<script>`, `<iframe>` and `onerror=` in a file are inert text. Do not add
 *     `rehype-raw` here — that single change would make every post and every doc
 *     page a script injection into fintela.io.
 *  2. **URLs are allow-listed** by `urlTransform` below, which replaces
 *     react-markdown's default with a stricter scheme check, so
 *     `[x](javascript:…)` and `<img src=data:text/html,…>` are dropped.
 *  3. **No `dangerouslySetInnerHTML`** anywhere in this tree — every node is a
 *     React element.
 *
 * `remarkCallouts` only rewrites text it already parsed and sets `class`/`title`
 * from a fixed allow-list, so it adds no way for content to reach the DOM
 * unescaped.
 */

/** Fence languages the in-repo highlighter understands. */
const LANGUAGE_ALIASES: Record<string, Language> = {
  python: 'python',
  py: 'python',
  typescript: 'ts',
  ts: 'ts',
  tsx: 'ts',
  javascript: 'js',
  js: 'js',
  jsx: 'js',
  mjs: 'js',
  node: 'js',
  json: 'json',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  http: 'http',
  curl: 'http',
};

/**
 * Anything unrecognised (sql, rust, yaml…) falls back to the bash tokenizer: it
 * has the smallest keyword set, so it highlights strings and numbers and leaves
 * the rest plain rather than mis-colouring another language's syntax.
 */
const resolveLanguage = (fence: string | undefined): Language =>
  LANGUAGE_ALIASES[(fence ?? '').toLowerCase()] ?? 'bash';

const SAFE_IMAGE_DATA_URI = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i;
const SAFE_LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

/**
 * Control characters are stripped before the scheme is read, because browsers
 * strip them too when parsing a URL: `java&#9;script:alert(1)` becomes
 * `javascript:alert(1)` in the DOM. A scheme check that runs on the raw string
 * would see `java\tscript`, decide it isn't a scheme at all, and wave it through
 * as a relative path.
 *
 * The control characters in this class are the entire point of it, so
 * `no-control-regex` is suppressed rather than satisfied.
 */
// eslint-disable-next-line no-control-regex
const URL_CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/**
 * Where relative image paths resolve. Unset (the default) leaves them relative to
 * the current URL, so `![](diagram.png)` on `/blog/my-post` resolves to
 * `/blog/diagram.png` — i.e. next to the post JSON in the same bucket prefix.
 */
const ASSET_BASE = (() => {
  const configured = import.meta.env.VITE_BLOG_ASSET_BASE_URL || '';
  return configured ? configured.replace(/\/*$/, '/') : '';
})();

/**
 * Scheme allow-list for every URL react-markdown is about to emit. Returning an
 * empty string drops the attribute.
 */
function urlTransform(url: string, key: string): string {
  const value = url.replace(URL_CONTROL_CHARS, '').trim();
  if (!value) return '';

  // The scheme is read as the substring before the first colon rather than by
  // pattern-matching the whole URL — a colon that follows a `/`, `?` or `#`
  // belongs to the path or query (`page.html?a=b:c`), not to a scheme.
  const colon = value.indexOf(':');
  const slash = value.indexOf('/');
  const question = value.indexOf('?');
  const hash = value.indexOf('#');
  const isRelative =
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (question !== -1 && colon > question) ||
    (hash !== -1 && colon > hash);
  const scheme = isRelative ? '' : value.slice(0, colon).toLowerCase();

  if (key === 'src') {
    if (!scheme) return ASSET_BASE ? `${ASSET_BASE}${value.replace(/^\.?\//, '')}` : value;
    if (scheme === 'http' || scheme === 'https') return value;
    // Inline base64 images are allowed (the brief permits them for small assets);
    // svg is excluded because it can carry script.
    return SAFE_IMAGE_DATA_URI.test(value) ? value : '';
  }

  // Relative paths and #anchors have no scheme and are always safe.
  if (!scheme) return value;
  return SAFE_LINK_SCHEMES.has(scheme) ? value : '';
}

const isExternal = (href: string | undefined) => !!href && /^https?:/i.test(href);

/**
 * A path this app's router owns: leading `/`, but not `//host` (protocol-relative,
 * i.e. off-site) and not a bare `#anchor`, which must stay a plain anchor so the
 * browser scrolls instead of the router navigating.
 */
const isInternalPath = (href: string) => href.startsWith('/') && !href.startsWith('//');

/**
 * The visible text of a heading, for its anchor id.
 *
 * Walks the rendered children rather than the source line so the id is derived
 * from exactly what the reader sees — `## The \`simulate\` contract` gives
 * `the-simulate-contract`, matching what `extractToc` computes for the rail.
 */
function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeText(node.props.children);
  }
  return '';
}

export interface MarkdownContentProps {
  markdown: string;
  /**
   * Give `h2`–`h4` anchor ids derived from their text, plus a hover link. Docs
   * pages need them for the table-of-contents rail and cross-page `#section`
   * links; a blog post has nothing pointing into its middle.
   */
  headingAnchors?: boolean;
  /**
   * Last say over every link's `href`, after `urlTransform`. Returning `null`
   * renders the link's text with no anchor at all — how docs handle a link to a
   * page that isn't published, so a stale cross-reference reads as prose instead
   * of sending readers to a 404.
   */
  resolveHref?: (href: string | undefined) => string | null | undefined;
}

const headingSizes = {
  h2: { variant: 'h4', component: 'h2', mt: 5, fontSize: '1.6rem' },
  h3: { variant: 'h5', component: 'h3', mt: 4, fontSize: '1.3rem' },
  h4: { variant: 'h6', component: 'h4', mt: 3, fontSize: '1.1rem' },
} as const;

type HeadingKey = keyof typeof headingSizes;

/**
 * Every component that varies with props is built here, so `useMemo` in the
 * exported component can keep one stable object per configuration instead of
 * re-rendering the whole tree on each parent render.
 */
function buildComponents({
  headingAnchors,
  resolveHref,
}: Omit<MarkdownContentProps, 'markdown'>): Components {
  const heading = (key: HeadingKey) =>
    function Heading({ children }: { children?: ReactNode }) {
      const spec = headingSizes[key];
      const id = headingAnchors ? slugify(nodeText(children)) || undefined : undefined;

      return (
        <Typography
          id={id}
          variant={spec.variant}
          // Markdown headings start at h2: the title is the page's only h1.
          component={spec.component}
          sx={{
            mt: spec.mt,
            mb: 1.5,
            color: 'text.primary',
            fontSize: spec.fontSize,
            scrollMarginTop: 96,
            ...(id
              ? {
                  '& .heading-anchor': { opacity: 0, transition: 'opacity 0.2s' },
                  '&:hover .heading-anchor': { opacity: 1 },
                }
              : {}),
          }}
        >
          {children}
          {id && (
            <Box
              component="a"
              href={`#${id}`}
              className="heading-anchor"
              aria-label="Link to this section"
              sx={{
                ml: 1,
                color: 'text.disabled',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                verticalAlign: 'middle',
                '&:hover': { color: palette.blue },
              }}
            >
              <LinkIcon sx={{ fontSize: '0.7em' }} />
            </Box>
          )}
        </Typography>
      );
    };

  return {
    // A markdown `#` is treated as an `h2`: the page title above already owns h1.
    h1: heading('h2'),
    h2: heading('h2'),
    h3: heading('h3'),
    h4: heading('h4'),

    p: ({ children }) => (
      <Typography
        sx={{
          my: 2.5,
          color: 'text.secondary',
          fontSize: { xs: '1rem', md: '1.075rem' },
          lineHeight: 1.8,
        }}
      >
        {children}
      </Typography>
    ),

    a: ({ href, children }) => {
      const resolved = resolveHref ? resolveHref(href) : href;

      // A dead cross-reference degrades to its own text. Rendering the anchor
      // anyway would promise a page that is not there; dropping the text would
      // lose a sentence.
      if (!resolved) {
        return <Box component="span">{children}</Box>;
      }

      // An in-app path routes through the router instead of reloading the SPA.
      // Docs cross-reference each other constantly, and a full document load per
      // link would throw away the loaded index on every hop.
      const internal = isInternalPath(resolved);

      return (
        <Box
          {...(internal
            ? { component: RouterLink, to: resolved }
            : {
                component: 'a',
                href: resolved,
                ...(isExternal(resolved)
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {}),
              })}
          sx={{
            color: palette.blue,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(47,99,149,0.35)',
            transition: 'border-color 0.18s, color 0.18s',
            '&:hover': { color: palette.blue, borderBottomColor: palette.blue },
          }}
        >
          {children}
        </Box>
      );
    },

    strong: ({ children }) => (
      <Box component="strong" sx={{ color: 'text.primary', fontWeight: 700 }}>
        {children}
      </Box>
    ),
    em: ({ children }) => (
      <Box component="em" sx={{ fontStyle: 'italic' }}>
        {children}
      </Box>
    ),

    ul: ({ children }) => (
      <Box
        component="ul"
        sx={{
          my: 2.5,
          pl: 3.5,
          color: 'text.secondary',
          fontSize: { xs: '1rem', md: '1.075rem' },
          lineHeight: 1.8,
          '& li': { my: 1 },
          '& li::marker': { color: palette.blue },
          // GFM task lists: the checkbox replaces the bullet rather than joining it.
          '& li:has(> input[type="checkbox"])': { listStyle: 'none', ml: -2.5 },
          '& input[type="checkbox"]': {
            mr: 1,
            width: 15,
            height: 15,
            verticalAlign: '-2px',
            accentColor: palette.blue,
          },
        }}
      >
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box
        component="ol"
        sx={{
          my: 2.5,
          pl: 3.5,
          color: 'text.secondary',
          fontSize: { xs: '1rem', md: '1.075rem' },
          lineHeight: 1.8,
          '& li': { my: 1 },
          '& li::marker': { color: palette.blue, fontWeight: 700 },
        }}
      >
        {children}
      </Box>
    ),

    /**
     * `remarkCallouts` marks GitHub-style alert blockquotes with a `callout-*`
     * class; everything else stays an ordinary quote.
     */
    blockquote: ({ className, title, children }) => {
      const variant = calloutVariant(className);
      if (variant) {
        return (
          <Callout variant={variant} title={title}>
            {children}
          </Callout>
        );
      }

      return (
        <Box
          component="blockquote"
          sx={{
            my: 3.5,
            mx: 0,
            px: 3,
            py: 0.5,
            borderLeft: '3px solid',
            borderColor: palette.blue,
            background:
              'linear-gradient(90deg, rgba(47,99,149,0.06) 0%, rgba(47,99,149,0) 100%)',
            borderRadius: '0 10px 10px 0',
            '& p': { color: 'text.primary', fontStyle: 'italic' },
          }}
        >
          {children}
        </Box>
      );
    },

    /**
     * `code` fires for both fenced blocks and inline spans; the `language-*` class
     * (or the absence of a newline) is what tells them apart.
     */
    code: ({ className, children }) => {
      const fence = /language-(\w+)/.exec(className ?? '')?.[1];
      const text = String(children ?? '');

      if (!fence && !text.includes('\n')) {
        return <Box component="code" sx={inlineCode}>{text}</Box>;
      }
      return (
        <CodeBlock
          language={resolveLanguage(fence)}
          code={text.replace(/\n$/, '')}
          filename={fence ?? 'code'}
        />
      );
    },
    // CodeBlock brings its own <pre>; this keeps the wrapper from double-nesting.
    pre: ({ children }) => <>{children}</>,

    img: ({ src, alt }) => {
      // `urlTransform` returns '' for a blocked URL. Rendering `<img src="">` would
      // make the browser re-request the current page, so drop the node instead of
      // leaving a broken image behind.
      if (typeof src !== 'string' || !src) return null;

      return (
        <Box
          component="img"
          src={src}
          alt={alt ?? ''}
          loading="lazy"
          sx={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            my: 4,
            mx: 'auto',
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
      );
    },

    // Wide tables scroll inside their own container so the page never does.
    table: ({ children }) => (
      <Box sx={{ my: 3.5, overflowX: 'auto', borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Box
          component="table"
          sx={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '0.94rem',
            '& th, & td': {
              textAlign: 'left',
              px: 2,
              py: 1.25,
              borderBottom: 1,
              borderColor: 'divider',
              verticalAlign: 'top',
            },
            '& th': {
              bgcolor: 'rgba(47,99,149,0.05)',
              color: 'text.primary',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            },
            '& td': { color: 'text.secondary' },
            '& td code': inlineCode,
            '& tr:last-of-type td': { borderBottom: 0 },
          }}
        >
          {children}
        </Box>
      </Box>
    ),

    hr: () => (
      <Box
        sx={{
          my: 5,
          height: '1px',
          border: 0,
          background:
            'linear-gradient(90deg, transparent, rgba(47,99,149,0.35) 50%, transparent)',
        }}
      />
    ),
  };
}

type CalloutVariant = 'info' | 'warning' | 'tip' | 'danger' | 'success';

const CALLOUT_VARIANTS = new Set<CalloutVariant>([
  'info',
  'warning',
  'tip',
  'danger',
  'success',
]);

/** `"callout callout-warning"` → `'warning'`; anything else → `undefined`. */
function calloutVariant(className: string | undefined): CalloutVariant | undefined {
  if (!className) return undefined;
  for (const name of className.split(/\s+/)) {
    const variant = name.startsWith('callout-') ? name.slice('callout-'.length) : '';
    if (CALLOUT_VARIANTS.has(variant as CalloutVariant)) return variant as CalloutVariant;
  }
  return undefined;
}

const remarkPlugins = [remarkGfm, remarkCallouts];

export const MarkdownContent = ({
  markdown,
  headingAnchors,
  resolveHref,
}: MarkdownContentProps) => {
  const components = useMemo(
    () => buildComponents({ headingAnchors, resolveHref }),
    [headingAnchors, resolveHref],
  );

  return (
    <Box sx={{ overflowWrap: 'anywhere' }}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        urlTransform={urlTransform}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </Box>
  );
};
