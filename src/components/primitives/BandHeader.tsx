import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { SectionHeader } from './SectionHeader';

export interface BandHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  titleAccent?: ReactNode;
  description?: ReactNode;
  /** The band's lateral exit (a raised button), bottom-aligned on the header's row. */
  exit?: ReactNode;
}

/**
 * The header row of an asymmetric band: a left-aligned SectionHeader in a 7/5
 * grid whose right cell holds the exit, so the row itself is off-centre.
 * Below md the exit drops under the header.
 */
export const BandHeader = ({ eyebrow, title, titleAccent, description, exit }: BandHeaderProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: exit ? 'minmax(0, 7fr) minmax(0, 5fr)' : '1fr' },
      gap: { xs: 2.5, md: 4 },
      alignItems: 'end',
      mb: { xs: 5, md: 7 },
    }}
  >
    <SectionHeader
      align="left"
      eyebrow={eyebrow}
      title={title}
      titleAccent={titleAccent}
      description={description}
      gutter={false}
    />
    {exit && (
      <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, pb: 0.5 }}>
        {exit}
      </Box>
    )}
  </Box>
);
