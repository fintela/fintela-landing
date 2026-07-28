import { Box, Chip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { gradients } from '../../theme/tokens';

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  /** Optional highlighted span that follows the title with a brand gradient. */
  titleAccent?: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  /** Variant for the eyebrow chip. */
  eyebrowTone?: 'soft' | 'gradient';
}

export const SectionHeader = ({
  eyebrow,
  title,
  titleAccent,
  description,
  align = 'center',
  eyebrowTone = 'soft',
}: SectionHeaderProps) => {
  return (
    <Box
      sx={{
        textAlign: align,
        mb: { xs: 5, md: 8 },
        maxWidth: align === 'center' ? 720 : '100%',
        mx: align === 'center' ? 'auto' : 0,
      }}
    >
      {eyebrow && (
        <AnimateOnScroll>
          <Chip
            label={eyebrow}
            sx={{
              mb: 2.5,
              height: 26,
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              fontWeight: 700,
              ...(eyebrowTone === 'gradient'
                ? { background: gradients.brand, color: '#fff' }
                : {
                    bgcolor: 'rgba(102,126,234,0.08)',
                    color: '#667eea',
                    border: '1px solid rgba(102,126,234,0.18)',
                  }),
            }}
          />
        </AnimateOnScroll>
      )}
      <AnimateOnScroll delay={80}>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
            color: 'text.primary',
            mb: description ? 2 : 0,
          }}
        >
          {title}
          {titleAccent && (
            <>
              {' '}
              <Box
                component="span"
                sx={{
                  background: gradients.brand,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {titleAccent}
              </Box>
            </>
          )}
        </Typography>
      </AnimateOnScroll>
      {description && (
        <AnimateOnScroll delay={140}>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '1rem', md: '1.125rem' },
              maxWidth: align === 'center' ? 640 : '100%',
              mx: align === 'center' ? 'auto' : 0,
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        </AnimateOnScroll>
      )}
    </Box>
  );
};
