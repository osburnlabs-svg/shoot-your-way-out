/**
 * Game state types and state update function.
 *
 * This module owns:
 *   - The shape of GameState (single source of truth for all mutable game data)
 *   - createInitialGameState — builds the starting state from canvas dimensions
 *   - updateGameState — advances state by one fixed timestep (no-op in G2;
 *     movement, animation, combat, spawning are added in Groups 3+)
 *
 * All functions are marked 'worklet' — they run on the Reanimated UI thread
 * inside the useFrameCallback game loop. Do not add imports that are not
 * worklet-safe (no React hooks, no AsyncStorage, no side effects).
 *
 * Future phases add fields to GameState:
 *   Group 3: drag input target position, velocity
 *   Phase 3:  enemies[], projectiles[]
 *   Phase 4a: xp, level, skills[]
 *   Phase 4b: activeCrates[], throwables[]
 */

import type { HeroWeaponPose } from './sprites';

export type PlayerState = {
  x: number;
  y: number;
  rotation: number;      // radians; 0 = facing right, increases clockwise
  weaponPose: HeroWeaponPose;
  isMoving: boolean;
  animFrame: number;     // current walk-cycle frame index
  animElapsedMs: number; // ms since last frame advance
};

export type GameState = {
  player: PlayerState;
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
      weaponPose: 'pistol',
      isMoving: false,
      animFrame: 0,
      animElapsedMs: 0,
    },
    elapsedMs: 0,
    frameCount: 0,
  };
}

/**
 * Advance game state by one fixed timestep (FIXED_STEP_MS).
 *
 * G2: only elapsedMs and frameCount are updated. All gameplay logic
 * (movement, animation, combat, spawning) is added in Groups 3+.
 * The pattern is already established — each group extends this function.
 */
export function updateGameState(state: GameState, dtMs: number): GameState {
  'worklet';
  return {
    ...state,
    elapsedMs: state.elapsedMs + dtMs,
    frameCount: state.frameCount + 1,
  };
}
