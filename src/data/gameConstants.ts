/**
 * Game balance constants — tunable numbers that affect feel and difficulty.
 *
 * All values are plain numbers (no imports, no side effects).
 * Worklet-safe: safe to import from gameEngine.ts worklet functions.
 *
 * This file grows with each phase:
 *   Phase 3:  projectile speed, enemy speed/health, spawn rates
 *   Phase 4a: XP thresholds, skill modifier values
 *   Phase 4b: throwable ranges, crate drop rates
 *   Phase 5:  per-map settings
 */

// ─── Player movement ──────────────────────────────────────────────────────────

/** How fast the hero moves in the input direction, in pixels per second. */
export const PLAYER_MOVE_SPEED_PX_PER_SEC = 250;

/**
 * Maximum rotation speed in radians per second.
 * 720°/sec feels responsive without snapping instantly on sharp direction changes.
 */
export const PLAYER_MAX_ANGULAR_SPEED_RAD_PER_SEC = (720 * Math.PI) / 180;

/**
 * Virtual joystick deadzone radius in pixels.
 * Finger must travel this far from the touch-down origin before the hero moves.
 * Prevents micro-jitter when holding a stationary finger from registering as movement.
 */
export const JOYSTICK_DEADZONE_PX = 30;

// ─── Hero sprite ──────────────────────────────────────────────────────────────

/**
 * Pixel-art upscale factor. 3× is the default for Group 3 tuning on device.
 * Revert to 4 if sprites feel too small. Phase 5 will set the final value
 * once tiles, enemies, and HUD are all visible together.
 */
export const HERO_SPRITE_SCALE = 2;

/**
 * Walk animation: 7 frames at 100ms each → full cycle ~700ms.
 * Matches the TDS asset kit's 7-frame walk strip.
 */
export const WALK_FRAME_COUNT = 7;
export const WALK_FRAME_DURATION_MS = 100;
