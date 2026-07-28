import { useState } from 'react';
import { Box, Typography, Chip, Collapse, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined';
import type { SxProps, Theme } from '@mui/material';
import { docRegistry } from '../registry';
import type { AppContext } from '../registry/types';
import '../blocks';

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  GET: { bg: '#dcfce7', color: '#16a34a' },
  POST: { bg: 'rgba(102,126,234,0.1)', color: '#4a5de8' },
  PUT: { bg: '#fef9c3', color: '#ca8a04' },
  PATCH: { bg: '#fff7ed', color: '#ea580c' },
  DELETE: { bg: '#fee2e2', color: '#dc2626' },
};

export interface APIEndpointHint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  docsPath?: string;
}

export interface ContextualAPIHelpProps {
  /** App context to auto-resolve relevant API blocks. */
  appContext?: AppContext;
  /** Explicit block IDs to show related docs for. */
  blockIds?: string[];
  /** Explicit API endpoint hints to display. */
  endpoints?: APIEndpointHint[];
  title?: string;
  defaultExpanded?: boolean;
  sx?: SxProps<Theme>;
}

export const ContextualAPIHelp = ({
  appContext,
  blockIds,
  endpoints,
  title = 'API reference',
  defaultExpanded = false,
  sx,
}: ContextualAPIHelpProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const resolvedIds = blockIds ??
    (appContext
      ? docRegistry
          .getByAppContext(appContext)
          .filter((b) => b.meta.apiRelevance)
          .map((b) => b.meta.id)
      : []);

  const blocks = resolvedIds
    .map((id) => docRegistry.getBlock(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof docRegistry.getBlock>>[];

  const hasContent = endpoints || blocks.length > 0;
  if (!hasContent) return null;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'rgba(102,126,234,0.2)',
        borderRadius: 2.5,
        overflow: 'hidden',
        bgcolor: 'rgba(102,126,234,0.02)',
        ...sx,
      }}
    >
      {/* Header */}
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
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        aria-expanded={expanded}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ApiOutlinedIcon sx={{ fontSize: 16, color: '#667eea' }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
        <IconButton
          size="small"
          tabIndex={-1}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            color: 'text.disabled',
            width: 24,
            height: 24,
          }}
          aria-hidden
        >
          <ExpandMoreIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout={220}>
        <Box sx={{ borderTop: '1px solid rgba(102,126,234,0.12)', p: 2 }}>
          {/* Explicit endpoints */}
          {endpoints && endpoints.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: blocks.length > 0 ? 2 : 0 }}>
              {endpoints.map((ep, idx) => {
                const mc = METHOD_COLORS[ep.method] ?? METHOD_COLORS.GET;
                return (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Chip
                      label={ep.method}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        bgcolor: mc.bg,
                        color: mc.color,
                        border: 'none',
                        flexShrink: 0,
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        component="code"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: '0.78rem',
                          color: 'text.primary',
                          display: 'block',
                          mb: 0.25,
                        }}
                      >
                        {ep.path}
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.4 }}>
                        {ep.description}
                      </Typography>
                      {ep.docsPath && (
                        <Box
                          component={RouterLink}
                          to={`/documentation/${ep.docsPath}`}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.2,
                            mt: 0.25,
                            fontSize: '0.7rem',
                            color: '#667eea',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Reference
                          <OpenInNewIcon sx={{ fontSize: 10 }} />
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Related block summaries */}
          {blocks.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {blocks.map((b) => (
                <Box
                  key={b.meta.id}
                  component={RouterLink}
                  to={`/documentation/${b.meta.docPath}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(255,255,255,0.6)',
                    border: '1px solid',
                    borderColor: 'divider',
                    textDecoration: 'none',
                    transition: 'border-color 0.16s',
                    '&:hover': { borderColor: 'rgba(102,126,234,0.3)' },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.primary', mb: 0.15 }}>
                      {b.meta.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.meta.summary}
                    </Typography>
                  </Box>
                  <OpenInNewIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
