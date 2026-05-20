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
  FLAMETHROWER_ZONE_DURATION_MS,
  FLAMETHROWER_ZONE_RADIUS_PX,
  FLAMETHROWER_ZONE_DAMAGE_PER_SEC,
  RARITY_DAMAGE_MULTIPLIERS,
  ENEMY_COLLISION_RADIUS_PX,
  THROWABLE_TARGET_RANGE_PX,
} from '../data/gameConstants';
import type { PickupState } from './gameEngine';

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Apply AOE damage to all alive enemies within radiusPx of (centerX, centerY).
 * Killed enemies transition to 'dying' and spawn a pickup at their position.
 * Returns updated [enemies, pickups, nextPickupId, killCount].
 * Exported so combatEngine can call it for rocket detonations.
 */
export function applyAOEDamage(
  enemies: GameState['enemies'],
  pickups: Array<PickupState | null>,
  nextPickupId: number,
  killCount: number,
  centerX: number,
  centerY: number,
  radiusPx: number,
  damage: number,
  elapsedMs: number,
): {
  enemies: GameState['enemies'];
  pickups: Array<PickupState | null>;
  nextPickupId: number;
  killCount: number;
} {
  'worklet';

  const threshold = radiusPx + ENEMY_COLLISION_RADIUS_PX;
  const newEnemies: GameState['enemies'] = [];
  const newPickups: Array<PickupState | null> = pickups.slice();
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
        fireCooldownMs: enemy.fireCooldownMs,
        lastFiredAtMs: enemy.lastFiredAtMs,
      });
      kills += 1;
      // Silent drop if all slots full — same policy as crates. Tune PICKUP_SLOT_COUNT if Phase 5+ density requires.
      let aoeSpawnSlot = -1;
      for (let s = 0; s < newPickups.length; s++) {
        if (newPickups[s] === null) { aoeSpawnSlot = s; break; }
      }
      if (aoeSpawnSlot !== -1) {
        newPickups[aoeSpawnSlot] = {
          id: pid,
          x: enemy.x,
          y: enemy.y,
          vxPxPerSec: 0,
          vyPxPerSec: 0,
          type: 'money_small',
          scoreValue: 10,
          xpValue: 10,
          spawnedAtMs: elapsedMs,
        };
        pid += 1;
      }
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
        fireCooldownMs: enemy.fireCooldownMs,
        lastFiredAtMs: enemy.lastFiredAtMs,
      });
    }
  }

  return { enemies: newEnemies, pickups: newPickups, nextPickupId: pid, killCount: kills };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Spawn an effect zone of the given type at an absolute canvas position.
 * Finds the first free slot in effectZones. Silently drops if all slots are full.
 * Callable from both combatEngine (rocket impact / flamethrower fire) and throwableEngine.
 */
export function spawnEffectZoneAt(
  state: GameState,
  type: 'flame' | 'explosion',
  x: number,
  y: number,
  rotation = 0,
): GameState {
  'worklet';

  let freeSlot = -1;
  const newZones: Array<EffectZoneState | null> = [];
  for (let zi = 0; zi < state.effectZones.length; zi++) { newZones.push(state.effectZones[zi]); }
  for (let zi = 0; zi < newZones.length; zi++) {
    if (newZones[zi] === null) { freeSlot = zi; break; }
  }
  if (freeSlot === -1) return state; // no free slot — drop silently

  newZones[freeSlot] = {
    id: state.nextEffectZoneId,
    type,
    x,
    y,
    rotation,
    spawnedAtMs: state.elapsedMs,
    lastTickAppliedMs: 0,
  };

  return {
    ...state,
    effectZones: newZones,
    nextEffectZoneId: state.nextEffectZoneId + 1,
  };
}

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
            rotation: 0,
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

    let duration: number;
    if (zone.type === 'smoke') {
      duration = SMOKE_DURATION_MS;
    } else if (zone.type === 'flame') {
      duration = FLAMETHROWER_ZONE_DURATION_MS;
    } else if (zone.type === 'explosion') {
      duration = FRAG_EXPLODE_FRAME_COUNT * FRAG_EXPLODE_FRAME_DURATION_MS;
    } else {
      duration = MOLOTOV_DURATION_MS;
    }

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
          rotation: zone.rotation,
          spawnedAtMs: zone.spawnedAtMs,
          lastTickAppliedMs: elapsedMs,
        };
        anyChange = true;
      }
    } else if (zone.type === 'flame') {
      const timeSinceLastTick = elapsedMs - zone.lastTickAppliedMs;
      if (timeSinceLastTick >= MOLOTOV_TICK_INTERVAL_MS) {
        // Rarity multiplier applies to flamethrower zone DoT. Skill damage modifiers do NOT —
        // flamethrower is intentionally outside the projectile damage system.
        const rarityMult = RARITY_DAMAGE_MULTIPLIERS[state.player.equippedWeaponRarity] ?? 1.0;
        const tickDamage = FLAMETHROWER_ZONE_DAMAGE_PER_SEC * rarityMult * (MOLOTOV_TICK_INTERVAL_MS / 1000);
        const result = applyAOEDamage(
          enemies, pickups, nextPickupId, killCount,
          zone.x, zone.y, FLAMETHROWER_ZONE_RADIUS_PX, tickDamage, elapsedMs,
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
          rotation: zone.rotation,
          spawnedAtMs: zone.spawnedAtMs,
          lastTickAppliedMs: elapsedMs,
        };
        anyChange = true;
      }
    }
    // 'smoke' and 'explosion' are passive — no per-tick action needed.
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

/**
 * Advance throwable skill cooldowns and auto-fire when cooldown expires.
 *
 * Called once per fixed step after tickEffectZones and before tickRegen.
 * Each of the three throwable skills (frag, smoke, molotov) is processed
 * independently with its own cooldown field on PlayerState.
 *
 * Cooldown math:
 *   Frag:    max(8000  - 2000 * stacks, 4000)  ms
 *   Smoke:   max(15000 - 3000 * stacks, 9000)  ms
 *   Molotov: max(12000 - 3000 * stacks, 6000)  ms
 *
 * When cooldown reaches 0 or below:
 *   1. Collect all alive enemies within THROWABLE_TARGET_RANGE_PX of the player.
 *   2. If none: cooldown stays at 0 — fires instantly when an enemy enters range.
 *   3. If found: pick one at random (Math.random() is worklet-safe), call
 *      spawnThrowable(), reset cooldown to the effective duration.
 *
 * Cooldown does NOT advance if the player has 0 stacks (skill not selected).
 * Engine freeze (isDead / pendingLevelUp) suppresses all ticks — no new guard needed.
 *
 * Phase 6 audio stub: throwable_spawn SFX call site omitted — wire to audioEngine
 * when audio system is built. TODO: audioEngine.playSFX('throwable_spawn', type)
 */
export function tickThrowableSkills(state: GameState, dtMs: number): GameState {
  'worklet';

  const fragStacks   = state.player.skillStacks['throwables_frag']    ?? 0;
  const smokeStacks  = state.player.skillStacks['throwables_smoke']   ?? 0;
  const molotovStacks = state.player.skillStacks['throwables_molotov'] ?? 0;

  // Fast-path: no throwable skills selected.
  if (fragStacks === 0 && smokeStacks === 0 && molotovStacks === 0) return state;

  const fragCd    = Math.max(8000  - 2000 * fragStacks,    4000);
  const smokeCd   = Math.max(15000 - 3000 * smokeStacks,   9000);
  const molotovCd = Math.max(12000 - 3000 * molotovStacks, 6000);

  let newFragMs    = fragStacks    > 0 ? state.player.fragCooldownMs    - dtMs : state.player.fragCooldownMs;
  let newSmokeMs   = smokeStacks   > 0 ? state.player.smokeCooldownMs   - dtMs : state.player.smokeCooldownMs;
  let newMolotovMs = molotovStacks > 0 ? state.player.molotovCooldownMs - dtMs : state.player.molotovCooldownMs;

  // Floor at 0 so cooldown doesn't accumulate negative time.
  if (newFragMs    < 0) newFragMs    = 0;
  if (newSmokeMs   < 0) newSmokeMs   = 0;
  if (newMolotovMs < 0) newMolotovMs = 0;

  let newState = state;

  /**
   * Pick a random alive enemy within THROWABLE_TARGET_RANGE_PX of the player.
   * Returns null if no eligible target exists.
   * Inlined as a closure (no separate function) to avoid additional worklet overhead.
   */
  const pickTarget = (): { x: number; y: number } | null => {
    'worklet';
    const rangeSq = THROWABLE_TARGET_RANGE_PX * THROWABLE_TARGET_RANGE_PX;
    const px = newState.player.x;
    const py = newState.player.y;
    const eligible: number[] = [];
    for (let i = 0; i < newState.enemies.length; i++) {
      const e = newState.enemies[i];
      if (!e || e.status !== 'alive') continue;
      const dx = e.x - px;
      const dy = e.y - py;
      if (dx * dx + dy * dy <= rangeSq) {
        eligible.push(i);
      }
    }
    if (eligible.length === 0) return null;
    const chosen = newState.enemies[eligible[Math.floor(Math.random() * eligible.length)]!]!;
    return { x: chosen.x, y: chosen.y };
  };

  // Frag
  if (fragStacks > 0 && newFragMs <= 0) {
    const target = pickTarget();
    if (target !== null) {
      newState = spawnThrowable(newState, 'frag', target.x, target.y);
      newFragMs = fragCd;
    }
    // No target: cooldown stays at 0, fires instantly on next tick with an enemy in range.
  }

  // Smoke
  if (smokeStacks > 0 && newSmokeMs <= 0) {
    const target = pickTarget();
    if (target !== null) {
      newState = spawnThrowable(newState, 'smoke', target.x, target.y);
      newSmokeMs = smokeCd;
    }
  }

  // Molotov
  if (molotovStacks > 0 && newMolotovMs <= 0) {
    const target = pickTarget();
    if (target !== null) {
      newState = spawnThrowable(newState, 'molotov', target.x, target.y);
      newMolotovMs = molotovCd;
    }
  }

  return {
    ...newState,
    player: {
      ...newState.player,
      fragCooldownMs:    newFragMs,
      smokeCooldownMs:   newSmokeMs,
      molotovCooldownMs: newMolotovMs,
    },
  };
}
