/**
 * Tank turret tick — tower rotation, fire trigger, projectile motion, player-hit detection.
 * Runs on the Reanimated UI thread (worklet) as step 3.5 of updateGameState
 * (after tickCombat, before tickPickups).
 *
 * Responsibilities:
 *   1. If tank is null, return state unchanged.
 *   2. Compute towerAngle via atan2 toward player (always tracks, even out of range).
 *   3. Decrement fireCooldownMs by dtMs.
 *   4. If player is within TANK_FIRE_RANGE_PX and cooldown ≤ 0: spawn a tank projectile
 *      at the barrel tip (fire offset rotated by towerAngle), reset cooldown, set lastFiredAtMs.
 *   5. Advance all tankProjectiles (straight-line constant speed).
 *   6. Despawn tankProjectiles that exceeded maxRangePx.
 *   7. For each remaining tankProjectile: circle-vs-circle check vs player.
 *      On hit: apply 30% maxHp damage, set invulnerableUntilMs, despawn projectile.
 *      isDead set if hp reaches 0.
 *
 * Threading contract: UI-thread worklet. No React state. No runOnJS.
 */

'worklet';

import type { GameState, ProjectileState } from './gameEngine';
import {
  TANK_FIRE_DAMAGE_RATIO,
  TANK_FIRE_RATE_MS,
  TANK_FIRE_RANGE_PX,
  TANK_PROJECTILE_SPEED_PX_PER_SEC,
  BTR_FIRE_OFFSET,
  PANZER_FIRE_OFFSET,
  PLAYER_COLLISION_RADIUS_PX,
} from '../data/gameConstants';

const TANK_PROJECTILE_RADIUS = 10;
const TANK_PROJECTILE_MAX_RANGE = TANK_FIRE_RANGE_PX * 1.5;
const INVULN_DURATION_MS = 800;

export function tickTank(state: GameState, dtMs: number): GameState {
  'worklet';
  if (!state.tank) return state;

  const tank = state.tank;
  const px = state.player.x;
  const py = state.player.y;

  const dx = px - tank.x;
  const dy = py - tank.y;
  const distSq = dx * dx + dy * dy;
  const towerAngle = Math.atan2(dy, dx);

  const newCooldown = Math.max(0, tank.fireCooldownMs - dtMs);
  let lastFiredAtMs = tank.lastFiredAtMs;
  let nextTankProjectileId = state.nextTankProjectileId;
  const newProjectiles: ProjectileState[] = [...state.tankProjectiles];

  // Fire when in range and cooldown expired
  if (newCooldown === 0 && distSq <= TANK_FIRE_RANGE_PX * TANK_FIRE_RANGE_PX) {
    const fireOffset = tank.variant === 'btr' ? BTR_FIRE_OFFSET : PANZER_FIRE_OFFSET;
    const cos = Math.cos(towerAngle);
    const sin = Math.sin(towerAngle);
    const spawnX = tank.x + cos * fireOffset.y - sin * fireOffset.x;
    const spawnY = tank.y + sin * fireOffset.y + cos * fireOffset.x;
    newProjectiles.push({
      id: nextTankProjectileId++,
      x: spawnX,
      y: spawnY,
      vxPxPerSec: cos * TANK_PROJECTILE_SPEED_PX_PER_SEC,
      vyPxPerSec: sin * TANK_PROJECTILE_SPEED_PX_PER_SEC,
      speedPxPerSec: TANK_PROJECTILE_SPEED_PX_PER_SEC,
      distanceTraveledPx: 0,
      maxRangePx: TANK_PROJECTILE_MAX_RANGE,
      damage: 0,
      pierceRemaining: 0,
      hitEnemyIds: [],
      isRocket: true,
    });
    lastFiredAtMs = state.elapsedMs;
  }

  // Advance projectiles and check player collision
  const dtSec = dtMs / 1000;
  let playerHp = state.player.hp;
  let invulnerableUntilMs = state.player.invulnerableUntilMs;
  let isDead = state.isDead;

  const survivingProjectiles: ProjectileState[] = [];
  for (const proj of newProjectiles) {
    const moved: ProjectileState = {
      ...proj,
      x: proj.x + proj.vxPxPerSec * dtSec,
      y: proj.y + proj.vyPxPerSec * dtSec,
      distanceTraveledPx: proj.distanceTraveledPx + proj.speedPxPerSec * dtSec,
    };

    if (moved.distanceTraveledPx >= moved.maxRangePx) continue;

    // Player invulnerability window from previous hits
    if (state.elapsedMs < state.player.invulnerableUntilMs) {
      survivingProjectiles.push(moved);
      continue;
    }

    const pdx = moved.x - px;
    const pdy = moved.y - py;
    const hitRadius = TANK_PROJECTILE_RADIUS + PLAYER_COLLISION_RADIUS_PX;
    if (pdx * pdx + pdy * pdy < hitRadius * hitRadius) {
      const damage = state.player.maxHp * TANK_FIRE_DAMAGE_RATIO;
      playerHp = Math.max(0, playerHp - damage);
      invulnerableUntilMs = state.elapsedMs + INVULN_DURATION_MS;
      if (playerHp <= 0) isDead = true;
      // projectile consumed — do not push
      continue;
    }

    survivingProjectiles.push(moved);
  }

  return {
    ...state,
    tank: {
      ...tank,
      towerAngle,
      fireCooldownMs: newCooldown === 0 && lastFiredAtMs !== tank.lastFiredAtMs
        ? TANK_FIRE_RATE_MS
        : newCooldown,
      lastFiredAtMs,
    },
    tankProjectiles: survivingProjectiles,
    nextTankProjectileId,
    player: {
      ...state.player,
      hp: playerHp,
      invulnerableUntilMs,
    },
    isDead,
  };
}
