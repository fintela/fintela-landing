import type { DocSummary } from './types';

/**
 * Documentation-specific presentation helpers.
 *
 * The section accents lean slate where the blog's card accents
 * (`src/blog/format.ts`) lean cobalt: the two card grids share typography,
 * spacing and code theme, and the badge colour is what tells a reader at a
 * glance whether they are looking at a section of the docs or a blog tag.
 * Every step clears 4.5:1 on white, since the colour is painted as chip text.
 *
 * A section keeps its colour everywhere it appears — index badge, page eyebrow,
 * sidebar — because the colour is derived from the section name rather than
 * assigned per card.
 */
const SECTION_ACCENTS = [
  '#4a5b78', // slate 700
  '#0b1a33', // cobalt 900
  '#4a5b78', // slate 600
  '#10264d', // slate 800
  '#16325c', // cobalt 700
  '#0b1a33', // slate 900
] as const;

export function sectionAccent(section: string): string {
  let hash = 0;
  for (let i = 0; i < section.length; i++) {
    hash = (hash * 31 + section.charCodeAt(i)) % 100000;
  }
  return SECTION_ACCENTS[hash % SECTION_ACCENTS.length];
}

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
