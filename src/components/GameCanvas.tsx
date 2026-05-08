/**
 * GameCanvas — Skia canvas + game loop orchestration.
 *
 * Owns:
 *   - The single useSharedValue<GameState> (whole game state)
 *   - The useFrameCallback game loop (runs on Reanimated UI thread)
 *   - All Skia draw calls for the current frame
 *   - The dev-only FPS/frame/time debug overlay
 *
 * The game loop runs entirely on the UI thread via useFrameCallback:
 *   1. Accumulate real elapsed time
 *   2. Run as many fixed steps as fit (computeSteps → updateGameState)
 *   3. Bridge FPS + debug counters to React state once per second (runOnJS)
 *
 * G2: player is stationary at canvas center. Position does not change.
 * G3: drag input will update player.x/y each step; useDerivedValue will
 *     pass live positions to Skia without React re-renders.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  FilterMode,
  Image,
  MipmapMode,
  useImage,
} from '@shopify/react-native-skia';
import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

import { HeroSprites } from '../lib/sprites';
import { createInitialGameState, updateGameState } from '../lib/gameEngine';
import { getPlayerRenderData } from '../lib/gameRenderer';
import { computeSteps, FIXED_STEP_MS } from '../lib/gameLoop';

type Props = {
  width: number;
  height: number;
};

export default function GameCanvas({ width, height }: Props) {
  const heroImage = useImage(HeroSprites.pistol.idle);

  // ─── Game state ──────────────────────────────────────────────────────────
  // Single shared value. All mutations replace the object (never mutate .value
  // in place — Reanimated needs a new reference to detect the change).
  const gameState = useSharedValue(createInitialGameState(width, height));

  // Fixed-step accumulator — carries leftover ms between animation frames
  const accumulator = useSharedValue(0);

  // ─── FPS tracking (UI thread) ─────────────────────────────────────────────
  // Separate shared values because closure vars in worklets don't persist
  // across invocations (they're copied, not referenced).
  const fpsAccumMs = useSharedValue(0);
  const fpsFrameCount = useSharedValue(0);

  // ─── Debug display (React state, updated once/sec via runOnJS) ────────────
  const [displayFps, setDisplayFps] = useState(0);
  const [displayElapsed, setDisplayElapsed] = useState(0);
  const [displayFrameCount, setDisplayFrameCount] = useState(0);

  // Stable callback — useCallback with [] so runOnJS captures a fixed reference
  const updateDebugDisplay = useCallback(
    (fps: number, elapsedSec: number, frames: number) => {
      setDisplayFps(fps);
      setDisplayElapsed(elapsedSec);
      setDisplayFrameCount(frames);
    },
    [],
  );

  // ─── Game loop ───────────────────────────────────────────────────────────
  // useFrameCallback callbacks are auto-workletized by react-native-worklets/plugin.
  // Any standalone function called from here needs its own 'worklet' directive.
  useFrameCallback((frameInfo) => {
    const dtMs = frameInfo.timeSincePreviousFrame ?? 0;

    // Fixed-step update
    accumulator.value += dtMs;
    const { steps, remainingMs } = computeSteps(accumulator.value, FIXED_STEP_MS);
    accumulator.value = remainingMs;

    let state = gameState.value;
    for (let i = 0; i < steps; i++) {
      state = updateGameState(state, FIXED_STEP_MS);
    }
    gameState.value = state;

    // FPS — compute and bridge to React once per second
    fpsAccumMs.value += dtMs;
    fpsFrameCount.value += 1;
    if (fpsAccumMs.value >= 1000) {
      const fps = Math.round((fpsFrameCount.value / fpsAccumMs.value) * 1000);
      runOnJS(updateDebugDisplay)(
        fps,
        Math.round(state.elapsedMs / 1000),
        state.frameCount,
      );
      fpsAccumMs.value = 0;
      fpsFrameCount.value = 0;
    }
  });

  // ─── Render ──────────────────────────────────────────────────────────────
  // G2: player is stationary — read position from initial state value once.
  // G3: this becomes useDerivedValue(() => getPlayerRenderData(gameState.value))
  //     so the canvas reacts to live position changes without React re-renders.
  const playerData = getPlayerRenderData(gameState.value);
  const spriteW = heroImage ? heroImage.width() * playerData.scale : 0;
  const spriteH = heroImage ? heroImage.height() * playerData.scale : 0;
  // Sprite origin is top-left; offset by half so player.x/y is the sprite center
  const heroX = playerData.x - spriteW / 2;
  const heroY = playerData.y - spriteH / 2;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        {heroImage && (
          <Image
            image={heroImage}
            x={heroX}
            y={heroY}
            width={spriteW}
            height={spriteH}
            sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
          />
        )}
      </Canvas>

      {/* Debug overlay — dev only. Phase 7 gates this behind a settings checkbox. */}
      {/* TODO Phase 7: replace hardcoded insets with real safe-area values once
          SafeAreaProvider's native ViewManager (RNCSafeAreaProvider) is confirmed
          registering correctly in the New Architecture build. */}
      <View
        style={[styles.debugOverlay, { top: 50, right: 10 }]}
        pointerEvents="none"
      >
        <Text style={styles.debugText}>FPS: {displayFps}</Text>
        <Text style={styles.debugText}>Frame: {displayFrameCount}</Text>
        <Text style={styles.debugText}>Time: {displayElapsed}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  debugOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  debugText: {
    color: '#4CAF50',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});
