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

// Per-map tint overrides — applied in Phase 5
export const mapTints = {
  compound: '#8a90a0',
  outskirts: '#c8a96e',
  treeline: '#4a6040',
} as const;
