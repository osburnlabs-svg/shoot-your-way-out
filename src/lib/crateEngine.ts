/**
 * Crate spawn tick — timer-based random world placement.
 * Runs on the Reanimated UI thread (worklet) as part of the updateGameState chain,
 * immediately after tickPickups.
 *
 * Fires every CRATE_SPAWN_INTERVAL_MS. Spawns one crate at a random canvas position
 * (CRATE_SPAWN_MARGIN_PX from each edge) if active count < CRATE_MAX_ACTIVE.
 * Skips silently if cap is reached or no slot is free (advances timer regardless).
 */

import type { GameState, CrateState } from './gameEngine';
import {
  CRATE_SLOT_COUNT,
  CRATE_SPAWN_INTERVAL_MS,
  CRATE_MAX_ACTIVE,
  CRATE_SPAWN_MARGIN_PX,
  CAMERA_ZOOM,
} from '../data/gameConstants';

export function tickCrateSpawn(state: GameState, _dtMs: number): GameState {
  'worklet';

  if (state.elapsedMs < state.nextCrateSpawnAtMs) return state;

  const nextSpawnAtMs = state.nextCrateSpawnAtMs + CRATE_SPAWN_INTERVAL_MS;

  let activeCount = 0;
  for (let i = 0; i < state.crates.length; i++) {
    if (state.crates[i] !== null) activeCount += 1;
  }

  if (activeCount >= CRATE_MAX_ACTIVE) {
    return { ...state, nextCrateSpawnAtMs: nextSpawnAtMs };
  }

  let slot = -1;
  for (let i = 0; i < CRATE_SLOT_COUNT; i++) {
    if (state.crates[i] === null) { slot = i; break; }
  }
  if (slot === -1) {
    return { ...state, nextCrateSpawnAtMs: nextSpawnAtMs };
  }

  const viewHalfW = state.canvasWidth / (2 * CAMERA_ZOOM);
  const viewHalfH = state.canvasHeight / (2 * CAMERA_ZOOM);
  const minX = Math.max(state.player.x - viewHalfW + CRATE_SPAWN_MARGIN_PX, 0);
  const maxX = Math.min(state.player.x + viewHalfW - CRATE_SPAWN_MARGIN_PX, state.worldWidth);
  const minY = Math.max(state.player.y - viewHalfH + CRATE_SPAWN_MARGIN_PX, 0);
  const maxY = Math.min(state.player.y + viewHalfH - CRATE_SPAWN_MARGIN_PX, state.worldHeight);
  const x = minX + Math.random() * (maxX - minX);
  const y = minY + Math.random() * (maxY - minY);

  const newCrate: CrateState = {
    id: state.nextCrateId,
    x,
    y,
    spawnedAtMs: state.elapsedMs,
  };

  const newCrates = state.crates.slice() as Array<CrateState | null>;
  newCrates[slot] = newCrate;

  return {
    ...state,
    crates: newCrates,
    nextCrateId: state.nextCrateId + 1,
    nextCrateSpawnAtMs: nextSpawnAtMs,
  };
}
