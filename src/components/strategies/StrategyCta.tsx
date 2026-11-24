import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { NeuButton } from '../primitives/NeuButton';
import { motion, soft } from '../../theme/tokens';
import { track } from '../../lib/track';
import type { CtaTarget } from '../../strategies/links';

interface StrategyCtaProps {
  target: CtaTarget;
  /** Sent with the click event, e.g. `strategies_header_publish`. */
  placement: string;
  children: ReactNode;
}

const onClick = (placement: string) => () => track('strategies_cta_click', { cta_placement: placement });

/** A filled or raised button to one of `STRATEGY_LINKS`. */
export const StrategyButton = ({ target, placement, tone, children }: StrategyCtaProps & { tone: 'accent' | 'raised' }) =>
  'to' in target ? (
    <NeuButton tone={tone} to={target.to} onClick={onClick(placement)}>
      {children}
    </NeuButton>
  ) : (
    <NeuButton tone={tone} href={target.href} rel="noopener" onClick={onClick(placement)}>
      {children}
    </NeuButton>
  );

/** The site's arrow link, to an internal route, an external URL or an on-page anchor. */
export const StrategyArrowLink = ({ target, placement, children }: StrategyCtaProps) => {
  const sx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    minHeight: 44,
    fontSize: '0.95rem',
    fontWeight: 600,
    color: soft.linkAccent,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    borderRadius: '4px',
    '& svg': { fontSize: 16, transition: `transform ${motion.fast}` },
    '@media (hover: hover)': { '&:hover svg': { transform: 'translateX(4px)' } },
    '@media (prefers-reduced-motion: reduce)': { '& svg': { transform: 'none !important' } },
    '&:focus-visible': { outline: `2px solid ${soft.linkAccent}`, outlineOffset: 3 },
  } as const;
  const content = (
    <>
      {children}
      <ArrowForwardIcon aria-hidden />
    </>
  );
  return 'to' in target ? (
    <Box component={RouterLink} to={target.to} onClick={onClick(placement)} sx={sx}>
      {content}
    </Box>
  ) : (
    <Box component="a" href={target.href} onClick={onClick(placement)} sx={sx}>
      {content}
    </Box>
  );
};
