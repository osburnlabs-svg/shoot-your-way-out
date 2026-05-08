/**
 * Renderer data extraction — pure functions that read GameState and return
 * the data needed to draw each entity. No Skia imports, no draw calls.
 *
 * Why this separation:
 * - Functions are worklet-safe — callable from Reanimated's UI thread
 * - Return values are plain objects — trivial to unit test and inspect
 * - GameCanvas.tsx does the actual Skia drawing; this module decides *what*
 *
 * Future phases add parallel functions for each entity type:
 *   Phase 3:  getEnemyRenderData(), getProjectileRenderData()
 *   Phase 4b: getCrateRenderData()
 *   Phase 5:  getTileRenderData(), getObstacleRenderData()
 *   Phase 6:  getEffectRenderData()
 */

import type { GameState } from './gameEngine';
import type { HeroWeaponPose } from './sprites';

export type PlayerRenderData = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  weaponPose: HeroWeaponPose;
  isMoving: boolean;
  animFrame: number;
};

/**
 * Extract everything GameCanvas needs to draw the player this frame.
 * x/y are the sprite center. scale is the pixel-art upscale factor.
 */
export function getPlayerRenderData(state: GameState): PlayerRenderData {
  'worklet';
  const { player } = state;
  return {
    x: player.x,
    y: player.y,
    rotation: player.rotation,
    scale: 4, // 4× upscale for pixel art on high-DPI screens
    weaponPose: player.weaponPose,
    isMoving: player.isMoving,
    animFrame: player.animFrame,
  };
}
