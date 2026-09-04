import { createTheme } from '@mui/material/styles';
import { palette, radii, shadows } from './tokens';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      // light/dark are derived automatically from `main` by createTheme.
      main: palette.blue,
      contrastText: '#ffffff',
    },
    secondary: {
      main: palette.crimson,
      contrastText: '#ffffff',
    },
    text: {
      primary: palette.text,
      secondary: palette.textMuted,
      disabled: palette.textSubtle,
    },
    background: {
      default: palette.surface,
      paper: palette.surface,
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
        body: {
          background: palette.surface,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
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
        sizeLarge: {
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 12,
          paddingBottom: 12,
          fontSize: '1rem',
        },
        contained: {
          boxShadow: shadows.brand,
          '&:hover': {
            boxShadow: shadows.brandStrong,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: palette.border,
          color: palette.text,
          '&:hover': {
            borderColor: palette.blue,
            color: palette.blue,
            background: 'rgba(47,99,149,0.04)',
          },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radii.lg,
          border: `1px solid ${palette.border}`,
          backgroundImage: 'none',
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
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radii.pill,
          fontWeight: 600,
        },
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
