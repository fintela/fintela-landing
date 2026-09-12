import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { clippedGradientSx } from '../../theme/neu';
import { gradients, soft } from '../../theme/tokens';

interface SectionHeaderProps {
  /** DOM heading level and type size. Default 'h2'. */
  level?: 'h1' | 'h2';
  /**
   * Page-hero mode: no gold mark and no bottom margin (the band's own padding
   * ends the hero). Defaults to true for h1. Pass `hero` on an h2 that heads a
   * page rather than a section.
   */
  hero?: boolean;
  eyebrow?: string;
  title: ReactNode;
  /** Optional highlighted span that follows the title, in the gold display ramp. */
  titleAccent?: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  /** Bottom margin under the block. `false` when a parent row (BandHeader) owns the spacing. */
  gutter?: boolean;
}

/** The short gold rule that flanks an eyebrow — the site's section marker. */
const Rule = ({ width = 28 }: { width?: number }) => (
  <Box
    aria-hidden
    sx={{ width, height: 3, borderRadius: '2px', background: gradients.gold, flexShrink: 0 }}
  />
);

/**
 * The one heading system: section headers (eyebrow between two rules, or a
 * lone rule) and page heroes (h1, or an h2 with `hero`). Colours are the two
 * soft text colours; the accent span is the gold display ramp.
 */
export const SectionHeader = ({
  level = 'h2',
  hero = level === 'h1',
  eyebrow,
  title,
  titleAccent,
  description,
  align = 'center',
  gutter = true,
}: SectionHeaderProps) => {
  const centered = align === 'center';
  return (
    <Box
      sx={{
        textAlign: align,
        mb: hero || !gutter ? 0 : { xs: 5, md: 8 },
        maxWidth: centered ? 760 : '100%',
        mx: centered ? 'auto' : 0,
      }}
    >
      {eyebrow && (
        <AnimateOnScroll delay={40}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: centered ? 'center' : 'flex-start',
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <Rule />
            <Typography
              component="span"
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: soft.textSecondary,
              }}
            >
              {eyebrow}
            </Typography>
            {centered && <Rule />}
          </Box>
        </AnimateOnScroll>
      )}
      {!eyebrow && !hero && (
        <AnimateOnScroll delay={40}>
          <Box sx={{ display: 'flex', justifyContent: centered ? 'center' : 'flex-start', mb: 2.5 }}>
            <Rule width={36} />
          </Box>
        </AnimateOnScroll>
      )}
      <AnimateOnScroll delay={90}>
        <Typography
          variant={level}
          sx={{
            fontSize:
              level === 'h1'
                ? { xs: '2.25rem', sm: '3rem', md: '3.9rem' }
                : { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
            color: soft.text,
            mb: description ? 2.5 : 0,
            // Even line lengths on the 2-3 line wraps a phone forces, so a
            // title never strands its last word alone.
            textWrap: 'balance',
          }}
        >
          {title}
          {titleAccent && (
            <>
              {' '}
              <Box component="span" sx={clippedGradientSx(gradients.goldText)}>
                {titleAccent}
              </Box>
            </>
          )}
        </Typography>
      </AnimateOnScroll>
      {description && (
        <AnimateOnScroll delay={150}>
          <Typography
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.65,
              color: soft.textSecondary,
              maxWidth: centered ? 640 : '100%',
              mx: centered ? 'auto' : 0,
            }}
          >
            {description}
          </Typography>
        </AnimateOnScroll>
      )}
    </Box>
  );
};
