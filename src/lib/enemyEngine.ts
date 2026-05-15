/**
 * Enemy spawner and AI tick — runs inside the fixed-timestep loop on the UI thread.
 *
 * All functions are marked 'worklet' — called from updateGameState in gameEngine.ts
 * which itself runs inside useFrameCallback on the Reanimated UI thread.
 *
 * Responsibilities:
 *   - Spawner: respects initial delay, ramps spawn rate + Raider ratio over time,
 *     enforces soft cap, places enemies at random points just outside screen edge.
 *   - AI tick: per-enemy heading toward player, position advance by moveSpeed * dt.
 *     Dying enemies are skipped — they stay in place until despawned by combatEngine.
 *     No avoidance or separation — enemies clip through each other (acceptable in G2).
 *
 * NOT in scope here (future phases):
 *   - Contact damage to player (G3)
 *   - Money pickup spawning on death (G3)
 *   - Gunner/Sniper/vehicle AI variants (Phase 5)
 */

import type { GameState, EnemyState, ProjectileState } from './gameEngine';
import { ENEMY_PROFILES } from '../data/enemies';
import type { EnemyType } from '../data/enemies';
import {
  SPAWN_INITIAL_DELAY_MS,
  SPAWN_RATE_INITIAL,
  SPAWN_RATE_MAX,
  SPAWN_RATE_RAMP_DURATION_MS,
  ENEMY_SOFT_CAP,
  SPAWN_MARGIN_PX,
  RAIDER_RATIO_INITIAL,
  RAIDER_RATIO_MAX,
  RAIDER_RATIO_RAMP_DURATION_MS,
  ENEMY_BASE_SPEED_PX_PER_SEC,
  ENEMY_COLLISION_RADIUS_PX,
  SMOKE_RADIUS_PX,
  SMOKE_SLOW_MULT,
  CAMERA_ZOOM,
  SNIPER_FIRE_RANGE_PX,
  SNIPER_FIRE_COOLDOWN_MS,
  SNIPER_PROJECTILE_SPEED_PX_PER_SEC,
  SNIPER_PROJECTILE_DAMAGE,
  SNIPER_MAX_ACTIVE,
  SNIPER_RATIO_RAMP_START_MS,
  SNIPER_RATIO_RAMP_END_MS,
  SNIPER_RATIO_MAX,
} from '../data/gameConstants';
import { resolveAABB, resolveCircle } from './collision';
import type { CollisionData } from './collision';
import { spawnEffectZoneAt } from './throwableEngine';

/** Linear interpolation — inlined here to avoid importing a non-worklet util. */
function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

/** Enemies-per-second at the given elapsed time. Ramps linearly over 60s. */
function spawnRateAt(elapsedMs: number): number {
  'worklet';
  const t = Math.min(elapsedMs / SPAWN_RATE_RAMP_DURATION_MS, 1);
  return lerp(SPAWN_RATE_INITIAL, SPAWN_RATE_MAX, t);
}

/** Fraction of spawns that should be Raiders at the given elapsed time. Ramps over 90s. */
function raiderRatioAt(elapsedMs: number): number {
  'worklet';
  const t = Math.min(elapsedMs / RAIDER_RATIO_RAMP_DURATION_MS, 1);
  return lerp(RAIDER_RATIO_INITIAL, RAIDER_RATIO_MAX, t);
}

/** Sniper spawn fraction — linearly ramps from 0 to SNIPER_RATIO_MAX between the ramp window. */
function sniperRatioAt(elapsedMs: number): number {
  'worklet';
  if (elapsedMs < SNIPER_RATIO_RAMP_START_MS) return 0;
  const t = Math.min(
    (elapsedMs - SNIPER_RATIO_RAMP_START_MS) / (SNIPER_RATIO_RAMP_END_MS - SNIPER_RATIO_RAMP_START_MS),
    1,
  );
  return lerp(0, SNIPER_RATIO_MAX, t);
}

/** Roll enemy type based on current ratios. Sniper rolls first, then raider/scav split. */
function rollEnemyType(elapsedMs: number): EnemyType {
  'worklet';
  const sniperRatio = sniperRatioAt(elapsedMs);
  if (sniperRatio > 0 && Math.random() < sniperRatio) {
    return Math.random() < 0.5 ? 'sniperA' : 'sniperB';
  }
  return Math.random() < raiderRatioAt(elapsedMs) ? 'raider' : 'scav';
}

/**
 * Pick a random position just outside the visible viewport edge.
 * Viewport is centered on the player — enemies spawn at the edge of what the
 * player can see so they always walk in from off-screen.
 * All positions are clamped to world bounds so enemies never spawn outside the arena.
 */
function randomEdgePos(
  playerX: number,
  playerY: number,
  viewHalfW: number,
  viewHalfH: number,
  worldWidth: number,
  worldHeight: number,
): { x: number; y: number } {
  'worklet';
  const clampX = (v: number) => Math.min(Math.max(v, 0), worldWidth);
  const clampY = (v: number) => Math.min(Math.max(v, 0), worldHeight);
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) {
    // Top edge
    return {
      x: clampX(playerX - viewHalfW + Math.random() * viewHalfW * 2),
      y: clampY(playerY - viewHalfH - SPAWN_MARGIN_PX),
    };
  }
  if (edge === 1) {
    // Right edge
    return {
      x: clampX(playerX + viewHalfW + SPAWN_MARGIN_PX),
      y: clampY(playerY - viewHalfH + Math.random() * viewHalfH * 2),
    };
  }
  if (edge === 2) {
    // Bottom edge
    return {
      x: clampX(playerX - viewHalfW + Math.random() * viewHalfW * 2),
      y: clampY(playerY + viewHalfH + SPAWN_MARGIN_PX),
    };
  }
  // Left edge
  return {
    x: clampX(playerX - viewHalfW - SPAWN_MARGIN_PX),
    y: clampY(playerY - viewHalfH + Math.random() * viewHalfH * 2),
  };
}

/**
 * Advance all enemy logic by one fixed timestep.
 * Called once per step from updateGameState in gameEngine.ts.
 *
 * Phase ordering within one tick:
 *   1. Spawner — may push new enemies onto the array
 *   2. AI movement — advances alive enemies toward the player;
 *      dying enemies are left in place (combatEngine removes them when done)
 *
 * Returns a new GameState (no mutation of input).
 */
export function tickEnemies(state: GameState, dtMs: number, collData: CollisionData): GameState {
  'worklet';

  const { canvasWidth, canvasHeight, worldWidth, worldHeight, elapsedMs } = state;
  const viewHalfW = canvasWidth / (2 * CAMERA_ZOOM);
  const viewHalfH = canvasHeight / (2 * CAMERA_ZOOM);
  let enemies = state.enemies;
  let nextEnemyId = state.nextEnemyId;
  let spawnAccMs = state.spawnAccMs;
  let nextProjectileId = state.nextProjectileId;
  let effectZones = state.effectZones;
  let nextEffectZoneId = state.nextEffectZoneId;
  const newEnemyProjectiles: ProjectileState[] = [];

  // ─── Spawner ──────────────────────────────────────────────────────────────
  // enemies is a fixed ENEMY_SOFT_CAP-length sparse array (null = empty slot).
  // Count free slots to determine if we are at the soft cap.
  let freeSlotCount = 0;
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i] === null) freeSlotCount += 1;
  }

  if (elapsedMs >= SPAWN_INITIAL_DELAY_MS && freeSlotCount > 0) {
    const rate = spawnRateAt(elapsedMs);
    const intervalMs = 1000 / rate;
    let acc = spawnAccMs + dtMs;

    // Build new array only if we're actually spawning something this tick.
    if (acc >= intervalMs) {
      const next: Array<EnemyState | null> = [];
      for (let i = 0; i < enemies.length; i++) {
        next.push(enemies[i]);
      }

      // Count active snipers for the cap check inside the spawn loop.
      let activeSniperCount = 0;
      for (let si = 0; si < next.length; si++) {
        const e = next[si];
        if (e && (e.type === 'sniperA' || e.type === 'sniperB')) activeSniperCount += 1;
      }

      while (acc >= intervalMs) {
        // Find the first free (null) slot.
        let freeSlot = -1;
        for (let si = 0; si < next.length; si++) {
          if (next[si] === null) { freeSlot = si; break; }
        }
        if (freeSlot === -1) break; // all slots occupied — at soft cap

        const pos = randomEdgePos(state.player.x, state.player.y, viewHalfW, viewHalfH, worldWidth, worldHeight);
        let type = rollEnemyType(elapsedMs);

        // Sniper cap: fall back to raider/scav when SNIPER_MAX_ACTIVE already active.
        if ((type === 'sniperA' || type === 'sniperB') && activeSniperCount >= SNIPER_MAX_ACTIVE) {
          type = Math.random() < raiderRatioAt(elapsedMs) ? 'raider' : 'scav';
        }

        const isSniper = type === 'sniperA' || type === 'sniperB';
        if (isSniper) activeSniperCount += 1;

        next[freeSlot] = {
          id: nextEnemyId,
          type,
          x: pos.x,
          y: pos.y,
          hp: ENEMY_PROFILES[type].hp,
          walkStartedAtMs: elapsedMs,
          status: 'alive',
          dyingStartedAtMs: 0,
          lastHitPlayerAtMs: 0,
          hitFlashUntilMs: 0,
          fireCooldownMs: isSniper ? SNIPER_FIRE_COOLDOWN_MS : 0,
        };
        nextEnemyId += 1;
        acc -= intervalMs;
      }

      enemies = next;
    }

    spawnAccMs = acc >= intervalMs ? acc % intervalMs : acc;
  } else if (elapsedMs < SPAWN_INITIAL_DELAY_MS) {
    // Hold accumulator at zero during the initial delay window.
    spawnAccMs = 0;
  } else {
    // Soft cap hit (no free slots) — keep accumulating but don't spawn.
    spawnAccMs = spawnAccMs + dtMs;
  }

  // ─── AI movement (walk toward player) + sniper fire ──────────────────────
  // Dying enemies stay in place — their die animation runs until combatEngine
  // removes them once the animation completes.
  const px = state.player.x;
  const py = state.player.y;
  const dtSec = dtMs / 1000;

  const moved: Array<EnemyState | null> = [];
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];

    if (enemy === null) {
      // Empty slot — pass through unchanged.
      moved.push(null);
      continue;
    }

    if (enemy.status === 'dying') {
      // Leave in place; combatEngine will null the slot after die animation completes.
      moved.push(enemy);
      continue;
    }

    const profile = ENEMY_PROFILES[enemy.type];
    let speed = profile.moveSpeed * ENEMY_BASE_SPEED_PX_PER_SEC;

    // Smoke slow — check all active smoke zones inline (one-tick lag, imperceptible).
    // No new EnemyState field needed; reads state.effectZones directly each tick.
    for (let zi = 0; zi < state.effectZones.length; zi++) {
      const zone = state.effectZones[zi];
      if (zone === null || zone.type !== 'smoke') continue;
      const szDx = enemy.x - zone.x;
      const szDy = enemy.y - zone.y;
      if (Math.sqrt(szDx * szDx + szDy * szDy) < SMOKE_RADIUS_PX) {
        speed *= SMOKE_SLOW_MULT;
        break; // Multiple overlapping smoke zones don't stack — first match wins.
      }
    }

    const dx = px - enemy.x;
    const dy = py - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // ── Sniper fire: decrement cooldown, fire when in range and ready ─────
    let newFireCd = enemy.fireCooldownMs;
    if ((enemy.type === 'sniperA' || enemy.type === 'sniperB') && dist > 0) {
      newFireCd = Math.max(0, enemy.fireCooldownMs - dtMs);
      if (newFireCd === 0 && dist <= SNIPER_FIRE_RANGE_PX) {
        const angle = Math.random() * 2 * Math.PI;
        const nx = Math.cos(angle);
        const ny = Math.sin(angle);
        newEnemyProjectiles.push({
          id: nextProjectileId,
          x: enemy.x,
          y: enemy.y,
          vxPxPerSec: nx * SNIPER_PROJECTILE_SPEED_PX_PER_SEC,
          vyPxPerSec: ny * SNIPER_PROJECTILE_SPEED_PX_PER_SEC,
          speedPxPerSec: SNIPER_PROJECTILE_SPEED_PX_PER_SEC,
          distanceTraveledPx: 0,
          maxRangePx: SNIPER_FIRE_RANGE_PX,
          damage: SNIPER_PROJECTILE_DAMAGE,
          pierceRemaining: 0,
          hitEnemyIds: [],
          isRocket: false,
          isEnemyProjectile: true,
        });
        nextProjectileId += 1;
        // Muzzle flash at sniper position — visual flair only.
        const flashType = enemy.type === 'sniperA' ? 'muzzle_flash_a' : 'muzzle_flash_b';
        const tmpFlashState = spawnEffectZoneAt(
          { ...state, effectZones, nextEffectZoneId },
          flashType,
          enemy.x,
          enemy.y,
        );
        effectZones = tmpFlashState.effectZones;
        nextEffectZoneId = tmpFlashState.nextEffectZoneId;
        newFireCd = SNIPER_FIRE_COOLDOWN_MS;
      }
    }

    if (dist < 1) {
      // Already on top of player — no movement to avoid divide-by-zero.
      moved.push({
        id: enemy.id,
        type: enemy.type,
        x: enemy.x,
        y: enemy.y,
        hp: enemy.hp,
        walkStartedAtMs: enemy.walkStartedAtMs,
        status: enemy.status,
        dyingStartedAtMs: enemy.dyingStartedAtMs,
        lastHitPlayerAtMs: enemy.lastHitPlayerAtMs,
        hitFlashUntilMs: enemy.hitFlashUntilMs,
        fireCooldownMs: newFireCd,
      });
    } else {
      const propX = enemy.x + (dx / dist) * speed * dtSec;
      const propY = enemy.y + (dy / dist) * speed * dtSec;
      const resolvedAabb = resolveAABB(enemy.x, enemy.y, propX, propY, ENEMY_COLLISION_RADIUS_PX, collData);
      const resolved = resolveCircle(resolvedAabb.x, resolvedAabb.y, ENEMY_COLLISION_RADIUS_PX, collData);
      moved.push({
        id: enemy.id,
        type: enemy.type,
        x: resolved.x,
        y: resolved.y,
        hp: enemy.hp,
        walkStartedAtMs: enemy.walkStartedAtMs,
        status: enemy.status,
        dyingStartedAtMs: enemy.dyingStartedAtMs,
        lastHitPlayerAtMs: enemy.lastHitPlayerAtMs,
        hitFlashUntilMs: enemy.hitFlashUntilMs,
        fireCooldownMs: newFireCd,
      });
    }
  }

  // Merge new sniper projectiles into the existing projectile array.
  let updatedProjectiles = state.projectiles;
  if (newEnemyProjectiles.length > 0) {
    const allProjs: ProjectileState[] = [];
    for (let i = 0; i < state.projectiles.length; i++) allProjs.push(state.projectiles[i]);
    for (let i = 0; i < newEnemyProjectiles.length; i++) allProjs.push(newEnemyProjectiles[i]);
    updatedProjectiles = allProjs;
  }

  return {
    ...state,
    enemies: moved,
    nextEnemyId,
    spawnAccMs,
    projectiles: updatedProjectiles,
    nextProjectileId,
    effectZones,
    nextEffectZoneId,
  };
}
