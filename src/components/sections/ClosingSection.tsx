import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { NeuButton } from '../primitives/NeuButton';
import { Groove } from '../primitives/Groove';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { ctaRowSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';

export interface ClosingCta {
  label: string;
  /** Internal route. */
  to?: string;
  /** External URL; with neither, the button links to the app. */
  href?: string;
}

export interface ClosingSectionProps {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  titleAccent?: ReactNode;
  body: string;
  primary: ClosingCta;
  secondary?: ClosingCta;
  /** Mono strip under the groove: the facts, separated by dots. */
  strip?: string;
}

// Spread only what is set: an explicit `href: undefined` would override the
// button's default link to the app.
const linkProps = (cta: ClosingCta) => (cta.to ? { to: cta.to } : cta.href ? { href: cta.href, rel: 'noopener' } : {});

/**
 * The one centred band. After seven off-axis compositions symmetry reads as a
 * full stop; no ring — the gold here is the display accent in the title.
 */
export const ClosingSection = ({ id = 'start', eyebrow, title, titleAccent, body, primary, secondary, strip }: ClosingSectionProps) => (
  <Section id={id} size="lg" sx={{ pt: { xs: 4, md: 6 } }}>
    <AnimateOnScroll>
      <NeuPanel sx={{ maxWidth: 780, mx: 'auto', px: { xs: 3, md: 6 }, py: { xs: 5, md: 7 }, textAlign: 'center' }}>
        <SectionHeader gutter={false} eyebrow={eyebrow} title={title} titleAccent={titleAccent} />
        <Typography sx={{ color: soft.textSecondary, fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.65, maxWidth: 520, mx: 'auto', mt: 2, mb: 4 }}>
          {body}
        </Typography>
        <Box sx={ctaRowSx}>
          <NeuButton tone="accent" {...linkProps(primary)}>
            {primary.label}
          </NeuButton>
          {secondary && (
            <NeuButton tone="raised" {...linkProps(secondary)}>
              {secondary.label}
            </NeuButton>
          )}
        </Box>
        {strip && (
          <>
            <Groove sx={{ mt: 4, mb: 2.25, mx: { xs: 0, md: 4 } }} />
            <Typography
              sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.02em', color: soft.textSecondary, lineHeight: 1.7 }}
            >
              {strip}
            </Typography>
          </>
        )}
      </NeuPanel>
    </AnimateOnScroll>
  </Section>
);
