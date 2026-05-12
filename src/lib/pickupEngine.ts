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

import type { GameState, PickupState, CrateState } from './gameEngine';
import { audioEngine } from './audioEngine';
import {
  MAGNET_RANGE_PX,
  MAGNET_MAX_SPEED_PX_PER_SEC,
  COLLECT_RADIUS_PX,
  CRATE_PICKUP_RADIUS_PX,
  CRATE_TIER_WEIGHTS,
  CRATE_TIER_WEAPONS,
} from '../data/gameConstants';
import type { CrateTier } from '../data/gameConstants';

/** Squared thresholds — avoid sqrt in the hot loop until needed for normalization. */
const MAGNET_RANGE_SQ = MAGNET_RANGE_PX * MAGNET_RANGE_PX;
const COLLECT_RADIUS_SQ = COLLECT_RADIUS_PX * COLLECT_RADIUS_PX;
const CRATE_PICKUP_RADIUS_SQ = CRATE_PICKUP_RADIUS_PX * CRATE_PICKUP_RADIUS_PX;

export function tickPickups(state: GameState, dtMs: number): GameState {
  'worklet';

  const { pickups, player } = state;

  // Comms Headset: +30% magnet range per stack.
  // Computed per-tick here rather than via getEffectiveStats to avoid importing
  // WEAPON_PROFILES into pickupEngine. Result replaces the module-level constant.
  const commsStacks = player.skillStacks['provisions_comms_headset'] ?? 0;
  const effectiveMagnetRange = MAGNET_RANGE_PX * (1 + 0.30 * commsStacks);
  const effectiveMagnetRangeSq = effectiveMagnetRange * effectiveMagnetRange;

  const dtSec = dtMs / 1000;
  let newScore = player.score;
  let newXp = player.xp;

  const newPickups: Array<PickupState | null> = pickups.slice();

  for (let i = 0; i < newPickups.length; i++) {
    const pickup = newPickups[i];
    if (!pickup) continue;

    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const distSq = dx * dx + dy * dy;

    // ─── Collect ────────────────────────────────────────────────────────────
    if (distSq < COLLECT_RADIUS_SQ) {
      newScore += pickup.scoreValue;
      newXp += pickup.xpValue;
      audioEngine.playSFX('xp_absorb');
      newPickups[i] = null; // null the slot — index does not shift
      continue;
    }

    // ─── Magnet pull ────────────────────────────────────────────────────────
    if (distSq < effectiveMagnetRangeSq) {
      // Direct-pull: recompute velocity fresh each tick — no momentum.
      const dist = Math.sqrt(distSq);
      const vx = (dx / dist) * MAGNET_MAX_SPEED_PX_PER_SEC;
      const vy = (dy / dist) * MAGNET_MAX_SPEED_PX_PER_SEC;

      newPickups[i] = {
        id: pickup.id,
        x: pickup.x + vx * dtSec,
        y: pickup.y + vy * dtSec,
        vxPxPerSec: vx,
        vyPxPerSec: vy,
        type: pickup.type,
        scoreValue: pickup.scoreValue,
        xpValue: pickup.xpValue,
        spawnedAtMs: pickup.spawnedAtMs,
      };
    } else {
      // Out of magnet range — stationary, velocity explicitly zeroed (no drift).
      newPickups[i] = { ...pickup, vxPxPerSec: 0, vyPxPerSec: 0 };
    }
  }

  // ─── Crate pickup ──────────────────────────────────────────────────────────
  let cratesChanged = false;
  let pendingCrateReveal = state.pendingCrateReveal;
  let crateRevealWeaponId = state.crateRevealWeaponId;
  let crateRevealTier = state.crateRevealTier;
  const newCrates: Array<CrateState | null> = state.crates.slice();

  for (let i = 0; i < newCrates.length; i++) {
    const crate = newCrates[i];
    if (!crate) continue;
    const cdx = player.x - crate.x;
    const cdy = player.y - crate.y;
    if (cdx * cdx + cdy * cdy < CRATE_PICKUP_RADIUS_SQ) {
      newCrates[i] = null;
      cratesChanged = true;

      // Tier roll — accumulator-weighted, stops at first threshold exceeded.
      const rand = Math.random();
      let tier: CrateTier;
      if (rand < CRATE_TIER_WEIGHTS.common) {
        tier = 'common';
      } else if (rand < CRATE_TIER_WEIGHTS.common + CRATE_TIER_WEIGHTS.uncommon) {
        tier = 'uncommon';
      } else if (rand < CRATE_TIER_WEIGHTS.common + CRATE_TIER_WEIGHTS.uncommon + CRATE_TIER_WEIGHTS.rare) {
        tier = 'rare';
      } else {
        tier = 'legendary';
      }
      const pool = CRATE_TIER_WEAPONS[tier];
      const weaponId = pool[Math.floor(Math.random() * pool.length)]!;

      pendingCrateReveal = true;
      crateRevealWeaponId = weaponId;
      crateRevealTier = tier;
      audioEngine.playSFX('crate_open');
      break; // one crate pickup per tick
    }
  }

  return {
    ...state,
    pickups: newPickups,
    player: {
      ...state.player,
      score: newScore,
      xp: newXp,
    },
    crates: cratesChanged ? newCrates : state.crates,
    pendingCrateReveal,
    crateRevealWeaponId,
    crateRevealTier,
  };
}
