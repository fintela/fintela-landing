import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { HTMLAttributes } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  neuControlSx,
  neuLinkCardSx,
  raisedPanelFeaturedSx,
  raisedPanelSx,
  raisedTileSx,
} from '../../theme/neu';

/**
 * Props are HTMLAttributes<HTMLElement> (not BoxProps): a div-typed handler
 * cannot be spread onto an <a>, but an HTMLElement-typed one can be spread
 * onto any of the elements this component renders.
 */
export type NeuPanelProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  sx?: SxProps<Theme>;
  /** 'panel' (default): neuRaisedMd/neuRaised, radius 20/24. 'tile': neuRaisedSm, radius 14, for tight stacks. */
  variant?: 'panel' | 'tile';
  /** Deeper shadow, gold ring, zIndex 1 (PricingPage featured tier). Panels only. */
  featured?: boolean;
  /** The surface itself is the link/button: hover lifts, press settles/sinks, focus ring. */
  interactive?: boolean;
  /** Static element type. For links pass `to` (router) or `href` (external) instead. */
  component?: 'div' | 'article' | 'section' | 'li' | 'aside';
  /** Internal route: renders a react-router Link. Implies `interactive`. */
  to?: string;
  /** External URL: renders an <a>. Implies `interactive`. */
  href?: string;
  target?: string;
  rel?: string;
};

/**
 * One raised surface for every card, row and sheet on the site, so consumers
 * never re-spread raisedPanelSx with an overridden shadow or radius.
 */
export const NeuPanel = ({
  variant = 'panel',
  featured = false,
  interactive,
  component = 'div',
  to,
  href,
  target,
  rel,
  sx,
  ...rest
}: NeuPanelProps) => {
  const isLink = Boolean(to || href);
  const base = featured ? raisedPanelFeaturedSx : variant === 'tile' ? raisedTileSx : raisedPanelSx;
  const state = interactive || isLink ? (variant === 'tile' ? neuControlSx : neuLinkCardSx) : null;
  const merged = [
    base,
    ...(state ? [{ ...state, borderRadius: base.borderRadius }] : []),
    ...(Array.isArray(sx) ? sx : [sx]),
  ] as SxProps<Theme>;

  if (to) return <Box component={RouterLink} to={to} sx={merged} {...rest} />;
  if (href) return <Box component="a" href={href} target={target} rel={rel} sx={merged} {...rest} />;
  return <Box component={component} sx={merged} {...rest} />;
};
