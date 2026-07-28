import { Box, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface NavPathProps {
  steps: string[];
}

/**
 * Renders a navigation breadcrumb path showing where a feature lives in the UI.
 * e.g. Registry → Strategies → Create Strategy
 */
export const NavPath = ({ steps }: NavPathProps) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      px: 1.5,
      py: 0.6,
      borderRadius: 1.5,
      bgcolor: 'rgba(102,126,234,0.07)',
      border: '1px solid rgba(102,126,234,0.18)',
      mb: 2,
      flexWrap: 'wrap',
    }}
  >
    {steps.map((step, idx) => (
      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: idx === steps.length - 1 ? 700 : 500,
            color: idx === steps.length - 1 ? '#667eea' : 'text.secondary',
            fontFamily: idx === steps.length - 1 ? '"JetBrains Mono", monospace' : 'inherit',
          }}
        >
          {step}
        </Typography>
        {idx < steps.length - 1 && (
          <ChevronRightIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        )}
      </Box>
    ))}
  </Box>
);
