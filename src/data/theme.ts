// Phase 7 — theme
// Base color palette, fonts, and per-map atmosphere tints.
// Per-map tints layer on top of base palette via Skia color matrix.

export const palette = {
  backgroundDark: '#0a0d08',
  accentGold: '#c9a356',
  rustOrange: '#a8501f',
  warningRed: '#cc3333',
  toxicGreen: '#4CAF50',
} as const;

// Typography — VT323-Regular loaded via useFonts in App.tsx; key name matches the useFonts map entry.
// All HUD and UI components reference this constant — change here propagates app-wide.
export const PIXEL_FONT_FAMILY: string = 'VT323-Regular';
export const FONT_WEIGHT_BOLD = 'bold' as const;
export const FONT_WEIGHT_NORMAL = '400' as const;

