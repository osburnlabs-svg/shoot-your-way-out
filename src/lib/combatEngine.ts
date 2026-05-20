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
 * Collision model (G2):
 *   Circle-vs-circle. Radii from gameConstants (ENEMY_COLLISION_RADIUS_PX +
 *   PROJECTILE_COLLISION_RADIUS_PX). Projectiles track pierceRemaining + hitEnemyIds.
 *   pierceRemaining = 0 → consumed after 1 hit. pierceRemaining = N → hits N+1 enemies.
 *   An enemy can receive multiple simultaneous hits from different projectiles.
 *   A projectile cannot re-hit the same enemy (hitEnemyIds check).
 */

import type { GameState, EnemyState, ProjectileState, PickupState } from './gameEngine';
import { WEAPON_PROFILES } from '../data/weapons';
import { ENEMY_PROFILES } from '../data/enemies';
import { getEffectiveStats } from '../data/skills';
import { audioEngine } from './audioEngine';
import { applyAOEDamage, spawnEffectZoneAt } from './throwableEngine';
import {
  ENEMY_COLLISION_RADIUS_PX,
  PROJECTILE_COLLISION_RADIUS_PX,
  ENEMY_DIE_FRAME_COUNT,
  ENEMY_DIE_FRAME_DURATION_MS,
  PLAYER_COLLISION_RADIUS_PX,
  CONTACT_DAMAGE_INTERVAL_MS,
  HIT_FLASH_DURATION_MS,
  SHOTGUN_PELLET_COUNT,
  SHOTGUN_SPREAD_DEG,
  FLAMETHROWER_CONE_DEG,
  FLAMETHROWER_ZONE_COUNT,
  FLAMETHROWER_SPAWN_DISTANCE_PX,
  ROCKET_AOE_RADIUS_PX,
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

  // Compute effective stats once per tick — threads skill bonuses into all combat logic.
  const effective = getEffectiveStats(player.skillStacks, weapon, player.maxHp);

  // Inline-effect skill stacks — read once, used in collision and contact-damage blocks.
  const hollowPointsStacks = player.skillStacks['ammo_hollow_points'] ?? 0;
  const suppressorStacks   = player.skillStacks['optics_suppressor']  ?? 0;
  const helmetStacks        = player.skillStacks['gear_helmet']        ?? 0;

  const dtSec = dtMs / 1000;

  // ─── 1. Advance weapon cooldown ───────────────────────────────────────────
  let weaponCooldownMs = player.weaponCooldownMs - dtMs;
  if (weaponCooldownMs < 0) weaponCooldownMs = 0;

  let playerLastFiredAtMs = player.lastFiredAtMs;
  let nextProjectileId = state.nextProjectileId;
  let nextPickupId = state.nextPickupId;
  let killCount = state.killCount;
  let effectZones = state.effectZones;
  let nextEffectZoneId = state.nextEffectZoneId;

  // Pickup array — carry existing pickups forward; deaths fill first null slot below.
  const newPickups: Array<PickupState | null> = state.pickups.slice();

  // ─── 2. Find nearest alive enemy within range ─────────────────────────────
  const rangeSq = effective.rangePx * effective.rangePx;
  let targetIdx = -1;
  let minDistSq = rangeSq + 1; // just beyond range so any in-range enemy beats it

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e || e.status !== 'alive') continue;
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

    if (weapon.id === 'm870') {
      // Shotgun: SHOTGUN_PELLET_COUNT pellets spread over SHOTGUN_SPREAD_DEG arc.
      const spreadRad = (SHOTGUN_SPREAD_DEG * Math.PI) / 180;
      const baseAngle = Math.atan2(ny, nx);
      for (let pi = 0; pi < SHOTGUN_PELLET_COUNT; pi++) {
        const offset = (pi / (SHOTGUN_PELLET_COUNT - 1) - 0.5) * spreadRad;
        const angle = baseAngle + offset;
        newProjectiles.push({
          id: nextProjectileId,
          x: player.x,
          y: player.y,
          vxPxPerSec: Math.cos(angle) * spd,
          vyPxPerSec: Math.sin(angle) * spd,
          speedPxPerSec: spd,
          distanceTraveledPx: 0,
          maxRangePx: effective.rangePx,
          damage: effective.damage,
          pierceRemaining: effective.pierce,
          hitEnemyIds: [],
          isRocket: false,
        });
        nextProjectileId += 1;
      }
    } else if (weapon.id === 'gp25') {
      // Rocket Launcher: single rocket projectile — AOE applied on impact in collision loop.
      newProjectiles.push({
        id: nextProjectileId,
        x: player.x,
        y: player.y,
        vxPxPerSec: nx * spd,
        vyPxPerSec: ny * spd,
        speedPxPerSec: spd,
        distanceTraveledPx: 0,
        maxRangePx: effective.rangePx,
        damage: effective.damage,
        pierceRemaining: effective.pierce,
        hitEnemyIds: [],
        isRocket: true,
      });
      nextProjectileId += 1;
    } else if (weapon.id === 'rpo') {
      // Flamethrower: FLAMETHROWER_ZONE_COUNT flame zones in a cone, no projectile.
      const coneRad = (FLAMETHROWER_CONE_DEG * Math.PI) / 180;
      const baseAngle = Math.atan2(ny, nx);
      let tmpState = { ...state, effectZones, nextEffectZoneId };
      for (let zi = 0; zi < FLAMETHROWER_ZONE_COUNT; zi++) {
        const offset = (zi / (FLAMETHROWER_ZONE_COUNT - 1) - 0.5) * coneRad;
        const angle = baseAngle + offset;
        const zx = player.x + Math.cos(angle) * FLAMETHROWER_SPAWN_DISTANCE_PX;
        const zy = player.y + Math.sin(angle) * FLAMETHROWER_SPAWN_DISTANCE_PX;
        tmpState = spawnEffectZoneAt(tmpState, 'flame', zx, zy, angle);
      }
      effectZones = tmpState.effectZones;
      nextEffectZoneId = tmpState.nextEffectZoneId;
    } else {
      // Default: single projectile (pistol, SMG, assault rifle, sniper).
      newProjectiles.push({
        id: nextProjectileId,
        x: player.x,
        y: player.y,
        vxPxPerSec: nx * spd,
        vyPxPerSec: ny * spd,
        speedPxPerSec: spd,
        distanceTraveledPx: 0,
        maxRangePx: effective.rangePx,
        damage: effective.damage,
        pierceRemaining: effective.pierce,
        hitEnemyIds: [],
        isRocket: false,
      });
      nextProjectileId += 1;
    }

    weaponCooldownMs = effective.cooldownMs;
    playerLastFiredAtMs = state.elapsedMs;
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
      pierceRemaining: p.pierceRemaining,
      hitEnemyIds: p.hitEnemyIds,
      isRocket: p.isRocket,
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

  // Pierce-aware collision loop.
  // Each projectile tracks its own pierceRemaining and hitEnemyIds.
  // A projectile is consumed when pierceRemaining drops below 0.
  // hitEnemyIds prevents re-hitting the same enemy across multiple ticks of travel.
  // Rockets bypass damageAccum — their position is recorded in rocketImpacts and
  // AOE is applied in a post-loop pass after the die-animation cleanup.
  const finalProjectiles: ProjectileState[] = [];
  const rocketImpacts: { x: number; y: number; damage: number }[] = [];

  for (let pi = 0; pi < movedProjectiles.length; pi++) {
    const proj = movedProjectiles[pi];

    let pierceRemaining = proj.pierceRemaining;
    // Copy hitEnemyIds for mutation within this tick.
    const hitEnemyIds: number[] = [];
    for (let k = 0; k < proj.hitEnemyIds.length; k++) {
      hitEnemyIds.push(proj.hitEnemyIds[k]);
    }

    let rocketDetonated = false;

    for (let ei = 0; ei < enemies.length; ei++) {
      const enemy = enemies[ei];
      if (!enemy || enemy.status !== 'alive') continue;

      // Skip enemies this projectile has already hit.
      let alreadyHit = false;
      for (let k = 0; k < hitEnemyIds.length; k++) {
        if (hitEnemyIds[k] === enemy.id) { alreadyHit = true; break; }
      }
      if (alreadyHit) continue;

      const dx = proj.x - enemy.x;
      const dy = proj.y - enemy.y;
      if (dx * dx + dy * dy < PROJ_ENEMY_COLLISION_R_SQ) {
        if (proj.isRocket) {
          // Player rocket: record impact position for AOE pass — skip damageAccum.
          rocketImpacts.push({ x: proj.x, y: proj.y, damage: proj.damage });
          rocketDetonated = true;
          break; // rocket always consumed on first contact
        }

        // Base damage for this hit — apply conditional skill multipliers before accumulating.
        let hitDamage = proj.damage;

        // Suppressor: +10% per stack on the very first hit this projectile ever lands.
        // hitEnemyIds.length === 0 before this push means no prior hits (any tick).
        if (suppressorStacks > 0 && hitEnemyIds.length === 0) {
          hitDamage *= 1 + 0.10 * suppressorStacks;
        }

        // Hollow Points: +50% per stack when target is below 50% of its starting HP.
        if (hollowPointsStacks > 0) {
          const enemyMaxHp = ENEMY_PROFILES[enemy.type].hp;
          if (enemy.hp < 0.5 * enemyMaxHp) {
            hitDamage *= 1 + 0.50 * hollowPointsStacks;
          }
        }

        damageAccum[ei] += hitDamage;
        hitEnemyIds.push(enemy.id);
        audioEngine.playSFX('impact_flesh');
        pierceRemaining -= 1;
        if (pierceRemaining < 0) break; // projectile fully consumed
      }
    }

    if (rocketDetonated) continue; // detonated rockets are consumed — do not keep

    // Keep projectile if it still has pierce capacity (pierceRemaining >= 0).
    if (pierceRemaining >= 0) {
      finalProjectiles.push({
        id: proj.id,
        x: proj.x,
        y: proj.y,
        vxPxPerSec: proj.vxPxPerSec,
        vyPxPerSec: proj.vyPxPerSec,
        speedPxPerSec: proj.speedPxPerSec,
        distanceTraveledPx: proj.distanceTraveledPx,
        maxRangePx: proj.maxRangePx,
        damage: proj.damage,
        pierceRemaining,
        hitEnemyIds,
        isRocket: proj.isRocket,
      });
    }
  }

  // Apply damage to enemies, transition dying ones, spawn pickups on death.
  const damagedEnemies: Array<EnemyState | null> = [];
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (!enemy) {
      damagedEnemies.push(null);
      continue;
    }
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
      // Silent drop if all slots full — same policy as crates. Tune PICKUP_SLOT_COUNT if Phase 5+ density requires.
      let pickupSpawnSlot = -1;
      for (let s = 0; s < newPickups.length; s++) {
        if (newPickups[s] === null) { pickupSpawnSlot = s; break; }
      }
      if (pickupSpawnSlot !== -1) {
        newPickups[pickupSpawnSlot] = {
          id: nextPickupId,
          x: enemy.x,
          y: enemy.y,
          vxPxPerSec: 0,
          vyPxPerSec: 0,
          type: 'money_small',
          scoreValue: MONEY_SMALL_SCORE,
          xpValue: MONEY_SMALL_XP,
          spawnedAtMs: elapsedMs,
        };
        nextPickupId += 1;
      }
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
      fireCooldownMs: enemy.fireCooldownMs,
      lastFiredAtMs: enemy.lastFiredAtMs,
    });
  }

  // ─── 7. Cleanup: null out slots whose die animation has finished ─────────
  // Slot index is stable — null reclaims the slot without compacting the array.
  // This prevents slot-index drift between UI-thread transforms and React sprite state.
  const survivingEnemies: Array<EnemyState | null> = [];
  for (let i = 0; i < damagedEnemies.length; i++) {
    const enemy = damagedEnemies[i];
    if (!enemy) {
      survivingEnemies.push(null);
      continue;
    }
    if (enemy.status === 'dying') {
      const dieElapsed = elapsedMs - enemy.dyingStartedAtMs;
      if (dieElapsed >= DIE_DURATION_MS) {
        survivingEnemies.push(null); // animation done — slot reclaimed
        continue;
      }
    }
    survivingEnemies.push(enemy);
  }

  // ─── 7b. Rocket AOE ───────────────────────────────────────────────────────
  // Process rocket impacts recorded in the collision loop.
  // AOE damage is applied after regular die-animation cleanup so we don't re-kill
  // enemies that were already transitioned to dying by direct bullet hits this tick.
  let postRocketEnemies: Array<EnemyState | null> = survivingEnemies;
  let finalPickups: Array<PickupState | null> = newPickups;

  for (let ri = 0; ri < rocketImpacts.length; ri++) {
    const impact = rocketImpacts[ri];
    const aoeResult = applyAOEDamage(
      postRocketEnemies, finalPickups, nextPickupId, killCount,
      impact.x, impact.y, ROCKET_AOE_RADIUS_PX, impact.damage, elapsedMs,
    );
    postRocketEnemies = aoeResult.enemies;
    finalPickups = aoeResult.pickups;
    nextPickupId = aoeResult.nextPickupId;
    killCount = aoeResult.killCount;
    const tmpState = spawnEffectZoneAt(
      { ...state, effectZones, nextEffectZoneId },
      'explosion', impact.x, impact.y,
    );
    effectZones = tmpState.effectZones;
    nextEffectZoneId = tmpState.nextEffectZoneId;
    audioEngine.playSFX('impact_flesh');
  }

  // ─── 8. Contact damage ────────────────────────────────────────────────────
  // For each alive enemy overlapping the player, apply contactDamage once per
  // CONTACT_DAMAGE_INTERVAL_MS. Each enemy has its own independent cooldown
  // (lastHitPlayerAtMs), so multiple overlapping enemies each deal damage.
  //
  // Invulnerability: when elapsedMs < player.invulnerableUntilMs, the damage
  // application is skipped but lastHitPlayerAtMs is NOT advanced — enemies
  // deal damage immediately on their natural cooldown when the window expires.
  const isInvulnerable = elapsedMs < player.invulnerableUntilMs;
  let newPlayerHp = player.hp;
  let newLastDamagedAtMs = player.lastDamagedAtMs;
  const contactCheckedEnemies: Array<EnemyState | null> = [];

  for (let i = 0; i < postRocketEnemies.length; i++) {
    const enemy = postRocketEnemies[i];

    if (!enemy) {
      contactCheckedEnemies.push(null);
      continue;
    }

    if (enemy.status !== 'alive') {
      contactCheckedEnemies.push(enemy);
      continue;
    }

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distSq = dx * dx + dy * dy;

    if (
      !isInvulnerable &&
      distSq < PLAYER_ENEMY_COLLISION_R_SQ &&
      elapsedMs - enemy.lastHitPlayerAtMs >= CONTACT_DAMAGE_INTERVAL_MS
    ) {
      const profile = ENEMY_PROFILES[enemy.type];

      // Helmet: probabilistic negate using a worklet-safe deterministic hash.
      // Math.random() is not worklet-safe — hash of (enemy.id, elapsedMs) gives
      // effectively random values since elapsedMs shifts ~500ms per contact event.
      let negated = false;
      if (helmetStacks > 0) {
        const helmetChance = Math.min(0.15 * helmetStacks, 0.60);
        const roll = Math.abs(Math.sin(enemy.id * 127.1 + elapsedMs * 0.31)) % 1;
        negated = roll < helmetChance;
      }

      if (!negated) {
        newPlayerHp = Math.max(0, newPlayerHp - profile.contactDamage * effective.damageTakenMult);
        newLastDamagedAtMs = elapsedMs;
        audioEngine.playSFX('hit_grunt');
      }
      // Always update lastHitPlayerAtMs: cooldown advances even on negated hits,
      // preventing the same enemy from re-rolling on every subsequent frame.
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
        fireCooldownMs: enemy.fireCooldownMs,
        lastFiredAtMs: enemy.lastFiredAtMs,
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
      lastFiredAtMs: playerLastFiredAtMs,
      hp: newPlayerHp,
      lastDamagedAtMs: newLastDamagedAtMs,
    },
    enemies: contactCheckedEnemies,
    projectiles: finalProjectiles,
    nextProjectileId,
    killCount,
    pickups: finalPickups,
    nextPickupId,
    effectZones,
    nextEffectZoneId,
  };
}
