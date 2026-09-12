import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { mediaWellSx } from '../../theme/neu';

export type MediaRatio = '16/10' | '16/9' | '4/5' | '3/2' | '1/1' | (string & {});

export type MediaWellProps = Omit<BoxProps, 'children'> & {
  /** CSS aspect-ratio; reserved before the image loads, so nothing shifts. */
  ratio?: MediaRatio;
  /** 'md' (default) for plates and 48px+ viewports; 'sm' for thumbnails. */
  tier?: 'md' | 'sm';
  /** 'duotone' (default) desaturates and washes navy; 'plain' for product stills. */
  tone?: 'plain' | 'duotone';
  src?: string;
  srcSet?: string;
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
}: MediaWellProps) => (
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
    {src && (
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    )}
    {children}
  </Box>
);
