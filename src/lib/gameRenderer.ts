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
import { getCurrentFrame } from './animation';
import { HERO_SPRITE_SCALE, WALK_FRAME_COUNT, WALK_FRAME_DURATION_MS } from '../data/gameConstants';

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
