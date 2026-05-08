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
 *
 * G4 addition:
 *   WEAPON POSE: weapon layer is now dynamic — reads player.weaponPose from
 *   game state and selects the matching idle sprite. Debug button (top-left)
 *   cycles through all 5 poses for verification.
 *   TODO Phase 4: LevelUpModal + CrateRevealOverlay replace this debug button
 *   with real weapon equipping logic driven by player progression.
 *
 * Thread model:
 *   UI thread  — useFrameCallback, gesture callbacks, groupTransform derived value
 *   JS thread  — React state (sprite frame/weapon selection, FPS display)
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import type { HeroWeaponPose } from '../lib/sprites';
import { HERO_SPRITE_SCALE, JOYSTICK_DEADZONE_PX } from '../data/gameConstants';
import { createInitialGameState, updateGameState } from '../lib/gameEngine';
import { getPlayerRenderData } from '../lib/gameRenderer';
import { computeSteps, FIXED_STEP_MS } from '../lib/gameLoop';

// Cycle order and display labels for the debug weapon button.
const WEAPON_CYCLE: HeroWeaponPose[] = [
  'pistol', 'rifle', 'machinegun', 'grenade_launcher', 'flamethrower',
];
const WEAPON_LABELS: Record<HeroWeaponPose, string> = {
  pistol: 'Pistol',
  rifle: 'Rifle',
  machinegun: 'MachineGun',
  grenade_launcher: 'Grenade Launcher',
  flamethrower: 'Flamethrower',
};

type Props = {
  width: number;
  height: number;
};

export default function GameCanvas({ width, height }: Props) {
  // ─── Sprite images (loaded once at mount) ─────────────────────────────────
  // Walk frames: 96×96 lower body animation (16px transparent border aligns
  // the 64×64 character area with the weapon overlay).
  const walk0 = useImage(HeroSprites.walk[0]);
  const walk1 = useImage(HeroSprites.walk[1]);
  const walk2 = useImage(HeroSprites.walk[2]);
  const walk3 = useImage(HeroSprites.walk[3]);
  const walk4 = useImage(HeroSprites.walk[4]);
  const walk5 = useImage(HeroSprites.walk[5]);
  const walk6 = useImage(HeroSprites.walk[6]);
  const walkImages = [walk0, walk1, walk2, walk3, walk4, walk5, walk6];

  // Weapon pose images: 64×64 upper body. Selected at runtime from player.weaponPose.
  const pistolImage = useImage(HeroSprites.pistol.idle);
  const rifleImage = useImage(HeroSprites.rifle.idle);
  const machinegunImage = useImage(HeroSprites.machinegun.idle);
  const grenadeLauncherImage = useImage(HeroSprites.grenade_launcher.idle);
  const flamethrowerImage = useImage(HeroSprites.flamethrower.idle);
  const weaponIdleImages: Record<HeroWeaponPose, ReturnType<typeof useImage>> = {
    pistol: pistolImage,
    rifle: rifleImage,
    machinegun: machinegunImage,
    grenade_launcher: grenadeLauncherImage,
    flamethrower: flamethrowerImage,
  };

  // ─── Game state ────────────────────────────────────────────────────────────
  const gameState = useSharedValue(createInitialGameState(width, height));
  const accumulator = useSharedValue(0);

  // ─── Virtual joystick shared values (UI thread) ───────────────────────────
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

  // ─── Sprite state (React, bridged from UI thread only when values change) ──
  // weaponPose included so the weapon image selection re-renders on equip change.
  const [spriteState, setSpriteState] = useState<{
    isMoving: boolean;
    frame: number;
    weaponPose: HeroWeaponPose;
  }>({ isMoving: false, frame: 0, weaponPose: 'pistol' });

  const lastBridgedFrame = useSharedValue(-1);
  const lastBridgedMoving = useSharedValue(false);
  const lastBridgedWeapon = useSharedValue<string>('pistol');

  const updateSpriteState = useCallback(
    (isMoving: boolean, frame: number, weaponPose: HeroWeaponPose) => {
      setSpriteState({ isMoving, frame, weaponPose });
    },
    [],
  );

  // ─── Debug weapon cycle button ─────────────────────────────────────────────
  // Writes directly to gameState shared value from JS thread — valid pattern.
  // TODO Phase 4: replace with real equip logic from LevelUpModal + CrateRevealOverlay.
  const cycleWeapon = useCallback(() => {
    const current = gameState.value.player.weaponPose;
    const idx = WEAPON_CYCLE.indexOf(current);
    const next = WEAPON_CYCLE[(idx + 1) % WEAPON_CYCLE.length];
    gameState.value = {
      ...gameState.value,
      player: { ...gameState.value.player, weaponPose: next },
    };
  }, [gameState]);

  // ─── Virtual joystick gesture ──────────────────────────────────────────────
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
        inputVectorX.value = dx / mag;
        inputVectorY.value = dy / mag;
      } else {
        inputVectorX.value = 0;
        inputVectorY.value = 0;
      }
    })
    .onFinalize(() => {
      inputActive.value = false;
      inputVectorX.value = 0;
      inputVectorY.value = 0;
    });

  // ─── Group transform (UI thread → Skia) ───────────────────────────────────
  // Sprites face DOWN by default in this kit; subtract π/2 to align with
  // the standard atan2 convention (0 = right).
  const HERO_SPRITE_ROTATION_OFFSET = -Math.PI / 2;

  const groupTransform = useDerivedValue(() => [
    { translateX: gameState.value.player.x },
    { translateY: gameState.value.player.y },
    { rotate: gameState.value.player.rotation + HERO_SPRITE_ROTATION_OFFSET },
  ]);

  // ─── Game loop ─────────────────────────────────────────────────────────────
  useFrameCallback((frameInfo) => {
    const dtMs = frameInfo.timeSincePreviousFrame ?? 0;

    const ivx = inputActive.value ? inputVectorX.value : 0;
    const ivy = inputActive.value ? inputVectorY.value : 0;
    const iv = (ivx !== 0 || ivy !== 0) ? { x: ivx, y: ivy } : null;

    let state = {
      ...gameState.value,
      player: { ...gameState.value.player, inputVector: iv },
    };

    accumulator.value += dtMs;
    const { steps, remainingMs } = computeSteps(accumulator.value, FIXED_STEP_MS);
    accumulator.value = remainingMs;

    for (let i = 0; i < steps; i++) {
      state = updateGameState(state, FIXED_STEP_MS);
    }
    gameState.value = state;

    // Bridge sprite state when any display-relevant value changes.
    const rd = getPlayerRenderData(state);
    if (
      rd.isMoving !== lastBridgedMoving.value ||
      rd.walkFrame !== lastBridgedFrame.value ||
      rd.weaponPose !== lastBridgedWeapon.value
    ) {
      lastBridgedMoving.value = rd.isMoving;
      lastBridgedFrame.value = rd.walkFrame;
      lastBridgedWeapon.value = rd.weaponPose;
      runOnJS(updateSpriteState)(rd.isMoving, rd.walkFrame, rd.weaponPose);
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
  const bodyImage = spriteState.isMoving ? (walkImages[spriteState.frame] ?? null) : null;
  const weaponImage = weaponIdleImages[spriteState.weaponPose];

  const bodyW = bodyImage ? bodyImage.width() * HERO_SPRITE_SCALE : 0;
  const bodyH = bodyImage ? bodyImage.height() * HERO_SPRITE_SCALE : 0;
  const weaponW = weaponImage ? weaponImage.width() * HERO_SPRITE_SCALE : 0;
  const weaponH = weaponImage ? weaponImage.height() * HERO_SPRITE_SCALE : 0;

  return (
    <GestureDetector gesture={panGesture}>
      <View style={StyleSheet.absoluteFill}>
        {/* TODO Phase 5: wrap world rendering in <Group> with camera transform.
            scale = zoom level, translate = camera offset following player.
            Visual sprite scale (currently 2×) will likely need tuning once
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
            {/* Top layer: weapon pose — dynamic from player.weaponPose */}
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

        {/* Debug weapon cycle button — top-left.
            TODO Phase 4: remove once LevelUpModal + CrateRevealOverlay wire
            real weapon equipping from player progression. */}
        <Pressable
          style={[styles.debugOverlay, styles.weaponButton, { top: 50, left: 10 }]}
          onPress={cycleWeapon}
        >
          <Text style={styles.debugText}>
            Weapon: {WEAPON_LABELS[spriteState.weaponPose]}
          </Text>
          <Text style={[styles.debugText, styles.tapHint]}>tap to cycle</Text>
        </Pressable>

        {/* FPS overlay — top-right. */}
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
  weaponButton: {
    alignItems: 'flex-start',
  },
  debugText: {
    color: '#4CAF50',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  tapHint: {
    color: '#888',
    fontSize: 9,
  },
});
