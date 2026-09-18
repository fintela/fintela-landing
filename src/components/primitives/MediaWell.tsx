import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { mediaWellSx } from '../../theme/neu';
import { fallbackSrcSet, framingFor, pictureFor, pictureSources } from '../../media/picture';
import type { Picture } from '../../media/picture';

export type MediaRatio = '16/10' | '16/9' | '4/5' | '3/2' | '1/1' | (string & {});

export type MediaWellProps = Omit<BoxProps, 'children'> & {
  /** CSS aspect-ratio; reserved before the image loads, so nothing shifts. */
  ratio?: MediaRatio;
  /** 'md' (default) for plates and 48px+ viewports; 'sm' for thumbnails. */
  tier?: 'md' | 'sm';
  /** 'duotone' (default) desaturates and washes navy; 'plain' for product stills. */
  tone?: 'plain' | 'duotone';
  /**
   * A registry still (a URL string the registry filed a `Picture` under, or
   * the `Picture` itself) renders as `<picture>` with AVIF/WebP/JPEG rungs and
   * its intrinsic size; any other URL (a blog cover) renders as a plain <img>.
   */
  src?: string | Picture;
  /** For a plain-URL `src` only; a picture brings its own. */
  srcSet?: string;
  /** How wide the slot renders, for the browser to pick a rung; `100vw` when unset. */
  sizes?: string;
  alt?: string;
  /** The LCP image: eager, high fetch priority. Everything else is lazy. */
  priority?: boolean;
  /**
   * Bleeds to the parent panel's own top edge instead of sitting inset by the
   * panel's padding: no deboss, top corners take the panel's own radius. See
   * `mediaWellSx` — the caller still has to supply the matching negative
   * margin itself, since the panel's padding isn't knowable here.
   */
  flush?: boolean;
  /** Replaces the <img> — a <video>, or a play control layered over it. */
  children?: ReactNode;
};

/**
 * A photograph set into the surface (debossed), the only way imagery appears in
 * this style: never on the ground, never behind text.
 */
export const MediaWell = ({
  ratio = '16/10',
  tier = 'md',
  tone = 'duotone',
  src,
  srcSet,
  sizes,
  alt = '',
  priority = false,
  flush = false,
  children,
  sx,
  ...rest
}: MediaWellProps) => {
  const picture = typeof src === 'string' ? pictureFor(src) : src;
  const { objectPosition } = typeof src === 'string' ? framingFor(src) : {};
  // The LCP image is fetched eagerly at high priority; the rest wait for the
  // viewport. `decoding="async"` either way: a decode never blocks a paint.
  const imgAttrs = {
    alt,
    sizes,
    loading: priority ? 'eager' : 'lazy',
    fetchPriority: priority ? 'high' : 'auto',
    decoding: 'async',
    style: objectPosition ? { objectPosition } : undefined,
  } as const;
  return (
    <Box
      sx={
        [
          mediaWellSx(tier, tone, flush),
          { aspectRatio: ratio },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>
      }
      {...rest}
    >
      {picture ? (
        // Modern formats first — the browser takes the first <source> it can
        // decode — and the JPEG on the <img>, whose intrinsic width/height let
        // the browser size the box before any bytes arrive (no shift).
        <picture>
          {pictureSources(picture).map(({ type, srcSet: set }) => (
            <source key={type} type={type} srcSet={set} sizes={sizes} />
          ))}
          <img
            src={picture.img.src}
            srcSet={fallbackSrcSet(picture)}
            width={picture.img.w}
            height={picture.img.h}
            {...imgAttrs}
          />
        </picture>
      ) : (
        typeof src === 'string' && <img src={src} srcSet={srcSet} {...imgAttrs} />
      )}
      {children}
    </Box>
  );
};
