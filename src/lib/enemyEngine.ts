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

import type { GameState, EnemyState } from './gameEngine';
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
} from '../data/gameConstants';

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

/** Roll enemy type based on current Raider ratio. */
function rollEnemyType(elapsedMs: number): EnemyType {
  'worklet';
  return Math.random() < raiderRatioAt(elapsedMs) ? 'raider' : 'scav';
}

/**
 * Pick a random position just outside one of the four screen edges.
 * Enemies always walk inward from their spawn point.
 */
function randomEdgePos(
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  'worklet';
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) {
    // Top edge
    return { x: Math.random() * canvasWidth, y: -SPAWN_MARGIN_PX };
  }
  if (edge === 1) {
    // Right edge
    return { x: canvasWidth + SPAWN_MARGIN_PX, y: Math.random() * canvasHeight };
  }
  if (edge === 2) {
    // Bottom edge
    return { x: Math.random() * canvasWidth, y: canvasHeight + SPAWN_MARGIN_PX };
  }
  // Left edge
  return { x: -SPAWN_MARGIN_PX, y: Math.random() * canvasHeight };
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
export function tickEnemies(state: GameState, dtMs: number): GameState {
  'worklet';

  const { canvasWidth, canvasHeight, elapsedMs } = state;
  let enemies = state.enemies;
  let nextEnemyId = state.nextEnemyId;
  let spawnAccMs = state.spawnAccMs;

  // ─── Spawner ──────────────────────────────────────────────────────────────
  if (elapsedMs >= SPAWN_INITIAL_DELAY_MS && enemies.length < ENEMY_SOFT_CAP) {
    const rate = spawnRateAt(elapsedMs);
    const intervalMs = 1000 / rate;
    let acc = spawnAccMs + dtMs;

    // Build new array only if we're actually spawning something this tick.
    if (acc >= intervalMs) {
      const next: EnemyState[] = [];
      for (let i = 0; i < enemies.length; i++) {
        next.push(enemies[i]);
      }

      while (acc >= intervalMs && next.length < ENEMY_SOFT_CAP) {
        const pos = randomEdgePos(canvasWidth, canvasHeight);
        const type = rollEnemyType(elapsedMs);
        next.push({
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
        });
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
    // Soft cap hit — keep accumulating but don't spawn.
    spawnAccMs = spawnAccMs + dtMs;
  }

  // ─── AI movement (walk toward player) ────────────────────────────────────
  // Dying enemies stay in place — their die animation runs until combatEngine
  // removes them once the animation completes.
  const px = state.player.x;
  const py = state.player.y;
  const dtSec = dtMs / 1000;

  const moved: EnemyState[] = [];
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];

    if (enemy.status === 'dying') {
      // Leave in place; combatEngine will remove after die animation completes.
      moved.push(enemy);
      continue;
    }

    const profile = ENEMY_PROFILES[enemy.type];
    const speed = profile.moveSpeed * ENEMY_BASE_SPEED_PX_PER_SEC;

    const dx = px - enemy.x;
    const dy = py - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      // Already on top of player — no movement to avoid divide-by-zero.
      moved.push(enemy);
    } else {
      moved.push({
        id: enemy.id,
        type: enemy.type,
        x: enemy.x + (dx / dist) * speed * dtSec,
        y: enemy.y + (dy / dist) * speed * dtSec,
        hp: enemy.hp,
        walkStartedAtMs: enemy.walkStartedAtMs,
        status: enemy.status,
        dyingStartedAtMs: enemy.dyingStartedAtMs,
        lastHitPlayerAtMs: enemy.lastHitPlayerAtMs,
        hitFlashUntilMs: enemy.hitFlashUntilMs,
      });
    }
  }

  return {
    ...state,
    enemies: moved,
    nextEnemyId,
    spawnAccMs,
  };
}
