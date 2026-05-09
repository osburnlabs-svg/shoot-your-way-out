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

// ─── Enemy sprite ─────────────────────────────────────────────────────────────

/**
 * Pixel-art upscale factor for enemy sprites. Same as hero — same kit, same art style.
 * Phase 5 will set a final unified value once tiles + camera are in.
 */
export const ENEMY_SPRITE_SCALE = 2;

/**
 * Base movement speed in px/sec. Enemy profile moveSpeed is a multiplier on this.
 * Scav (1.2×) → 96 px/sec. Raider (1.8×) → 144 px/sec.
 * Hero moves at 250 px/sec so player can always outrun both.
 */
export const ENEMY_BASE_SPEED_PX_PER_SEC = 80;

/** Scav uses Soldier walk cycle: 7 frames (SW_01–07), same count as hero. */
export const SCAV_WALK_FRAME_COUNT = 7;
export const SCAV_WALK_FRAME_DURATION_MS = 120;

/** Raider uses Soldier 02 fire frames as walk cycle: 5 frames (SF_01–05). */
export const RAIDER_WALK_FRAME_COUNT = 5;
export const RAIDER_WALK_FRAME_DURATION_MS = 110;

// ─── Enemy spawner ────────────────────────────────────────────────────────────

/** Ms after game start before first enemy spawns. */
export const SPAWN_INITIAL_DELAY_MS = 2000;

/** Enemies per second at game start. */
export const SPAWN_RATE_INITIAL = 0.5;

/** Enemies per second at peak (reached after SPAWN_RATE_RAMP_DURATION_MS). */
export const SPAWN_RATE_MAX = 3.0;

/** Time (ms) over which spawn rate ramps from INITIAL to MAX. */
export const SPAWN_RATE_RAMP_DURATION_MS = 60000;

/** Max concurrent live enemies. Spawner pauses above this. */
export const ENEMY_SOFT_CAP = 50;

/** How far off the screen edge (px) enemies spawn so they walk into view. */
export const SPAWN_MARGIN_PX = 60;

// ─── Raider mix ramp ─────────────────────────────────────────────────────────

/** Fraction of spawns that are Raiders at game start (rest are Scavs). */
export const RAIDER_RATIO_INITIAL = 0.1;

/** Fraction of spawns that are Raiders at ramp peak. */
export const RAIDER_RATIO_MAX = 0.4;

/** Time (ms) over which Raider ratio ramps from INITIAL to MAX. */
export const RAIDER_RATIO_RAMP_DURATION_MS = 90000;
