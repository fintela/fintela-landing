import { Box, Typography, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import type { SxProps, Theme } from '@mui/material';
import type { RenderMode } from '../registry/types';
import { docRegistry } from '../registry';
import '../blocks'; // ensure all blocks are registered

export interface EmbeddedDocsSectionProps {
  /** Stable block ID from the registry (e.g. 'strategies', 'data-clusters'). */
  blockId: string;
  /**
   * How to render the block content.
   * - embedded: full body without anchor heading — suitable for side panels and drawers
   * - compact:  summary card — suitable for onboarding and help widgets
   * - inline:   single sentence — suitable for inline tooltips
   */
  mode?: Exclude<RenderMode, 'full'>;
  /** Override the auto-detected title from block metadata. */
  title?: string;
  /** Show a link to the full documentation page. Default: true. */
  showViewFull?: boolean;
  /** Override the full-docs link (defaults to /documentation/{block.meta.docPath}). */
  docsHref?: string;
  /**
   * Visual variant.
   * default  — bordered card with subtle background
   * card     — elevated card (box-shadow)
   * bordered — border only, transparent background
   * ghost    — no border, no background (content only)
   */
  variant?: 'default' | 'card' | 'bordered' | 'ghost';
  /** Show the complexity badge (beginner / intermediate / advanced). */
  showComplexity?: boolean;
  sx?: SxProps<Theme>;
}

const complexityColors: Record<string, string> = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

export const EmbeddedDocsSection = ({
  blockId,
  mode = 'embedded',
  title,
  showViewFull = true,
  docsHref,
  variant = 'default',
  showComplexity = false,
  sx,
}: EmbeddedDocsSectionProps) => {
  const block = docRegistry.getBlock(blockId);

  if (!block) {
    if (import.meta.env.DEV) {
      return (
        <Box sx={{ p: 2, border: '1px dashed #ef4444', borderRadius: 1.5, color: '#ef4444', fontSize: '0.82rem' }}>
          [EmbeddedDocsSection] Block not found: <code>{blockId}</code>
        </Box>
      );
    }
    return null;
  }

  const resolvedTitle = title ?? block.meta.title;
  const resolvedHref = docsHref ?? `/documentation/${block.meta.docPath}`;

  const containerSx: SxProps<Theme> = {
    ...(variant === 'default' && {
      border: '1px solid',
      borderColor: 'rgba(102,126,234,0.18)',
      bgcolor: 'rgba(102,126,234,0.03)',
      borderRadius: 2.5,
      overflow: 'hidden',
    }),
    ...(variant === 'card' && {
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#fff',
      borderRadius: 2.5,
      boxShadow: '0 4px 14px rgba(11,16,32,0.07)',
      overflow: 'hidden',
    }),
    ...(variant === 'bordered' && {
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2.5,
      overflow: 'hidden',
    }),
    // ghost: no container styles
  };

  if (mode === 'inline') {
    return (
      <Box component="span" sx={sx}>
        {block.render('inline')}
      </Box>
    );
  }

  if (mode === 'compact') {
    return (
      <Box
        sx={{
          p: variant !== 'ghost' ? 2 : 0,
          ...containerSx,
          ...sx,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookOutlinedIcon sx={{ fontSize: 15, color: '#667eea' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
              {resolvedTitle}
            </Typography>
            {showComplexity && (
              <Chip
                label={block.meta.complexity}
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  bgcolor: `${complexityColors[block.meta.complexity]}18`,
                  color: complexityColors[block.meta.complexity],
                  border: 'none',
                }}
              />
            )}
          </Box>
          {showViewFull && (
            <Box
              component={RouterLink}
              to={resolvedHref}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: '0.72rem', color: '#667eea', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Docs
              <OpenInNewIcon sx={{ fontSize: 11 }} />
            </Box>
          )}
        </Box>
        {block.render('compact')}
      </Box>
    );
  }

  // embedded mode
  return (
    <Box sx={{ ...containerSx, ...sx }}>
      {/* Title bar */}
      {variant !== 'ghost' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 2.5,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: variant === 'default' ? 'rgba(102,126,234,0.12)' : 'divider',
            bgcolor: variant === 'default' ? 'rgba(102,126,234,0.04)' : 'rgba(11,16,32,0.02)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookOutlinedIcon sx={{ fontSize: 15, color: '#667eea', flexShrink: 0 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>
              {resolvedTitle}
            </Typography>
            {showComplexity && (
              <Chip
                label={block.meta.complexity}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  bgcolor: `${complexityColors[block.meta.complexity]}18`,
                  color: complexityColors[block.meta.complexity],
                  border: 'none',
                }}
              />
            )}
          </Box>
          {showViewFull && (
            <Box
              component={RouterLink}
              to={resolvedHref}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#667eea',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View full docs
              <OpenInNewIcon sx={{ fontSize: 12 }} />
            </Box>
          )}
        </Box>
      )}
      {/* Content */}
      <Box
        sx={{
          px: variant !== 'ghost' ? 2.5 : 0,
          py: variant !== 'ghost' ? 2 : 0,
          '& > p:first-of-type': { mt: 0 },
          '& > p:last-of-type': { mb: 0 },
        }}
      >
        {block.render('embedded')}
      </Box>
    </Box>
  );
};
