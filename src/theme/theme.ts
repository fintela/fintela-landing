import { createTheme } from '@mui/material/styles';
import { motion, palette, radii, shadows, soft } from './tokens';

/**
 * The theme carries only what cannot be expressed per element: the ground,
 * the focus ring, and the surfaces MUI paints on its own (inputs, portals,
 * alerts, tooltips). Every card, chip, button and divider is a recipe from
 * ./neu.ts applied through `sx`; MuiButton has no contained/outlined/text
 * override so NeuButton (variant="text") is never restyled by the theme.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      // light/dark are derived automatically from `main` by createTheme.
      main: palette.navy,
      contrastText: '#ffffff',
    },
    secondary: {
      main: palette.navyDeep,
      contrastText: '#ffffff',
    },
    text: {
      primary: palette.text,
      secondary: palette.textMuted,
      disabled: palette.textSubtle,
    },
    background: {
      default: soft.ground,
      paper: soft.surfaceRaised,
    },
    divider: palette.border,
    success: { main: palette.success },
    warning: { main: palette.warning },
    error: { main: palette.danger },
    info: { main: palette.info },
  },
  shape: {
    borderRadius: radii.md,
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontWeight: 800,
      lineHeight: 1.05,
      letterSpacing: '-0.035em',
    },
    h2: {
      fontWeight: 800,
      lineHeight: 1.12,
      letterSpacing: '-0.03em',
    },
    h3: {
      fontWeight: 800,
      lineHeight: 1.18,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
    },
    h6: {
      fontWeight: 700,
      lineHeight: 1.35,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.65,
    },
    body2: {
      fontSize: '0.9rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      letterSpacing: 0,
    },
    overline: {
      fontWeight: 700,
      fontSize: '0.7rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // The one owner of the ground. colorScheme pins light on <html>, which
        // portals (Drawer, Menu, Modal, Tooltip) inherit: an auto-darkened
        // ground inverts every white highlight into a smear.
        html: { colorScheme: 'light' },
        body: {
          background: soft.ground,
          '@media print': { background: soft.white },
        },
      },
    },
    MuiButtonBase: {
      // A ripple over a pressed well reads wrong; the outline below replaces
      // the focus ripple. Every ButtonBase control (IconButton, MenuItem,
      // ToggleButton, AccordionSummary, Tab) inherits both.
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          '&:focus-visible, &.Mui-focusVisible': {
            outline: `2px solid ${soft.accent}`,
            outlineOffset: 3,
          },
          '@media (forced-colors: active)': {
            '&:focus-visible, &.Mui-focusVisible': {
              outline: '3px solid Highlight',
              outlineOffset: 3,
            },
          },
        },
      },
    },
    MuiIconButton: {
      // IconButton keeps a gray `&:hover` fill whenever ITS OWN disableRipple
      // prop is falsy (the ButtonBase default above does not reach its
      // ownerState), and that fill sticks after a tap on touch devices.
      defaultProps: { disableRipple: true },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Byte-for-byte the flat theme's root; NeuButton overrides every value
        // here through sx. `sizeLarge`, `contained` and `outlined` are
        // deleted: no raw contained/outlined Button remains, and a `text`
        // override must never be added — NeuButton depends on its absence.
        root: {
          textTransform: 'none',
          borderRadius: radii.sm,
          fontWeight: 600,
          paddingLeft: 18,
          paddingRight: 18,
          paddingTop: 10,
          paddingBottom: 10,
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radii.lg,
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        // A slab of ground floating over the scrim. The shadow falls away
        // from the scrim edge: a white highlight there paints as a hairline.
        paper: {
          backgroundColor: soft.ground,
          backgroundImage: 'none',
          borderRadius: 0,
          border: 0,
          '&.MuiDrawer-paperAnchorRight': { boxShadow: shadows.neuFloatLeft },
          '&.MuiDrawer-paperAnchorLeft': { boxShadow: shadows.neuFloatRight },
          '@media (forced-colors: active)': {
            boxShadow: 'none',
            '&.MuiDrawer-paperAnchorRight': { borderLeft: '1px solid CanvasText' },
            '&.MuiDrawer-paperAnchorLeft': { borderRight: '1px solid CanvasText' },
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: soft.surfaceRaised,
          backgroundImage: 'none',
          border: '1px solid transparent',
          borderRadius: radii.neuInner,
          boxShadow: shadows.neuFloat,
          marginTop: 8,
          minWidth: 160,
          padding: 6,
          '@media (forced-colors: active)': { boxShadow: 'none', borderColor: 'CanvasText' },
        },
        list: { padding: 0 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: soft.deep,
          color: soft.white,
          fontSize: '0.75rem',
          fontWeight: 600,
          borderRadius: radii.neuWell,
          padding: '6px 10px',
          boxShadow: shadows.neuFloat,
        },
        arrow: { color: soft.deep },
      },
    },
    MuiCollapse: {
      styleOverrides: {
        root: {
          '@media (prefers-reduced-motion: reduce)': { transition: 'none !important' },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        // A raised tile; the severity colour lives on the icon only.
        root: {
          backgroundColor: soft.surfaceRaised,
          color: soft.text,
          border: '1px solid transparent',
          borderRadius: radii.neuInner,
          boxShadow: shadows.neuRaisedSm,
          '@media (forced-colors: active)': { boxShadow: 'none', borderColor: 'CanvasText' },
          '@media print': { boxShadow: 'none', borderColor: soft.deep },
        },
        standardSuccess: { '& .MuiAlert-icon': { color: palette.success } },
        standardError: { '& .MuiAlert-icon': { color: palette.danger } },
        standardWarning: { '& .MuiAlert-icon': { color: palette.warning } },
        standardInfo: { '& .MuiAlert-icon': { color: palette.info } },
        action: { '& .MuiIconButton-root': { color: soft.textSecondary } },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        // A sunken well. Focus and error are outlines, never entries appended
        // to the box-shadow list, so the well never flattens on focus and
        // forced-colors gets a Highlight ring for free.
        root: {
          backgroundColor: soft.groundSunken,
          borderRadius: radii.neuInner, // styleOverrides are raw CSS: 14 -> 14px
          boxShadow: shadows.neuInsetSm,
          transition: `box-shadow ${motion.fast}`,
          '& .MuiOutlinedInput-notchedOutline': { border: 0 },
          '&:hover': { boxShadow: shadows.neuInset },
          '&.Mui-focused': {
            boxShadow: shadows.neuInset,
            outline: `2px solid ${soft.accent}`,
            outlineOffset: 2,
          },
          '&.Mui-error': { outline: `2px solid ${palette.danger}`, outlineOffset: 2 },
          '&.Mui-disabled': { boxShadow: shadows.neuInsetXs, opacity: 0.7 },
          '@media (forced-colors: active)': {
            boxShadow: 'none',
            border: '1px solid CanvasText',
            '&.Mui-focused': { outline: '3px solid Highlight' },
          },
          '@media print': { boxShadow: 'none', border: `1px solid ${soft.deep}` },
        },
        input: {
          color: soft.text,
          '&::placeholder': { color: soft.textSecondary, opacity: 1 },
          // Chrome autofill paints its own pale blue; repaint the well.
          '&:-webkit-autofill': {
            WebkitBoxShadow: `0 0 0 100px ${soft.groundSunken} inset`,
            WebkitTextFillColor: soft.text,
            borderRadius: 'inherit',
          },
        },
      },
    },
    MuiInputLabel: {
      // A well has no outline for a floating label to notch into, so the label
      // sits above it as a static caption instead of straddling the top edge.
      defaultProps: { shrink: true },
      styleOverrides: {
        root: {
          color: soft.textSecondary,
          '&.Mui-focused': { color: soft.accent },
          // Semantic colours are never text: the error is the field's red ring.
          '&.Mui-error': { color: soft.text },
        },
        outlined: {
          position: 'static',
          transform: 'none',
          maxWidth: '100%',
          marginBottom: 6,
          paddingLeft: 4,
          fontSize: '0.8125rem',
          fontWeight: 600,
          lineHeight: 1.3,
          '&.MuiInputLabel-shrink': { transform: 'none' },
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: { color: soft.textSecondary, '& .MuiSvgIcon-root': { color: soft.textSecondary } },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { color: soft.textSecondary, marginLeft: 12, '&.Mui-error': { color: soft.text } },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
    },
    MuiLink: {
      defaultProps: { underline: 'none' },
      styleOverrides: {
        root: {
          transition: 'color 0.18s ease',
        },
      },
    },
  },
});
