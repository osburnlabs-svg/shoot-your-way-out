/**
 * Crate spawn tick — timer-based random world placement.
 * Runs on the Reanimated UI thread (worklet) as part of the updateGameState chain,
 * immediately after tickPickups.
 *
 * Fires every CRATE_SPAWN_INTERVAL_MS. Spawns one crate at a random WORLD-SPACE
 * position within the camera viewport, inset by CRATE_SPAWN_MARGIN_PX from each
 * screen edge (so crates are always visible and reachable). World-edge clamped to
 * [viewHalfW, worldWidth - viewHalfW] — matches the player movement wall exactly
 * so crates never spawn outside the player-reachable area. Rejects positions that land inside a
 * solid prop exclusion circle; retries up to CRATE_SPAWN_MAX_ATTEMPTS times before
 * skipping this cycle (timer still advances).
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

// Max position re-rolls before skipping this spawn cycle.
const CRATE_SPAWN_MAX_ATTEMPTS = 10;

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
  const minX = Math.max(state.player.x - viewHalfW + CRATE_SPAWN_MARGIN_PX, viewHalfW);
  const maxX = Math.min(state.player.x + viewHalfW - CRATE_SPAWN_MARGIN_PX, state.worldWidth - viewHalfW);
  const minY = Math.max(state.player.y - viewHalfH + CRATE_SPAWN_MARGIN_PX, viewHalfH);
  const maxY = Math.min(state.player.y + viewHalfH - CRATE_SPAWN_MARGIN_PX, state.worldHeight - viewHalfH);

  const exclusions = state.solidPropExclusions;
  let x = 0;
  let y = 0;
  let placed = false;
  for (let attempt = 0; attempt < CRATE_SPAWN_MAX_ATTEMPTS; attempt++) {
    const cx = minX + Math.random() * (maxX - minX);
    const cy = minY + Math.random() * (maxY - minY);
    let blocked = false;
    for (let j = 0; j < exclusions.length; j++) {
      const ex = exclusions[j]!;
      const dx = cx - ex.x;
      const dy = cy - ex.y;
      if (dx * dx + dy * dy < ex.r * ex.r) { blocked = true; break; }
    }
    if (!blocked) { x = cx; y = cy; placed = true; break; }
  }
  if (!placed) {
    return { ...state, nextCrateSpawnAtMs: nextSpawnAtMs };
  }

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
