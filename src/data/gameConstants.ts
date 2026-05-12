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

// ─── World / camera ───────────────────────────────────────────────────────────

/**
 * Arena dimensions in world pixels. Larger than the screen — the camera scrolls
 * to follow the player. Phase 5 G2 (tile rendering) will validate these values;
 * adjust here if the tile grid requires a different size.
 */
export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 2000;

/**
 * Camera zoom factor. 1.0 = no zoom (screen shows SCREEN_SIZE world pixels at 1:1).
 * Final value locked at end of Phase 5 once tiles + enemies + HUD are visible together.
 * Do not tune this in G1 — just introduces the constant so all systems share one source.
 */
export const CAMERA_ZOOM = 1.0;

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
 * Duration (ms) of post-revive invulnerability.
 * Contact damage is suppressed while elapsedMs < player.invulnerableUntilMs.
 * lastHitPlayerAtMs is NOT updated during this window so enemies can deal
 * damage immediately when the window expires.
 */
export const INVULNERABLE_DURATION_MS = 3000;

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

/**
 * Duration (ms) of the white hit-flash tint applied to an enemy on projectile impact.
 * 80ms is visible but short — pop on hit, back to normal before the next shot.
 * Adjustable here; the flash is checked every frame on the UI thread via useDerivedValue.
 */
export const HIT_FLASH_DURATION_MS = 80;

/** Pixel-art upscale for pickup sprites. Same as hero/enemy — same kit. */
export const PICKUP_SPRITE_SCALE = 2;

/**
 * Radius (px) of the red hit-flash Circle rendered on enemy impact.
 * ~1/3 of ENEMY_COLLISION_RADIUS_PX (20px) so the flash reads as an impact
 * splash rather than enveloping the whole sprite. Tune on device.
 */
export const HIT_FLASH_RADIUS_PX = 7;

// ─── Throwables ───────────────────────────────────────────────────────────────

/**
 * Radius (px) within which a throwable skill will target an enemy.
 * tickThrowableSkills scans all alive enemies and picks a random one inside
 * this range. If none are found, the cooldown stays at 0 and fires the instant
 * an enemy enters range on a subsequent tick.
 */
export const THROWABLE_TARGET_RANGE_PX = 250;

/**
 * Fixed pre-allocated slot count for throwable entities.
 * Same sparse-array pattern as ENEMY_SOFT_CAP: slots are never compacted,
 * null = empty. 10 slots is generous — the player can only carry 3 of each
 * type in G5, and travel time is 400ms so overlap is rare.
 */
export const THROWABLE_SLOT_COUNT = 10;

/**
 * Fixed pre-allocated slot count for effect zone entities.
 * 20 = headroom for flamethrower (3 zones/fire × rapid fire) + molotov + smoke + rocket explosions.
 */
export const EFFECT_ZONE_SLOT_COUNT = 20;

/** Time (ms) for a throwable to travel from the player to its target. */
export const THROWABLE_TRAVEL_TIME_MS = 400;

/**
 * Peak height (px) of the parabolic arc above the direct line.
 * Gives a lofted grenade feel. Applied as a vertical screen-space offset
 * using a sin(0→π) curve over the travel fraction.
 */
export const THROWABLE_ARC_HEIGHT_PX = 40;

// ─── Frag grenade ─────────────────────────────────────────────────────────────

/** Damage dealt to each enemy within FRAG_RADIUS_PX on detonation. */
export const FRAG_DAMAGE = 25;

/** Blast radius (px) for frag detonation — circle-overlap with ENEMY_COLLISION_RADIUS_PX. */
export const FRAG_RADIUS_PX = 40;

/** Number of frames in the Explode sprite sheet (Effects/Explode/1–4.png). */
export const FRAG_EXPLODE_FRAME_COUNT = 4;

/** Duration per explode frame (ms). 4 × 100ms = 400ms total explosion visual. */
export const FRAG_EXPLODE_FRAME_DURATION_MS = 100;

// ─── Smoke grenade ────────────────────────────────────────────────────────────

/** Radius (px) of the smoke slow zone. */
export const SMOKE_RADIUS_PX = 50;

/** How long (ms) the smoke zone persists before despawning. */
export const SMOKE_DURATION_MS = 4000;

/** Speed multiplier applied to enemies inside a smoke zone. 0.5 = half speed. */
export const SMOKE_SLOW_MULT = 0.5;

/** Frame count for the LightSmoke animation (7 frames: frame 0 = full cloud, frame 6 = tiny wisp). */
export const SMOKE_ANIM_FRAME_COUNT = 7;

/** Bloom phase: time (ms) to ramp from wisp → full cloud (frames 6→0). */
export const SMOKE_BLOOM_DURATION_MS = 1000;

/** Dissipate phase: time (ms) to ramp from full cloud → gone (frames 0→6). */
export const SMOKE_DISSIPATE_DURATION_MS = 1000;
// Hold = SMOKE_DURATION_MS - SMOKE_BLOOM_DURATION_MS - SMOKE_DISSIPATE_DURATION_MS = 2000ms.

// ─── Molotov ──────────────────────────────────────────────────────────────────

/** Radius (px) of the fire damage zone. */
export const MOLOTOV_RADIUS_PX = 50;

/** How long (ms) the fire zone persists before despawning. */
export const MOLOTOV_DURATION_MS = 3000;

/** DoT damage per second to enemies inside the fire zone. */
export const MOLOTOV_DAMAGE_PER_SEC = 5;

/** Interval (ms) between DoT damage ticks per zone. */
export const MOLOTOV_TICK_INTERVAL_MS = 250;

/** Number of frames in the Flamethrower sprite sheet (Effects/Flamethrower/1–7.png). */
export const MOLOTOV_FIRE_FRAME_COUNT = 7;

/** Duration per fire frame (ms). 7 × 120ms ≈ 840ms per loop cycle. */
export const MOLOTOV_FIRE_FRAME_DURATION_MS = 120;

// ─── Effect sprite scale ──────────────────────────────────────────────────────

/**
 * Pixel-art upscale for effect sprites (explode, flame).
 * 2× matches hero/enemy/pickup scale.
 */
export const EFFECT_SPRITE_SCALE = 2;

// ─── Shotgun ──────────────────────────────────────────────────────────────────

/** Number of pellets per shotgun shot. */
export const SHOTGUN_PELLET_COUNT = 5;

/** Total spread arc of the pellet fan in degrees. */
export const SHOTGUN_SPREAD_DEG = 30;

// ─── Flamethrower weapon zones ────────────────────────────────────────────────

/** Spread arc of the flamethrower cone in degrees.
 *  Narrowed from 45 → 15 so zones cluster tightly along the aim line,
 *  overlapping heavily and reading as a dense stream rather than sparse sparks. */
export const FLAMETHROWER_CONE_DEG = 15;

/** Render scale for individual flame zone sprites (independent of EFFECT_SPRITE_SCALE).
 *  At scale 3: 32×32 source → 96×96 rendered. Three overlapping 96px sprites at
 *  15° spread create a dense fire mass vs the 64px sprites that read as sparks. */
export const FLAME_ZONE_SPRITE_SCALE = 3;

/** Number of flame zones spawned per trigger pull. */
export const FLAMETHROWER_ZONE_COUNT = 3;

/** Radius (px) of each individual flame zone. */
export const FLAMETHROWER_ZONE_RADIUS_PX = 35;

/** Duration (ms) each flame zone persists before despawning.
 *  Matches the full 7-frame animation cycle exactly (7 × 120ms = 840ms).
 *  Zone expires before the 900ms React timer tick so the animation never
 *  loops — frames 0-6 play once cleanly. cooldownMs (1000ms) leaves a brief
 *  ~160ms gap between bursts which also prevents multi-batch phase overlap. */
export const FLAMETHROWER_ZONE_DURATION_MS = 840;

/** DoT damage per second to enemies inside a flame zone.
 *  Restored to 35 (from 17) now that duration is 840ms (3 ticks per zone at
 *  250ms intervals). 3 zones × 35 × 0.25s = 26.25 HP first tick — one-shots
 *  Scavs (20 HP) and kills Raiders (40 HP) within the second tick (~500ms). */
export const FLAMETHROWER_ZONE_DAMAGE_PER_SEC = 35;

/** Distance (px) from player center at which flame zones spawn along the cone.
 *  At 50px spawn with 35px radius, inner zone edge starts at 15px — catches
 *  enemies at near-contact range. Was 95px: inner edge at 60px, missing close
 *  enemies entirely. */
export const FLAMETHROWER_SPAWN_DISTANCE_PX = 50;

// ─── Rocket launcher ──────────────────────────────────────────────────────────

/** Blast radius (px) for rocket AOE detonation. Larger than FRAG_RADIUS_PX (40px). */
export const ROCKET_AOE_RADIUS_PX = 60;

/** Number of frames in the rocket body sprite animation (effects/rocket/1–2.png). */
export const ROCKET_FRAME_COUNT = 2;

/** Duration per rocket frame (ms). 2 × 100ms = 200ms cycle. */
export const ROCKET_FRAME_DURATION_MS = 100;

// ─── Crates ──────────────────────────────────────────────────────────────────

/**
 * Fixed pre-allocated slot count for crate entities.
 * Intentionally equals CRATE_MAX_ACTIVE — crates have no transitional state
 * (unlike enemies which hold a dying slot), so no headroom is needed.
 * If CRATE_MAX_ACTIVE is raised, bump this in sync to avoid silent spawn skips.
 */
export const CRATE_SLOT_COUNT = 3;

/** Time (ms) between crate spawn events. */
export const CRATE_SPAWN_INTERVAL_MS = 30000;

/** Maximum number of simultaneously active crates on the map. */
export const CRATE_MAX_ACTIVE = 3;

/**
 * Distance (px) within which the player picks up a crate on overlap.
 * No magnet — player must physically walk to the crate.
 */
export const CRATE_PICKUP_RADIUS_PX = 30;

/** Margin (px) from each canvas edge within which crates will not spawn. */
export const CRATE_SPAWN_MARGIN_PX = 50;

// ─── Crate drop table ─────────────────────────────────────────────────────────

export type CrateTier = 'common' | 'uncommon' | 'rare' | 'legendary';

/** Probability weight for each tier. Must sum to 1.0. */
export const CRATE_TIER_WEIGHTS: Record<CrateTier, number> = {
  common:    0.40,
  uncommon:  0.35,
  rare:      0.20,
  legendary: 0.05,
};

/**
 * Weapon IDs available per tier. Uses actual weapon profile IDs from weapons.ts.
 * pkm excluded — dormant weapon, not surfaced to the player.
 */
export const CRATE_TIER_WEAPONS: Record<CrateTier, string[]> = {
  common:    ['aks74u'],
  uncommon:  ['ak74', 'm870'],
  rare:      ['gp25'],
  legendary: ['svd', 'rpo'],
};

// ─── Tier display colors (UI only) ────────────────────────────────────────────

export const TIER_COLORS: Record<CrateTier, string> = {
  common:    '#bbbbbb',
  uncommon:  '#4cc36a',
  rare:      '#4a8fff',
  legendary: '#ff9a3c',
};
