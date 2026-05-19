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
 * to follow the player.
 */
export const WORLD_WIDTH = 6000;
export const WORLD_HEIGHT = 6000;

/**
 * Camera zoom factor. 1.0 = no zoom (screen shows SCREEN_SIZE world pixels at 1:1).
 * Final value locked at end of Phase 5 once tiles + enemies + HUD are visible together.
 */
export const CAMERA_ZOOM = 1.0;

/**
 * Game tick interval in milliseconds — controls the logic update rate.
 * 33.333ms = 30fps. The useFrameCallback accumulates vsync time and fires one
 * tick per interval; sub-interval remainder carries forward to prevent drift.
 */
export const TICK_INTERVAL_MS = 33.333;

/**
 * Size of one tile cell in world units. Matches the source tile pixel size (64×64px)
 * so that at CAMERA_ZOOM=1.0 each tile renders at exactly its native resolution.
 * Confirmed from tilesheet dimensions: 320×320 sheets / 5 cols = 64px per tile.
 */
export const TILE_SIZE = 64;

/** Number of tile columns in the world grid. WORLD_WIDTH / TILE_SIZE = 6000 / 64 = 93.75 → 94. */
export const TILE_COLS = Math.ceil(WORLD_WIDTH / TILE_SIZE);

/** Number of tile rows in the world grid. WORLD_HEIGHT / TILE_SIZE = 6000 / 64 = 93.75 → 94. */
export const TILE_ROWS = Math.ceil(WORLD_HEIGHT / TILE_SIZE);

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

/** Raider uses Gunner walk cycle: 7 frames (GunnerWalk_01–07). */
export const RAIDER_WALK_FRAME_COUNT = 7;
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
 * World-space cell size (px) for the static-prop collision spatial grid.
 * 6000 / 500 = 12 columns × 12 rows = 144 cells. At ~101 solid props maximum,
 * average density is <1 per cell. Each entity checks current cell + up to 8
 * neighbours → typically 2–8 AABB tests per frame.
 */
export const COLLISION_GRID_CELL_SIZE = 500;

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
 * Default upscale factor for all scatter props (rocks, barrels, vegetation, wrecks).
 * Matches entity convention so props read at the same visual scale as the hero/enemies.
 * Phase 5 placeholder — final value locked after device verification.
 */
export const PROP_SPRITE_SCALE = 2;

/**
 * Upscale factor for large structures (houses, watchtower).
 * 3× vs entity 2× so structures read as clearly larger than characters.
 * Per-asset overrides in propAtlasData handle individual exceptions (e.g. env_house02
 * drops back to PROP_SPRITE_SCALE because its native 263px already reads as large).
 */
export const STRUCTURE_SPRITE_SCALE = 3;

/**
 * Radius (px) of the red hit-flash Circle rendered on enemy impact.
 * ~1/3 of ENEMY_COLLISION_RADIUS_PX (20px) so the flash reads as an impact
 * splash rather than enveloping the whole sprite. Tune on device.
 */
export const HIT_FLASH_RADIUS_PX = 7;

// ─── Sniper enemy ─────────────────────────────────────────────────────────────

/** Sniper (variant A) uses Sniper kit walk cycle: 7 frames. */
export const SNIPER_WALK_FRAME_COUNT = 7;
export const SNIPER_WALK_FRAME_DURATION_MS = 120;

/** Soldier02 (variant B) fire cycle used as walk: 5 frames. */
export const SOLDIER02_WALK_FRAME_COUNT = 5;
export const SOLDIER02_WALK_FRAME_DURATION_MS = 110;

/** ~60% of a 390px-wide viewport at CAMERA_ZOOM=1.0. Tunable. */
export const SNIPER_FIRE_RANGE_PX = 300;

/** Seconds between sniper shots. Tunable. */
export const SNIPER_FIRE_COOLDOWN_MS = 3500;

/** Seconds between raider muzzle flashes. Visual only — no projectile. Tunable. */
export const RAIDER_FIRE_COOLDOWN_MS = 3500;

/** Speed of sniper projectiles in px/sec. Slightly faster than player movement so dodging requires timing. */
export const SNIPER_PROJECTILE_SPEED_PX_PER_SEC = 350;

/** Damage per sniper projectile hit. Matches raider contactDamage. */
export const SNIPER_PROJECTILE_DAMAGE = 12;

/** Max concurrent snipers across both variants. Spawner falls back to scav/raider when cap is reached. */
export const SNIPER_MAX_ACTIVE = 5;

/** Sniper ratio ramp: 0% until this elapsed time, then linearly rises to SNIPER_RATIO_MAX. */
export const SNIPER_RATIO_RAMP_START_MS = 45000;
export const SNIPER_RATIO_RAMP_END_MS = 120000;

/** Peak fraction of spawns that are snipers (reached at SNIPER_RATIO_RAMP_END_MS). */
export const SNIPER_RATIO_MAX = 0.15;

/** Muzzle flash animation: 3 frames at 50ms each. 200ms window catches the 100ms timer. Non-looping. */
export const MUZZLE_FLASH_FRAME_COUNT = 3;
export const MUZZLE_FLASH_FRAME_DURATION_MS = 50;
export const MUZZLE_FLASH_DURATION_MS = 200;

/**
 * Barrel-tip offsets for muzzle flash positioning, in Group local coordinates
 * (sprite pixels × ENEMY_SPRITE_SCALE=2). The flash <Image> is rendered inside
 * the enemy's Group, which already carries the facing rotation, so these offsets
 * rotate automatically with the sprite — no manual rotation math needed.
 *
 * Derivation: sprite is 96×96, center = (48,48). Barrel tip pixel identified
 * from pixel map; offset = (tip - center) × 2.
 *
 * Tune on device if the flash appears off — 1 sprite-pixel = 2 rendered units.
 */
export const SNIPER_A_FLASH_OFFSET = { x: -13, y: 34 } as const;
export const SNIPER_B_FLASH_OFFSET = { x: -16, y: 22 } as const;
/**
 * Barrel-tip offset for raider muzzle flash, in Group local coordinates.
 * Soldier body overlay — rifle extends from upper body toward bottom of sprite.
 * Tune on device; 1 sprite-pixel = 2 rendered units.
 */
export const RAIDER_FLASH_OFFSET = { x: -2, y: 60 } as const;

// ─── Tank Turret (Phase 5 G5) ─────────────────────────────────────────────────

export const TANK_FIRE_DAMAGE_RATIO = 0.30;
export const TANK_FIRE_RATE_MS = 6000;
export const TANK_FIRE_RANGE_PX = 450;
export const TANK_COLLISION_RADIUS = 80;
export const TANK_PROJECTILE_SPEED_PX_PER_SEC = 300;
export const TANK_SPRITE_SCALE = 2;
export const TANK_MIN_DISTANCE_FROM_PLAYER = 1500;
/** Render scale for the tank rocket projectile sprite (0.7× = ~13×48 px). */
export const TANK_PROJECTILE_SCALE = 0.7;

/**
 * Muzzle flash offsets in sprite-local space (sprite-pixels from tower center).
 * +y = toward barrel tip (sprite drawn barrel-down). Applied inside the rotating
 * tower Group — auto-rotates with the turret, no per-angle math needed.
 * Initial values from sprite inspection; tune on device.
 *   ACS:    barrel tip ≈ y+54 from center (long barrel, y≈118 in 128px sprite)
 *   Panzer: barrel tip ≈ y+57 from center (long barrel, y≈121 in 128px sprite)
 */
export const ACS_FLASH_OFFSET = { x: 0, y: 54 } as const;
export const PANZER_FLASH_OFFSET = { x: 0, y: 57 } as const;

/**
 * Fire origin offsets from tower center in world units (sprite-px × TANK_SPRITE_SCALE).
 * Applied in tankEngine after towerAngle rotation — places rocket at barrel tip.
 * Must match FLASH_OFFSET × TANK_SPRITE_SCALE so rocket spawns where flash appears.
 */
export const ACS_FIRE_OFFSET = { x: 0, y: 108 } as const;
export const PANZER_FIRE_OFFSET = { x: 0, y: 114 } as const;

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

// ─── Helicopter ambient flyover ───────────────────────────────────────────────

/** Render scale for the ambient helicopter flyover sprite (288×288 source). */
export const HELI_SPRITE_SCALE = 1.5;
/** ms per rotor animation frame (3 frames → ~120ms cycle). */
export const HELI_ROTOR_FRAME_MS = 40;
/** Duration in ms for the helicopter to cross the viewport. */
export const HELI_FLYOVER_DURATION_MS = 6500;
/** Min/max gap between flyover spawns (ms). */
export const HELI_SPAWN_MIN_MS = 60000;
export const HELI_SPAWN_MAX_MS = 120000;
