import { Typography } from '@mui/material';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { soft } from '../../theme/tokens';

/**
 * A left-aligned sub-heading for a content block that lives inside an
 * existing Section (not a new one): an eyebrow, a title, and an optional
 * description. Used to stack several distinct capability blocks on one page
 * (e.g. Fintela API, In-Depth Analysis) without each needing its own Section.
 */
export const BlockHeading = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) => (
  <AnimateOnScroll>
    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: soft.accent, mb: 1 }}>
      {eyebrow}
    </Typography>
    <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.85rem' }, color: soft.text, mb: description ? 1 : 3, letterSpacing: '-0.01em' }}>
      {title}
    </Typography>
    {description && (
      <Typography sx={{ color: soft.textSecondary, fontSize: '0.98rem', lineHeight: 1.6, maxWidth: 680, mb: 3 }}>
        {description}
      </Typography>
    )}
  </AnimateOnScroll>
);
