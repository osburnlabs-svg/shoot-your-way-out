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
export const SPAWN_INITIAL_DELAY_MS = 3000;

/**
 * Enemies per second at game start.
 * 0.25/s = one enemy every 4 seconds — sparse, comfortable opening.
 * Players need time to orient before pressure builds.
 */
export const SPAWN_RATE_INITIAL = 0.25;

/**
 * Enemies per second at peak (reached after SPAWN_RATE_RAMP_DURATION_MS).
 * 2.0/s at peak; player pistol kills ~1.25 Scavs/sec (400ms cooldown, 2 shots each).
 * Spawn rate crosses kill rate at ~70s — enemies accumulate and death follows shortly after.
 */
export const SPAWN_RATE_MAX = 2.0;

/**
 * Time (ms) over which spawn rate ramps from INITIAL to MAX.
 * 120s ramp gives a real arc: comfortable → pressured → overwhelmed.
 * Rate crosses player kill capacity (~1.25/sec) at ~70s → first-death window 70-90s.
 */
export const SPAWN_RATE_RAMP_DURATION_MS = 120000;

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

// ─── Projectiles ──────────────────────────────────────────────────────────────

/**
 * Fixed pre-allocated slot count for projectile entities in GameCanvas.
 * Mirrors ENEMY_SOFT_CAP pattern — 30 useDerivedValue hooks, inactive slots
 * render off-screen. At Pistol's 400ms cooldown, only 1–2 bullets are ever
 * in flight simultaneously; 30 is comfortable headroom for faster weapons later.
 */
export const PROJECTILE_SLOT_COUNT = 30;

// ─── Collision ────────────────────────────────────────────────────────────────

/**
 * Circle collision radius for enemies (px). Sprites are 64px source × 2× scale
 * = 128px display, but the actual character body is roughly 40px wide, so 20px
 * radius is a fair hitbox — not too tight, not too forgiving.
 */
export const ENEMY_COLLISION_RADIUS_PX = 20;

/** Circle collision radius for projectiles (px). Matches bullet render size. */
export const PROJECTILE_COLLISION_RADIUS_PX = 4;

// ─── Enemy death animation ─────────────────────────────────────────────────────

/** Both Scav (SD_01–04) and Raider (SD2_01–04) die cycles: 4 frames. */
export const ENEMY_DIE_FRAME_COUNT = 4;

/**
 * Duration per die frame in ms. 4 frames × 100ms = 400ms total death sequence.
 * Matches the context doc spec ("~400ms die animation based on 4 frames").
 */
export const ENEMY_DIE_FRAME_DURATION_MS = 100;

// ─── Player ───────────────────────────────────────────────────────────────────

/** Starting and maximum HP for the player. */
export const PLAYER_STARTING_HP = 100;

/**
 * Circle collision radius for the player (px). Used for enemy contact damage
 * checks and pickup collection. Hero sprites are ~64px display at 2× scale;
 * 16px is a fair center-body hitbox.
 */
export const PLAYER_COLLISION_RADIUS_PX = 16;

// ─── Contact damage ───────────────────────────────────────────────────────────

/**
 * Minimum ms between contact damage ticks per enemy.
 * Each enemy tracks its own cooldown — multiple overlapping enemies each deal
 * damage independently on their own 500ms timer.
 */
export const CONTACT_DAMAGE_INTERVAL_MS = 500;

// ─── Pickups ──────────────────────────────────────────────────────────────────

/**
 * Pre-allocated pickup slot count — mirrors PROJECTILE_SLOT_COUNT pattern.
 * 50 useDerivedValue hooks in GameCanvas, always rendered at (-9999,-9999)
 * when inactive. Money can stack up if the player kites a large swarm.
 */
export const PICKUP_SLOT_COUNT = 50;

/**
 * Distance (px) at which the magnet pull activates toward the player.
 * 120px gives pickup enough time to build speed before player exits the range.
 * At 80px the player (250px/s) crossed the zone too fast for acceleration to bite.
 */
export const MAGNET_RANGE_PX = 120;

/**
 * Maximum speed a pickup can reach under magnet pull (px/sec).
 * 1200px/s = 4.8× player speed — once up to speed, pickup closes at 950px/s net.
 */
export const MAGNET_MAX_SPEED_PX_PER_SEC = 1200;

/** Distance (px) at which a pickup is collected (overlaps player center). */
export const COLLECT_RADIUS_PX = 12;

/** Pixel-art upscale for pickup sprites. Same as hero/enemy — same kit. */
export const PICKUP_SPRITE_SCALE = 2;
