/**
 * Pickup tick — magnet pull, collection, score/XP grant.
 * Runs on the Reanimated UI thread (worklet) as the final step of updateGameState.
 *
 * Tick ordering (called after tickCombat):
 *   For each active pickup:
 *     1. Compute distance to player center
 *     2. If within COLLECT_RADIUS_PX: collect (add score + xp, despawn)
 *     3. If within MAGNET_RANGE_PX: move directly toward player at MAGNET_MAX_SPEED_PX_PER_SEC
 *     4. Otherwise: pickup stays still, velocity explicitly zeroed
 *
 * Threading contract:
 *   - All logic runs on the UI thread (worklet).
 *   - audioEngine.playSFX is worklet-safe (stub has 'worklet' directive).
 *   - No runOnJS calls. No React state reads or writes.
 *
 * Magnet model:
 *   Direct-pull: velocity recomputed each tick as unit-vector-toward-player × max speed.
 *   No acceleration, no momentum. Pickup always moves at full speed toward current
 *   player position — no tail-chase, no drift.
 */

import type { GameState, PickupState } from './gameEngine';
import { audioEngine } from './audioEngine';
import {
  MAGNET_RANGE_PX,
  MAGNET_MAX_SPEED_PX_PER_SEC,
  COLLECT_RADIUS_PX,
} from '../data/gameConstants';

/** Squared thresholds — avoid sqrt in the hot loop until needed for normalization. */
const MAGNET_RANGE_SQ = MAGNET_RANGE_PX * MAGNET_RANGE_PX;
const COLLECT_RADIUS_SQ = COLLECT_RADIUS_PX * COLLECT_RADIUS_PX;

export function tickPickups(state: GameState, dtMs: number): GameState {
  'worklet';

  const { pickups, player } = state;
  if (pickups.length === 0) return state;

  const dtSec = dtMs / 1000;
  let newScore = player.score;
  let newXp = player.xp;

  const survivingPickups: PickupState[] = [];

  for (let i = 0; i < pickups.length; i++) {
    const pickup = pickups[i];

    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const distSq = dx * dx + dy * dy;

    // ─── Collect ────────────────────────────────────────────────────────────
    if (distSq < COLLECT_RADIUS_SQ) {
      newScore += pickup.scoreValue;
      newXp += pickup.xpValue;
      audioEngine.playSFX('xp_absorb');
      continue; // despawn — do not push to survivingPickups
    }

    // ─── Magnet pull ────────────────────────────────────────────────────────
    if (distSq < MAGNET_RANGE_SQ) {
      // Direct-pull: recompute velocity fresh each tick — no momentum.
      const dist = Math.sqrt(distSq);
      const vx = (dx / dist) * MAGNET_MAX_SPEED_PX_PER_SEC;
      const vy = (dy / dist) * MAGNET_MAX_SPEED_PX_PER_SEC;

      survivingPickups.push({
        id: pickup.id,
        x: pickup.x + vx * dtSec,
        y: pickup.y + vy * dtSec,
        vxPxPerSec: vx,
        vyPxPerSec: vy,
        type: pickup.type,
        scoreValue: pickup.scoreValue,
        xpValue: pickup.xpValue,
        spawnedAtMs: pickup.spawnedAtMs,
      });
    } else {
      // Out of magnet range — stationary, velocity explicitly zeroed (no drift).
      survivingPickups.push({ ...pickup, vxPxPerSec: 0, vyPxPerSec: 0 });
    }
  }

  return {
    ...state,
    pickups: survivingPickups,
    player: {
      ...state.player,
      score: newScore,
      xp: newXp,
    },
  };
}
