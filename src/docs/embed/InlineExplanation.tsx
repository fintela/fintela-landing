import { useState, useRef, type ReactNode } from 'react';
import {
  Box,
  Popover,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { docRegistry } from '../registry';
import '../blocks';

export interface InlineExplanationProps {
  blockId: string;
  /**
   * popover — opens a floating popover anchored to the trigger icon
   * expand  — expands content inline below the trigger
   */
  mode?: 'popover' | 'expand';
  /** Custom trigger element. Defaults to a "?" icon button. */
  trigger?: ReactNode;
  /** Show a link to the full docs page. Default: true. */
  showViewFull?: boolean;
}

export const InlineExplanation = ({
  blockId,
  mode = 'popover',
  trigger,
  showViewFull = true,
}: InlineExplanationProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const block = docRegistry.getBlock(blockId);
  if (!block) return null;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (mode === 'popover') setAnchorEl(e.currentTarget);
    else setExpanded((v) => !v);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setExpanded(false);
  };

  const defaultTrigger = (
    <Tooltip title={`What is ${block.meta.title}?`} placement="top">
      <IconButton
        ref={triggerRef}
        size="small"
        onClick={handleOpen}
        aria-label={`Explanation: ${block.meta.title}`}
        sx={{
          width: 18,
          height: 18,
          color: '#667eea',
          bgcolor: 'rgba(102,126,234,0.08)',
          border: '1px solid rgba(102,126,234,0.18)',
          '&:hover': { bgcolor: 'rgba(102,126,234,0.14)' },
          verticalAlign: 'middle',
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 12 }} />
      </IconButton>
    </Tooltip>
  );

  if (mode === 'expand') {
    return (
      <Box component="span">
        <Box component="span" onClick={handleOpen} sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', ml: 0.5 }}>
          {trigger ?? defaultTrigger}
        </Box>
        <Collapse in={expanded} timeout={200}>
          <Box
            sx={{
              mt: 1.5,
              p: 2,
              border: '1px solid rgba(102,126,234,0.18)',
              bgcolor: 'rgba(102,126,234,0.03)',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#667eea' }}>
                {block.meta.title}
              </Typography>
              <IconButton size="small" onClick={handleClose} sx={{ mt: -0.5, mr: -0.5 }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              {block.render('compact')}
            </Box>
            {showViewFull && (
              <Box
                component={RouterLink}
                to={`/documentation/${block.meta.docPath}`}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  mt: 1.5,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#667eea',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                View full docs
                <OpenInNewIcon sx={{ fontSize: 11 }} />
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    );
  }

  // popover mode
  return (
    <Box component="span">
      <Box component="span" onClick={handleOpen} sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', ml: 0.5 }}>
        {trigger ?? defaultTrigger}
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{
          '& .MuiPopover-paper': {
            width: 320,
            p: 2,
            borderRadius: 2.5,
            border: '1px solid rgba(102,126,234,0.18)',
            boxShadow: '0 14px 40px rgba(11,16,32,0.14)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.25 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>
            {block.meta.title}
          </Typography>
          <IconButton size="small" onClick={handleClose} sx={{ mt: -0.5, mr: -0.5 }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          {block.render('compact')}
        </Box>
        {showViewFull && (
          <Box
            component={RouterLink}
            to={`/documentation/${block.meta.docPath}`}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              mt: 1.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#667eea',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            View full docs
            <OpenInNewIcon sx={{ fontSize: 11 }} />
          </Box>
        )}
      </Popover>
    </Box>
  );
};
