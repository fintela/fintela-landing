/**
 * Fintela design tokens — single source of truth for color, gradient,
 * radius, shadow and motion. Import from here, not from raw hex values.
 */

export const palette = {
  // Brand — sampled from the Fintela mark (gold apex → crimson body → blue tip)
  gold: '#efc03c',
  crimson: '#e53540',
  crimsonDark: '#bc2b34',
  crimsonSoft: '#f19096',
  blue: '#2f6395',
  blueDark: '#254d74',
  blueSoft: '#789aba',
  indigo: '#383959',

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
  brand: 'linear-gradient(135deg, #efc03c 0%, #e53540 45%, #2f6395 100%)',
  brandSoft:
    'linear-gradient(135deg, rgba(239,192,60,0.07) 0%, rgba(229,53,64,0.07) 45%, rgba(47,99,149,0.07) 100%)',
  brandFaint:
    'linear-gradient(135deg, rgba(239,192,60,0.04) 0%, rgba(229,53,64,0.04) 45%, rgba(47,99,149,0.04) 100%)',
  brandHorizontal:
    'linear-gradient(90deg, transparent, #efc03c 15%, #e53540 50%, #2f6395 85%, transparent)',
  ink: 'linear-gradient(180deg, #0b1020 0%, #131835 100%)',
  surfaceFade:
    'linear-gradient(180deg, rgba(229,53,64,0.03) 0%, rgba(47,99,149,0.02) 50%, rgba(255,255,255,0) 100%)',
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 6,
  lg: 10,
  xl: 14,
  pill: 999,
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(11, 16, 32, 0.04)',
  sm: '0 1px 3px rgba(11, 16, 32, 0.05)',
  md: '0 2px 8px rgba(11, 16, 32, 0.06)',
  lg: '0 4px 16px rgba(11, 16, 32, 0.07)',
  brand: '0 6px 16px rgba(47, 99, 149, 0.18)',
  brandStrong: '0 8px 20px rgba(47, 99, 149, 0.26)',
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
