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

// Typography — swap PIXEL_FONT_FAMILY to the loaded font name when pixel font lands (Phase 7 follow-up).
// All HUD and UI components reference these constants so the swap is a single line change here.
export const PIXEL_FONT_FAMILY: string | undefined = undefined;
export const FONT_WEIGHT_BOLD = 'bold' as const;
export const FONT_WEIGHT_NORMAL = '400' as const;

