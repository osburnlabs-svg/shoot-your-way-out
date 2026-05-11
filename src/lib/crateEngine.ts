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

  const minX = CRATE_SPAWN_MARGIN_PX;
  const maxX = state.canvasWidth - CRATE_SPAWN_MARGIN_PX;
  const minY = CRATE_SPAWN_MARGIN_PX;
  const maxY = state.canvasHeight - CRATE_SPAWN_MARGIN_PX;
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
