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
 */

import type { HeroWeaponPose } from './sprites';
import type { EnemyType } from '../data/enemies';
import {
  PLAYER_MOVE_SPEED_PX_PER_SEC,
  PLAYER_MAX_ANGULAR_SPEED_RAD_PER_SEC,
} from '../data/gameConstants';
import { tickEnemies } from './enemyEngine';

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
};

/**
 * Runtime enemy entity. Lives inside the single GameState shared value.
 *
 * walkStartedAtMs is set at spawn (= state.elapsedMs at that moment).
 * Walk frame = getCurrentFrame(config, elapsedMs - enemy.walkStartedAtMs).
 * This matches exactly how the hero walk frame is computed — same animation system.
 *
 * hp is stored even in G1 (where enemies can't die) so the shape doesn't change in G2.
 * contactDamage is on EnemyProfile in data/enemies.ts, not here — no per-instance variance.
 */
export type EnemyState = {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  /** elapsedMs at spawn — used to offset walk animation so enemies don't all sync frames. */
  walkStartedAtMs: number;
};

export type GameState = {
  player: PlayerState;
  /** All currently live enemies. Filtered/replaced each tick — no mutation. */
  enemies: EnemyState[];
  /** Monotonically increasing counter — ensures every enemy has a unique id. */
  nextEnemyId: number;
  /** Spawn time accumulator in ms — carries sub-interval remainder across ticks. */
  spawnAccMs: number;
  /** Canvas dimensions stored once at init — spawner uses them to place enemies at edges. */
  canvasWidth: number;
  canvasHeight: number;
  elapsedMs: number;  // total ms the game has been running
  frameCount: number; // total fixed-step frames processed
};

export function createInitialGameState(canvasWidth: number, canvasHeight: number): GameState {
  'worklet';
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
    },
    enemies: [],
    nextEnemyId: 0,
    spawnAccMs: 0,
    canvasWidth,
    canvasHeight,
    elapsedMs: 0,
    frameCount: 0,
  };
}

/**
 * Advance game state by one fixed timestep (FIXED_STEP_MS).
 *
 * Virtual joystick movement model:
 *   - inputVector is a pre-normalized direction (x, y both in [-1, 1], magnitude = 1)
 *   - Hero moves at full speed in that direction while inputVector is non-null
 *   - Rotation smoothly tracks the input direction, capped at max angular speed
 *   - No overshoot concern — target is a direction, not a position
 *
 * Enemy tick is delegated to tickEnemies (lib/enemyEngine.ts):
 *   - Spawner: respects delay, ramps rate, places at screen edges
 *   - AI: moves each enemy toward current player position at profile speed
 */
export function updateGameState(state: GameState, dtMs: number): GameState {
  'worklet';
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
    const speed = PLAYER_MOVE_SPEED_PX_PER_SEC * (dtMs / 1000);
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

  return tickEnemies(stateAfterPlayer, dtMs);
}
