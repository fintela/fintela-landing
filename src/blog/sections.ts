/**
 * The two pages a post can live on. Every post is a file in `content/blog/`
 * and is published under the same `blog/` JSON prefix; `section:` in its
 * frontmatter decides which page lists it and where its own URL lives:
 *
 *   blog      `/blog`, `/blog/<slug>`          general articles and company news (the default)
 *   research  `/research`, `/research/<slug>`  research notes
 *
 * Tags are something else: a post tagged "Research" can still be a blog post.
 * Every link to a post is built with `postPath`, so the URL always follows
 * the section.
 */
export const POST_SECTIONS = ['blog', 'research'] as const;

export type PostSection = (typeof POST_SECTIONS)[number];

/** A post with no `section:` is a blog post. */
export const DEFAULT_SECTION: PostSection = 'blog';

export const isPostSection = (value: string): value is PostSection =>
  (POST_SECTIONS as readonly string[]).includes(value);

/** The section's index page: `/blog` or `/research`. */
export const sectionPath = (section: PostSection): string => `/${section}`;

/** A post's own page: `/<section>/<slug>`. */
export const postPath = (post: { slug: string; section?: PostSection }): string =>
  `${sectionPath(post.section ?? DEFAULT_SECTION)}/${post.slug}`;

/** Each section's default social card, rendered by `scripts/og/render.mjs`. */
export const SECTION_OG_IMAGE: Record<PostSection, string> = {
  blog: '/og/blog.png',
  research: '/og/research.png',
};

/** Props of the two page components that serve both sections. */
export interface PostSectionProps {
  section?: PostSection;
}
