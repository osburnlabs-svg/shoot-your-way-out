/**
 * Frame-based animation system — pure functions, no React, no Skia dependencies.
 *
 * Pure functions mean:
 * - Trivial to unit test (deterministic given the same inputs)
 * - Safe to call from Skia worklets (no React hooks or closures over mutable state)
 * - Works identically for hero walk, enemy walk, explosions, muzzle flashes, smoke —
 *   anything that is a sequence of frames played over time.
 *
 * Animation playback (the useFrameCallback / useEffect that advances elapsed time)
 * belongs in components, not here. This module only maps time → frame index.
 */

export type AnimationConfig = {
  frameCount: number;
  frameDurationMs: number;
  loop: boolean; // if false, holds on the final frame after one full play
};

/**
 * Given an animation config and time elapsed since animation start,
 * return the zero-based frame index to display.
 */
export function getCurrentFrame(config: AnimationConfig, elapsedMs: number): number {
  'worklet';
  const totalDuration = config.frameCount * config.frameDurationMs;

  if (!config.loop && elapsedMs >= totalDuration) {
    return config.frameCount - 1;
  }

  const effectiveMs = config.loop ? elapsedMs % totalDuration : elapsedMs;
  return Math.min(
    Math.floor(effectiveMs / config.frameDurationMs),
    config.frameCount - 1,
  );
}

/**
 * Given an animation config and time elapsed, return whether the animation has
 * completed one full play. Always false for looping animations.
 */
export function isAnimationComplete(config: AnimationConfig, elapsedMs: number): boolean {
  'worklet';
  if (config.loop) return false;
  return elapsedMs >= config.frameCount * config.frameDurationMs;
}
