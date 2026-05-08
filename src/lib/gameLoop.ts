/**
 * Fixed-timestep game loop math — pure functions, no React, no Skia.
 *
 * All functions are marked 'worklet' so they can be called from Reanimated
 * UI-thread worklets (useFrameCallback, useDerivedValue, etc.) without
 * crossing the JS bridge.
 *
 * The accumulator pattern: each animation frame, add the real elapsed time
 * to an accumulator. Run as many fixed steps as fit, carry the remainder.
 * This keeps physics deterministic regardless of actual frame rate.
 */

/** Target simulation step — ~16.667ms = 60 updates per second. */
export const FIXED_STEP_MS = 1000 / 60;

export type StepResult = {
  steps: number;
  remainingMs: number;
};

/**
 * Compute how many fixed steps fit in the accumulated time.
 * Returns the step count and the leftover milliseconds to carry forward.
 */
export function computeSteps(accumulatorMs: number, stepMs: number): StepResult {
  'worklet';
  const steps = Math.floor(accumulatorMs / stepMs);
  return {
    steps,
    remainingMs: accumulatorMs - steps * stepMs,
  };
}
