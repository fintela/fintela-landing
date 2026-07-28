import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { SxProps, Theme } from '@mui/material';
import { docRegistry } from '../registry';
import '../blocks';

export interface MiniWorkflowStep {
  number: number;
  title: string;
  description: string;
}

export interface MiniWorkflowGuideProps {
  /**
   * Provide steps directly, OR provide a blockId whose compact mode renders steps.
   * If both are provided, explicit steps take precedence.
   */
  blockId?: string;
  steps?: MiniWorkflowStep[];
  title?: string;
  showViewFull?: boolean;
  /** Accent color for the step numbers. Defaults to brand indigo. */
  accentColor?: string;
  sx?: SxProps<Theme>;
}

export const MiniWorkflowGuide = ({
  blockId,
  steps,
  title,
  showViewFull = true,
  accentColor = '#667eea',
  sx,
}: MiniWorkflowGuideProps) => {
  const block = blockId ? docRegistry.getBlock(blockId) : undefined;
  const resolvedTitle = title ?? block?.meta.title;
  const docsHref = block ? `/documentation/${block.meta.docPath}` : undefined;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        ...sx,
      }}
    >
      {/* Header */}
      {(resolvedTitle || showViewFull) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(11,16,32,0.02)',
          }}
        >
          {resolvedTitle && (
            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>
              {resolvedTitle}
            </Typography>
          )}
          {showViewFull && docsHref && (
            <Box
              component={RouterLink}
              to={docsHref}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.25,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: accentColor,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View full guide
              <OpenInNewIcon sx={{ fontSize: 11 }} />
            </Box>
          )}
        </Box>
      )}

      {/* Steps or block content */}
      <Box sx={{ px: 2.5, py: 2 }}>
        {steps ? (
          <ExplicitSteps steps={steps} accentColor={accentColor} />
        ) : block ? (
          <Box sx={{ fontSize: '0.875rem', '& > p': { m: 0 } }}>
            {block.render('embedded')}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

const ExplicitSteps = ({
  steps,
  accentColor,
}: {
  steps: MiniWorkflowStep[];
  accentColor: string;
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {steps.map((step, idx) => (
      <Box key={step.number} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box
          sx={{
            flexShrink: 0,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor} 0%, #f093fb 100%)`,
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"JetBrains Mono", monospace',
            boxShadow: `0 2px 8px ${accentColor}30`,
            mt: '1px',
          }}
        >
          {step.number}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary', mb: 0.25 }}>
            {step.title}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.55 }}>
            {step.description}
          </Typography>
        </Box>
        {idx < steps.length - 1 && (
          <Box
            sx={{
              position: 'absolute',
              width: 1,
              height: 16,
              bgcolor: 'divider',
              left: 11,
              top: 26,
            }}
          />
        )}
      </Box>
    ))}
  </Box>
);
