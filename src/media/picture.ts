/**
 * Responsive stills. A `?w=…&format=avif;webp;jpg&as=picture` import (see
 * src/media/registry.ts and vite.config.ts's imagetools plugin) resolves at
 * build time to a `Picture`: one `srcset` per format at the requested widths
 * plus the fallback `<img>` — the largest JPEG — with its intrinsic size, so
 * a well can reserve the right box before a byte of image arrives.
 *
 * Callers mostly hold a still as a plain URL string (`STILLS.solutions.funds`,
 * a video's `poster`), a shape that predates this module and that every slot
 * on the site is typed against. Rather than change those types, the registry
 * files each picture here under its fallback URL, and MediaWell looks the
 * picture up from the string it was given: the same call sites, now serving
 * AVIF/WebP at the width the slot needs.
 */

/** What a `…&as=picture` import resolves to (vite-imagetools' `Picture`). */
export interface Picture {
  /** Keyed by mime subtype (`avif`, `webp`, `jpeg`): a `srcset` with `w` descriptors. */
  sources: Record<string, string>;
  /** The fallback image: the largest rung of the last format in the directive. */
  img: { src: string; w: number; h: number };
}

/** How a still sits in a well whose ratio is not the file's own. */
export interface PictureFraming {
  /**
   * CSS `object-position` for the `<img>`: where the subject is, so a well
   * that crops the file (a portrait in a 16/9 slot) crops around it rather
   * than around the centre.
   */
  objectPosition?: string;
}

const byFallbackSrc = new Map<string, { picture: Picture; framing: PictureFraming }>();

/**
 * Files `picture` under its fallback URL and returns that URL, so a registry
 * entry can stay a string while `pictureFor(entry)` yields the full source set.
 */
export const registerPicture = (picture: Picture, framing: PictureFraming = {}): string => {
  byFallbackSrc.set(picture.img.src, { picture, framing });
  return picture.img.src;
};

/** The picture registered under `src`, if the string came from the registry. */
export const pictureFor = (src: string | undefined): Picture | undefined =>
  src ? byFallbackSrc.get(src)?.picture : undefined;

/** The framing registered with a still, if any. */
export const framingFor = (src: string | undefined): PictureFraming =>
  (src && byFallbackSrc.get(src)?.framing) || {};

/** The fallback format's subtype (`jpeg`), read from its file extension. */
const fallbackFormat = (picture: Picture): string => {
  const ext = picture.img.src.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return ext === 'jpg' ? 'jpeg' : ext;
};

/**
 * The `<source>` list in the order a `<picture>` should offer it: the browser
 * takes the first type it can decode, so the smallest format leads. The
 * fallback format is left to the `<img>` (`fallbackSrcSet`).
 */
export const pictureSources = (picture: Picture): Array<{ type: string; srcSet: string }> => {
  const fallback = fallbackFormat(picture);
  const order = ['avif', 'webp'];
  return Object.entries(picture.sources)
    .filter(([format]) => format !== fallback)
    .sort(([a], [b]) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
    })
    .map(([format, srcSet]) => ({ type: `image/${format}`, srcSet }));
};

/** The fallback format's `srcset`, when it has more than one rung. */
export const fallbackSrcSet = (picture: Picture): string | undefined =>
  picture.sources[fallbackFormat(picture)];

/** The URL of the `width`-wide rung in a `srcset`, or the last entry when no rung matches. */
export const srcsetEntry = (srcSet: string, width: number): string | undefined => {
  const entries = srcSet.split(',').map((entry) => entry.trim().split(/\s+/));
  const exact = entries.find(([, descriptor]) => descriptor === `${width}w`);
  return (exact ?? entries[entries.length - 1])?.[0];
};
