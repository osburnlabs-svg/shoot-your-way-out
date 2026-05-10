/**
 * Pickup tick — magnet pull, collection, score/XP grant.
 * Runs on the Reanimated UI thread (worklet) as the final step of updateGameState.
 *
 * Tick ordering (called after tickCombat):
 *   For each active pickup:
 *     1. Compute distance to player center
 *     2. If within COLLECT_RADIUS_PX: collect (add score + xp, despawn)
 *     3. If within MAGNET_RANGE_PX: accelerate toward player, cap at max speed,
 *        advance position
 *     4. Otherwise: pickup stays still (velocity preserved for when player re-enters range)
 *
 * Threading contract:
 *   - All logic runs on the UI thread (worklet).
 *   - audioEngine.playSFX is worklet-safe (stub has 'worklet' directive).
 *   - No runOnJS calls. No React state reads or writes.
 *
 * Magnet model:
 *   Constant acceleration toward player position each tick.
 *   Speed capped at MAGNET_MAX_SPEED_PX_PER_SEC to prevent teleportation.
 *   Acceleration applied in normalized direction — pickup curves toward player
 *   as both move, giving the visual "chasing" effect.
 */

import type { GameState, PickupState } from './gameEngine';
import { audioEngine } from './audioEngine';
import {
  MAGNET_RANGE_PX,
  MAGNET_ACCELERATION_PX_PER_SEC_SQ,
  MAGNET_MAX_SPEED_PX_PER_SEC,
  COLLECT_RADIUS_PX,
} from '../data/gameConstants';

/** Squared thresholds — avoid sqrt in the hot loop until needed for normalization. */
const MAGNET_RANGE_SQ = MAGNET_RANGE_PX * MAGNET_RANGE_PX;
const COLLECT_RADIUS_SQ = COLLECT_RADIUS_PX * COLLECT_RADIUS_PX;
const MAX_SPEED_SQ = MAGNET_MAX_SPEED_PX_PER_SEC * MAGNET_MAX_SPEED_PX_PER_SEC;

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
      // Normalize direction toward player (sqrt needed here for direction unit vector).
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      // Apply acceleration toward player this tick.
      let newVx = pickup.vxPxPerSec + nx * MAGNET_ACCELERATION_PX_PER_SEC_SQ * dtSec;
      let newVy = pickup.vyPxPerSec + ny * MAGNET_ACCELERATION_PX_PER_SEC_SQ * dtSec;

      // Cap speed magnitude at MAGNET_MAX_SPEED_PX_PER_SEC.
      const speedSq = newVx * newVx + newVy * newVy;
      if (speedSq > MAX_SPEED_SQ) {
        const spd = Math.sqrt(speedSq);
        newVx = (newVx / spd) * MAGNET_MAX_SPEED_PX_PER_SEC;
        newVy = (newVy / spd) * MAGNET_MAX_SPEED_PX_PER_SEC;
      }

      survivingPickups.push({
        id: pickup.id,
        x: pickup.x + newVx * dtSec,
        y: pickup.y + newVy * dtSec,
        vxPxPerSec: newVx,
        vyPxPerSec: newVy,
        type: pickup.type,
        scoreValue: pickup.scoreValue,
        xpValue: pickup.xpValue,
        spawnedAtMs: pickup.spawnedAtMs,
      });
    } else {
      // Out of magnet range — stationary this tick.
      // Velocity is preserved so if player re-enters range, acceleration resumes.
      survivingPickups.push(pickup);
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
