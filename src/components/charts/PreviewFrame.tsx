import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { fonts, preview, radii } from '../../theme/tokens';

export interface PreviewFrameProps {
  /** A short mono label at the top left, naming what the frame shows. */
  label?: ReactNode;
  /** The right end of the top row: a counter or a status. */
  meta?: ReactNode;
  /** Under the body: the "Illustrative data" note, controls. */
  footer?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * The dark frame every schematic visual on the home page sits in: a light
 * canvas with dark previews. It pins its own colours (the page forces a light
 * colour scheme) and its own text colour, so nothing inside inherits the
 * canvas's ink.
 */
export const PreviewFrame = ({ label, meta, footer, children, sx }: PreviewFrameProps) => (
  <Box
    sx={
      [
        {
          colorScheme: 'dark',
          background: preview.ground,
          color: preview.text,
          borderRadius: { xs: `${radii.neuCardSm}px`, md: `${radii.neuCard}px` },
          boxShadow: `inset 0 0 0 1px ${preview.line}`,
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1.5, sm: 2 },
          minWidth: 0,
          '@media (forced-colors: active)': { border: '1px solid CanvasText', boxShadow: 'none' },
          '@media print': { background: '#fff', color: '#000', border: '1px solid #000', boxShadow: 'none' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
  >
    {(label || meta) && (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 20, fontFamily: fonts.mono, fontSize: '0.72rem', color: preview.textMuted }}>
        <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </Box>
        <Box component="span" sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {meta}
        </Box>
      </Box>
    )}
    {children}
    {footer}
  </Box>
);

/** The note under every visual that shows a result: these numbers are an example. */
export const IllustrativeNote = ({ children }: { children: ReactNode }) => (
  <Box sx={{ fontSize: '0.72rem', lineHeight: 1.4, color: preview.textMuted }}>{children}</Box>
);
