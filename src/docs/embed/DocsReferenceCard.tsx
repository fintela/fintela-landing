import { Box, Typography, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import type { SxProps, Theme } from '@mui/material';
import { docRegistry } from '../registry';
import '../blocks';

export interface ReferenceRow {
  name: string;
  type?: string;
  required?: boolean;
  description: string;
}

export interface DocsReferenceCardProps {
  blockId?: string;
  /** Override or supplement the block title. */
  title?: string;
  /** Override or supplement the block summary. */
  description?: string;
  /** Explicit reference rows (for API params, config fields, etc.). */
  rows?: ReferenceRow[];
  /** Show a link to full docs. Default: true. */
  showLink?: boolean;
  sx?: SxProps<Theme>;
}

export const DocsReferenceCard = ({
  blockId,
  title,
  description,
  rows,
  showLink = true,
  sx,
}: DocsReferenceCardProps) => {
  const block = blockId ? docRegistry.getBlock(blockId) : undefined;
  const resolvedTitle = title ?? block?.meta.title;
  const resolvedDescription = description ?? block?.meta.summary;
  const docsHref = block ? `/documentation/${block.meta.docPath}` : undefined;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        bgcolor: '#fff',
        ...sx,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 2.5,
          py: 1.75,
          borderBottom: rows ? '1px solid' : 'none',
          borderColor: 'divider',
        }}
      >
        <DescriptionOutlinedIcon sx={{ fontSize: 16, color: '#667eea', flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {resolvedTitle && (
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary', mb: resolvedDescription ? 0.25 : 0 }}>
              {resolvedTitle}
            </Typography>
          )}
          {resolvedDescription && (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>
              {resolvedDescription}
            </Typography>
          )}
        </Box>
        {showLink && docsHref && (
          <Box
            component={RouterLink}
            to={docsHref}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#667eea',
              textDecoration: 'none',
              flexShrink: 0,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Docs
            <OpenInNewIcon sx={{ fontSize: 11 }} />
          </Box>
        )}
      </Box>

      {/* Reference rows */}
      {rows && rows.length > 0 && (
        <Box>
          {rows.map((row, idx) => (
            <Box key={row.name}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  gap: 2,
                  px: 2.5,
                  py: 1.25,
                  alignItems: 'baseline',
                }}
              >
                <Box>
                  <Box
                    component="code"
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#667eea',
                      bgcolor: 'rgba(102,126,234,0.07)',
                      px: 0.75,
                      py: 0.2,
                      borderRadius: 0.75,
                    }}
                  >
                    {row.name}
                  </Box>
                  {row.type && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.25 }}>
                      {row.type}
                    </Typography>
                  )}
                  {row.required !== undefined && (
                    <Typography
                      sx={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        mt: 0.25,
                        color: row.required ? '#ef4444' : '#10b981',
                      }}
                    >
                      {row.required ? 'required' : 'optional'}
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.55 }}>
                  {row.description}
                </Typography>
              </Box>
              {idx < rows.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
