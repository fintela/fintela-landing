import type { DocSummary } from './types';

/**
 * Documentation-specific presentation helpers.
 *
 * The section accents are deliberately a different family from the blog's card
 * accents (`src/blog/format.ts`): the two card grids share typography, spacing
 * and code theme, and the badge colour is what tells a reader at a glance whether
 * they are looking at a section of the docs or a blog tag.
 *
 * A section keeps its colour everywhere it appears — index badge, page eyebrow,
 * sidebar — because the colour is derived from the section name rather than
 * assigned per card.
 */
const SECTION_ACCENTS = [
  '#0ea5e9', // sky
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#0891b2', // cyan
  '#2563eb', // blue
] as const;

export function sectionAccent(section: string): string {
  let hash = 0;
  for (let i = 0; i < section.length; i++) {
    hash = (hash * 31 + section.charCodeAt(i)) % 100000;
  }
  return SECTION_ACCENTS[hash % SECTION_ACCENTS.length];
}

/**
 * Where "Edit this page" goes. The docs are Markdown in a public repository, so
 * the link is a real contribution entry point, not decoration: it opens GitHub's
 * editor on the exact file, and saving opens a pull request.
 *
 * `VITE_DOCS_REPO_URL` exists for forks; the default is the canonical repo.
 */
const REPO_URL = (
  import.meta.env.VITE_DOCS_REPO_URL || 'https://github.com/fintela/fintela-landing'
).replace(/\/+$/, '');

/** Branch the edit link targets — where merging a docs PR publishes. */
const REPO_BRANCH = 'main';

export const editUrlFor = (doc: Pick<DocSummary, 'sourcePath'>): string =>
  `${REPO_URL}/edit/${REPO_BRANCH}/${doc.sourcePath.replace(/^\/+/, '')}`;

/** Group pages by section, in the generator's section order. */
export function bySection(
  sections: string[],
  pages: DocSummary[],
): { section: string; pages: DocSummary[] }[] {
  return sections
    .map((section) => ({
      section,
      pages: pages.filter((p) => p.section === section),
    }))
    // A section whose every page was filtered out (by search, or because they are
    // all drafts) shows no heading at all rather than an empty group.
    .filter((group) => group.pages.length > 0);
}
