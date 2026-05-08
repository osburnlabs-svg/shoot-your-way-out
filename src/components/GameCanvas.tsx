/**
 * GameCanvas — Skia canvas + game loop orchestration.
 *
 * G3 vs G2:
 *   INPUT:  Virtual joystick — touch anywhere; origin is touch-down point;
 *           direction vector = (finger - origin), normalized. Hero moves
 *           continuously while finger is held; stops on lift.
 *           Deadzone (JOYSTICK_DEADZONE_PX) prevents jitter when holding still.
 *
 *   RENDER: Two-layer sprite system (TDS kit pattern):
 *     - Walk frame (96×96 source, lower body): rendered when isMoving
 *     - Weapon pose (64×64 source, upper body): always rendered
 *     Both layers centered at player position inside the same Skia Group.
 *     When idle: weapon pose alone (full-body idle stance).
 *     Alignment note: walk frames have 16px transparent padding on all sides,
 *     so the 64×64 character area aligns with the weapon overlay — verify on device.
 *
 * Thread model:
 *   UI thread  — useFrameCallback, gesture callbacks, groupTransform derived value
 *   JS thread  — React state (sprite frame selection, FPS display)
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  FilterMode,
  Group,
  Image,
  MipmapMode,
  useImage,
} from '@shopify/react-native-skia';
import {
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { HeroSprites } from '../lib/sprites';
import { HERO_SPRITE_SCALE, JOYSTICK_DEADZONE_PX } from '../data/gameConstants';
import { createInitialGameState, updateGameState } from '../lib/gameEngine';
import { getPlayerRenderData } from '../lib/gameRenderer';
import { computeSteps, FIXED_STEP_MS } from '../lib/gameLoop';

type Props = {
  width: number;
  height: number;
};

export default function GameCanvas({ width, height }: Props) {
  // ─── Sprite images (loaded once at mount) ─────────────────────────────────
  // Weapon pose: 64×64 upper body (also serves as full-body idle).
  // Walk frames: 96×96 lower body animation (16px transparent border matches weapon canvas).
  const weaponIdleImage = useImage(HeroSprites.pistol.idle); // Group 4 makes this dynamic
  const walk0 = useImage(HeroSprites.walk[0]);
  const walk1 = useImage(HeroSprites.walk[1]);
  const walk2 = useImage(HeroSprites.walk[2]);
  const walk3 = useImage(HeroSprites.walk[3]);
  const walk4 = useImage(HeroSprites.walk[4]);
  const walk5 = useImage(HeroSprites.walk[5]);
  const walk6 = useImage(HeroSprites.walk[6]);
  const walkImages = [walk0, walk1, walk2, walk3, walk4, walk5, walk6];

  // ─── Game state ────────────────────────────────────────────────────────────
  const gameState = useSharedValue(createInitialGameState(width, height));
  const accumulator = useSharedValue(0);

  // ─── Virtual joystick shared values (UI thread) ───────────────────────────
  // joystickOrigin: position where the finger first touched down.
  // inputVector: normalized direction (x, y ∈ [-1,1]); (0,0) when in deadzone.
  // inputActive: true while finger is on screen.
  const joystickOriginX = useSharedValue(0);
  const joystickOriginY = useSharedValue(0);
  const inputVectorX = useSharedValue(0);
  const inputVectorY = useSharedValue(0);
  const inputActive = useSharedValue(false);

  // ─── FPS tracking (UI thread) ──────────────────────────────────────────────
  const fpsAccumMs = useSharedValue(0);
  const fpsFrameCount = useSharedValue(0);

  // ─── Debug display (React state, ~once/sec) ────────────────────────────────
  const [displayFps, setDisplayFps] = useState(0);
  const [displayElapsed, setDisplayElapsed] = useState(0);
  const [displayFrameCount, setDisplayFrameCount] = useState(0);

  const updateDebugDisplay = useCallback(
    (fps: number, elapsedSec: number, frames: number) => {
      setDisplayFps(fps);
      setDisplayElapsed(elapsedSec);
      setDisplayFrameCount(frames);
    },
    [],
  );

  // ─── Sprite state (React, bridged from UI thread only when frame changes) ──
  const [spriteState, setSpriteState] = useState({ isMoving: false, frame: 0 });
  const lastBridgedFrame = useSharedValue(-1);
  const lastBridgedMoving = useSharedValue(false);

  const updateSpriteState = useCallback((isMoving: boolean, frame: number) => {
    setSpriteState({ isMoving, frame });
  }, []);

  // ─── Virtual joystick gesture ──────────────────────────────────────────────
  // onBegin: capture touch-down position as joystick origin.
  // onUpdate: compute direction vector from origin; normalize if beyond deadzone.
  // onFinalize: clear input on finger lift or gesture cancel.
  //
  // Callbacks are auto-workletized by react-native-worklets/plugin.
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      joystickOriginX.value = e.x;
      joystickOriginY.value = e.y;
      inputVectorX.value = 0;
      inputVectorY.value = 0;
      inputActive.value = true;
    })
    .onUpdate((e) => {
      const dx = e.x - joystickOriginX.value;
      const dy = e.y - joystickOriginY.value;
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > JOYSTICK_DEADZONE_PX) {
        // Normalize to unit vector — full speed regardless of drag distance.
        inputVectorX.value = dx / mag;
        inputVectorY.value = dy / mag;
      } else {
        // Inside deadzone: hero stays still even though finger is down.
        inputVectorX.value = 0;
        inputVectorY.value = 0;
      }
    })
    .onFinalize(() => {
      inputActive.value = false;
      inputVectorX.value = 0;
      inputVectorY.value = 0;
    });

  // ─── Group transform (UI thread → Skia, no React re-renders for movement) ─
  // Skia re-draws the Canvas whenever this derived value changes (60fps during movement).
  // Transform: translate to player position, then rotate around that center.
  // Both sprite layers are drawn at (-w/2, -h/2) inside the Group.
  //
  // Sprite orientation: this kit's hero sprites face DOWN by default (positive Y axis).
  // Our rotation math uses 0 = facing RIGHT (standard atan2 convention).
  // Subtracting π/2 converts from math convention to sprite convention.
  const HERO_SPRITE_ROTATION_OFFSET = -Math.PI / 2;

  const groupTransform = useDerivedValue(() => [
    { translateX: gameState.value.player.x },
    { translateY: gameState.value.player.y },
    { rotate: gameState.value.player.rotation + HERO_SPRITE_ROTATION_OFFSET },
  ]);

  // ─── Game loop ─────────────────────────────────────────────────────────────
  useFrameCallback((frameInfo) => {
    const dtMs = frameInfo.timeSincePreviousFrame ?? 0;

    // Build inputVector from joystick shared values.
    // Treat (0,0) as null — hero stays idle in deadzone even if finger is down.
    const ivx = inputActive.value ? inputVectorX.value : 0;
    const ivy = inputActive.value ? inputVectorY.value : 0;
    const iv = (ivx !== 0 || ivy !== 0) ? { x: ivx, y: ivy } : null;

    // Inject current input vector into game state before running fixed steps.
    let state = {
      ...gameState.value,
      player: { ...gameState.value.player, inputVector: iv },
    };

    // Fixed-step update
    accumulator.value += dtMs;
    const { steps, remainingMs } = computeSteps(accumulator.value, FIXED_STEP_MS);
    accumulator.value = remainingMs;

    for (let i = 0; i < steps; i++) {
      state = updateGameState(state, FIXED_STEP_MS);
    }
    gameState.value = state;

    // Bridge sprite state to React only when frame index or isMoving changes.
    const rd = getPlayerRenderData(state);
    if (rd.isMoving !== lastBridgedMoving.value || rd.walkFrame !== lastBridgedFrame.value) {
      lastBridgedMoving.value = rd.isMoving;
      lastBridgedFrame.value = rd.walkFrame;
      runOnJS(updateSpriteState)(rd.isMoving, rd.walkFrame);
    }

    // FPS — bridge to React once per second
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

  // ─── Render ────────────────────────────────────────────────────────────────
  // Two-layer sprite system:
  //   bodyImage   — walk frame (96×96, lower body). Rendered when moving; null when idle.
  //   weaponImage — weapon pose (64×64, upper body + idle stance). Always rendered.
  //
  // Both are centered at the Group origin (= player position).
  // The 16px transparent border on walk frames means the 64×64 character
  // area inside them aligns exactly with the 64×64 weapon overlay.
  const bodyImage = spriteState.isMoving ? (walkImages[spriteState.frame] ?? null) : null;
  const weaponImage = weaponIdleImage; // Group 4 will make this dynamic

  const bodyW = bodyImage ? bodyImage.width() * HERO_SPRITE_SCALE : 0;
  const bodyH = bodyImage ? bodyImage.height() * HERO_SPRITE_SCALE : 0;
  const weaponW = weaponImage ? weaponImage.width() * HERO_SPRITE_SCALE : 0;
  const weaponH = weaponImage ? weaponImage.height() * HERO_SPRITE_SCALE : 0;

  return (
    <GestureDetector gesture={panGesture}>
      <View style={StyleSheet.absoluteFill}>
        {/* TODO Phase 5: wrap world rendering in <Group> with camera transform.
            scale = zoom level, translate = camera offset following player.
            Visual sprite scale (currently 4x) will likely need tuning once
            tiles + enemies + HUD are visible on screen — the right scale
            can't be determined until Phase 5 has all elements present. */}
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={groupTransform}>
            {/* Bottom layer: animated walk legs (only while moving) */}
            {bodyImage && (
              <Image
                image={bodyImage}
                x={-bodyW / 2}
                y={-bodyH / 2}
                width={bodyW}
                height={bodyH}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
            )}
            {/* Top layer: upper body + weapon pose (always visible) */}
            {weaponImage && (
              <Image
                image={weaponImage}
                x={-weaponW / 2}
                y={-weaponH / 2}
                width={weaponW}
                height={weaponH}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
            )}
          </Group>
        </Canvas>

        {/* Debug overlay — dev only. */}
        {/* TODO Phase 7: replace hardcoded insets with real safe-area values. */}
        <View
          style={[styles.debugOverlay, { top: 50, right: 10 }]}
          pointerEvents="none"
        >
          <Text style={styles.debugText}>FPS: {displayFps}</Text>
          <Text style={styles.debugText}>Frame: {displayFrameCount}</Text>
          <Text style={styles.debugText}>Time: {displayElapsed}s</Text>
        </View>
      </View>
    </GestureDetector>
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
