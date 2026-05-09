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
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { HeroSprites, EnemySprites } from '../lib/sprites';
import type { HeroWeaponPose } from '../lib/sprites';
import { HERO_SPRITE_SCALE, JOYSTICK_DEADZONE_PX } from '../data/gameConstants';
import { createInitialGameState, updateGameState } from '../lib/gameEngine';
import { getPlayerRenderData, getEnemyRenderData } from '../lib/gameRenderer';
import type { EnemyRenderData } from '../lib/gameRenderer';
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

  // ─── Enemy render data (React state, bridged via useAnimatedReaction) ────────
  // ONE derived value watches the full enemy array each frame.
  // useAnimatedReaction bridges it to React state; JSX uses static transforms.
  // Net result: 0 Skia animated-prop subscriptions for enemies (was 50).
  const [enemyRenderData, setEnemyRenderData] = useState<EnemyRenderData[]>([]);

  const allEnemyData = useDerivedValue(() => getEnemyRenderData(gameState.value));
  useAnimatedReaction(
    () => allEnemyData.value,
    (current) => { runOnJS(setEnemyRenderData)(current); },
  );

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
          {/* Static transforms from React state — 0 Skia animated-prop subs. */}
          {enemyRenderData.map((enemy) => {
            const images = enemy.type === 'scav' ? scavWalkImages : raiderFireImages;
            const img = images[enemy.walkFrame] ?? null;
            if (!img) return null;
            const w = img.width() * enemy.scale;
            const h = img.height() * enemy.scale;
            return (
              <Group
                key={enemy.id}
                transform={[
                  { translateX: enemy.x },
                  { translateY: enemy.y },
                  { rotate: enemy.rotation + SPRITE_ROTATION_OFFSET },
                ]}
              >
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
