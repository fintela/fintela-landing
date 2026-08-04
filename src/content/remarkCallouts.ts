/**
 * GitHub-style alert blockquotes → a class the renderer turns into a `<Callout>`.
 *
 *   > [!WARNING] External endpoints are called on every trial
 *   > Keep the handler under two seconds.
 *
 * The marker is stripped from the body and re-emitted as `class` and `title` on
 * the blockquote, both of which are ordinary HTML attributes and so arrive as
 * plain `className` / `title` props on the `blockquote` component. Nothing
 * downstream has to understand mdast.
 *
 * Why a remark plugin rather than sniffing the rendered children: the marker has
 * to be *removed* from the output, and text inside an already-rendered React tree
 * cannot be edited. Doing it on the syntax tree also means a callout survives any
 * inline markup an author puts in the first line.
 *
 * Callouts degrade honestly: a file read on GitHub, or by a renderer that has
 * never heard of this plugin, still shows an ordinary blockquote with a
 * `[!WARNING]` label — the information is in the text, not in the styling.
 */

/** The five GitHub alert types, plus `SUCCESS`, which maps to a green callout. */
const VARIANTS: Record<string, string> = {
  NOTE: 'info',
  IMPORTANT: 'info',
  TIP: 'tip',
  WARNING: 'warning',
  CAUTION: 'danger',
  SUCCESS: 'success',
};

/** `[!NOTE]` or `[!NOTE] An optional title`, on the blockquote's first line. */
const MARKER = /^\[!([A-Za-z]+)\][ \t]*([^\n]*)(?:\n|$)/;

/**
 * Structural subset of mdast. Declared locally rather than imported from
 * `@types/mdast`, which is only present transitively — a source file should not
 * depend on another package's dependency graph for its types.
 */
interface Node {
  type: string;
  value?: string;
  children?: Node[];
  data?: { hProperties?: Record<string, unknown> };
}

/** Depth-first walk. Small enough not to justify pulling in unist-util-visit. */
function walk(node: Node, visit: (n: Node) => void): void {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

export function remarkCallouts() {
  return (tree: Node): void => {
    walk(tree, (node) => {
      if (node.type !== 'blockquote') return;

      const first = node.children?.[0];
      if (first?.type !== 'paragraph') return;

      const lead = first.children?.[0];
      // The marker must be literal text at the very start; `> **[!NOTE]**` is a
      // blockquote that happens to mention a marker, not a callout.
      if (lead?.type !== 'text' || typeof lead.value !== 'string') return;

      const match = MARKER.exec(lead.value);
      if (!match) return;

      const variant = VARIANTS[match[1].toUpperCase()];
      if (!variant) return;

      const title = match[2].trim();
      lead.value = lead.value.slice(match[0].length);

      // `> [!NOTE]` on a line of its own leaves an empty lead paragraph behind.
      if (!lead.value) {
        first.children?.shift();
        if (first.children?.length === 0) node.children?.shift();
      }

      node.data = {
        ...node.data,
        hProperties: {
          ...node.data?.hProperties,
          className: ['callout', `callout-${variant}`],
          ...(title ? { title } : {}),
        },
      };
    });
  };
}
