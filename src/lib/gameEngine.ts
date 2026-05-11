/**
 * Game state types and fixed-timestep state update.
 *
 * All functions are marked 'worklet' — they run on the Reanimated UI thread
 * inside the useFrameCallback game loop.
 *
 * G3 input model: virtual joystick.
 *   - inputVector is a pre-normalized direction (magnitude always 0 or 1)
 *   - null when no finger is down or inside the deadzone
 *   - Hero moves at full PLAYER_MOVE_SPEED_PX_PER_SEC in that direction
 *   - No "stop at target" logic — hero moves continuously while input is active
 *
 * Phase 3 G1 additions:
 *   - EnemyState type (id, type, position, hp, walk animation offset)
 *   - GameState extended with enemies[], nextEnemyId, spawnAccMs
 *   - canvasWidth/canvasHeight stored in state so spawner can compute screen edges
 *   - updateGameState calls tickEnemies from enemyEngine (spawner + AI)
 *
 * Phase 3 G2 additions:
 *   - EnemyState gains status ('alive'|'dying') + dyingStartedAtMs
 *   - ProjectileState type (position, velocity, range tracking, damage)
 *   - PlayerState gains equippedWeaponId + weaponCooldownMs
 *   - GameState gains projectiles[], nextProjectileId, killCount
 *   - updateGameState chains tickCombat after tickEnemies
 *
 * Phase 3 G3 additions:
 *   - PickupState type (position, velocity, type, values)
 *   - EnemyState gains lastHitPlayerAtMs (per-enemy contact damage cooldown)
 *   - PlayerState gains hp, maxHp, score, xp, lastDamagedAtMs
 *   - GameState gains pickups[], nextPickupId, isDead
 *   - updateGameState freezes all ticks when isDead; chains tickPickups last
 *
 * Phase 4a G1 additions:
 *   - PlayerState gains level (initialized to 1)
 *   - GameState gains pendingLevelUp + pendingLevelUpCount
 *   - updateGameState freezes when pendingLevelUp (same pattern as isDead)
 *   - tickProgression (progressionEngine) runs after tickPickups; detects XP
 *     threshold crossings and sets pendingLevelUp. Level does not increment
 *     until the player selects a skill in G3.
 *
 * Phase 4a G2 additions:
 *   - PlayerState gains skillStacks: Record<SkillId, number>
 *   - ProjectileState gains pierceRemaining + hitEnemyIds (pierce support)
 *   - createInitialGameState includes a verification seed (dev-only skill stacks)
 *   - updateGameState movement block uses effective.moveSpeedPxPerSec instead of
 *     the bare PLAYER_MOVE_SPEED_PX_PER_SEC constant
 *   - updateGameState chains tickRegen after tickPickups, before tickProgression
 *
 * Phase 4a G3 additions:
 *   - GameState gains currentLevelUpChoices: SkillId[] (populated by JS thread during freeze)
 *   - LevelUpModal renders on React thread; skill selection mutates gameState.value directly
 *     (safe during pendingLevelUp freeze window — follows cycleWeapon precedent)
 */

import type { HeroWeaponPose } from './sprites';
import type { EnemyType } from '../data/enemies';
import { STARTING_WEAPON_ID, WEAPON_PROFILES } from '../data/weapons';
import {
  PLAYER_MAX_ANGULAR_SPEED_RAD_PER_SEC,
  PLAYER_STARTING_HP,
  ENEMY_SOFT_CAP,
  THROWABLE_SLOT_COUNT,
  EFFECT_ZONE_SLOT_COUNT,
} from '../data/gameConstants';
import type { SkillId } from '../data/skills';
import { getEffectiveStats } from '../data/skills';
import { tickEnemies } from './enemyEngine';
import { tickCombat } from './combatEngine';
import { tickPickups } from './pickupEngine';
import { tickProgression, tickRegen } from './progressionEngine';
import { tickThrowables, tickEffectZones } from './throwableEngine';

export type PlayerState = {
  x: number;
  y: number;
  /** Current facing angle in radians. 0 = right, increases clockwise (canvas coords). */
  rotation: number;
  /** Angle toward input direction — lerped into rotation each step. */
  targetRotation: number;
  /**
   * Normalized movement direction from the virtual joystick.
   * null when no finger is down or finger is within the deadzone.
   * Injected by GameCanvas each frame from gesture shared values.
   */
  inputVector: { x: number; y: number } | null;
  weaponPose: HeroWeaponPose;
  /** True while the hero is moving this step (inputVector is active). */
  isMoving: boolean;
  /** game.elapsedMs when the current walk session began — used to compute walk frame index. */
  walkStartedAtMs: number;
  /** ID key into WEAPON_PROFILES. Determines firing behavior. Always 'pistol' in G2. */
  equippedWeaponId: string;
  /**
   * Remaining cooldown in ms before the next shot can fire.
   * Always decrements toward 0. When 0 and a target is in range, fires immediately.
   */
  weaponCooldownMs: number;
  /** Current player HP. Reduced by enemy contact damage. Death at 0. */
  hp: number;
  /** Maximum HP (used for HP bar scaling in future HUD). */
  maxHp: number;
  /** Cumulative score this run. Incremented by pickup collection. */
  score: number;
  /** Cumulative XP this run. Incremented by pickup collection; drives level-ups in Phase 4a. */
  xp: number;
  /**
   * elapsedMs when the player last received any contact damage (any enemy).
   * Not used as a global gate (each enemy has its own cooldown via lastHitPlayerAtMs).
   * Stored for future hit-flash effect in G4.
   */
  lastDamagedAtMs: number;
  /**
   * Current player level. Initialized to 1. Increments in G3 when the player
   * selects a skill from the level-up modal — NOT when the XP threshold is crossed.
   * tickProgression reads this to determine which threshold to check next.
   */
  level: number;
  /**
   * Active skill stack counts for this run. Key = SkillId; value = number of stacks.
   * Initialized in createInitialGameState (dev seed in G2; cleared to {} in G3 real runs).
   * Read by getEffectiveStats every tick to compute live weapon/player stats.
   */
  skillStacks: Record<SkillId, number>;
  /**
   * elapsedMs until which contact damage is suppressed (post-revive grace window).
   * 0 when not active. combatEngine §8 skips HP decrement while elapsedMs < this value.
   * lastHitPlayerAtMs is NOT updated during this window so enemies deal damage
   * immediately on their natural cooldown when the window expires.
   */
  invulnerableUntilMs: number;
};

/**
 * Runtime enemy entity. Lives inside the single GameState shared value.
 *
 * walkStartedAtMs is set at spawn (= state.elapsedMs at that moment).
 * Walk frame = getCurrentFrame(config, elapsedMs - enemy.walkStartedAtMs).
 *
 * G2 adds:
 *   status — 'alive': walking toward player, collidable.
 *            'dying': playing die animation, not collidable, not moving.
 *   dyingStartedAtMs — elapsedMs when status transitioned to 'dying'.
 *                      Used to compute die frame index. 0 when status is 'alive'.
 *
 * G3 adds:
 *   lastHitPlayerAtMs — elapsedMs when this enemy last dealt contact damage.
 *                       0 at spawn. Each enemy has its own 500ms cooldown gate.
 *
 * G4c adds:
 *   hitFlashUntilMs — elapsedMs until which the enemy renders with a white hit-flash tint.
 *                     Set to elapsedMs + HIT_FLASH_DURATION_MS on projectile impact.
 *                     0 when not flashing. Checked every frame on the UI thread.
 */
export type EnemyState = {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  /** elapsedMs at spawn — used to offset walk animation so enemies don't all sync frames. */
  walkStartedAtMs: number;
  status: 'alive' | 'dying';
  /** elapsedMs when the die animation started. 0 when alive. */
  dyingStartedAtMs: number;
  /** elapsedMs when this enemy last dealt contact damage to the player. 0 at spawn. */
  lastHitPlayerAtMs: number;
  /** elapsedMs until which the enemy renders with a white hit-flash tint. 0 when not flashing. */
  hitFlashUntilMs: number;
};

/**
 * Runtime projectile entity. Lives inside GameState.projectiles[].
 *
 * Velocity is stored pre-computed in px/sec (direction × speed).
 * speedPxPerSec is the cached magnitude — used for distance tracking without
 * recomputing sqrt every tick.
 *
 * Projectile despawns when distanceTraveledPx >= maxRangePx (range expiry)
 * or when it hits an enemy (collision — handled in combatEngine).
 */
export type ProjectileState = {
  id: number;
  x: number;
  y: number;
  /** x component of velocity, in pixels per second. */
  vxPxPerSec: number;
  /** y component of velocity, in pixels per second. */
  vyPxPerSec: number;
  /** Cached speed magnitude (px/sec) — avoids sqrt in the motion update. */
  speedPxPerSec: number;
  distanceTraveledPx: number;
  maxRangePx: number;
  damage: number;
  /**
   * Remaining pierce penetrations. Decremented on each enemy hit.
   * When it falls below 0 the projectile is consumed.
   * 0 = non-piercing (consumed after 1 hit), 1 = pierces 1 extra enemy, etc.
   * Set at spawn from effective.pierce; never increases after spawn.
   */
  pierceRemaining: number;
  /**
   * IDs of enemies already hit by this projectile in prior ticks.
   * Checked before collision so a piercing projectile cannot re-hit the same enemy.
   * Plain number[] — avoids Set/Map which are not worklet-safe.
   */
  hitEnemyIds: number[];
};

/**
 * Runtime pickup entity. Lives inside GameState.pickups[].
 *
 * Velocity starts at zero and is accelerated by the magnet system in tickPickups.
 * Pickups despawn when collected (overlap with player within COLLECT_RADIUS_PX).
 */
export type PickupState = {
  id: number;
  x: number;
  y: number;
  /** Velocity x in px/sec — starts at 0, accelerated by magnet pull. */
  vxPxPerSec: number;
  /** Velocity y in px/sec — starts at 0, accelerated by magnet pull. */
  vyPxPerSec: number;
  type: 'money_small';
  /** Score added to player on collection. */
  scoreValue: number;
  /** XP added to player on collection. Drives level-ups in Phase 4a. */
  xpValue: number;
  spawnedAtMs: number;
};

/**
 * A throwable entity in flight or detonating.
 *
 * 'flying': arcing from spawnX/Y toward targetX/Y over THROWABLE_TRAVEL_TIME_MS.
 *   Screen position is interpolated along the arc each render frame.
 *   Visual: colored circle (per THROWABLE_PROJECTILE_COLORS in GameCanvas).
 *
 * 'detonating' (frag only): explosion animation plays for
 *   FRAG_EXPLODE_FRAME_COUNT × FRAG_EXPLODE_FRAME_DURATION_MS ms at targetX/Y.
 *   Smoke and molotov clear their throwable slot immediately on landing (the
 *   EffectZone carries the visual); frag holds the slot until detonation ends.
 *
 * spawnX/Y: position at the moment of throw (player center at throw time).
 * targetX/Y: absolute canvas coordinates of the target.
 * thrownAtMs: elapsedMs when the throw occurred — used to compute arc fraction.
 * detonationStartedAtMs: elapsedMs when status transitioned to 'detonating'. 0 otherwise.
 */
export type ThrowableState = {
  id: number;
  type: 'frag' | 'smoke' | 'molotov';
  status: 'flying' | 'detonating';
  spawnX: number;
  spawnY: number;
  targetX: number;
  targetY: number;
  /** elapsedMs when the throw was initiated. */
  thrownAtMs: number;
  /** elapsedMs when 'detonating' status began. 0 when 'flying'. */
  detonationStartedAtMs: number;
};

/**
 * A persistent on-ground effect zone left by a smoke or molotov throwable.
 *
 * type 'smoke': slows enemies inside by SMOKE_SLOW_MULT for SMOKE_DURATION_MS.
 *   Slow is applied inline in tickEnemies — no EnemyState field needed.
 *   Visual: grey Skia Circle (Phase 6 placeholder; no kit smoke sprite).
 *
 * type 'molotov': deals MOLOTOV_DAMAGE_PER_SEC DoT to enemies inside.
 *   Damage ticks every MOLOTOV_TICK_INTERVAL_MS using lastTickAppliedMs.
 *   Visual: looping Flamethrower sprite (7 frames × 120ms).
 *
 * spawnedAtMs: elapsedMs when the zone was created (throwable landed).
 * lastTickAppliedMs: elapsedMs of the most recent DoT tick. 0 at spawn.
 *   Updated by tickEffectZones each time damage is applied.
 */
export type EffectZoneState = {
  id: number;
  type: 'smoke' | 'molotov';
  x: number;
  y: number;
  spawnedAtMs: number;
  lastTickAppliedMs: number;
};

export type GameState = {
  player: PlayerState;
  /**
   * Fixed-length sparse array of ENEMY_SOFT_CAP (50) slots.
   * null = empty slot (enemy despawned or never spawned).
   * Slot index is stable for each enemy's full lifetime — no compaction on death.
   * Dying enemies set their slot to null after the die animation completes.
   * This prevents slot-index drift between the UI-thread transforms (per-frame)
   * and React sprite state (100ms poll), which caused die-frame flashes on alive enemies.
   */
  enemies: Array<EnemyState | null>;
  /** Monotonically increasing counter — ensures every enemy has a unique id. */
  nextEnemyId: number;
  /** Spawn time accumulator in ms — carries sub-interval remainder across ticks. */
  spawnAccMs: number;
  /** All active projectiles. Filtered/replaced each tick — no mutation. */
  projectiles: ProjectileState[];
  /** Monotonically increasing counter — ensures every projectile has a unique id. */
  nextProjectileId: number;
  /** Total enemies killed this run. Displayed in debug overlay. */
  killCount: number;
  /** All active pickups. Filtered/replaced each tick — no mutation. */
  pickups: PickupState[];
  /** Monotonically increasing counter — ensures every pickup has a unique id. */
  nextPickupId: number;
  /**
   * True when the player's HP has reached 0.
   * updateGameState freezes all ticks (returns state unchanged) when true.
   * Real restart/menu wiring is Phase 7.
   */
  isDead: boolean;
  /**
   * True when the player has accumulated enough XP to level up and is waiting
   * to select a skill. updateGameState freezes all ticks when true (same pattern
   * as isDead). Cleared in G3 when the player confirms a skill selection.
   */
  pendingLevelUp: boolean;
  /**
   * Number of level-up selections still pending. Normally 1 when pendingLevelUp
   * is true. Can be >1 if a single XP grant crossed multiple thresholds in one tick.
   * G3 decrements this on each selection; clears pendingLevelUp when it reaches 0.
   */
  pendingLevelUpCount: number;
  /**
   * The 1–3 skill IDs drawn for the current level-up offer. Empty [] when no level-up
   * is pending. Populated by the JS thread (in the 100ms timer) when pendingLevelUp is
   * first detected and currentLevelUpChoices is still empty. Never read by worklets.
   */
  currentLevelUpChoices: SkillId[];
  /**
   * Number of ad revives used this run. Capped at 1 — only one ad revive per run.
   * Incremented by the ad revive handler; reset to 0 on REDEPLOY.
   */
  adRevivesUsed: number;
  /**
   * Fixed-length sparse array of THROWABLE_SLOT_COUNT (10) slots.
   * null = empty slot. Slot index stable for throwable lifetime (no compaction).
   * Frag holds its slot through detonation; smoke/molotov clear immediately on land.
   */
  throwables: Array<ThrowableState | null>;
  /** Monotonically increasing counter — ensures every throwable has a unique id. */
  nextThrowableId: number;
  /**
   * Fixed-length sparse array of EFFECT_ZONE_SLOT_COUNT (6) slots.
   * null = empty slot. Smoke and molotov zones live here after the throwable lands.
   */
  effectZones: Array<EffectZoneState | null>;
  /** Monotonically increasing counter — ensures every effect zone has a unique id. */
  nextEffectZoneId: number;
  /** Canvas dimensions stored once at init — spawner uses them to place enemies at edges. */
  canvasWidth: number;
  canvasHeight: number;
  elapsedMs: number;  // total ms the game has been running
  frameCount: number; // total fixed-step frames processed
};

export function createInitialGameState(canvasWidth: number, canvasHeight: number): GameState {
  'worklet';
  const emptyEnemies: Array<EnemyState | null> = [];
  for (let i = 0; i < ENEMY_SOFT_CAP; i++) { emptyEnemies.push(null); }
  return {
    player: {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      rotation: 0,
      targetRotation: 0,
      inputVector: null,
      weaponPose: 'pistol',
      isMoving: false,
      walkStartedAtMs: 0,
      equippedWeaponId: STARTING_WEAPON_ID,
      weaponCooldownMs: 0,
      hp: PLAYER_STARTING_HP,
      maxHp: PLAYER_STARTING_HP,
      score: 0,
      xp: 0,
      lastDamagedAtMs: 0,
      level: 1,
      skillStacks: {
        ammo_545bt: 0,
        ammo_subsonic: 0,
        ammo_tracer: 0,
        optics_red_dot: 0,
        optics_pso_scope: 0,
        gear_plate_carrier: 0,
        gear_tactical_boots: 0,
        gear_mre: 0,
        provisions_painkillers: 0,
        provisions_stims: 0,
      },
      invulnerableUntilMs: 0,
    },
    enemies: emptyEnemies,
    nextEnemyId: 0,
    spawnAccMs: 0,
    projectiles: [],
    nextProjectileId: 0,
    killCount: 0,
    pickups: [],
    nextPickupId: 0,
    isDead: false,
    pendingLevelUp: false,
    pendingLevelUpCount: 0,
    currentLevelUpChoices: [],
    adRevivesUsed: 0,
    throwables: (function () {
      const arr: Array<ThrowableState | null> = [];
      for (let i = 0; i < THROWABLE_SLOT_COUNT; i++) { arr.push(null); }
      return arr;
    }()),
    nextThrowableId: 0,
    effectZones: (function () {
      const arr: Array<EffectZoneState | null> = [];
      for (let i = 0; i < EFFECT_ZONE_SLOT_COUNT; i++) { arr.push(null); }
      return arr;
    }()),
    nextEffectZoneId: 0,
    canvasWidth,
    canvasHeight,
    elapsedMs: 0,
    frameCount: 0,
  };
}

/**
 * Advance game state by one fixed timestep (FIXED_STEP_MS).
 *
 * Returns state unchanged when isDead or pendingLevelUp — both conditions
 * freeze all simulation until the relevant flag is cleared (isDead: Phase 7
 * restart wiring; pendingLevelUp: G3 skill selection).
 *
 * Tick ordering within one step:
 *   1. Player movement + rotation
 *   2. Enemy spawning + AI movement (tickEnemies)
 *   3. Combat: weapon cooldown, auto-fire, projectile motion,
 *      collision, damage, death transitions, die-animation cleanup,
 *      pickup spawning on death, contact damage (tickCombat)
 *   4. Pickup magnet pull + collection (tickPickups)
 *   5. HP regen from provisions_painkillers / provisions_stims (tickRegen)
 *   6. XP threshold check — sets pendingLevelUp if a level was earned (tickProgression)
 */
export function updateGameState(state: GameState, dtMs: number): GameState {
  'worklet';

  // Freeze all simulation when the player is dead.
  // Phase 7 will set isDead = false via a restart action.
  if (state.isDead) return state;

  // Freeze all simulation while a level-up selection is pending.
  // G3 will clear pendingLevelUp after the player picks a skill.
  if (state.pendingLevelUp) return state;

  const { player } = state;
  const { inputVector } = player;

  let newX = player.x;
  let newY = player.y;
  let newRotation = player.rotation;
  let newTargetRotation = player.targetRotation;
  let newIsMoving = false;
  let newWalkStartedAtMs = player.walkStartedAtMs;

  if (inputVector !== null) {
    newIsMoving = true;

    // Face toward input direction
    newTargetRotation = Math.atan2(inputVector.y, inputVector.x);

    // Smooth rotation: step toward target angle, capped at max angular speed.
    // Normalize diff to [-PI, PI] so we always rotate the short way around.
    const maxDelta = PLAYER_MAX_ANGULAR_SPEED_RAD_PER_SEC * (dtMs / 1000);
    const rawDiff = newTargetRotation - player.rotation;
    const rotDiff = rawDiff - Math.round(rawDiff / (2 * Math.PI)) * (2 * Math.PI);
    newRotation =
      player.rotation + Math.sign(rotDiff) * Math.min(Math.abs(rotDiff), maxDelta);

    // Move at full speed in input direction (inputVector is already normalized).
    // Speed is drawn from effective stats so gear_tactical_boots stacks apply.
    const weapon = WEAPON_PROFILES[player.equippedWeaponId];
    const effective = getEffectiveStats(player.skillStacks, weapon, player.maxHp);
    const speed = effective.moveSpeedPxPerSec * (dtMs / 1000);
    newX = player.x + inputVector.x * speed;
    newY = player.y + inputVector.y * speed;

    // Record when this walk session started (for walk animation frame offset).
    if (!player.isMoving) {
      newWalkStartedAtMs = state.elapsedMs;
    }
  }

  const stateAfterPlayer: GameState = {
    ...state,
    elapsedMs: state.elapsedMs + dtMs,
    frameCount: state.frameCount + 1,
    player: {
      ...player,
      x: newX,
      y: newY,
      rotation: newRotation,
      targetRotation: newTargetRotation,
      isMoving: newIsMoving,
      walkStartedAtMs: newWalkStartedAtMs,
    },
  };

  const stateAfterEnemies = tickEnemies(stateAfterPlayer, dtMs);
  const stateAfterCombat = tickCombat(stateAfterEnemies, dtMs);
  const stateAfterPickups = tickPickups(stateAfterCombat, dtMs);
  const stateAfterThrowables = tickThrowables(stateAfterPickups, dtMs);
  const stateAfterZones = tickEffectZones(stateAfterThrowables, dtMs);
  const stateAfterRegen = tickRegen(stateAfterZones, dtMs);
  return tickProgression(stateAfterRegen);
}
