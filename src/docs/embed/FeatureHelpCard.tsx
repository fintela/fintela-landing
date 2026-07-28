import { Box, Typography, Chip, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { SxProps, Theme } from '@mui/material';
import { docRegistry } from '../registry';
import '../blocks';

export interface FeatureHelpCardProps {
  blockId: string;
  /** Show complexity badge. Default: true. */
  showComplexity?: boolean;
  /** Show related blocks links. Default: true if relatedBlocks > 0. */
  showRelated?: boolean;
  /** Show feature tags as chips. Default: false. */
  showTags?: boolean;
  /** Show a "Read the docs" link. Default: true. */
  showLink?: boolean;
  sx?: SxProps<Theme>;
}

const complexityColor: Record<string, string> = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

export const FeatureHelpCard = ({
  blockId,
  showComplexity = true,
  showRelated = true,
  showTags = false,
  showLink = true,
  sx,
}: FeatureHelpCardProps) => {
  const block = docRegistry.getBlock(blockId);
  if (!block) return null;

  const related = showRelated
    ? block.meta.relatedBlocks
        .map((id) => docRegistry.getBlock(id))
        .filter(Boolean)
    : [];

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        bgcolor: '#fff',
        transition: 'box-shadow 0.18s, border-color 0.18s',
        '&:hover': {
          borderColor: 'rgba(102,126,234,0.3)',
          boxShadow: '0 6px 20px rgba(11,16,32,0.07)',
        },
        ...sx,
      }}
    >
      {/* Top accent line */}
      <Box
        sx={{
          height: 3,
          background: 'linear-gradient(90deg, #667eea 0%, #f093fb 50%, #fbbf24 100%)',
        }}
      />

      <Box sx={{ p: 2.5 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary', lineHeight: 1.3 }}>
            {block.meta.title}
          </Typography>
          {showComplexity && (
            <Chip
              label={block.meta.complexity}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 700,
                flexShrink: 0,
                bgcolor: `${complexityColor[block.meta.complexity]}15`,
                color: complexityColor[block.meta.complexity],
                border: 'none',
              }}
            />
          )}
        </Box>

        {/* Summary */}
        <Typography
          sx={{
            fontSize: '0.85rem',
            color: 'text.secondary',
            lineHeight: 1.6,
            mb: (showTags && block.meta.tags.length > 0) || related.length > 0 || showLink ? 2 : 0,
          }}
        >
          {block.meta.summary}
        </Typography>

        {/* Tags */}
        {showTags && block.meta.tags.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
            {block.meta.tags.slice(0, 5).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  bgcolor: 'rgba(11,16,32,0.05)',
                  color: 'text.secondary',
                  border: 'none',
                }}
              />
            ))}
          </Stack>
        )}

        {/* Related blocks */}
        {related.length > 0 && (
          <Box sx={{ mb: showLink ? 2 : 0 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.75 }}>
              Related
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {related.map((r) =>
                r ? (
                  <Box
                    key={r.meta.id}
                    component={RouterLink}
                    to={`/documentation/${r.meta.docPath}`}
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#667eea',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.25,
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {r.meta.title}
                    <ArrowForwardIcon sx={{ fontSize: 10 }} />
                  </Box>
                ) : null,
              )}
            </Stack>
          </Box>
        )}

        {/* Docs link */}
        {showLink && (
          <Box
            component={RouterLink}
            to={`/documentation/${block.meta.docPath}`}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#667eea',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Read the docs
            <OpenInNewIcon sx={{ fontSize: 12 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};
