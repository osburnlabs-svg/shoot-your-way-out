/**
 * Renderer data extraction — pure functions that read GameState and return
 * the data needed to draw each entity. No Skia imports, no draw calls.
 *
 * Why this separation:
 * - Functions are worklet-safe — callable from Reanimated's UI thread
 * - Return values are plain objects — trivial to unit test and inspect
 * - GameCanvas.tsx does the actual Skia drawing; this module decides *what*
 *
 * Phase 3 G1 additions:
 *   getEnemyRenderData() — returns per-enemy position, rotation, frame, scale
 *
 * Future phases add parallel functions for each entity type:
 *   Phase 3 G2: getProjectileRenderData()
 *   Phase 4b:   getCrateRenderData()
 *   Phase 5:    getTileRenderData(), getObstacleRenderData()
 *   Phase 6:    getEffectRenderData()
 */

import type { GameState } from './gameEngine';
import type { HeroWeaponPose } from './sprites';
import type { EnemyType } from '../data/enemies';
import { getCurrentFrame } from './animation';
import {
  HERO_SPRITE_SCALE,
  WALK_FRAME_COUNT,
  WALK_FRAME_DURATION_MS,
  ENEMY_SPRITE_SCALE,
  SCAV_WALK_FRAME_COUNT,
  SCAV_WALK_FRAME_DURATION_MS,
  RAIDER_WALK_FRAME_COUNT,
  RAIDER_WALK_FRAME_DURATION_MS,
} from '../data/gameConstants';

export type PlayerRenderData = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  weaponPose: HeroWeaponPose;
  isMoving: boolean;
  /** Walk animation frame index (0–6). Only meaningful when isMoving is true. */
  walkFrame: number;
};

/**
 * Extract everything GameCanvas needs to draw the player this frame.
 * x/y are the sprite center. scale is the pixel-art upscale factor.
 *
 * Note on sprite orientation: rotation=0 corresponds to the sprite's default
 * facing direction. If the hero sprite faces UP by default, add -Math.PI/2
 * to the rotation value passed to the Skia Group transform (tune on device).
 */
export function getPlayerRenderData(state: GameState): PlayerRenderData {
  'worklet';
  const { player } = state;

  const walkFrame = player.isMoving
    ? getCurrentFrame(
        { frameCount: WALK_FRAME_COUNT, frameDurationMs: WALK_FRAME_DURATION_MS, loop: true },
        state.elapsedMs - player.walkStartedAtMs,
      )
    : 0;

  return {
    x: player.x,
    y: player.y,
    rotation: player.rotation,
    scale: HERO_SPRITE_SCALE,
    weaponPose: player.weaponPose,
    isMoving: player.isMoving,
    walkFrame,
  };
}

export type EnemyRenderData = {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  /**
   * Heading angle in radians — direction from enemy toward player.
   * Computed here (derived from positions) so EnemyState stays lean.
   * Apply ENEMY_SPRITE_ROTATION_OFFSET in GameCanvas when constructing the transform.
   */
  rotation: number;
  scale: number;
  /** Walk animation frame index into the type's walk/fire array. */
  walkFrame: number;
};

/**
 * Extract render data for all live enemies.
 *
 * Walk frame computation mirrors the hero exactly:
 *   getCurrentFrame(config, elapsedMs - enemy.walkStartedAtMs)
 * walkStartedAtMs is set at spawn, so each enemy's animation cycles independently.
 *
 * Z-order: GameCanvas renders enemies before the player Group (enemies drawn below hero).
 */
export function getEnemyRenderData(state: GameState): EnemyRenderData[] {
  'worklet';
  const { enemies, player, elapsedMs } = state;
  const result: EnemyRenderData[] = [];

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];

    const isScav = enemy.type === 'scav';
    const frameCount = isScav ? SCAV_WALK_FRAME_COUNT : RAIDER_WALK_FRAME_COUNT;
    const frameDurationMs = isScav ? SCAV_WALK_FRAME_DURATION_MS : RAIDER_WALK_FRAME_DURATION_MS;

    const walkFrame = getCurrentFrame(
      { frameCount, frameDurationMs, loop: true },
      elapsedMs - enemy.walkStartedAtMs,
    );

    // Heading: direction from enemy toward current player position.
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const rotation = Math.atan2(dy, dx);

    result.push({
      id: enemy.id,
      type: enemy.type,
      x: enemy.x,
      y: enemy.y,
      rotation,
      scale: ENEMY_SPRITE_SCALE,
      walkFrame,
    });
  }

  return result;
}
