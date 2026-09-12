import { Button } from '@mui/material';
import type { ButtonProps, SxProps, Theme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { APP_URL, neuButtonSx } from '../../theme/neu';
import type { NeuSize, NeuTone } from '../../theme/neu';

export type NeuButtonProps = Omit<ButtonProps, 'variant' | 'color' | 'size' | 'disableRipple'> & {
  tone: NeuTone;
  /** 'sm' 40px (toolbar), 'md' 48px (default), 'lg' 56px (form submit). */
  size?: NeuSize;
  /** Internal route; renders through react-router. Use `href` for external URLs. */
  to?: string;
};

/**
 * variant="text" is deliberate: it is the only MuiButton variant with no
 * styleOverrides in the theme, so nothing the theme paints can reach these
 * buttons. Without `to`, `href`, `onClick` or `type` the button links to the
 * app, exactly as the PricingPage original did.
 */
export const NeuButton = ({ tone, size = 'md', to, sx, ...rest }: NeuButtonProps) => {
  const merged = [neuButtonSx(tone, size), ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>;
  if (to) {
    return <Button component={RouterLink} to={to} variant="text" disableRipple sx={merged} {...rest} />;
  }
  const linksToApp = !rest.href && !rest.onClick && !rest.type;
  return (
    <Button
      variant="text"
      disableRipple
      sx={merged}
      {...(linksToApp ? { href: APP_URL, rel: 'noopener' } : {})}
      {...rest}
    />
  );
};
