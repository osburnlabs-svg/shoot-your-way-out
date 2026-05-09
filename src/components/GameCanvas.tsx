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
 * Phase 3 G1 additions:
 *   ENEMIES: Scav + Raider spawn from off-screen edges, walk toward player.
 *   Walk animation cycles using same animation.ts system as hero.
 *   All 21 enemy sprite frames loaded at mount (unconditional useImage calls).
 *   Enemy render data is bridged to React state via runOnJS every frame.
 *   Enemies drawn before the player Group (z-order: enemies below hero).
 *   Debug overlay gains: Enemies count + M:SS elapsed time.
 *
 * Thread model:
 *   UI thread  — useFrameCallback, gesture callbacks, groupTransform derived value
 *   JS thread  — React state (sprite frame/weapon selection, FPS display, enemy data)
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
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { HeroSprites, EnemySprites } from '../lib/sprites';
import type { HeroWeaponPose } from '../lib/sprites';
import {
  HERO_SPRITE_SCALE,
  JOYSTICK_DEADZONE_PX,
  ENEMY_SOFT_CAP,
  ENEMY_SPRITE_SCALE,
  SCAV_WALK_FRAME_COUNT,
  SCAV_WALK_FRAME_DURATION_MS,
  RAIDER_WALK_FRAME_COUNT,
  RAIDER_WALK_FRAME_DURATION_MS,
} from '../data/gameConstants';
import type { EnemyType } from '../data/enemies';
import { createInitialGameState, updateGameState } from '../lib/gameEngine';
import type { GameState } from '../lib/gameEngine';
import { getPlayerRenderData } from '../lib/gameRenderer';
import { getCurrentFrame } from '../lib/animation';
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

// Rotation offset: TDS kit sprites face DOWN by default.
// Subtract π/2 to align with atan2 convention (0 = right).
// Applied to both hero and enemy transforms.
const SPRITE_ROTATION_OFFSET = -Math.PI / 2;

/** Format elapsed seconds as M:SS for the debug overlay. */
function formatElapsed(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Per-slot enemy group transform — runs entirely on the UI thread.
 *
 * Reads enemy position and player position directly from the shared game state
 * each tick (same pattern as the hero's groupTransform useDerivedValue).
 * Inactive slots (no enemy at slotIndex) translate off-screen so they are
 * invisible without conditionally mounting/unmounting Skia nodes.
 *
 * SPRITE_ROTATION_OFFSET is applied here so the JSX <Group transform> prop
 * receives a complete, ready-to-use transform — no arithmetic in JSX.
 */
function useEnemySlotTransform(gameState: SharedValue<GameState>, slotIndex: number) {
  return useDerivedValue(() => {
    const enemy = gameState.value.enemies[slotIndex];
    if (!enemy) {
      return [{ translateX: -99999 }, { translateY: -99999 }, { rotate: 0 }];
    }
    const dx = gameState.value.player.x - enemy.x;
    const dy = gameState.value.player.y - enemy.y;
    const rotation = Math.atan2(dy, dx) + SPRITE_ROTATION_OFFSET;
    return [{ translateX: enemy.x }, { translateY: enemy.y }, { rotate: rotation }];
  });
}

type Props = {
  width: number;
  height: number;
};

export default function GameCanvas({ width, height }: Props) {
  // ─── Hero sprite images (loaded once at mount) ────────────────────────────
  const walk0 = useImage(HeroSprites.walk[0]);
  const walk1 = useImage(HeroSprites.walk[1]);
  const walk2 = useImage(HeroSprites.walk[2]);
  const walk3 = useImage(HeroSprites.walk[3]);
  const walk4 = useImage(HeroSprites.walk[4]);
  const walk5 = useImage(HeroSprites.walk[5]);
  const walk6 = useImage(HeroSprites.walk[6]);
  const walkImages = [walk0, walk1, walk2, walk3, walk4, walk5, walk6];

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

  // ─── Enemy sprite images (loaded once at mount, all unconditional) ────────
  // Scav walk: 7 frames (SW_01–07)
  const scavWalk0 = useImage(EnemySprites.scav.walk[0]);
  const scavWalk1 = useImage(EnemySprites.scav.walk[1]);
  const scavWalk2 = useImage(EnemySprites.scav.walk[2]);
  const scavWalk3 = useImage(EnemySprites.scav.walk[3]);
  const scavWalk4 = useImage(EnemySprites.scav.walk[4]);
  const scavWalk5 = useImage(EnemySprites.scav.walk[5]);
  const scavWalk6 = useImage(EnemySprites.scav.walk[6]);
  const scavWalkImages = [scavWalk0, scavWalk1, scavWalk2, scavWalk3, scavWalk4, scavWalk5, scavWalk6];

  // Scav shot + die (imported now, used in G2)
  const scavShot0 = useImage(EnemySprites.scav.shot[0]);
  const scavDie0 = useImage(EnemySprites.scav.die[0]);
  const scavDie1 = useImage(EnemySprites.scav.die[1]);
  const scavDie2 = useImage(EnemySprites.scav.die[2]);
  const scavDie3 = useImage(EnemySprites.scav.die[3]);
  // Suppress unused-variable lint — these will be used in G2/G3.
  void scavShot0; void scavDie0; void scavDie1; void scavDie2; void scavDie3;

  // Raider fire: 5 frames (SF_01–05) — used as walk animation
  const raiderFire0 = useImage(EnemySprites.raider.fire[0]);
  const raiderFire1 = useImage(EnemySprites.raider.fire[1]);
  const raiderFire2 = useImage(EnemySprites.raider.fire[2]);
  const raiderFire3 = useImage(EnemySprites.raider.fire[3]);
  const raiderFire4 = useImage(EnemySprites.raider.fire[4]);
  const raiderFireImages = [raiderFire0, raiderFire1, raiderFire2, raiderFire3, raiderFire4];

  // Raider die (imported now, used in G2)
  const raiderDie0 = useImage(EnemySprites.raider.die[0]);
  const raiderDie1 = useImage(EnemySprites.raider.die[1]);
  const raiderDie2 = useImage(EnemySprites.raider.die[2]);
  const raiderDie3 = useImage(EnemySprites.raider.die[3]);
  void raiderDie0; void raiderDie1; void raiderDie2; void raiderDie3;

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
  const [displayEnemyCount, setDisplayEnemyCount] = useState(0);

  const updateDebugDisplay = useCallback(
    (fps: number, elapsedSec: number, frames: number, enemyCount: number) => {
      setDisplayFps(fps);
      setDisplayElapsed(elapsedSec);
      setDisplayFrameCount(frames);
      setDisplayEnemyCount(enemyCount);
    },
    [],
  );

  // ─── Hero sprite state (React, bridged from UI thread only when values change)
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

  // ─── Enemy slot data (sprite selection only — bridged selectively ~8×/sec) ─
  // Positions + rotations are handled by per-slot useDerivedValue on the UI
  // thread (see allSlotTransforms below) — no runOnJS needed for movement.
  // Only walk frame index + enemy type need to reach the JS thread for image
  // selection; these change once every 110–120 ms, not every frame.
  const [enemySlotTypes, setEnemySlotTypes] = useState<Array<EnemyType | null>>(
    () => Array.from({ length: ENEMY_SOFT_CAP }, () => null as EnemyType | null),
  );
  const [enemySlotFrames, setEnemySlotFrames] = useState<number[]>(
    () => Array.from({ length: ENEMY_SOFT_CAP }, () => 0),
  );

  // Tracks last-bridged slot state on the UI thread for change detection.
  const lastSlotFrames = useSharedValue<number[]>(
    Array.from({ length: ENEMY_SOFT_CAP }, () => -1),
  );
  const lastEnemyCount = useSharedValue(0);

  const updateEnemySlotData = useCallback(
    (types: Array<EnemyType | null>, frames: number[]) => {
      setEnemySlotTypes(types);
      setEnemySlotFrames(frames);
    },
    [],
  );

  // ─── Per-slot enemy transforms (UI thread, no runOnJS) ────────────────────
  // One useDerivedValue per slot (= ENEMY_SOFT_CAP = 50).
  // Hooks must be called unconditionally and in a fixed order — the static
  // listing below satisfies React's rules of hooks.
  const eTransform0  = useEnemySlotTransform(gameState, 0);
  const eTransform1  = useEnemySlotTransform(gameState, 1);
  const eTransform2  = useEnemySlotTransform(gameState, 2);
  const eTransform3  = useEnemySlotTransform(gameState, 3);
  const eTransform4  = useEnemySlotTransform(gameState, 4);
  const eTransform5  = useEnemySlotTransform(gameState, 5);
  const eTransform6  = useEnemySlotTransform(gameState, 6);
  const eTransform7  = useEnemySlotTransform(gameState, 7);
  const eTransform8  = useEnemySlotTransform(gameState, 8);
  const eTransform9  = useEnemySlotTransform(gameState, 9);
  const eTransform10 = useEnemySlotTransform(gameState, 10);
  const eTransform11 = useEnemySlotTransform(gameState, 11);
  const eTransform12 = useEnemySlotTransform(gameState, 12);
  const eTransform13 = useEnemySlotTransform(gameState, 13);
  const eTransform14 = useEnemySlotTransform(gameState, 14);
  const eTransform15 = useEnemySlotTransform(gameState, 15);
  const eTransform16 = useEnemySlotTransform(gameState, 16);
  const eTransform17 = useEnemySlotTransform(gameState, 17);
  const eTransform18 = useEnemySlotTransform(gameState, 18);
  const eTransform19 = useEnemySlotTransform(gameState, 19);
  const eTransform20 = useEnemySlotTransform(gameState, 20);
  const eTransform21 = useEnemySlotTransform(gameState, 21);
  const eTransform22 = useEnemySlotTransform(gameState, 22);
  const eTransform23 = useEnemySlotTransform(gameState, 23);
  const eTransform24 = useEnemySlotTransform(gameState, 24);
  const eTransform25 = useEnemySlotTransform(gameState, 25);
  const eTransform26 = useEnemySlotTransform(gameState, 26);
  const eTransform27 = useEnemySlotTransform(gameState, 27);
  const eTransform28 = useEnemySlotTransform(gameState, 28);
  const eTransform29 = useEnemySlotTransform(gameState, 29);
  const eTransform30 = useEnemySlotTransform(gameState, 30);
  const eTransform31 = useEnemySlotTransform(gameState, 31);
  const eTransform32 = useEnemySlotTransform(gameState, 32);
  const eTransform33 = useEnemySlotTransform(gameState, 33);
  const eTransform34 = useEnemySlotTransform(gameState, 34);
  const eTransform35 = useEnemySlotTransform(gameState, 35);
  const eTransform36 = useEnemySlotTransform(gameState, 36);
  const eTransform37 = useEnemySlotTransform(gameState, 37);
  const eTransform38 = useEnemySlotTransform(gameState, 38);
  const eTransform39 = useEnemySlotTransform(gameState, 39);
  const eTransform40 = useEnemySlotTransform(gameState, 40);
  const eTransform41 = useEnemySlotTransform(gameState, 41);
  const eTransform42 = useEnemySlotTransform(gameState, 42);
  const eTransform43 = useEnemySlotTransform(gameState, 43);
  const eTransform44 = useEnemySlotTransform(gameState, 44);
  const eTransform45 = useEnemySlotTransform(gameState, 45);
  const eTransform46 = useEnemySlotTransform(gameState, 46);
  const eTransform47 = useEnemySlotTransform(gameState, 47);
  const eTransform48 = useEnemySlotTransform(gameState, 48);
  const eTransform49 = useEnemySlotTransform(gameState, 49);
  const allSlotTransforms = [
    eTransform0,  eTransform1,  eTransform2,  eTransform3,  eTransform4,
    eTransform5,  eTransform6,  eTransform7,  eTransform8,  eTransform9,
    eTransform10, eTransform11, eTransform12, eTransform13, eTransform14,
    eTransform15, eTransform16, eTransform17, eTransform18, eTransform19,
    eTransform20, eTransform21, eTransform22, eTransform23, eTransform24,
    eTransform25, eTransform26, eTransform27, eTransform28, eTransform29,
    eTransform30, eTransform31, eTransform32, eTransform33, eTransform34,
    eTransform35, eTransform36, eTransform37, eTransform38, eTransform39,
    eTransform40, eTransform41, eTransform42, eTransform43, eTransform44,
    eTransform45, eTransform46, eTransform47, eTransform48, eTransform49,
  ];

  // ─── Debug weapon cycle button ─────────────────────────────────────────────
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

  // ─── Hero group transform (UI thread → Skia) ───────────────────────────────
  const groupTransform = useDerivedValue(() => [
    { translateX: gameState.value.player.x },
    { translateY: gameState.value.player.y },
    { rotate: gameState.value.player.rotation + SPRITE_ROTATION_OFFSET },
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

    // Bridge hero sprite state when any display-relevant value changes.
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

    // Bridge enemy slot data selectively — only when walk frame or count changes.
    // Fires at most once per frame-duration interval (~8–9×/sec for 110–120 ms
    // frames), NOT every game tick. Positions are handled by per-slot
    // useDerivedValue (allSlotTransforms) and never touch this bridge.
    let slotDataChanged = state.enemies.length !== lastEnemyCount.value;
    const newSlotFrames: number[] = [];
    const newSlotTypes: Array<EnemyType | null> = [];
    for (let si = 0; si < ENEMY_SOFT_CAP; si++) {
      const en = state.enemies[si] ?? null;
      if (!en) {
        newSlotTypes[si] = null;
        newSlotFrames[si] = -1;
        if (lastSlotFrames.value[si] !== -1) slotDataChanged = true;
      } else {
        newSlotTypes[si] = en.type;
        const isScav = en.type === 'scav';
        const frame = getCurrentFrame(
          {
            frameCount: isScav ? SCAV_WALK_FRAME_COUNT : RAIDER_WALK_FRAME_COUNT,
            frameDurationMs: isScav ? SCAV_WALK_FRAME_DURATION_MS : RAIDER_WALK_FRAME_DURATION_MS,
            loop: true,
          },
          state.elapsedMs - en.walkStartedAtMs,
        );
        newSlotFrames[si] = frame;
        if (lastSlotFrames.value[si] !== frame) slotDataChanged = true;
      }
    }
    if (slotDataChanged) {
      lastEnemyCount.value = state.enemies.length;
      lastSlotFrames.value = newSlotFrames;
      runOnJS(updateEnemySlotData)(newSlotTypes, newSlotFrames);
    }

    // FPS + debug counters — bridge to React once per second.
    fpsAccumMs.value += dtMs;
    fpsFrameCount.value += 1;
    if (fpsAccumMs.value >= 1000) {
      const fps = Math.round((fpsFrameCount.value / fpsAccumMs.value) * 1000);
      runOnJS(updateDebugDisplay)(
        fps,
        Math.round(state.elapsedMs / 1000),
        state.frameCount,
        state.enemies.length,
      );
      fpsAccumMs.value = 0;
      fpsFrameCount.value = 0;
    }
  });

  // ─── Hero render ──────────────────────────────────────────────────────────
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
            tiles + enemies + HUD are visible on screen together. */}
        <Canvas style={StyleSheet.absoluteFill}>

          {/* ── Enemies (below player) ────────────────────────────────────── */}
          {/* transform = per-slot useDerivedValue (UI thread, no bridge).    */}
          {/* Image selection = enemySlotTypes/Frames (React state, ~8×/sec). */}
          {allSlotTransforms.map((transform, i) => {
            const type = enemySlotTypes[i];
            if (!type) return null;
            const frame = enemySlotFrames[i] >= 0 ? enemySlotFrames[i] : 0;
            const images = type === 'scav' ? scavWalkImages : raiderFireImages;
            const img = images[frame] ?? null;
            if (!img) return null;
            const w = img.width() * ENEMY_SPRITE_SCALE;
            const h = img.height() * ENEMY_SPRITE_SCALE;
            return (
              <Group key={i} transform={transform}>
                <Image
                  image={img}
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                />
              </Group>
            );
          })}

          {/* ── Player (above enemies) ────────────────────────────────────── */}
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

        {/* Debug overlay — top-right. */}
        {/* TODO Phase 7: replace hardcoded insets with real safe-area values. */}
        <View
          style={[styles.debugOverlay, { top: 50, right: 10 }]}
          pointerEvents="none"
        >
          <Text style={styles.debugText}>FPS: {displayFps}</Text>
          <Text style={styles.debugText}>Enemies: {displayEnemyCount}</Text>
          <Text style={styles.debugText}>Time: {formatElapsed(displayElapsed)}</Text>
          <Text style={styles.debugText}>Frame: {displayFrameCount}</Text>
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
