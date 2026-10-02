import type { ReactNode } from 'react';

/**
 * Stroke glyphs in the manner of the app's Lucide set (16px, 1.5 stroke) —
 * drawn here rather than copied, for the handful the demo shows.
 */
const Stroke = ({ children, size = 16 }: { children: ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ display: 'block', flexShrink: 0 }}
  >
    {children}
  </svg>
);

export const HistoryGlyph = () => (
  <Stroke>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3.5 4.5V9H8" />
    <path d="M12 7.5V12l3 2" />
  </Stroke>
);

export const ClipGlyph = () => (
  <Stroke>
    <path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8-8a3.4 3.4 0 0 1 4.8 4.8l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3" />
  </Stroke>
);

export const SlidersGlyph = () => (
  <Stroke>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Stroke>
);

export const PanelGlyph = () => (
  <Stroke>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M15 4.5v15" />
  </Stroke>
);

export const SendGlyph = () => (
  <Stroke>
    <path d="M21 3L10.5 13.5" />
    <path d="M21 3l-6.5 18-4-7.5L3 9.5 21 3z" />
  </Stroke>
);

export const StopGlyph = () => (
  <Stroke>
    <circle cx="12" cy="12" r="9" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </Stroke>
);

export const CloseGlyph = ({ size = 14 }: { size?: number }) => (
  <Stroke size={size}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Stroke>
);

export const SearchGlyph = () => (
  <Stroke size={14}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Stroke>
);

export const PlusGlyph = () => (
  <Stroke size={14}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);

/** Sidebar row glyphs, keyed by the nav entry they stand for. */
export const NavGlyph = ({ kind }: { kind: string }) => (
  <Stroke size={17}>
    {kind === 'home' && <path d="M4 11l8-7 8 7M6.5 9.5V20h11V9.5" />}
    {kind === 'library' && <path d="M5 4h4v16H5zM11 4h4v16h-4zM16.5 5l3.5 1-3.5 14-3.5-1" />}
    {kind === 'studies' && <path d="M5 20V10M10 20V5M15 20v-7M20 20v-4" />}
    {kind === 'portfolios' && <path d="M4 8h16v11H4zM9 8V5.5h6V8" />}
    {kind === 'markets' && <path d="M4 18l5-6 4 3 7-9" />}
    {kind === 'dataExplorer' && <path d="M4 6h16M4 12h10M4 18h7M18 16a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM20 18l-1-1" />}
    {kind === 'laboratory' && <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />}
  </Stroke>
);

/** The Fintelligent mark: the app's upward arrow. */
export const FintelligentMark = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block', flexShrink: 0 }}>
    <path d="M12 2 L20 21 L12 17 L4 21 Z" fill={color} />
  </svg>
);

/** A macOS-style arrow pointer. */
export const PointerGlyph = () => (
  <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden style={{ display: 'block' }}>
    <path
      d="M2 2 L2 20.5 L7 16 L10.3 23.5 L13.6 22 L10.4 14.8 L17 14.6 Z"
      fill="#0B1A33"
      stroke="#ffffff"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

/** The Confirm card's shield-check. */
export const ShieldCheckGlyph = ({ size = 18 }: { size?: number }) => (
  <Stroke size={size}>
    <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z" />
    <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
  </Stroke>
);

/** Entity glyphs for the creation previews and the Confirm card's rows. */
export const EntityGlyph = ({ kind, size = 16 }: { kind: 'asset_group' | 'strategy' | 'study'; size?: number }) => (
  <Stroke size={size}>
    {kind === 'asset_group' && (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </>
    )}
    {kind === 'strategy' && <path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" />}
    {kind === 'study' && <path d="M5 20V10M10 20V5M15 20v-7M20 20v-4" />}
  </Stroke>
);

export const TokenGlyph = () => (
  <Stroke size={15}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9 9.5h6M12 9.5V16" />
  </Stroke>
);

/** The run tracker's health line. */
export const PulseGlyph = () => (
  <Stroke size={14}>
    <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />
  </Stroke>
);

/** The optimize step's turning glyph. */
export const RefreshGlyph = ({ size = 18 }: { size?: number }) => (
  <Stroke size={size}>
    <path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1" />
    <path d="M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4" />
  </Stroke>
);

/** The best trial's mark. */
export const PromotedGlyph = () => (
  <Stroke size={14}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM12 13v4M8.5 20h7M16 6h3a3 3 0 0 1-3 3M8 6H5a3 3 0 0 0 3 3" />
  </Stroke>
);

export const ChevronGlyph = ({ up = false }: { up?: boolean }) => (
  <Stroke size={16}>
    <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
  </Stroke>
);

export const CopyGlyph = () => (
  <Stroke size={14}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
  </Stroke>
);

export const ArrowGlyph = () => (
  <Stroke size={14}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Stroke>
);
