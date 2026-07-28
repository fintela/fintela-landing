/**
 * Fintela design tokens — single source of truth for color, gradient,
 * radius, shadow and motion. Import from here, not from raw hex values.
 */

export const palette = {
  // Brand
  indigo: '#667eea',
  indigoDark: '#4a5de8',
  indigoSoft: '#8b9fef',
  magenta: '#f093fb',
  magentaDark: '#e070f9',
  amber: '#fbbf24',

  // Neutrals — slightly warmer than pure gray for a softer fintech feel
  ink: '#0b1020',
  text: '#1a1a1f',
  textMuted: '#5b6478',
  textSubtle: '#8a93a6',

  surface: '#ffffff',
  surfaceMuted: '#fafbfc',
  surfaceAlt: '#f5f6fa',
  border: '#e8eaf1',
  borderStrong: '#d1d5e0',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
} as const;

export const gradients = {
  brand: 'linear-gradient(135deg, #667eea 0%, #f093fb 50%, #fbbf24 100%)',
  brandSoft:
    'linear-gradient(135deg, rgba(102,126,234,0.07) 0%, rgba(240,147,251,0.07) 50%, rgba(251,191,36,0.07) 100%)',
  brandFaint:
    'linear-gradient(135deg, rgba(102,126,234,0.04) 0%, rgba(240,147,251,0.04) 50%, rgba(251,191,36,0.04) 100%)',
  brandHorizontal:
    'linear-gradient(90deg, transparent, #667eea 20%, #f093fb 50%, #fbbf24 80%, transparent)',
  ink: 'linear-gradient(180deg, #0b1020 0%, #131835 100%)',
  surfaceFade:
    'linear-gradient(180deg, rgba(102,126,234,0.035) 0%, rgba(240,147,251,0.02) 50%, rgba(255,255,255,0) 100%)',
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(11, 16, 32, 0.04)',
  sm: '0 2px 6px rgba(11, 16, 32, 0.05), 0 1px 2px rgba(11, 16, 32, 0.04)',
  md: '0 6px 18px rgba(11, 16, 32, 0.06), 0 2px 4px rgba(11, 16, 32, 0.04)',
  lg: '0 18px 40px rgba(11, 16, 32, 0.08), 0 4px 12px rgba(11, 16, 32, 0.04)',
  brand: '0 14px 30px rgba(102, 126, 234, 0.22)',
  brandStrong: '0 18px 40px rgba(102, 126, 234, 0.32)',
} as const;

export const motion = {
  fast: '0.18s cubic-bezier(0.22, 1, 0.36, 1)',
  base: '0.28s cubic-bezier(0.22, 1, 0.36, 1)',
  slow: '0.45s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const layout = {
  maxWidth: 1200,
  sectionPaddingY: { xs: 8, md: 14 },
  containerPaddingX: { xs: 3, md: 4 },
} as const;
