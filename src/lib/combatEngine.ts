/**
 * Combat tick — auto-fire, projectile motion, collision, damage, death transitions,
 * pickup spawning on death, and enemy contact damage to player.
 * Runs on the Reanimated UI thread (worklet) as step 3 of updateGameState.
 *
 * Tick ordering (called after tickEnemies):
 *   1. Advance weapon cooldown toward 0
 *   2. Find nearest alive enemy within weapon range
 *   3. If cooldown == 0 and target found and player is NOT moving: spawn projectile, reset cooldown
 *   4. Move all active projectiles (straight-line, constant speed)
 *   5. Despawn projectiles that exceeded max range
 *   6. Collision: for each remaining projectile, check all alive enemies
 *      On hit: apply damage; if HP <= 0, transition enemy to 'dying' + spawn pickup
 *   7. Cleanup: remove dying enemies whose die animation has completed
 *   8. Contact damage: for each alive enemy overlapping the player, apply
 *      contactDamage on a per-enemy 500ms cooldown. Set isDead if HP reaches 0.
 *
 * Threading contract:
 *   - All logic runs on the UI thread (worklet).
 *   - No runOnJS calls. audioEngine.playSFX is worklet-safe (stub with 'worklet' directive).
 *   - No React state reads or writes. No SharedValue mutation outside GameState.
 *
 * Collision model:
 *   Circle-vs-circle. Radii from gameConstants (ENEMY_COLLISION_RADIUS_PX +
 *   PROJECTILE_COLLISION_RADIUS_PX). One projectile = one hit (no piercing in G2).
 *   An enemy can receive multiple simultaneous hits if multiple projectiles land
 *   in the same tick (unlikely at Pistol's 400ms cooldown, handled correctly).
 */

import type { GameState, EnemyState, ProjectileState, PickupState } from './gameEngine';
import { WEAPON_PROFILES } from '../data/weapons';
import { ENEMY_PROFILES } from '../data/enemies';
import { audioEngine } from './audioEngine';
import {
  ENEMY_COLLISION_RADIUS_PX,
  PROJECTILE_COLLISION_RADIUS_PX,
  ENEMY_DIE_FRAME_COUNT,
  ENEMY_DIE_FRAME_DURATION_MS,
  PLAYER_COLLISION_RADIUS_PX,
  CONTACT_DAMAGE_INTERVAL_MS,
  HIT_FLASH_DURATION_MS,
} from '../data/gameConstants';

/** Combined projectile-enemy collision radius squared — computed once, used in hot loop. */
const PROJ_ENEMY_COLLISION_R_SQ =
  (ENEMY_COLLISION_RADIUS_PX + PROJECTILE_COLLISION_RADIUS_PX) *
  (ENEMY_COLLISION_RADIUS_PX + PROJECTILE_COLLISION_RADIUS_PX);

/** Combined player-enemy collision radius squared — used for contact damage. */
const PLAYER_ENEMY_COLLISION_R_SQ =
  (PLAYER_COLLISION_RADIUS_PX + ENEMY_COLLISION_RADIUS_PX) *
  (PLAYER_COLLISION_RADIUS_PX + ENEMY_COLLISION_RADIUS_PX);

/** Total die animation duration in ms. Enemies despawn after this elapses. */
const DIE_DURATION_MS = ENEMY_DIE_FRAME_COUNT * ENEMY_DIE_FRAME_DURATION_MS;

/** Score and XP value of a Money Small pickup. */
const MONEY_SMALL_SCORE = 10;
const MONEY_SMALL_XP = 10;

export function tickCombat(state: GameState, dtMs: number): GameState {
  'worklet';

  const { player, enemies, projectiles, elapsedMs } = state;
  const weapon = WEAPON_PROFILES[player.equippedWeaponId];

  // Weapon profile lookup failed — should never happen, but bail gracefully.
  if (!weapon) return state;

  const dtSec = dtMs / 1000;

  // ─── 1. Advance weapon cooldown ───────────────────────────────────────────
  let weaponCooldownMs = player.weaponCooldownMs - dtMs;
  if (weaponCooldownMs < 0) weaponCooldownMs = 0;

  let nextProjectileId = state.nextProjectileId;
  let nextPickupId = state.nextPickupId;
  let killCount = state.killCount;

  // Pickup array — carry existing pickups forward; deaths add to it below.
  const newPickups: PickupState[] = [];
  for (let i = 0; i < state.pickups.length; i++) {
    newPickups.push(state.pickups[i]);
  }

  // ─── 2. Find nearest alive enemy within range ─────────────────────────────
  const rangeSq = weapon.rangePx * weapon.rangePx;
  let targetIdx = -1;
  let minDistSq = rangeSq + 1; // just beyond range so any in-range enemy beats it

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.status !== 'alive') continue;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dSq = dx * dx + dy * dy;
    if (dSq < minDistSq) {
      minDistSq = dSq;
      targetIdx = i;
    }
  }

  // ─── 3. Fire if ready and target found ────────────────────────────────────
  let newProjectiles: ProjectileState[] = [];
  for (let i = 0; i < projectiles.length; i++) {
    newProjectiles.push(projectiles[i]);
  }

  if (weaponCooldownMs === 0 && targetIdx !== -1 && !player.isMoving) {
    const target = enemies[targetIdx];
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist;
    const ny = dy / dist;
    const spd = weapon.projectileSpeedPxPerSec;

    newProjectiles.push({
      id: nextProjectileId,
      x: player.x,
      y: player.y,
      vxPxPerSec: nx * spd,
      vyPxPerSec: ny * spd,
      speedPxPerSec: spd,
      distanceTraveledPx: 0,
      maxRangePx: weapon.rangePx,
      damage: weapon.damage,
    });
    nextProjectileId += 1;
    weaponCooldownMs = weapon.cooldownMs;
    audioEngine.playSFX('shoot_pistol');
  }

  // ─── 4 & 5. Move projectiles, despawn range-expired ones ─────────────────
  const movedProjectiles: ProjectileState[] = [];
  for (let i = 0; i < newProjectiles.length; i++) {
    const p = newProjectiles[i];
    const newDist = p.distanceTraveledPx + p.speedPxPerSec * dtSec;
    if (newDist >= p.maxRangePx) continue; // range expired, despawn
    movedProjectiles.push({
      id: p.id,
      x: p.x + p.vxPxPerSec * dtSec,
      y: p.y + p.vyPxPerSec * dtSec,
      vxPxPerSec: p.vxPxPerSec,
      vyPxPerSec: p.vyPxPerSec,
      speedPxPerSec: p.speedPxPerSec,
      distanceTraveledPx: newDist,
      maxRangePx: p.maxRangePx,
      damage: p.damage,
    });
  }

  // ─── 6. Collision detection ───────────────────────────────────────────────
  // Accumulate damage per enemy by array index (enemies array is stable within this tick).
  // Using a plain numeric array (index = enemy slot in this tick's enemies array)
  // avoids Set/Map allocation in the hot path.
  const damageAccum: number[] = [];
  for (let i = 0; i < enemies.length; i++) {
    damageAccum.push(0);
  }

  // Track which projectile IDs were consumed (hit an enemy).
  const consumedIds: number[] = [];

  for (let pi = 0; pi < movedProjectiles.length; pi++) {
    const proj = movedProjectiles[pi];
    for (let ei = 0; ei < enemies.length; ei++) {
      const enemy = enemies[ei];
      if (enemy.status !== 'alive') continue;
      const dx = proj.x - enemy.x;
      const dy = proj.y - enemy.y;
      if (dx * dx + dy * dy < PROJ_ENEMY_COLLISION_R_SQ) {
        damageAccum[ei] += proj.damage;
        consumedIds.push(proj.id);
        audioEngine.playSFX('impact_flesh');
        break; // one projectile = one hit
      }
    }
  }

  // Filter out consumed projectiles.
  const finalProjectiles: ProjectileState[] = [];
  for (let i = 0; i < movedProjectiles.length; i++) {
    const p = movedProjectiles[i];
    let consumed = false;
    for (let j = 0; j < consumedIds.length; j++) {
      if (consumedIds[j] === p.id) { consumed = true; break; }
    }
    if (!consumed) finalProjectiles.push(p);
  }

  // Apply damage to enemies, transition dying ones, spawn pickups on death.
  const damagedEnemies: EnemyState[] = [];
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const dmg = damageAccum[i];
    if (dmg === 0) {
      damagedEnemies.push(enemy);
      continue;
    }
    const newHp = Math.max(0, enemy.hp - dmg);
    const dies = newHp <= 0 && enemy.status === 'alive';
    if (dies) {
      killCount += 1;
      // Spawn a Money Small pickup at the dying enemy's position.
      newPickups.push({
        id: nextPickupId,
        x: enemy.x,
        y: enemy.y,
        vxPxPerSec: 0,
        vyPxPerSec: 0,
        type: 'money_small',
        scoreValue: MONEY_SMALL_SCORE,
        xpValue: MONEY_SMALL_XP,
        spawnedAtMs: elapsedMs,
      });
      nextPickupId += 1;
    }
    damagedEnemies.push({
      id: enemy.id,
      type: enemy.type,
      x: enemy.x,
      y: enemy.y,
      hp: newHp,
      walkStartedAtMs: enemy.walkStartedAtMs,
      status: dies ? 'dying' : enemy.status,
      dyingStartedAtMs: dies ? elapsedMs : enemy.dyingStartedAtMs,
      lastHitPlayerAtMs: enemy.lastHitPlayerAtMs,
      // Flash on every hit, including the kill shot — applies to dying enemies too.
      hitFlashUntilMs: elapsedMs + HIT_FLASH_DURATION_MS,
    });
  }

  // ─── 7. Cleanup: remove enemies whose die animation has finished ──────────
  const survivingEnemies: EnemyState[] = [];
  for (let i = 0; i < damagedEnemies.length; i++) {
    const enemy = damagedEnemies[i];
    if (enemy.status === 'dying') {
      const dieElapsed = elapsedMs - enemy.dyingStartedAtMs;
      if (dieElapsed >= DIE_DURATION_MS) continue; // animation done, despawn
    }
    survivingEnemies.push(enemy);
  }

  // ─── 8. Contact damage ────────────────────────────────────────────────────
  // For each alive enemy overlapping the player, apply contactDamage once per
  // CONTACT_DAMAGE_INTERVAL_MS. Each enemy has its own independent cooldown
  // (lastHitPlayerAtMs), so multiple overlapping enemies each deal damage.
  let newPlayerHp = player.hp;
  let newLastDamagedAtMs = player.lastDamagedAtMs;
  const contactCheckedEnemies: EnemyState[] = [];

  for (let i = 0; i < survivingEnemies.length; i++) {
    const enemy = survivingEnemies[i];

    if (enemy.status !== 'alive') {
      contactCheckedEnemies.push(enemy);
      continue;
    }

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distSq = dx * dx + dy * dy;

    if (
      distSq < PLAYER_ENEMY_COLLISION_R_SQ &&
      elapsedMs - enemy.lastHitPlayerAtMs >= CONTACT_DAMAGE_INTERVAL_MS
    ) {
      const profile = ENEMY_PROFILES[enemy.type];
      newPlayerHp = Math.max(0, newPlayerHp - profile.contactDamage);
      newLastDamagedAtMs = elapsedMs;
      audioEngine.playSFX('hit_grunt');
      contactCheckedEnemies.push({
        id: enemy.id,
        type: enemy.type,
        x: enemy.x,
        y: enemy.y,
        hp: enemy.hp,
        walkStartedAtMs: enemy.walkStartedAtMs,
        status: enemy.status,
        dyingStartedAtMs: enemy.dyingStartedAtMs,
        lastHitPlayerAtMs: elapsedMs,
        hitFlashUntilMs: enemy.hitFlashUntilMs,
      });
    } else {
      contactCheckedEnemies.push(enemy);
    }
  }

  const newIsDead = newPlayerHp <= 0;

  return {
    ...state,
    isDead: newIsDead,
    player: {
      ...player,
      weaponCooldownMs,
      hp: newPlayerHp,
      lastDamagedAtMs: newLastDamagedAtMs,
    },
    enemies: contactCheckedEnemies,
    projectiles: finalProjectiles,
    nextProjectileId,
    killCount,
    pickups: newPickups,
    nextPickupId,
  };
}
