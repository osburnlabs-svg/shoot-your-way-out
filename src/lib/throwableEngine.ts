/**
 * Throwable system engine — arc-motion, detonation, and effect zone lifecycle.
 *
 * All functions are marked 'worklet' — called from updateGameState in gameEngine.ts
 * which runs inside useFrameCallback on the Reanimated UI thread.
 *
 * Module responsibilities:
 *   tickThrowables  — advance in-flight throwables along the arc, detect landing,
 *                     apply frag AOE damage, create effect zones for smoke/molotov,
 *                     advance detonating frag animation until slot clear.
 *   tickEffectZones — expire zones past their duration, apply molotov DoT ticks.
 *   spawnThrowable  — create a throwable in the first free slot. Marked 'worklet'
 *                     so it is callable from both the UI thread (future G5 skill ticks)
 *                     and the JS thread (debug buttons in GameCanvas).
 *
 * Arc motion:
 *   fraction = (elapsedMs - thrownAtMs) / THROWABLE_TRAVEL_TIME_MS  (clamped 0–1)
 *   screenX  = lerp(spawnX, targetX, fraction)
 *   screenY  = lerp(spawnY, targetY, fraction) - sin(fraction * PI) * THROWABLE_ARC_HEIGHT_PX
 *
 *   The GameCanvas reads spawnX/Y, targetX/Y, thrownAtMs from the throwable slot and
 *   computes the arc position in a useDerivedValue — the engine only tracks logical state.
 *
 * Frag detonation (status 'detonating'):
 *   AOE damage is applied once at landing. The slot then stays 'detonating' for
 *   FRAG_EXPLODE_FRAME_COUNT × FRAG_EXPLODE_FRAME_DURATION_MS ms so the explosion
 *   sprite can play. After that the slot is set to null.
 *
 * Smoke/Molotov:
 *   Slot is cleared immediately on landing. An EffectZone is created at targetX/Y.
 *   The zone carries the visual (smoke = Skia Circle; molotov = Flamethrower sprite).
 *
 * Phase 6 tech debt:
 *   Smoke zone has no kit sprite — rendered as a Skia grey Circle placeholder.
 *   Flag for replacement when a dedicated smoke asset is sourced.
 */

import type { GameState, ThrowableState, EffectZoneState } from './gameEngine';
import {
  THROWABLE_SLOT_COUNT,
  EFFECT_ZONE_SLOT_COUNT,
  THROWABLE_TRAVEL_TIME_MS,
  FRAG_DAMAGE,
  FRAG_RADIUS_PX,
  FRAG_EXPLODE_FRAME_COUNT,
  FRAG_EXPLODE_FRAME_DURATION_MS,
  SMOKE_DURATION_MS,
  SMOKE_RADIUS_PX,
  MOLOTOV_DURATION_MS,
  MOLOTOV_RADIUS_PX,
  MOLOTOV_DAMAGE_PER_SEC,
  MOLOTOV_TICK_INTERVAL_MS,
  ENEMY_COLLISION_RADIUS_PX,
} from '../data/gameConstants';
import type { PickupState } from './gameEngine';

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Apply AOE damage to all alive enemies within radiusPx of (centerX, centerY).
 * Killed enemies transition to 'dying' and spawn a pickup at their position.
 * Returns updated [enemies, pickups, nextPickupId, killCount].
 */
function applyAOEDamage(
  enemies: GameState['enemies'],
  pickups: PickupState[],
  nextPickupId: number,
  killCount: number,
  centerX: number,
  centerY: number,
  radiusPx: number,
  damage: number,
  elapsedMs: number,
): {
  enemies: GameState['enemies'];
  pickups: PickupState[];
  nextPickupId: number;
  killCount: number;
} {
  'worklet';

  const threshold = radiusPx + ENEMY_COLLISION_RADIUS_PX;
  const newEnemies: GameState['enemies'] = [];
  const newPickups: PickupState[] = [];
  for (let i = 0; i < pickups.length; i++) { newPickups.push(pickups[i]); }
  let pid = nextPickupId;
  let kills = killCount;

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy === null || enemy.status === 'dying') {
      newEnemies.push(enemy);
      continue;
    }

    const dx = enemy.x - centerX;
    const dy = enemy.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= threshold) {
      newEnemies.push(enemy);
      continue;
    }

    const newHp = enemy.hp - damage;
    if (newHp <= 0) {
      // Kill — transition to dying
      newEnemies.push({
        id: enemy.id,
        type: enemy.type,
        x: enemy.x,
        y: enemy.y,
        hp: 0,
        walkStartedAtMs: enemy.walkStartedAtMs,
        status: 'dying',
        dyingStartedAtMs: elapsedMs,
        lastHitPlayerAtMs: enemy.lastHitPlayerAtMs,
        hitFlashUntilMs: elapsedMs + 80,
      });
      kills += 1;
      newPickups.push({
        id: pid,
        x: enemy.x,
        y: enemy.y,
        vxPxPerSec: 0,
        vyPxPerSec: 0,
        type: 'money_small',
        scoreValue: 10,
        xpValue: 10,
        spawnedAtMs: elapsedMs,
      });
      pid += 1;
    } else {
      newEnemies.push({
        id: enemy.id,
        type: enemy.type,
        x: enemy.x,
        y: enemy.y,
        hp: newHp,
        walkStartedAtMs: enemy.walkStartedAtMs,
        status: enemy.status,
        dyingStartedAtMs: enemy.dyingStartedAtMs,
        lastHitPlayerAtMs: enemy.lastHitPlayerAtMs,
        hitFlashUntilMs: elapsedMs + 80,
      });
    }
  }

  return { enemies: newEnemies, pickups: newPickups, nextPickupId: pid, killCount: kills };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Spawn a throwable in the first free slot.
 * Callable from both UI thread (future G5 skill ticks) and JS thread (debug buttons).
 *
 * @param state    Current game state.
 * @param type     'frag' | 'smoke' | 'molotov'
 * @param targetX  Absolute canvas X coordinate of the target.
 * @param targetY  Absolute canvas Y coordinate of the target.
 */
export function spawnThrowable(
  state: GameState,
  type: 'frag' | 'smoke' | 'molotov',
  targetX: number,
  targetY: number,
): GameState {
  'worklet';

  // Find first free throwable slot.
  let freeSlot = -1;
  for (let i = 0; i < state.throwables.length; i++) {
    if (state.throwables[i] === null) { freeSlot = i; break; }
  }
  if (freeSlot === -1) return state; // All slots occupied — drop silently.

  const newThrowable: ThrowableState = {
    id: state.nextThrowableId,
    type,
    status: 'flying',
    spawnX: state.player.x,
    spawnY: state.player.y,
    targetX,
    targetY,
    thrownAtMs: state.elapsedMs,
    detonationStartedAtMs: 0,
  };

  const newThrowables: Array<ThrowableState | null> = [];
  for (let i = 0; i < state.throwables.length; i++) {
    newThrowables.push(state.throwables[i]);
  }
  newThrowables[freeSlot] = newThrowable;

  return {
    ...state,
    throwables: newThrowables,
    nextThrowableId: state.nextThrowableId + 1,
  };
}

/**
 * Advance all throwable entities by one fixed timestep.
 *
 * For 'flying' throwables: checks if travel time has elapsed.
 *   - frag: applies AOE damage, transitions to 'detonating'.
 *   - smoke/molotov: clears the slot, creates an EffectZone.
 *
 * For 'detonating' frags: clears the slot after explosion animation completes.
 */
export function tickThrowables(state: GameState, _dtMs: number): GameState {
  'worklet';

  const { elapsedMs } = state;
  const EXPLODE_DURATION_MS = FRAG_EXPLODE_FRAME_COUNT * FRAG_EXPLODE_FRAME_DURATION_MS;

  let throwables = state.throwables;
  let effectZones = state.effectZones;
  let nextEffectZoneId = state.nextEffectZoneId;
  let enemies = state.enemies;
  let pickups = state.pickups;
  let nextPickupId = state.nextPickupId;
  let killCount = state.killCount;

  let anyChange = false;
  const newThrowables: Array<ThrowableState | null> = [];
  for (let i = 0; i < throwables.length; i++) { newThrowables.push(throwables[i]); }

  for (let i = 0; i < newThrowables.length; i++) {
    const t = newThrowables[i];
    if (t === null) continue;

    if (t.status === 'flying') {
      const elapsed = elapsedMs - t.thrownAtMs;
      if (elapsed < THROWABLE_TRAVEL_TIME_MS) continue; // still in flight

      // Landed this tick.
      anyChange = true;

      if (t.type === 'frag') {
        // Apply AOE damage then transition to detonating.
        const result = applyAOEDamage(
          enemies, pickups, nextPickupId, killCount,
          t.targetX, t.targetY, FRAG_RADIUS_PX, FRAG_DAMAGE, elapsedMs,
        );
        enemies = result.enemies;
        pickups = result.pickups;
        nextPickupId = result.nextPickupId;
        killCount = result.killCount;

        newThrowables[i] = {
          id: t.id,
          type: t.type,
          status: 'detonating',
          spawnX: t.spawnX,
          spawnY: t.spawnY,
          targetX: t.targetX,
          targetY: t.targetY,
          thrownAtMs: t.thrownAtMs,
          detonationStartedAtMs: elapsedMs,
        };
      } else {
        // Smoke or molotov — clear slot, create effect zone.
        newThrowables[i] = null;

        // Find free effect zone slot.
        let zoneSlot = -1;
        const newZones: Array<EffectZoneState | null> = [];
        for (let zi = 0; zi < effectZones.length; zi++) { newZones.push(effectZones[zi]); }
        for (let zi = 0; zi < newZones.length; zi++) {
          if (newZones[zi] === null) { zoneSlot = zi; break; }
        }
        if (zoneSlot !== -1) {
          newZones[zoneSlot] = {
            id: nextEffectZoneId,
            type: t.type as 'smoke' | 'molotov',
            x: t.targetX,
            y: t.targetY,
            spawnedAtMs: elapsedMs,
            lastTickAppliedMs: 0,
          };
          nextEffectZoneId += 1;
          effectZones = newZones;
        }
      }
    } else if (t.status === 'detonating') {
      // Clear slot after explosion animation completes.
      if (elapsedMs - t.detonationStartedAtMs >= EXPLODE_DURATION_MS) {
        newThrowables[i] = null;
        anyChange = true;
      }
    }
  }

  if (!anyChange && effectZones === state.effectZones) return state;

  return {
    ...state,
    throwables: newThrowables,
    effectZones,
    nextEffectZoneId,
    enemies,
    pickups,
    nextPickupId,
    killCount,
  };
}

/**
 * Advance all effect zones by one fixed timestep.
 *
 * - Expires zones that have outlived their duration.
 * - Applies molotov DoT damage on MOLOTOV_TICK_INTERVAL_MS intervals.
 * - Smoke zones are passive (slow applied inline in tickEnemies) — no action here.
 */
export function tickEffectZones(state: GameState, _dtMs: number): GameState {
  'worklet';

  const { elapsedMs } = state;
  let zones = state.effectZones;
  let enemies = state.enemies;
  let pickups = state.pickups;
  let nextPickupId = state.nextPickupId;
  let killCount = state.killCount;

  let anyChange = false;
  const newZones: Array<EffectZoneState | null> = [];
  for (let i = 0; i < zones.length; i++) { newZones.push(zones[i]); }

  for (let i = 0; i < newZones.length; i++) {
    const zone = newZones[i];
    if (zone === null) continue;

    const duration = zone.type === 'smoke' ? SMOKE_DURATION_MS : MOLOTOV_DURATION_MS;
    if (elapsedMs - zone.spawnedAtMs >= duration) {
      newZones[i] = null;
      anyChange = true;
      continue;
    }

    if (zone.type === 'molotov') {
      const timeSinceLastTick = elapsedMs - zone.lastTickAppliedMs;
      if (timeSinceLastTick >= MOLOTOV_TICK_INTERVAL_MS) {
        const tickDamage = MOLOTOV_DAMAGE_PER_SEC * (MOLOTOV_TICK_INTERVAL_MS / 1000);
        const result = applyAOEDamage(
          enemies, pickups, nextPickupId, killCount,
          zone.x, zone.y, MOLOTOV_RADIUS_PX, tickDamage, elapsedMs,
        );
        enemies = result.enemies;
        pickups = result.pickups;
        nextPickupId = result.nextPickupId;
        killCount = result.killCount;

        newZones[i] = {
          id: zone.id,
          type: zone.type,
          x: zone.x,
          y: zone.y,
          spawnedAtMs: zone.spawnedAtMs,
          lastTickAppliedMs: elapsedMs,
        };
        anyChange = true;
      }
    }
  }

  if (!anyChange) return state;

  return {
    ...state,
    effectZones: newZones,
    enemies,
    pickups,
    nextPickupId,
    killCount,
  };
}
