import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface ParamRow {
  name: string;
  type: string;
  required?: boolean;
  description: ReactNode;
  /** Default value shown next to the type. */
  default?: string;
}

interface ParamTableProps {
  /** Optional table caption shown as an eyebrow above. */
  caption?: string;
  rows: ParamRow[];
}

export const ParamTable = ({ caption, rows }: ParamTableProps) => {
  return (
    <Box sx={{ my: 3 }}>
      {caption && (
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'text.disabled',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          {caption}
        </Typography>
      )}
      <Box
        sx={{
          borderRadius: 2.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fff',
        }}
      >
        {rows.map((row, idx) => (
          <Box
            key={row.name + idx}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '220px 1fr' },
              borderBottom: idx < rows.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              p: { xs: 1.75, md: 2 },
              gap: { xs: 0.5, md: 2 },
              transition: 'background 0.16s',
              '&:hover': { bgcolor: 'rgba(102,126,234,0.025)' },
            }}
          >
            <Box>
              <Box
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  wordBreak: 'break-word',
                }}
              >
                {row.name}
              </Box>
              <Box
                sx={{
                  mt: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.72rem',
                    color: '#667eea',
                    fontWeight: 600,
                  }}
                >
                  {row.type}
                </Box>
                {row.required && (
                  <Box
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#ef4444',
                      bgcolor: 'rgba(239,68,68,0.08)',
                      px: 0.75,
                      py: 0.15,
                      borderRadius: 1,
                    }}
                  >
                    Required
                  </Box>
                )}
                {row.default && (
                  <Box
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.68rem',
                      color: 'text.disabled',
                    }}
                  >
                    default: {row.default}
                  </Box>
                )}
              </Box>
            </Box>
            <Typography
              sx={{
                fontSize: '0.9rem',
                color: 'text.secondary',
                lineHeight: 1.6,
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
              {row.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
