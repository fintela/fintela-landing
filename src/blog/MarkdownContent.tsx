import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../docs/components/CodeBlock';
import type { Language } from '../docs/syntax/highlight';
import { inlineCode } from '../docs/components/Prose';

/**
 * Renders a post body from `landing/content/blog/*.md`.
 *
 * ## Why this is safe against XSS
 *
 * Post bodies are treated as untrusted even though they are reviewed in the repo —
 * the renderer must stay safe if the content source ever changes again:
 *
 *  1. **Raw HTML never renders.** `rehype-raw` is deliberately NOT installed;
 *     without it react-markdown drops embedded HTML instead of parsing it, so
 *     `<script>`, `<iframe>` and `onerror=` in a post are inert text. Do not add
 *     `rehype-raw` here — that single change would make every post a script
 *     injection into fintela.io.
 *  2. **URLs are allow-listed** by `urlTransform` below, which replaces
 *     react-markdown's default with a stricter scheme check, so
 *     `[x](javascript:…)` and `<img src=data:text/html,…>` are dropped.
 *  3. **No `dangerouslySetInnerHTML`** anywhere in this tree — every node is a
 *     React element.
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

const heading = (variant: 'h4' | 'h5' | 'h6', mt: number, fontSize: string) =>
  function Heading({ children }: { children?: ReactNode }) {
    return (
      <Typography
        variant={variant}
        // Markdown headings start at h2: the post title is the page's only h1.
        component={variant === 'h4' ? 'h2' : variant === 'h5' ? 'h3' : 'h4'}
        sx={{ mt, mb: 1.5, color: 'text.primary', fontSize, scrollMarginTop: 96 }}
      >
        {children}
      </Typography>
    );
  };

const components: Components = {
  h1: heading('h4', 5, '1.75rem'),
  h2: heading('h4', 5, '1.6rem'),
  h3: heading('h5', 4, '1.3rem'),
  h4: heading('h6', 3, '1.1rem'),

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

  a: ({ href, children }) => (
    <Box
      component="a"
      href={href}
      {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      sx={{
        color: '#4a5de8',
        textDecoration: 'none',
        borderBottom: '1px solid rgba(102,126,234,0.35)',
        transition: 'border-color 0.18s, color 0.18s',
        '&:hover': { color: '#667eea', borderBottomColor: '#667eea' },
      }}
    >
      {children}
    </Box>
  ),

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
        '& li::marker': { color: '#667eea' },
        // GFM task lists: the checkbox replaces the bullet rather than joining it.
        '& li:has(> input[type="checkbox"])': { listStyle: 'none', ml: -2.5 },
        '& input[type="checkbox"]': {
          mr: 1,
          width: 15,
          height: 15,
          verticalAlign: '-2px',
          accentColor: '#667eea',
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
        '& li::marker': { color: '#667eea', fontWeight: 700 },
      }}
    >
      {children}
    </Box>
  ),

  blockquote: ({ children }) => (
    <Box
      component="blockquote"
      sx={{
        my: 3.5,
        mx: 0,
        px: 3,
        py: 0.5,
        borderLeft: '3px solid',
        borderColor: '#667eea',
        background:
          'linear-gradient(90deg, rgba(102,126,234,0.06) 0%, rgba(102,126,234,0) 100%)',
        borderRadius: '0 10px 10px 0',
        '& p': { color: 'text.primary', fontStyle: 'italic' },
      }}
    >
      {children}
    </Box>
  ),

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
          },
          '& th': {
            bgcolor: 'rgba(102,126,234,0.05)',
            color: 'text.primary',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          },
          '& td': { color: 'text.secondary' },
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
          'linear-gradient(90deg, transparent, rgba(102,126,234,0.35) 50%, transparent)',
      }}
    />
  ),
};

export const MarkdownContent = ({ markdown }: { markdown: string }) => (
  <Box sx={{ overflowWrap: 'anywhere' }}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={urlTransform} components={components}>
      {markdown}
    </ReactMarkdown>
  </Box>
);
