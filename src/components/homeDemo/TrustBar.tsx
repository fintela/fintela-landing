import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion, soft } from '../../theme/tokens';
import { eyebrowSx, quietLinkSx } from '../../theme/neu';
import { Section } from '../primitives/Section';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import momentoCapitalLogo from '../../assets/clients/momento_capital_logo.png';
import edgebridgeCapitalLogo from '../../assets/clients/edgebridge_capital_logo.jpeg';

const partners = [
  { name: 'Momento Capital', logo: momentoCapitalLogo, url: 'https://momentocapital.com/' },
  { name: 'EdgeBridge Capital', logo: edgebridgeCapitalLogo, url: 'https://www.edgebridgecapital.com/' },
];

/**
 * How many times the partner list repeats along one lap of the belt. Wide
 * enough that two logos still read as a running strip rather than a lonely
 * pair drifting across an empty band, on any screen up to an ultra-wide
 * monitor.
 */
const LAPS = 6;
const lap = Array.from({ length: LAPS }, (_, i) => partners[i % partners.length]);
/** The belt: the lap, back to back with an exact copy of itself, so a
 *  -50% translateX always hands off to pixel-identical content — the loop
 *  point is invisible regardless of how wide the lap ends up being. */
const belt = [...lap, ...lap];

/**
 * A continuous, repeating strip of partner logos. Only the belt's first
 * pass through the real partner list (one tile per partner) is an
 * accessible, focusable link; every other tile — the repeats that fill the
 * belt, and the whole second lap that makes the loop seamless — is the same
 * logo again, `aria-hidden` and pulled out of the tab order so a keyboard or
 * screen-reader visitor never has to step through a dozen copies of the same
 * two destinations. The belt pauses on hover and on focus, so the one real
 * link is never a moving target.
 */
export const TrustBar = () => {
  const { t } = useTranslation('home');
  return (
    <Section size="sm" sx={{ py: { xs: 5, md: 6 } }}>
      <AnimateOnScroll>
        <Typography
          sx={{ ...eyebrowSx, fontSize: '0.72rem', letterSpacing: '0.14em', textAlign: 'center', mb: 3 }}
        >
          {t('trustBar.title')}
        </Typography>
        <Box
          sx={{
            overflow: 'hidden',
            // A mask-image starts a new stacking context, which isolates
            // blend modes for everything painted inside it — see the belt
            // track below, which needs the same fix for the same reason.
            backgroundColor: soft.ground,
            maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: 'max-content',
              gap: { xs: 3, md: 4 },
              // Every non-`none` `transform` — including this belt's, mid-
              // animation, on every frame but the one where it's exactly
              // translateX(0) — starts a stacking context exactly like the
              // mask above, and isolates blending the same way: the logos'
              // `mix-blend-mode: multiply` two levels down would see only
              // THIS box's own background, not the mask wrapper's a level
              // out, let alone the Section's ground several parents further.
              // Both isolating boxes need the ground painted on them, or a
              // multiply blend anywhere inside has nothing real to multiply
              // against and quietly does nothing — which is exactly what
              // happened before this line existed.
              backgroundColor: soft.ground,
              animation: 'trustBarBelt 34s linear infinite',
              '@keyframes trustBarBelt': {
                from: { transform: 'translateX(0)' },
                to: { transform: 'translateX(-50%)' },
              },
              // Paused, not stopped: a visitor reaching for a logo gets a
              // steady target, and letting go picks the motion back up.
              '@media (hover: hover)': { '&:hover': { animationPlayState: 'paused' } },
              '&:focus-within': { animationPlayState: 'paused' },
              // No motion: the belt collapses back to the one real lap,
              // wrapped like an ordinary row — every decorative repeat
              // below is `display: none` for the same query.
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
                width: 'auto',
                flexWrap: 'wrap',
                justifyContent: 'center',
              },
            }}
          >
            {belt.map((partner, i) => {
              const real = i < partners.length;
              return (
                <Box
                  key={i}
                  component="a"
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={partner.name}
                  aria-hidden={real ? undefined : true}
                  tabIndex={real ? undefined : -1}
                  sx={[
                    quietLinkSx,
                    {
                      // No card: just the logo, floating on the section's own
                      // ground. The link is still the full slot (quietLinkSx's
                      // focus ring included), so hover/focus/hit area match the
                      // image rather than hugging its non-transparent pixels.
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      height: { xs: 64, md: 80 },
                      px: 2.5,
                      py: 1.5,
                      '@media (hover: hover)': {
                        '&:hover .partner-logo': { opacity: 1, filter: 'grayscale(0)' },
                      },
                      '&:focus-visible .partner-logo': { opacity: 1, filter: 'grayscale(0)' },
                      '@media (prefers-reduced-motion: reduce)': { display: real ? 'flex' : 'none' },
                    },
                  ]}
                >
                  <Box
                    component="img"
                    className="partner-logo"
                    src={partner.logo}
                    alt={partner.name}
                    loading={real ? undefined : 'lazy'}
                    sx={{
                      maxHeight: '100%',
                      maxWidth: 180,
                      objectFit: 'contain',
                      opacity: 0.85,
                      filter: 'grayscale(0.4)',
                      // Every partner logo file is a flat opaque rectangle — a
                      // pure-white fill behind the mark, no real alpha (checked
                      // pixel by pixel; the .jpeg can't even carry one). Multiply
                      // is the standard fix for that: on the section's own flat,
                      // light ground, white multiplies away to the ground colour
                      // and only the ink stays visible, edges antialiased along
                      // with it — no cutout, no fringe, and it still tracks the
                      // ground if a future edit changes it.
                      mixBlendMode: 'multiply',
                      transition: `opacity ${motion.base}, filter ${motion.base}`,
                      // A filter (or a blend mode) is invisible to forced-colors'
                      // own repaint, and multiply against an unpredictable
                      // high-contrast ground can turn the mark illegible — both
                      // are reset with it, back to a plain opaque logo.
                      '@media (forced-colors: active)': { opacity: 1, filter: 'none', mixBlendMode: 'normal' },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </AnimateOnScroll>
    </Section>
  );
};
