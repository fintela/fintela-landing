import { useState, type ReactNode } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { SxProps, Theme } from '@mui/material';
import { docRegistry } from '../registry';
import '../blocks';

export interface ExpandableDocsProps {
  blockId: string;
  /** Content shown in the collapsed state. Defaults to the block's compact render. */
  previewContent?: ReactNode;
  defaultExpanded?: boolean;
  /** Show a "View full docs" link. Default: true. */
  showViewFull?: boolean;
  /** Visual style. */
  variant?: 'default' | 'borderless';
  sx?: SxProps<Theme>;
}

export const ExpandableDocs = ({
  blockId,
  previewContent,
  defaultExpanded = false,
  showViewFull = true,
  variant = 'default',
  sx,
}: ExpandableDocsProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const block = docRegistry.getBlock(blockId);
  if (!block) return null;

  const preview = previewContent ?? block.render('compact');

  return (
    <Box
      sx={{
        ...(variant === 'default' && {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2.5,
          overflow: 'hidden',
        }),
        ...sx,
      }}
    >
      {/* Toggle header */}
      <Box
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: variant === 'default' ? 2.5 : 0,
          py: variant === 'default' ? 1.5 : 1,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.16s',
          '&:hover': variant === 'default'
            ? { bgcolor: 'rgba(11,16,32,0.02)' }
            : undefined,
        }}
        aria-expanded={expanded}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookOutlinedIcon sx={{ fontSize: 15, color: '#667eea', flexShrink: 0 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>
            {block.meta.title}
          </Typography>
        </Box>
        <IconButton
          size="small"
          tabIndex={-1}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            color: 'text.disabled',
          }}
          aria-hidden
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Preview (always visible) */}
      {!expanded && (
        <Box
          sx={{
            px: variant === 'default' ? 2.5 : 0,
            pb: variant === 'default' ? 1.5 : 1,
            pt: 0,
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          {preview}
        </Box>
      )}

      {/* Expanded content */}
      <Collapse in={expanded} timeout={240}>
        <Box
          sx={{
            px: variant === 'default' ? 2.5 : 0,
            pb: variant === 'default' ? 2 : 1,
            pt: variant === 'default' ? 0 : 1,
            borderTop: variant === 'default' ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ pt: variant === 'default' ? 2 : 0, '& > p:first-of-type': { mt: 0 } }}>
            {block.render('embedded')}
          </Box>
          {showViewFull && (
            <Box
              component={RouterLink}
              to={`/documentation/${block.meta.docPath}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.25,
                mt: 2,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#667eea',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View full documentation
              <OpenInNewIcon sx={{ fontSize: 11 }} />
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
