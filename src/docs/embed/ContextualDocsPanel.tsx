import { useState } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { docRegistry } from '../registry';
import type { AppContext } from '../registry/types';
import '../blocks';

export interface ContextualDocsPanelProps {
  open: boolean;
  onClose: () => void;
  /** Explicit block IDs to show. When omitted, uses appContext to resolve blocks. */
  blockIds?: string[];
  /** Resolve relevant blocks from this app context (used when blockIds is not set). */
  appContext?: AppContext;
  /** Panel title shown in the header. */
  title?: string;
  anchor?: 'right' | 'left' | 'bottom';
  /** Width of the panel (right/left anchors only). */
  width?: number | string;
}

export const ContextualDocsPanel = ({
  open,
  onClose,
  blockIds,
  appContext,
  title = 'Documentation',
  anchor = 'right',
  width = 420,
}: ContextualDocsPanelProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const resolvedIds = blockIds ??
    (appContext ? docRegistry.getByAppContext(appContext).map((b) => b.meta.id) : []);

  const blocks = resolvedIds
    .map((id) => docRegistry.getBlock(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof docRegistry.getBlock>>[];

  const drawerSx =
    anchor === 'bottom'
      ? {
          '& .MuiDrawer-paper': {
            height: '65vh',
            bgcolor: '#fff',
            backgroundImage: 'none',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }
      : {
          '& .MuiDrawer-paper': {
            width,
            bgcolor: '#fff',
            backgroundImage: 'none',
          },
        };

  return (
    <Drawer anchor={anchor} open={open} onClose={onClose} sx={drawerSx}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          bgcolor: '#fff',
          zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookOutlinedIcon sx={{ fontSize: 18, color: '#667eea' }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close panel">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {blocks.length === 0 ? (
        <Box sx={{ px: 3, py: 4, color: 'text.secondary', fontSize: '0.9rem' }}>
          No documentation available for this context.
        </Box>
      ) : blocks.length === 1 ? (
        <SingleBlockView block={blocks[0]} />
      ) : (
        <MultiBlockView
          blocks={blocks}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </Drawer>
  );
};

const SingleBlockView = ({
  block,
}: {
  block: NonNullable<ReturnType<typeof docRegistry.getBlock>>;
}) => (
  <Box sx={{ px: 2.5, py: 2.5, overflowY: 'auto', flex: 1 }}>
    <Box
      sx={{
        '& > p:first-of-type': { mt: 0 },
        fontSize: '0.9rem',
      }}
    >
      {block.render('embedded')}
    </Box>
    <Divider sx={{ my: 2.5 }} />
    <Box
      component={RouterLink}
      to={`/documentation/${block.meta.docPath}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: '0.8rem',
        fontWeight: 600,
        color: '#667eea',
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      View full documentation
      <OpenInNewIcon sx={{ fontSize: 13 }} />
    </Box>
  </Box>
);

const MultiBlockView = ({
  blocks,
  activeTab,
  onTabChange,
}: {
  blocks: NonNullable<ReturnType<typeof docRegistry.getBlock>>[];
  activeTab: number;
  onTabChange: (idx: number) => void;
}) => {
  const active = blocks[activeTab];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Tabs
        value={activeTab}
        onChange={(_, v) => onTabChange(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 44,
          '& .MuiTab-root': {
            fontSize: '0.78rem',
            fontWeight: 600,
            minHeight: 44,
            px: 2,
            textTransform: 'none',
          },
          '& .Mui-selected': { color: '#667eea' },
          '& .MuiTabs-indicator': { bgcolor: '#667eea' },
        }}
      >
        {blocks.map((b) => (
          <Tab key={b.meta.id} label={b.meta.title} />
        ))}
      </Tabs>
      {active && (
        <Box sx={{ px: 2.5, py: 2.5, overflowY: 'auto', flex: 1 }}>
          <Box sx={{ '& > p:first-of-type': { mt: 0 }, fontSize: '0.9rem' }}>
            {active.render('embedded')}
          </Box>
          <Divider sx={{ my: 2.5 }} />
          <Box
            component={RouterLink}
            to={`/documentation/${active.meta.docPath}`}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#667eea',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            View full documentation
            <OpenInNewIcon sx={{ fontSize: 13 }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};
