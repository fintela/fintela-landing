import type { DocSummary } from './types';

/**
 * Documentation-specific presentation helpers.
 *
 * The section accents lean mid-gray where the blog's card accents
 * (`src/blog/format.ts`) lean the brand trio: the two card grids share
 * typography, spacing and code theme, and the badge colour is what tells a
 * reader at a glance whether they are looking at a section of the docs or a
 * blog tag. Every step clears 4.5:1 on white, since the colour is painted as
 * chip text.
 *
 * A section keeps its colour everywhere it appears — index badge, page eyebrow,
 * sidebar — because the colour is derived from the section name rather than
 * assigned per card.
 */
const SECTION_ACCENTS = [
  '#525252', // graphite 700
  '#000000', // graphite 900
  '#525252', // graphite 600
  '#262626', // graphite 800
  '#1a1a1a', // graphite 750
  '#000000', // graphite 900b
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
