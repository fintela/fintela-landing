import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface DataTableProps {
  headers: string[];
  rows: ReactNode[][];
  /** Column widths as CSS grid template (e.g. "1fr 2fr 1fr"). */
  cols?: string;
}

export const DataTable = ({ headers, rows, cols }: DataTableProps) => {
  const gridTemplateColumns =
    cols ?? headers.map(() => '1fr').join(' ');

  return (
    <Box
      sx={{
        my: 3,
        borderRadius: 2.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns,
          bgcolor: '#fafbfc',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {headers.map((h, idx) => (
          <Box
            key={idx}
            sx={{
              px: { xs: 1.25, md: 2 },
              py: 1.25,
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'text.disabled',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              borderRight: idx < headers.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            {h}
          </Box>
        ))}
      </Box>

      {/* Body */}
      <Box sx={{ overflowX: 'auto' }}>
        {rows.map((row, ridx) => (
          <Box
            key={ridx}
            sx={{
              display: 'grid',
              gridTemplateColumns,
              borderBottom: ridx < rows.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              transition: 'background 0.18s',
              '&:hover': { bgcolor: 'rgba(102,126,234,0.025)' },
            }}
          >
            {row.map((cell, cidx) => (
              <Box
                key={cidx}
                sx={{
                  px: { xs: 1.25, md: 2 },
                  py: 1.5,
                  fontSize: { xs: '0.85rem', md: '0.9rem' },
                  color: cidx === 0 ? 'text.primary' : 'text.secondary',
                  fontWeight: cidx === 0 ? 600 : 400,
                  lineHeight: 1.55,
                  borderRight: cidx < row.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  '& code': {
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.84em',
                    px: 0.5,
                    py: 0.15,
                    borderRadius: 0.75,
                    bgcolor: 'rgba(11,16,32,0.05)',
                    color: '#4a5de8',
                  },
                }}
              >
                {cell}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
