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
 *   Enemies drawn before the player Group (z-order: enemies below hero).
 *   Debug overlay gains: Enemies count + M:SS elapsed time.
 *
 * Phase 3 G2 additions:
 *   COMBAT: Player auto-fires Pistol at nearest enemy in range.
 *   Projectiles travel as Skia Circle primitives (yellow, 4px radius).
 *   30 pre-allocated projectile slot derived values (inactive slots off-screen).
 *   Enemy die animation: sprite timer detects 'dying' status, switches to die
 *   frames. Body overlay removed on dying Scavs. Kill count in debug overlay.
 *
 * Phase 3 G3 additions:
 *   PICKUPS: Money Small drops from killed enemies. 50 pre-allocated pickup
 *   slot derived values (same always-render pattern as projectiles).
 *   Pickup rendered as Money_Small.png sprite below projectiles in z-order.
 *   CONTACT DAMAGE: Enemies deal damage to player on overlap (500ms cooldown).
 *   DEATH: isDead freezes the game; "YOU DIED" overlay appears centered.
 *   Debug overlay gains: HP, Score, XP lines.
 *
 * Thread model:
 *   UI thread  — useFrameCallback, gesture callbacks, groupTransform derived value,
 *                enemy slot transforms, projectile slot transforms, pickup slot transforms
 *   JS thread  — React state (sprite frame/weapon selection, FPS display, enemy data,
 *                HP/Score/XP/isDead for debug and overlay)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Atlas,
  Canvas,
  Circle,
  FilterMode,
  Group,
  Image,
  MipmapMode,
  Skia,
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

import { HeroSprites, EnemySprites, PickupSprites, EffectSprites, TileSprites } from '../lib/sprites';
import type { HeroWeaponPose } from '../lib/sprites';
import { loadMap } from '../lib/mapLoader';
import { SKILLS, SKILL_IDS, getEffectiveStats } from '../data/skills';
import type { SkillId } from '../data/skills';
import { WEAPON_PROFILES } from '../data/weapons';
import LevelUpModal from './LevelUpModal';
import ReviveModal from './ReviveModal';
import CrateRevealModal from './CrateRevealModal';
import {
  ENEMY_COLLISION_RADIUS_PX,
  ENEMY_SOFT_CAP,
  ENEMY_SPRITE_SCALE,
  HERO_SPRITE_SCALE,
  JOYSTICK_DEADZONE_PX,
  RAIDER_WALK_FRAME_COUNT,
  RAIDER_WALK_FRAME_DURATION_MS,
  SCAV_WALK_FRAME_COUNT,
  SCAV_WALK_FRAME_DURATION_MS,
  WALK_FRAME_COUNT,
  WALK_FRAME_DURATION_MS,
  ENEMY_DIE_FRAME_COUNT,
  ENEMY_DIE_FRAME_DURATION_MS,
  PICKUP_SLOT_COUNT,
  PICKUP_SPRITE_SCALE,
  HIT_FLASH_RADIUS_PX,
  INVULNERABLE_DURATION_MS,
  THROWABLE_SLOT_COUNT,
  EFFECT_ZONE_SLOT_COUNT,
  THROWABLE_TRAVEL_TIME_MS,
  THROWABLE_ARC_HEIGHT_PX,
  FRAG_EXPLODE_FRAME_COUNT,
  FRAG_EXPLODE_FRAME_DURATION_MS,
  EFFECT_SPRITE_SCALE,
  SMOKE_RADIUS_PX,
  SMOKE_DURATION_MS,
  SMOKE_ANIM_FRAME_COUNT,
  SMOKE_BLOOM_DURATION_MS,
  SMOKE_DISSIPATE_DURATION_MS,
  MOLOTOV_FIRE_FRAME_COUNT,
  MOLOTOV_FIRE_FRAME_DURATION_MS,
  FLAME_ZONE_SPRITE_SCALE,
  PROJECTILE_SLOT_COUNT,
  ROCKET_FRAME_COUNT,
  ROCKET_FRAME_DURATION_MS,
  CAMERA_ZOOM,
  TILE_SIZE,
  TILE_COLS,
  TILE_ROWS,
} from '../data/gameConstants';
import type { CrateTier } from '../data/gameConstants';
import type { EnemyType } from '../data/enemies';
import { createInitialGameState, updateGameState } from '../lib/gameEngine';
import type { GameState } from '../lib/gameEngine';
import { getCurrentFrame } from '../lib/animation';

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

/**
 * Per-slot enemy transform — one useDerivedValue per pre-allocated slot.
 * Returns position + heading for the enemy at enemies[slotIndex], or an
 * off-screen zero transform when the slot is empty.
 *
 * IMPORTANT: only render <Group transform={result}> when the slot is active
 * (enemySlotTypes[slotIndex] !== null). An inactive slot is never subscribed
 * to as a Skia animated prop, so its per-tick recalculation causes zero Skia
 * notifications — even though the returned array is a new object each tick.
 */
function useEnemySlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
  return useDerivedValue(() => {
    const enemy = gameState.value.enemies[slotIndex];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!enemy) return [{ translateX: 0 }, { translateY: 0 }, { rotate: 0 }];
    const dx = px - enemy.x;
    const dy = py - enemy.y;
    return [
      { translateX: width / 2 + (enemy.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (enemy.y - py) * CAMERA_ZOOM },
      { rotate: Math.atan2(dy, dx) + SPRITE_ROTATION_OFFSET },
    ];
  });
}

/**
 * Per-slot projectile transform — one useDerivedValue per pre-allocated slot.
 * Always renders (no null return) — inactive slots go to (-9999, -9999) so the
 * circle is off-screen. This avoids needing React state to track slot activity
 * (which would add up to 100ms lag to bullet appearance/disappearance).
 *
 * 30 constant Skia subscriptions are safe — gesture runs as UI-thread worklet
 * (runOnJS removed in Phase 5 stutter fix).
 */
function useProjectileSlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
  return useDerivedValue(() => {
    const proj = gameState.value.projectiles[slotIndex];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!proj) return [{ translateX: -9999 }, { translateY: -9999 }, { rotate: 0 }];
    return [
      { translateX: width / 2 + (proj.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (proj.y - py) * CAMERA_ZOOM },
      { rotate: Math.atan2(proj.vyPxPerSec, proj.vxPxPerSec) + SPRITE_ROTATION_OFFSET },
    ];
  });
}

/**
 * Per-slot pickup transform — one useDerivedValue per pre-allocated slot.
 * Same always-render pattern as projectile slots: inactive slots go to
 * (-9999, -9999). No React state needed for pickup slot activity — position
 * updates happen every frame via derived value.
 */
function usePickupSlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
  return useDerivedValue(() => {
    const pickup = gameState.value.pickups[slotIndex];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!pickup) return [{ translateX: -9999 }, { translateY: -9999 }];
    return [
      { translateX: width / 2 + (pickup.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (pickup.y - py) * CAMERA_ZOOM },
    ];
  });
}

/**
 * Per-slot crate transform — one useDerivedValue per pre-allocated slot.
 * Same always-render pattern as pickups: inactive slots go to (-9999, -9999).
 */
function useCrateSlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
  return useDerivedValue(() => {
    const crate = gameState.value.crates[slotIndex];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!crate) return [{ translateX: -9999 }, { translateY: -9999 }];
    return [
      { translateX: width / 2 + (crate.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (crate.y - py) * CAMERA_ZOOM },
    ];
  });
}

/**
 * Throwable arc transform — one useDerivedValue per pre-allocated throwable slot.
 * Returns a Skia-compatible transform array for a flying throwable arc position.
 * Inactive/detonating slots return off-screen (-9999, -9999) so their circles
 * are invisible — same always-render pattern as projectile/pickup slots.
 * The transform is passed directly to <Group transform={...}>; no .value read
 * in JSX. Detonating frags are rendered separately via React state (targetX/Y).
 *
 * Arc formula:
 *   fraction = clamp((elapsedMs - thrownAtMs) / THROWABLE_TRAVEL_TIME_MS, 0, 1)
 *   x = lerp(spawnX, targetX, fraction)
 *   y = lerp(spawnY, targetY, fraction) - sin(fraction * PI) * THROWABLE_ARC_HEIGHT_PX
 */
function useThrowableSlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
  return useDerivedValue(() => {
    const t = gameState.value.throwables[slotIndex];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!t || t.status !== 'flying') return [{ translateX: -9999 }, { translateY: -9999 }];
    const elapsed = gameState.value.elapsedMs - t.thrownAtMs;
    const frac = Math.min(elapsed / THROWABLE_TRAVEL_TIME_MS, 1);
    const arcX = t.spawnX + (t.targetX - t.spawnX) * frac;
    const arcY = (t.spawnY + (t.targetY - t.spawnY) * frac)
               - Math.sin(frac * Math.PI) * THROWABLE_ARC_HEIGHT_PX;
    return [
      { translateX: width / 2 + (arcX - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (arcY - py) * CAMERA_ZOOM },
    ];
  });
}

/**
 * Per-slot hit-flash opacity — one useDerivedValue per pre-allocated enemy slot.
 * Returns 0.75 while hitFlashUntilMs is in the future, 0 otherwise.
 * Drives a red <Circle> rendered on top of each enemy sprite in JSX.
 * Checked every frame on the UI thread — no runOnJS, no 100ms polling lag.
 *
 * NOTE: Sprite color-filter approaches (ColorMatrix on <Image> or via <Group layer>)
 * do not work in Skia v2.2.12 — <Paint> children are ignored for Image draws, and
 * Skia.Paint() cannot be called from Reanimated worklets (same crash as G1). Red
 * circle is the worklet-safe solution.
 */
function useEnemySlotFlash(gameState: SharedValue<GameState>, slotIndex: number) {
  return useDerivedValue((): number => {
    const enemy = gameState.value.enemies[slotIndex];
    return !!enemy && gameState.value.elapsedMs < enemy.hitFlashUntilMs ? 0.75 : 0;
  });
}

/** Format elapsed seconds as M:SS for the debug overlay. */
function formatElapsed(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Throwable in-flight circle colors — defined locally (not in gameConstants) as
 * they are purely visual/render concerns. Smoke/Molotov zone colors are also here.
 * G5 TODO: remove debug spawn buttons that reference these; colors stay for flight circles.
 */
const THROWABLE_COLORS = {
  frag:    '#e8c040', // yellow-gold
  smoke:   '#a0c8a0', // pale green-grey
  molotov: '#e06020', // orange-red
};

console.log('G2-ATLAS VERSION: render attempt v1');

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

  // Scav upper body — composited over walk frames (two-layer, same as hero)
  const scavBodyImage = useImage(EnemySprites.scav.body);

  // Scav shot (staged; used in G3+)
  const scavShot0 = useImage(EnemySprites.scav.shot[0]);
  void scavShot0;

  // Scav die: 4 frames
  const scavDie0 = useImage(EnemySprites.scav.die[0]);
  const scavDie1 = useImage(EnemySprites.scav.die[1]);
  const scavDie2 = useImage(EnemySprites.scav.die[2]);
  const scavDie3 = useImage(EnemySprites.scav.die[3]);
  const scavDieImages = [scavDie0, scavDie1, scavDie2, scavDie3];

  // Raider fire: 5 frames (SF_01–05) — used as walk animation
  const raiderFire0 = useImage(EnemySprites.raider.fire[0]);
  const raiderFire1 = useImage(EnemySprites.raider.fire[1]);
  const raiderFire2 = useImage(EnemySprites.raider.fire[2]);
  const raiderFire3 = useImage(EnemySprites.raider.fire[3]);
  const raiderFire4 = useImage(EnemySprites.raider.fire[4]);
  const raiderFireImages = [raiderFire0, raiderFire1, raiderFire2, raiderFire3, raiderFire4];

  // Raider die: 4 frames
  const raiderDie0 = useImage(EnemySprites.raider.die[0]);
  const raiderDie1 = useImage(EnemySprites.raider.die[1]);
  const raiderDie2 = useImage(EnemySprites.raider.die[2]);
  const raiderDie3 = useImage(EnemySprites.raider.die[3]);
  const raiderDieImages = [raiderDie0, raiderDie1, raiderDie2, raiderDie3];

  // ─── Terrain tilesheet images (loaded once at mount) ─────────────────────
  // Each is a 320×320 sprite sheet of 25 tile variants (5×5 grid of 64×64px).
  // Atlas clipping isolates individual tiles via source rect in the sprites array.
  const dirtTileImage  = useImage(TileSprites.dirt);
  const sandTileImage  = useImage(TileSprites.sand);
  const grassTileImage = useImage(TileSprites.grass);
  // All 3 must be non-null before any Atlas renders — a single null image
  // crashes Skia's JSI layer on first render before the loaded images arrive.
  const tilesReady = !!(dirtTileImage && sandTileImage && grassTileImage);

  // ─── Pickup sprite image ──────────────────────────────────────────────────
  const moneySmallImage = useImage(PickupSprites.money.small);
  const crateImage = useImage(PickupSprites.crate);

  // ─── Effect sprite images (loaded once at mount, all unconditional) ───────
  // Explode: 4 frames (Explode/1–4.png) — frag detonation (non-looping) AND
  //   molotov zone static visual (frame 3, index 2: peak-bloom, reads as fire patch).
  // Flame: 7 frames (Flamethrower/1–7.png) — staged for future use (Phase 6 polish).
  const explode0 = useImage(EffectSprites.explode[0]);
  const explode1 = useImage(EffectSprites.explode[1]);
  const explode2 = useImage(EffectSprites.explode[2]);
  const explode3 = useImage(EffectSprites.explode[3]);
  const explodeImages = [explode0, explode1, explode2, explode3];

  const flame0 = useImage(EffectSprites.flame[0]);
  const flame1 = useImage(EffectSprites.flame[1]);
  const flame2 = useImage(EffectSprites.flame[2]);
  const flame3 = useImage(EffectSprites.flame[3]);
  const flame4 = useImage(EffectSprites.flame[4]);
  const flame5 = useImage(EffectSprites.flame[5]);
  const flame6 = useImage(EffectSprites.flame[6]);
  const flameImages = [flame0, flame1, flame2, flame3, flame4, flame5, flame6];

  // Smoke: 7 frames (LightSmoke/1–7.png) — dissipation animation, looping over smoke zone lifetime.
  const smoke0 = useImage(EffectSprites.smoke[0]);
  const smoke1 = useImage(EffectSprites.smoke[1]);
  const smoke2 = useImage(EffectSprites.smoke[2]);
  const smoke3 = useImage(EffectSprites.smoke[3]);
  const smoke4 = useImage(EffectSprites.smoke[4]);
  const smoke5 = useImage(EffectSprites.smoke[5]);
  const smoke6 = useImage(EffectSprites.smoke[6]);
  const smokeImages = [smoke0, smoke1, smoke2, smoke3, smoke4, smoke5, smoke6];

  // Rocket: 2-frame body animation (effects/rocket/1–2.png).
  const rocket0 = useImage(EffectSprites.rocket[0]);
  const rocket1 = useImage(EffectSprites.rocket[1]);
  const rocketImages = [rocket0, rocket1];

  // ─── Map data (generated once per mount; reused on redeploy in Phase 5) ──────
  // Phase 7 will generate a fresh map on each run restart via the menu flow.
  const [initialMapData] = useState(() => loadMap(Date.now()));

  // ─── Game state ────────────────────────────────────────────────────────────
  const gameState = useSharedValue(createInitialGameState(width, height));

  // ─── Tile viewport culling state ──────────────────────────────────────────────
  // Tracks which tile the player is currently on. The 100ms timer updates these
  // whenever the player crosses a tile boundary; useMemo rebuilds Atlas arrays only
  // for the ~9×15 tile window visible at the current zoom level (~135 tiles/type max).
  const [playerTileCol, setPlayerTileCol] = useState(() => Math.floor(TILE_COLS / 2));
  const [playerTileRow, setPlayerTileRow] = useState(() => Math.floor(TILE_ROWS / 2));

  // ─── Tile Atlas (viewport-culled, rebuilt when player crosses a tile boundary) ─
  // Visible tile range = player tile ± halfCols/halfRows (+1 buffer for edge pop).
  // RSXforms are world-space; camera Group handles all scrolling.
  const { dirtSprites, sandSprites, grassSprites,
          dirtTransforms, sandTransforms, grassTransforms } = useMemo(() => {
    const halfCols = Math.ceil(width / 2 / CAMERA_ZOOM / TILE_SIZE) + 1;
    const halfRows = Math.ceil(height / 2 / CAMERA_ZOOM / TILE_SIZE) + 1;
    const colMin = Math.max(0, playerTileCol - halfCols);
    const colMax = Math.min(TILE_COLS - 1, playerTileCol + halfCols);
    const rowMin = Math.max(0, playerTileRow - halfRows);
    const rowMax = Math.min(TILE_ROWS - 1, playerTileRow + halfRows);

    const dirtSrc:   { x: number; y: number; width: number; height: number }[] = [];
    const sandSrc:   { x: number; y: number; width: number; height: number }[] = [];
    const grassSrc:  { x: number; y: number; width: number; height: number }[] = [];
    const dirtXform: ReturnType<typeof Skia.RSXform>[] = [];
    const sandXform: ReturnType<typeof Skia.RSXform>[] = [];
    const grassXform: ReturnType<typeof Skia.RSXform>[] = [];

    for (let row = rowMin; row <= rowMax; row++) {
      for (let col = colMin; col <= colMax; col++) {
        const cell = initialMapData.tileGrid[row]![col]!;
        const srcX = (cell.variantIndex % 5) * TILE_SIZE;
        const srcY = Math.floor(cell.variantIndex / 5) * TILE_SIZE;
        const src  = { x: srcX, y: srcY, width: TILE_SIZE, height: TILE_SIZE };
        const xform = Skia.RSXform(1, 0, col * TILE_SIZE, row * TILE_SIZE);
        switch (cell.type) {
          case 'dirt':  dirtSrc.push(src);  dirtXform.push(xform);  break;
          case 'sand':  sandSrc.push(src);  sandXform.push(xform);  break;
          case 'grass': grassSrc.push(src); grassXform.push(xform); break;
        }
      }
    }
    return {
      dirtSprites:    dirtSrc,   sandSprites:    sandSrc,   grassSprites:    grassSrc,
      dirtTransforms: dirtXform, sandTransforms: sandXform, grassTransforms: grassXform,
    };
  }, [initialMapData, playerTileCol, playerTileRow, width, height]);

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
  const [displayKillCount, setDisplayKillCount] = useState(0);

  const updateDebugDisplay = useCallback(
    (fps: number, elapsedSec: number, frames: number, enemyCount: number, killCount: number) => {
      setDisplayFps(fps);
      setDisplayElapsed(elapsedSec);
      setDisplayFrameCount(frames);
      setDisplayEnemyCount(enemyCount);
      setDisplayKillCount(killCount);
    },
    [],
  );

  // ─── Hero sprite state (React, updated by the 100ms timer alongside enemy slots)
  const [spriteState, setSpriteState] = useState<{
    isMoving: boolean;
    frame: number;
    weaponPose: HeroWeaponPose;
  }>({ isMoving: false, frame: 0, weaponPose: 'pistol' });

  // ─── Pickup slot active flags (React, updated by timer) ─────────────────────
  // Only active slots render a <Group> in JSX — same conditional pattern as
  // enemies. Prevents all 50 always-subscribed Skia Groups from triggering
  // per-frame transform updates when inactive slots return a new [-9999,-9999]
  // array reference each tick.
  const [pickupSlotActive, setPickupSlotActive] = useState<boolean[]>(
    () => Array.from({ length: PICKUP_SLOT_COUNT }, () => false),
  );

  // ─── Enemy slot state (sprite selection, updated by timer) ──────────────────
  // Slot i = enemies[i]. type, status, and frame index are bridged to React;
  // positions/rotations live entirely on the UI thread (per-slot useDerivedValue).
  const [enemySlotTypes, setEnemySlotTypes] = useState<Array<EnemyType | null>>(
    () => Array.from({ length: ENEMY_SOFT_CAP }, () => null as EnemyType | null),
  );
  const [enemySlotStatuses, setEnemySlotStatuses] = useState<Array<'alive' | 'dying' | null>>(
    () => Array.from({ length: ENEMY_SOFT_CAP }, () => null as 'alive' | 'dying' | null),
  );
  const [enemySlotFrames, setEnemySlotFrames] = useState<number[]>(
    () => Array.from({ length: ENEMY_SOFT_CAP }, () => 0),
  );

  // ─── Player vitals + death flag + level (React, updated by 100ms timer) ──
  const [displayHp, setDisplayHp] = useState(100);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayXp, setDisplayXp] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [displayIsDead, setDisplayIsDead] = useState(false);
  const [displayBackpackStacks, setDisplayBackpackStacks] = useState(0);
  const [displayAdRevivesUsed, setDisplayAdRevivesUsed] = useState(0);

  // ─── Level-up modal display state (React, updated by 100ms timer) ─────────
  const [displayPendingLevelUp, setDisplayPendingLevelUp] = useState(false);
  const [displayChoices, setDisplayChoices] = useState<SkillId[]>([]);
  const [displayPlayerSkillStacks, setDisplayPlayerSkillStacks] = useState<Record<string, number>>({});

  // ─── Crate reveal modal display state (React, updated by 100ms timer) ─────
  const [displayCrateReveal, setDisplayCrateReveal] = useState(false);
  const [displayCrateWeaponId, setDisplayCrateWeaponId] = useState<string | null>(null);
  const [displayCrateTier, setDisplayCrateTier] = useState<CrateTier | null>(null);

  // Fixed-rate timer — reads gameState.value directly on the JS thread every
  // 100ms. Completely decoupled from useFrameCallback; zero runOnJS calls
  // for sprite selection. Hero + enemy sprite state + player vitals computed together.
  useEffect(() => {
    const id = setInterval(() => {
      const state = gameState.value;

      // Hero sprite state.
      const { player } = state;
      const heroWalkFrame = player.isMoving
        ? getCurrentFrame(
            { frameCount: WALK_FRAME_COUNT, frameDurationMs: WALK_FRAME_DURATION_MS, loop: true },
            state.elapsedMs - player.walkStartedAtMs,
          )
        : 0;
      setSpriteState({ isMoving: player.isMoving, frame: heroWalkFrame, weaponPose: player.weaponPose });

      // Player vitals, level, and death flag.
      setDisplayHp(Math.ceil(player.hp));
      setDisplayScore(Math.floor(player.score));
      setDisplayXp(Math.floor(player.xp));
      setDisplayLevel(player.level);
      setDisplayIsDead(state.isDead);
      setDisplayBackpackStacks(state.player.skillStacks['gear_backpack'] ?? 0);
      setDisplayAdRevivesUsed(state.adRevivesUsed);

      // Level-up modal: draw choices on JS thread when pendingLevelUp is first
      // detected and currentLevelUpChoices is still empty (safe to mutate
      // gameState.value here — engine is frozen during pendingLevelUp).
      if (state.pendingLevelUp && state.currentLevelUpChoices.length === 0) {
        // Build candidate list: skills not yet at max stacks.
        const candidates: SkillId[] = [];
        for (let ci = 0; ci < SKILL_IDS.length; ci++) {
          const sid = SKILL_IDS[ci];
          const stacks = player.skillStacks[sid] ?? 0;
          if (stacks < SKILLS[sid].maxStacks) {
            candidates.push(sid);
          }
        }
        // Fisher-Yates shuffle then take first 3.
        for (let ci = candidates.length - 1; ci > 0; ci--) {
          const j = Math.floor(Math.random() * (ci + 1));
          const tmp = candidates[ci];
          candidates[ci] = candidates[j]!;
          candidates[j] = tmp!;
        }
        const choices = candidates.slice(0, 3) as SkillId[];
        gameState.value = { ...state, currentLevelUpChoices: choices };
        setDisplayChoices(choices);
      } else {
        setDisplayChoices(state.currentLevelUpChoices as SkillId[]);
      }
      setDisplayPendingLevelUp(state.pendingLevelUp);
      setDisplayPlayerSkillStacks({ ...player.skillStacks });

      // Enemy slot sprite state.
      const types = Array.from({ length: ENEMY_SOFT_CAP }, () => null as EnemyType | null);
      const statuses = Array.from({ length: ENEMY_SOFT_CAP }, () => null as 'alive' | 'dying' | null);
      const frames = Array.from({ length: ENEMY_SOFT_CAP }, () => 0);

      for (let i = 0; i < state.enemies.length; i++) {
        const enemy = state.enemies[i];
        if (!enemy) continue; // null slot — types[i] stays null (already initialized)
        types[i] = enemy.type;
        statuses[i] = enemy.status;

        if (enemy.status === 'dying') {
          // Die animation: 4 frames, non-looping, holds on last frame.
          frames[i] = getCurrentFrame(
            { frameCount: ENEMY_DIE_FRAME_COUNT, frameDurationMs: ENEMY_DIE_FRAME_DURATION_MS, loop: false },
            state.elapsedMs - enemy.dyingStartedAtMs,
          );
        } else {
          // Walk animation: looping, offset by walkStartedAtMs so each enemy cycles independently.
          const isScav = enemy.type === 'scav';
          frames[i] = getCurrentFrame(
            {
              frameCount: isScav ? SCAV_WALK_FRAME_COUNT : RAIDER_WALK_FRAME_COUNT,
              frameDurationMs: isScav ? SCAV_WALK_FRAME_DURATION_MS : RAIDER_WALK_FRAME_DURATION_MS,
              loop: true,
            },
            state.elapsedMs - enemy.walkStartedAtMs,
          );
        }
      }

      setEnemySlotTypes(types);
      setEnemySlotStatuses(statuses);
      setEnemySlotFrames(frames);

      // Pickup slot active flags.
      const pickupActive = Array.from({ length: PICKUP_SLOT_COUNT }, (_, i) => !!state.pickups[i]);
      setPickupSlotActive(pickupActive);

      // Throwable slot state.
      const tSlots = Array.from({ length: THROWABLE_SLOT_COUNT }, () => ({
        type: null as 'frag' | 'smoke' | 'molotov' | null,
        status: null as 'flying' | 'detonating' | null,
        frame: 0,
        targetX: 0,
        targetY: 0,
      }));
      for (let i = 0; i < state.throwables.length; i++) {
        const t = state.throwables[i];
        if (!t) continue;
        let frame = 0;
        if (t.status === 'detonating') {
          frame = getCurrentFrame(
            { frameCount: FRAG_EXPLODE_FRAME_COUNT, frameDurationMs: FRAG_EXPLODE_FRAME_DURATION_MS, loop: false },
            state.elapsedMs - t.detonationStartedAtMs,
          );
        }
        tSlots[i] = { type: t.type, status: t.status, frame, targetX: t.targetX, targetY: t.targetY };
      }
      setThrowableSlotData(tSlots);

      // Effect zone slot state.
      const zSlots = Array.from({ length: EFFECT_ZONE_SLOT_COUNT }, () => ({
        type: null as 'smoke' | 'molotov' | 'flame' | 'explosion' | null,
        x: 0,
        y: 0,
        frame: 0,
        rotation: 0,
      }));
      for (let i = 0; i < state.effectZones.length; i++) {
        const z = state.effectZones[i];
        if (!z) continue;
        let zFrame = 0;
        if (z.type === 'smoke') {
          const elapsed = state.elapsedMs - z.spawnedAtMs;
          const LAST = SMOKE_ANIM_FRAME_COUNT - 1; // 6 = smallest wisp; 0 = full cloud
          if (elapsed < SMOKE_BLOOM_DURATION_MS) {
            // Bloom: 6 → 0 (wisp → full cloud)
            zFrame = LAST - Math.floor((elapsed / SMOKE_BLOOM_DURATION_MS) * SMOKE_ANIM_FRAME_COUNT);
          } else if (elapsed < SMOKE_DURATION_MS - SMOKE_DISSIPATE_DURATION_MS) {
            // Hold: full cloud
            zFrame = 0;
          } else {
            // Dissipate: 0 → 6 (full cloud → gone)
            const dissElapsed = elapsed - (SMOKE_DURATION_MS - SMOKE_DISSIPATE_DURATION_MS);
            zFrame = Math.floor((dissElapsed / SMOKE_DISSIPATE_DURATION_MS) * SMOKE_ANIM_FRAME_COUNT);
          }
          zFrame = Math.max(0, Math.min(LAST, zFrame));
        } else if (z.type === 'flame') {
          zFrame = getCurrentFrame(
            { frameCount: MOLOTOV_FIRE_FRAME_COUNT, frameDurationMs: MOLOTOV_FIRE_FRAME_DURATION_MS, loop: true },
            state.elapsedMs - z.spawnedAtMs,
          );
        } else if (z.type === 'explosion') {
          zFrame = getCurrentFrame(
            { frameCount: FRAG_EXPLODE_FRAME_COUNT, frameDurationMs: FRAG_EXPLODE_FRAME_DURATION_MS, loop: false },
            state.elapsedMs - z.spawnedAtMs,
          );
        }
        // Molotov zone uses a static explode frame — no frame cycling needed (zFrame stays 0).
        zSlots[i] = { type: z.type, x: z.x, y: z.y, frame: zFrame, rotation: z.rotation };
      }
      setZoneSlotData(zSlots);

      // Projectile rocket flags + animation frame.
      const rockets = Array.from({ length: PROJECTILE_SLOT_COUNT }, (_, i) => {
        const p = state.projectiles[i];
        return !!(p && p.isRocket);
      });
      setProjIsRocket(rockets);
      setRocketFrame(Math.floor(state.elapsedMs / ROCKET_FRAME_DURATION_MS) % ROCKET_FRAME_COUNT);

      // Crate reveal modal bridge.
      setDisplayCrateReveal(state.pendingCrateReveal);
      setDisplayCrateWeaponId(state.crateRevealWeaponId);
      setDisplayCrateTier(state.crateRevealTier);

      // Tile viewport culling: update player tile position so useMemo rebuilds
      // Atlas arrays for the visible window when the player crosses a tile boundary.
      setPlayerTileCol(Math.floor(state.player.x / TILE_SIZE));
      setPlayerTileRow(Math.floor(state.player.y / TILE_SIZE));
    }, 100);
    return () => clearInterval(id);
  }, [gameState]);

  // ─── Per-slot enemy transforms (UI thread, no runOnJS) ────────────────────
  // One useDerivedValue per slot. Only slots with an active enemy are rendered
  // in JSX, so only those create Skia animated-prop subscriptions.
  const eTransform0  = useEnemySlotTransform(gameState, 0,  width, height);
  const eTransform1  = useEnemySlotTransform(gameState, 1,  width, height);
  const eTransform2  = useEnemySlotTransform(gameState, 2,  width, height);
  const eTransform3  = useEnemySlotTransform(gameState, 3,  width, height);
  const eTransform4  = useEnemySlotTransform(gameState, 4,  width, height);
  const eTransform5  = useEnemySlotTransform(gameState, 5,  width, height);
  const eTransform6  = useEnemySlotTransform(gameState, 6,  width, height);
  const eTransform7  = useEnemySlotTransform(gameState, 7,  width, height);
  const eTransform8  = useEnemySlotTransform(gameState, 8,  width, height);
  const eTransform9  = useEnemySlotTransform(gameState, 9,  width, height);
  const eTransform10 = useEnemySlotTransform(gameState, 10, width, height);
  const eTransform11 = useEnemySlotTransform(gameState, 11, width, height);
  const eTransform12 = useEnemySlotTransform(gameState, 12, width, height);
  const eTransform13 = useEnemySlotTransform(gameState, 13, width, height);
  const eTransform14 = useEnemySlotTransform(gameState, 14, width, height);
  const eTransform15 = useEnemySlotTransform(gameState, 15, width, height);
  const eTransform16 = useEnemySlotTransform(gameState, 16, width, height);
  const eTransform17 = useEnemySlotTransform(gameState, 17, width, height);
  const eTransform18 = useEnemySlotTransform(gameState, 18, width, height);
  const eTransform19 = useEnemySlotTransform(gameState, 19, width, height);
  const eTransform20 = useEnemySlotTransform(gameState, 20, width, height);
  const eTransform21 = useEnemySlotTransform(gameState, 21, width, height);
  const eTransform22 = useEnemySlotTransform(gameState, 22, width, height);
  const eTransform23 = useEnemySlotTransform(gameState, 23, width, height);
  const eTransform24 = useEnemySlotTransform(gameState, 24, width, height);
  const eTransform25 = useEnemySlotTransform(gameState, 25, width, height);
  const eTransform26 = useEnemySlotTransform(gameState, 26, width, height);
  const eTransform27 = useEnemySlotTransform(gameState, 27, width, height);
  const eTransform28 = useEnemySlotTransform(gameState, 28, width, height);
  const eTransform29 = useEnemySlotTransform(gameState, 29, width, height);
  const eTransform30 = useEnemySlotTransform(gameState, 30, width, height);
  const eTransform31 = useEnemySlotTransform(gameState, 31, width, height);
  const eTransform32 = useEnemySlotTransform(gameState, 32, width, height);
  const eTransform33 = useEnemySlotTransform(gameState, 33, width, height);
  const eTransform34 = useEnemySlotTransform(gameState, 34, width, height);
  const eTransform35 = useEnemySlotTransform(gameState, 35, width, height);
  const eTransform36 = useEnemySlotTransform(gameState, 36, width, height);
  const eTransform37 = useEnemySlotTransform(gameState, 37, width, height);
  const eTransform38 = useEnemySlotTransform(gameState, 38, width, height);
  const eTransform39 = useEnemySlotTransform(gameState, 39, width, height);
  const eTransform40 = useEnemySlotTransform(gameState, 40, width, height);
  const eTransform41 = useEnemySlotTransform(gameState, 41, width, height);
  const eTransform42 = useEnemySlotTransform(gameState, 42, width, height);
  const eTransform43 = useEnemySlotTransform(gameState, 43, width, height);
  const eTransform44 = useEnemySlotTransform(gameState, 44, width, height);
  const eTransform45 = useEnemySlotTransform(gameState, 45, width, height);
  const eTransform46 = useEnemySlotTransform(gameState, 46, width, height);
  const eTransform47 = useEnemySlotTransform(gameState, 47, width, height);
  const eTransform48 = useEnemySlotTransform(gameState, 48, width, height);
  const eTransform49 = useEnemySlotTransform(gameState, 49, width, height);
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

  // ─── Per-slot hit-flash opacities (UI thread, no runOnJS) ────────────────
  // One useDerivedValue per enemy slot. Returns 0.65 while hitFlashUntilMs is
  // in the future, 0 otherwise. Drives a white Rect overlay in each enemy Group.
  const eFlash0  = useEnemySlotFlash(gameState, 0);
  const eFlash1  = useEnemySlotFlash(gameState, 1);
  const eFlash2  = useEnemySlotFlash(gameState, 2);
  const eFlash3  = useEnemySlotFlash(gameState, 3);
  const eFlash4  = useEnemySlotFlash(gameState, 4);
  const eFlash5  = useEnemySlotFlash(gameState, 5);
  const eFlash6  = useEnemySlotFlash(gameState, 6);
  const eFlash7  = useEnemySlotFlash(gameState, 7);
  const eFlash8  = useEnemySlotFlash(gameState, 8);
  const eFlash9  = useEnemySlotFlash(gameState, 9);
  const eFlash10 = useEnemySlotFlash(gameState, 10);
  const eFlash11 = useEnemySlotFlash(gameState, 11);
  const eFlash12 = useEnemySlotFlash(gameState, 12);
  const eFlash13 = useEnemySlotFlash(gameState, 13);
  const eFlash14 = useEnemySlotFlash(gameState, 14);
  const eFlash15 = useEnemySlotFlash(gameState, 15);
  const eFlash16 = useEnemySlotFlash(gameState, 16);
  const eFlash17 = useEnemySlotFlash(gameState, 17);
  const eFlash18 = useEnemySlotFlash(gameState, 18);
  const eFlash19 = useEnemySlotFlash(gameState, 19);
  const eFlash20 = useEnemySlotFlash(gameState, 20);
  const eFlash21 = useEnemySlotFlash(gameState, 21);
  const eFlash22 = useEnemySlotFlash(gameState, 22);
  const eFlash23 = useEnemySlotFlash(gameState, 23);
  const eFlash24 = useEnemySlotFlash(gameState, 24);
  const eFlash25 = useEnemySlotFlash(gameState, 25);
  const eFlash26 = useEnemySlotFlash(gameState, 26);
  const eFlash27 = useEnemySlotFlash(gameState, 27);
  const eFlash28 = useEnemySlotFlash(gameState, 28);
  const eFlash29 = useEnemySlotFlash(gameState, 29);
  const eFlash30 = useEnemySlotFlash(gameState, 30);
  const eFlash31 = useEnemySlotFlash(gameState, 31);
  const eFlash32 = useEnemySlotFlash(gameState, 32);
  const eFlash33 = useEnemySlotFlash(gameState, 33);
  const eFlash34 = useEnemySlotFlash(gameState, 34);
  const eFlash35 = useEnemySlotFlash(gameState, 35);
  const eFlash36 = useEnemySlotFlash(gameState, 36);
  const eFlash37 = useEnemySlotFlash(gameState, 37);
  const eFlash38 = useEnemySlotFlash(gameState, 38);
  const eFlash39 = useEnemySlotFlash(gameState, 39);
  const eFlash40 = useEnemySlotFlash(gameState, 40);
  const eFlash41 = useEnemySlotFlash(gameState, 41);
  const eFlash42 = useEnemySlotFlash(gameState, 42);
  const eFlash43 = useEnemySlotFlash(gameState, 43);
  const eFlash44 = useEnemySlotFlash(gameState, 44);
  const eFlash45 = useEnemySlotFlash(gameState, 45);
  const eFlash46 = useEnemySlotFlash(gameState, 46);
  const eFlash47 = useEnemySlotFlash(gameState, 47);
  const eFlash48 = useEnemySlotFlash(gameState, 48);
  const eFlash49 = useEnemySlotFlash(gameState, 49);
  const allSlotFlashOpacities = [
    eFlash0,  eFlash1,  eFlash2,  eFlash3,  eFlash4,
    eFlash5,  eFlash6,  eFlash7,  eFlash8,  eFlash9,
    eFlash10, eFlash11, eFlash12, eFlash13, eFlash14,
    eFlash15, eFlash16, eFlash17, eFlash18, eFlash19,
    eFlash20, eFlash21, eFlash22, eFlash23, eFlash24,
    eFlash25, eFlash26, eFlash27, eFlash28, eFlash29,
    eFlash30, eFlash31, eFlash32, eFlash33, eFlash34,
    eFlash35, eFlash36, eFlash37, eFlash38, eFlash39,
    eFlash40, eFlash41, eFlash42, eFlash43, eFlash44,
    eFlash45, eFlash46, eFlash47, eFlash48, eFlash49,
  ];

  // ─── Per-slot projectile transforms (UI thread, no runOnJS) ──────────────
  // 30 pre-allocated slots. Always rendered — inactive slots go to (-9999, -9999)
  // so their circles are off-screen. No React state needed for slot activity;
  // position updates happen every frame via derived value.
  const pTransform0  = useProjectileSlotTransform(gameState, 0,  width, height);
  const pTransform1  = useProjectileSlotTransform(gameState, 1,  width, height);
  const pTransform2  = useProjectileSlotTransform(gameState, 2,  width, height);
  const pTransform3  = useProjectileSlotTransform(gameState, 3,  width, height);
  const pTransform4  = useProjectileSlotTransform(gameState, 4,  width, height);
  const pTransform5  = useProjectileSlotTransform(gameState, 5,  width, height);
  const pTransform6  = useProjectileSlotTransform(gameState, 6,  width, height);
  const pTransform7  = useProjectileSlotTransform(gameState, 7,  width, height);
  const pTransform8  = useProjectileSlotTransform(gameState, 8,  width, height);
  const pTransform9  = useProjectileSlotTransform(gameState, 9,  width, height);
  const pTransform10 = useProjectileSlotTransform(gameState, 10, width, height);
  const pTransform11 = useProjectileSlotTransform(gameState, 11, width, height);
  const pTransform12 = useProjectileSlotTransform(gameState, 12, width, height);
  const pTransform13 = useProjectileSlotTransform(gameState, 13, width, height);
  const pTransform14 = useProjectileSlotTransform(gameState, 14, width, height);
  const pTransform15 = useProjectileSlotTransform(gameState, 15, width, height);
  const pTransform16 = useProjectileSlotTransform(gameState, 16, width, height);
  const pTransform17 = useProjectileSlotTransform(gameState, 17, width, height);
  const pTransform18 = useProjectileSlotTransform(gameState, 18, width, height);
  const pTransform19 = useProjectileSlotTransform(gameState, 19, width, height);
  const pTransform20 = useProjectileSlotTransform(gameState, 20, width, height);
  const pTransform21 = useProjectileSlotTransform(gameState, 21, width, height);
  const pTransform22 = useProjectileSlotTransform(gameState, 22, width, height);
  const pTransform23 = useProjectileSlotTransform(gameState, 23, width, height);
  const pTransform24 = useProjectileSlotTransform(gameState, 24, width, height);
  const pTransform25 = useProjectileSlotTransform(gameState, 25, width, height);
  const pTransform26 = useProjectileSlotTransform(gameState, 26, width, height);
  const pTransform27 = useProjectileSlotTransform(gameState, 27, width, height);
  const pTransform28 = useProjectileSlotTransform(gameState, 28, width, height);
  const pTransform29 = useProjectileSlotTransform(gameState, 29, width, height);
  const allProjectileTransforms = [
    pTransform0,  pTransform1,  pTransform2,  pTransform3,  pTransform4,
    pTransform5,  pTransform6,  pTransform7,  pTransform8,  pTransform9,
    pTransform10, pTransform11, pTransform12, pTransform13, pTransform14,
    pTransform15, pTransform16, pTransform17, pTransform18, pTransform19,
    pTransform20, pTransform21, pTransform22, pTransform23, pTransform24,
    pTransform25, pTransform26, pTransform27, pTransform28, pTransform29,
  ];

  // ─── Per-slot pickup transforms (UI thread, no runOnJS) ───────────────────
  // 50 pre-allocated slots. Same always-render pattern as projectiles:
  // inactive slots sit at (-9999, -9999). No React state needed — the image
  // is always Money_Small so no per-slot image selection required.
  const pkTransform0  = usePickupSlotTransform(gameState, 0,  width, height);
  const pkTransform1  = usePickupSlotTransform(gameState, 1,  width, height);
  const pkTransform2  = usePickupSlotTransform(gameState, 2,  width, height);
  const pkTransform3  = usePickupSlotTransform(gameState, 3,  width, height);
  const pkTransform4  = usePickupSlotTransform(gameState, 4,  width, height);
  const pkTransform5  = usePickupSlotTransform(gameState, 5,  width, height);
  const pkTransform6  = usePickupSlotTransform(gameState, 6,  width, height);
  const pkTransform7  = usePickupSlotTransform(gameState, 7,  width, height);
  const pkTransform8  = usePickupSlotTransform(gameState, 8,  width, height);
  const pkTransform9  = usePickupSlotTransform(gameState, 9,  width, height);
  const pkTransform10 = usePickupSlotTransform(gameState, 10, width, height);
  const pkTransform11 = usePickupSlotTransform(gameState, 11, width, height);
  const pkTransform12 = usePickupSlotTransform(gameState, 12, width, height);
  const pkTransform13 = usePickupSlotTransform(gameState, 13, width, height);
  const pkTransform14 = usePickupSlotTransform(gameState, 14, width, height);
  const pkTransform15 = usePickupSlotTransform(gameState, 15, width, height);
  const pkTransform16 = usePickupSlotTransform(gameState, 16, width, height);
  const pkTransform17 = usePickupSlotTransform(gameState, 17, width, height);
  const pkTransform18 = usePickupSlotTransform(gameState, 18, width, height);
  const pkTransform19 = usePickupSlotTransform(gameState, 19, width, height);
  const pkTransform20 = usePickupSlotTransform(gameState, 20, width, height);
  const pkTransform21 = usePickupSlotTransform(gameState, 21, width, height);
  const pkTransform22 = usePickupSlotTransform(gameState, 22, width, height);
  const pkTransform23 = usePickupSlotTransform(gameState, 23, width, height);
  const pkTransform24 = usePickupSlotTransform(gameState, 24, width, height);
  const pkTransform25 = usePickupSlotTransform(gameState, 25, width, height);
  const pkTransform26 = usePickupSlotTransform(gameState, 26, width, height);
  const pkTransform27 = usePickupSlotTransform(gameState, 27, width, height);
  const pkTransform28 = usePickupSlotTransform(gameState, 28, width, height);
  const pkTransform29 = usePickupSlotTransform(gameState, 29, width, height);
  const pkTransform30 = usePickupSlotTransform(gameState, 30, width, height);
  const pkTransform31 = usePickupSlotTransform(gameState, 31, width, height);
  const pkTransform32 = usePickupSlotTransform(gameState, 32, width, height);
  const pkTransform33 = usePickupSlotTransform(gameState, 33, width, height);
  const pkTransform34 = usePickupSlotTransform(gameState, 34, width, height);
  const pkTransform35 = usePickupSlotTransform(gameState, 35, width, height);
  const pkTransform36 = usePickupSlotTransform(gameState, 36, width, height);
  const pkTransform37 = usePickupSlotTransform(gameState, 37, width, height);
  const pkTransform38 = usePickupSlotTransform(gameState, 38, width, height);
  const pkTransform39 = usePickupSlotTransform(gameState, 39, width, height);
  const pkTransform40 = usePickupSlotTransform(gameState, 40, width, height);
  const pkTransform41 = usePickupSlotTransform(gameState, 41, width, height);
  const pkTransform42 = usePickupSlotTransform(gameState, 42, width, height);
  const pkTransform43 = usePickupSlotTransform(gameState, 43, width, height);
  const pkTransform44 = usePickupSlotTransform(gameState, 44, width, height);
  const pkTransform45 = usePickupSlotTransform(gameState, 45, width, height);
  const pkTransform46 = usePickupSlotTransform(gameState, 46, width, height);
  const pkTransform47 = usePickupSlotTransform(gameState, 47, width, height);
  const pkTransform48 = usePickupSlotTransform(gameState, 48, width, height);
  const pkTransform49 = usePickupSlotTransform(gameState, 49, width, height);
  const allPickupTransforms = [
    pkTransform0,  pkTransform1,  pkTransform2,  pkTransform3,  pkTransform4,
    pkTransform5,  pkTransform6,  pkTransform7,  pkTransform8,  pkTransform9,
    pkTransform10, pkTransform11, pkTransform12, pkTransform13, pkTransform14,
    pkTransform15, pkTransform16, pkTransform17, pkTransform18, pkTransform19,
    pkTransform20, pkTransform21, pkTransform22, pkTransform23, pkTransform24,
    pkTransform25, pkTransform26, pkTransform27, pkTransform28, pkTransform29,
    pkTransform30, pkTransform31, pkTransform32, pkTransform33, pkTransform34,
    pkTransform35, pkTransform36, pkTransform37, pkTransform38, pkTransform39,
    pkTransform40, pkTransform41, pkTransform42, pkTransform43, pkTransform44,
    pkTransform45, pkTransform46, pkTransform47, pkTransform48, pkTransform49,
  ];

  // ─── Per-slot crate transforms (UI thread, no runOnJS) ───────────────────
  // 3 pre-allocated slots — matches CRATE_SLOT_COUNT / CRATE_MAX_ACTIVE exactly.
  const crTransform0 = useCrateSlotTransform(gameState, 0, width, height);
  const crTransform1 = useCrateSlotTransform(gameState, 1, width, height);
  const crTransform2 = useCrateSlotTransform(gameState, 2, width, height);
  const allCrateTransforms = [crTransform0, crTransform1, crTransform2];

  // ─── Throwable slot arc positions (UI thread, no runOnJS) ────────────────
  // 10 pre-allocated slots. Flying slots interpolate the arc each frame.
  // Detonating/null slots return {x:-9999,y:-9999} — rendered off-screen.
  const tTransform0 = useThrowableSlotTransform(gameState, 0, width, height);
  const tTransform1 = useThrowableSlotTransform(gameState, 1, width, height);
  const tTransform2 = useThrowableSlotTransform(gameState, 2, width, height);
  const tTransform3 = useThrowableSlotTransform(gameState, 3, width, height);
  const tTransform4 = useThrowableSlotTransform(gameState, 4, width, height);
  const tTransform5 = useThrowableSlotTransform(gameState, 5, width, height);
  const tTransform6 = useThrowableSlotTransform(gameState, 6, width, height);
  const tTransform7 = useThrowableSlotTransform(gameState, 7, width, height);
  const tTransform8 = useThrowableSlotTransform(gameState, 8, width, height);
  const tTransform9 = useThrowableSlotTransform(gameState, 9, width, height);
  const allThrowableTransforms = [tTransform0, tTransform1, tTransform2, tTransform3, tTransform4, tTransform5, tTransform6, tTransform7, tTransform8, tTransform9];

  // ─── Throwable slot React state (100ms timer bridge) ─────────────────────
  // type/status drive render mode (null = skip). frame drives explode sprite.
  // targetX/Y used for detonating frags (position doesn't change post-landing).
  const [throwableSlotData, setThrowableSlotData] = useState<Array<{
    type: 'frag' | 'smoke' | 'molotov' | null;
    status: 'flying' | 'detonating' | null;
    frame: number;
    targetX: number;
    targetY: number;
  }>>(() => Array.from({ length: THROWABLE_SLOT_COUNT }, () => ({
    type: null, status: null, frame: 0, targetX: 0, targetY: 0,
  })));

  // ─── Effect zone slot React state (100ms timer bridge) ───────────────────
  // type drives render mode (null = skip). x/y are static per zone lifetime.
  // frame drives flame/explosion animation cycling.
  const [zoneSlotData, setZoneSlotData] = useState<Array<{
    type: 'smoke' | 'molotov' | 'flame' | 'explosion' | null;
    x: number;
    y: number;
    frame: number;
    rotation: number;
  }>>(() => Array.from({ length: EFFECT_ZONE_SLOT_COUNT }, () => ({
    type: null, x: 0, y: 0, frame: 0, rotation: 0,
  })));

  // ─── Projectile rocket flags + animation frame (100ms timer bridge) ───────
  // projIsRocket[i] = true when projectiles[i] is a rocket — drives Image vs Circle JSX.
  // rocketFrame is shared across all rocket slots (rockets are short-lived; sync is fine).
  const [projIsRocket, setProjIsRocket] = useState<boolean[]>(
    () => Array.from({ length: PROJECTILE_SLOT_COUNT }, () => false),
  );
  const [rocketFrame, setRocketFrame] = useState(0);

  // ─── Debug weapon cycle button ─────────────────────────────────────────────
  // KNOWN BUG (tech debt): mutates weaponPose (animation) only — does NOT update
  // equippedWeaponId (combat stats). Cycling shows a different pose but fires with
  // the previously equipped weapon's stats. Phase 7 removes this button entirely.
  const cycleWeapon = useCallback(() => {
    const current = gameState.value.player.weaponPose;
    const idx = WEAPON_CYCLE.indexOf(current);
    const next = WEAPON_CYCLE[(idx + 1) % WEAPON_CYCLE.length];
    gameState.value = {
      ...gameState.value,
      player: { ...gameState.value.player, weaponPose: next },
    };
  }, [gameState]);

  // ─── Crate reveal handlers ─────────────────────────────────────────────────
  // Both mutate gameState.value on the JS thread during the pendingCrateReveal
  // freeze window — same pattern as handleSkillSelect / handleFreeRevive.

  const handleEquip = useCallback(() => {
    const state = gameState.value;
    if (!state.crateRevealWeaponId) return;
    const weapon = WEAPON_PROFILES[state.crateRevealWeaponId];
    if (!weapon) return;
    // TODO Phase 6: audioEngine.playSFX('weapon_equip')
    gameState.value = {
      ...state,
      player: {
        ...state.player,
        equippedWeaponId: state.crateRevealWeaponId,
        weaponPose: weapon.animationPose,
      },
      pendingCrateReveal: false,
      crateRevealWeaponId: null,
      crateRevealTier: null,
    };
  }, [gameState]);

  const handleScrap = useCallback(() => {
    const state = gameState.value;
    gameState.value = {
      ...state,
      player: {
        ...state.player,
        score: state.player.score + 50,
        xp: state.player.xp + 25,
      },
      pendingCrateReveal: false,
      crateRevealWeaponId: null,
      crateRevealTier: null,
    };
  }, [gameState]);

  // ─── Skill selection handler ───────────────────────────────────────────────
  // Mutates gameState.value directly on the JS thread — safe because the engine
  // is frozen (pendingLevelUp guard in updateGameState) during the modal window.
  // Follows the same pattern as cycleWeapon above.
  // Order: increment level → check weapon floor unlock → apply skill stack → close modal.
  const handleSkillSelect = useCallback((id: SkillId) => {
    const state = gameState.value;
    const newLevel = state.player.level + 1;
    const currentStacks = state.player.skillStacks[id] ?? 0;
    const newStacks = { ...state.player.skillStacks, [id]: currentStacks + 1 };
    const newCount = state.pendingLevelUpCount - 1;

    // Compute effective stats with the new stacks — used for both the optional
    // on-selection heal and the unconditional maxHp clamp below.
    const skillDef = SKILLS[id];
    const weapon = WEAPON_PROFILES[state.player.equippedWeaponId];
    const effective = getEffectiveStats(newStacks, weapon, state.player.maxHp);
    let newHp = state.player.hp;
    if (skillDef.onSelectEffect?.healHp) {
      newHp = Math.min(newHp + skillDef.onSelectEffect.healHp, effective.maxHp);
    }
    // Always clamp current HP to new effective max. Handles max HP reductions
    // (e.g. Stims: -10 max HP per stack) so HP drops immediately on selection
    // rather than staying above the new cap until the next hit.
    newHp = Math.min(newHp, effective.maxHp);

    gameState.value = {
      ...state,
      player: {
        ...state.player,
        skillStacks: newStacks,
        level: newLevel,
        hp: newHp,
      },
      pendingLevelUp: newCount > 0,
      pendingLevelUpCount: newCount,
      currentLevelUpChoices: [],
    };
  }, [gameState]);

  // ─── Revive handlers ──────────────────────────────────────────────────────
  // All mutate gameState.value on the JS thread during the isDead freeze.
  // Same pattern as handleSkillSelect.

  const handleFreeRevive = useCallback(() => {
    const state = gameState.value;
    const backpackStacks = state.player.skillStacks['gear_backpack'] ?? 0;
    if (backpackStacks <= 0) return; // defensive — button should be disabled if 0

    const weapon = WEAPON_PROFILES[state.player.equippedWeaponId];
    const effective = getEffectiveStats(state.player.skillStacks, weapon, state.player.maxHp);

    gameState.value = {
      ...state,
      isDead: false,
      player: {
        ...state.player,
        hp: effective.maxHp,
        x: state.canvasWidth / 2,
        y: state.canvasHeight / 2,
        invulnerableUntilMs: state.elapsedMs + INVULNERABLE_DURATION_MS,
        skillStacks: {
          ...state.player.skillStacks,
          gear_backpack: backpackStacks - 1,
        },
      },
    };
  }, [gameState]);

  // Phase 9 TODO: replace handler body with rewarded ad flow.
  // On ad completion: apply revive effects (hp = effective.maxHp, center respawn,
  // invulnerableUntilMs, isDead = false) and remove the early return.
  // For now: stub sets adRevivesUsed = 1 so button greys immediately. No revive effect.
  const handleAdRevive = useCallback(() => {
    const state = gameState.value;
    if (state.adRevivesUsed >= 1) return; // defensive
    gameState.value = { ...state, adRevivesUsed: state.adRevivesUsed + 1 };
  }, [gameState]);

  const handleRedeploy = useCallback(() => {
    // Reuses the same map data — Phase 7 will generate a fresh map per restart
    // via the proper menu flow.
    gameState.value = createInitialGameState(width, height);
  }, [gameState, width, height, initialMapData]);

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

  // ─── Camera transform (UI thread → Skia) ──────────────────────────────────
  // Centers the world on the player: translate so player maps to screen center,
  // then scale by zoom. All world entities live inside this Group.
  const cameraTransform = useDerivedValue(() => {
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    return [
      { translateX: width / 2 - px * CAMERA_ZOOM },
      { translateY: height / 2 - py * CAMERA_ZOOM },
      { scale: CAMERA_ZOOM },
    ];
  });

  // ─── Hero group transform (UI thread → Skia) ───────────────────────────────
  // Player is always at screen center — camera math is baked into entity slot
  // transforms, so the player just sits at width/2, height/2 every frame.
  const groupTransform = useDerivedValue(() => [
    { translateX: width / 2 },
    { translateY: height / 2 },
    { rotate: gameState.value.player.rotation + SPRITE_ROTATION_OFFSET },
  ]);

  // ─── Game loop ─────────────────────────────────────────────────────────────
  useFrameCallback((frameInfo) => {
    const dtMs = frameInfo.timeSincePreviousFrame ?? 0;
    if (dtMs <= 0) return; // skip spurious zero-dt frames (JS-thread timer activity triggers extra UI-thread callbacks)

    const ivx = inputActive.value ? inputVectorX.value : 0;
    const ivy = inputActive.value ? inputVectorY.value : 0;
    const iv = (ivx !== 0 || ivy !== 0) ? { x: ivx, y: ivy } : null;

    let state = {
      ...gameState.value,
      player: { ...gameState.value.player, inputVector: iv },
    };

    // Cap at 50ms so a backgrounded-app resume doesn't produce a giant physics jump.
    state = updateGameState(state, Math.min(dtMs, 50));
    gameState.value = state;

    // FPS + debug counters — bridge to React once per second.
    fpsAccumMs.value += dtMs;
    fpsFrameCount.value += 1;
    if (fpsAccumMs.value >= 1000) {
      const fps = Math.round((fpsFrameCount.value / fpsAccumMs.value) * 1000);
      // Count only alive enemies for the display (dying ones are finishing their animation).
      let aliveCount = 0;
      for (let i = 0; i < state.enemies.length; i++) {
        const e = state.enemies[i];
        if (e && e.status === 'alive') aliveCount += 1;
      }
      runOnJS(updateDebugDisplay)(
        fps,
        Math.round(state.elapsedMs / 1000),
        state.frameCount,
        aliveCount,
        state.killCount,
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

  // ─── Pickup render sizes ──────────────────────────────────────────────────
  const moneyW = moneySmallImage ? moneySmallImage.width() * PICKUP_SPRITE_SCALE : 0;
  const moneyH = moneySmallImage ? moneySmallImage.height() * PICKUP_SPRITE_SCALE : 0;
  const crateW = crateImage ? crateImage.width() * PICKUP_SPRITE_SCALE : 0;
  const crateH = crateImage ? crateImage.height() * PICKUP_SPRITE_SCALE : 0;

  return (
    <GestureDetector gesture={panGesture}>
      <View style={StyleSheet.absoluteFill}>
        <Canvas style={StyleSheet.absoluteFill}>

          {/*
           * Camera Group: world-space coordinate system scrolled by cameraTransform.
           * Tiles use static world-space RSXforms (col*TILE_SIZE, row*TILE_SIZE) — the
           * Group's cameraTransform handles all camera scrolling, no per-frame RSXform
           * update needed. React-state entities (effects, buildings) also live here.
           * Animated-derived-value entities (enemies, projectiles, pickups) remain
           * outside to avoid nested animated Skia Group stutter.
           */}
          <Group transform={cameraTransform}>

          {/* ── Tile ground layer (z=0, drawn first inside camera Group) ────── */}
          {/* RSXforms are world-space (col*64, row*64). Camera Group scrolls them. */}
          {tilesReady && (
            <>
              <Atlas
                image={dirtTileImage!}
                sprites={dirtSprites}
                transforms={dirtTransforms}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
              <Atlas
                image={sandTileImage!}
                sprites={sandSprites}
                transforms={sandTransforms}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
              <Atlas
                image={grassTileImage!}
                sprites={grassSprites}
                transforms={grassTransforms}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
            </>
          )}

          {/* ── Effect zones (React state positions, static transforms) ──── */}
          {/* Smoke: 7-frame LightSmoke animation (dissipation loop, 150ms/frame). */}
          {/* Molotov: static Explode frame 3 (index 2) — peak-bloom reads as   */}
          {/*   "fire patch on ground" vs flamethrower stream. Phase 6: tune.    */}
          {zoneSlotData.map((z, i) => {
            if (!z.type) return null;
            if (z.type === 'smoke') {
              const smokeImg = smokeImages[z.frame] ?? smokeImages[0] ?? null;
              if (!smokeImg) return null;
              const sw = smokeImg.width() * EFFECT_SPRITE_SCALE;
              const sh = smokeImg.height() * EFFECT_SPRITE_SCALE;
              return (
                <Image
                  key={`zone-${i}`}
                  image={smokeImg}
                  x={z.x - sw / 2}
                  y={z.y - sh / 2}
                  width={sw}
                  height={sh}
                  sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                />
              );
            }
            if (z.type === 'flame') {
              // Flamethrower zone: directional jet sprite rotated to cone angle.
              // Group centers on zone position, rotates to spawn angle, image offsets to center.
              const flameImg = flameImages[z.frame] ?? flameImages[0] ?? null;
              if (!flameImg) return null;
              const fw = flameImg.width() * FLAME_ZONE_SPRITE_SCALE;
              const fh = flameImg.height() * FLAME_ZONE_SPRITE_SCALE;
              return (
                <Group
                  key={`zone-${i}`}
                  transform={[
                    { translateX: z.x },
                    { translateY: z.y },
                    { rotate: z.rotation + SPRITE_ROTATION_OFFSET },
                  ]}
                >
                  <Image
                    image={flameImg}
                    x={-fw / 2}
                    y={-fh / 2}
                    width={fw}
                    height={fh}
                    sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                  />
                </Group>
              );
            }
            if (z.type === 'explosion') {
              // Rocket detonation: non-looping Explode animation (4 frames × 100ms).
              const expImg = explodeImages[z.frame] ?? null;
              if (!expImg) return null;
              const ew = expImg.width() * EFFECT_SPRITE_SCALE;
              const eh = expImg.height() * EFFECT_SPRITE_SCALE;
              return (
                <Image
                  key={`zone-${i}`}
                  image={expImg}
                  x={z.x - ew / 2}
                  y={z.y - eh / 2}
                  width={ew}
                  height={eh}
                  sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                />
              );
            }
            // Molotov — static Explode frame 3 (index 2): peak-bloom, reads as
            // fire patch rather than directional stream. No frame cycling.
            const molotovImg = explodeImages[2] ?? null;
            if (!molotovImg) return null;
            const mw = molotovImg.width() * EFFECT_SPRITE_SCALE;
            const mh = molotovImg.height() * EFFECT_SPRITE_SCALE;
            return (
              <Image
                key={`zone-${i}`}
                image={molotovImg}
                x={z.x - mw / 2}
                y={z.y - mh / 2}
                width={mw}
                height={mh}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
            );
          })}

          {/* ── Detonating throwables (React state positions, static) ──── */}
          {/* Kept in camera Group: static inner transforms, no nested-animated issue. */}
          {throwableSlotData.map((t, i) => {
            if (t.status !== 'detonating') return null;
            const expImg = explodeImages[t.frame] ?? null;
            if (!expImg) return null;
            const ew = expImg.width() * EFFECT_SPRITE_SCALE;
            const eh = expImg.height() * EFFECT_SPRITE_SCALE;
            return (
              <Image
                key={`throw-det-${i}`}
                image={expImg}
                x={t.targetX - ew / 2}
                y={t.targetY - eh / 2}
                width={ew}
                height={eh}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
            );
          })}

          </Group>

          {/* ── Crates ───────────────────────────────────────────────────── */}
          {/* Screen-coord derived values — outside camera Group to avoid    */}
          {/* nested animated Skia Groups (root cause of stutter).           */}
          {/* Inactive slots sit at (-9999,-9999).                           */}
          {crateImage && allCrateTransforms.map((transform, i) => (
            <Group key={`crate-${i}`} transform={transform}>
              <Image
                image={crateImage}
                x={-crateW / 2}
                y={-crateH / 2}
                width={crateW}
                height={crateH}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
            </Group>
          ))}

          {/* ── Pickups ──────────────────────────────────────────────────── */}
          {/* Screen-coord derived values — outside camera Group.            */}
          {/* Only active slots render a Group (same conditional pattern as  */}
          {/* enemies) — prevents 50 always-subscribed Skia Groups from      */}
          {/* firing redundant per-frame transform updates when inactive.     */}
          {moneySmallImage && allPickupTransforms.map((transform, i) => {
            if (!pickupSlotActive[i]) return null;
            return (
              <Group key={`pickup-${i}`} transform={transform}>
                <Image
                  image={moneySmallImage}
                  x={-moneyW / 2}
                  y={-moneyH / 2}
                  width={moneyW}
                  height={moneyH}
                  sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                />
              </Group>
            );
          })}

          {/* ── Projectiles ──────────────────────────────────────────────── */}
          {/* Screen-coord derived values — outside camera Group.            */}
          {/* Rockets: Image sprite (transform includes rotation). Bullets: Circle. */}
          {allProjectileTransforms.map((transform, i) => {
            if (projIsRocket[i]) {
              const rImg = rocketImages[rocketFrame] ?? rocketImages[0] ?? null;
              if (!rImg) {
                return (
                  <Group key={`proj-${i}`} transform={transform}>
                    <Circle cx={0} cy={0} r={4} color="#f5c842" />
                  </Group>
                );
              }
              const rw = rImg.width() * EFFECT_SPRITE_SCALE;
              const rh = rImg.height() * EFFECT_SPRITE_SCALE;
              return (
                <Group key={`proj-${i}`} transform={transform}>
                  <Image
                    image={rImg}
                    x={-rw / 2}
                    y={-rh / 2}
                    width={rw}
                    height={rh}
                    sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                  />
                </Group>
              );
            }
            return (
              <Group key={`proj-${i}`} transform={transform}>
                <Circle cx={0} cy={0} r={4} color="#f5c842" />
              </Group>
            );
          })}

          {/* ── Flying throwables ────────────────────────────────────────── */}
          {/* Screen-coord derived values — outside camera Group.            */}
          {/* Inactive/detonating slots sit at (-9999,-9999) — invisible.   */}
          {allThrowableTransforms.map((transform, i) => {
            const t = throwableSlotData[i]!;
            const color = t.type ? THROWABLE_COLORS[t.type] : '#000000';
            return (
              <Group key={`throw-fly-${i}`} transform={transform}>
                <Circle cx={0} cy={0} r={5} color={color} />
              </Group>
            );
          })}

          {/* ── Enemies ──────────────────────────────────────────────────── */}
          {/* Screen-coord derived values — outside camera Group.            */}
          {/* Only active slots render a <Group>, breaking Skia subscriptions */}
          {/* for empty slots.                                                */}
          {allSlotTransforms.map((transform, i) => {
            const type = enemySlotTypes[i];
            if (!type) return null;
            const status = enemySlotStatuses[i];
            const isDying = status === 'dying';

            const images = isDying
              ? (type === 'scav' ? scavDieImages : raiderDieImages)
              : (type === 'scav' ? scavWalkImages : raiderFireImages);

            const img = images[enemySlotFrames[i]] ?? null;
            if (!img) return null;
            const w = img.width() * ENEMY_SPRITE_SCALE;
            const h = img.height() * ENEMY_SPRITE_SCALE;

            const bodyOverlay = (type === 'scav' && !isDying) ? scavBodyImage : null;
            const bw = bodyOverlay ? bodyOverlay.width() * ENEMY_SPRITE_SCALE : 0;
            const bh = bodyOverlay ? bodyOverlay.height() * ENEMY_SPRITE_SCALE : 0;

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
                {bodyOverlay && (
                  <Image
                    image={bodyOverlay}
                    x={-bw / 2}
                    y={-bh / 2}
                    width={bw}
                    height={bh}
                    sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                  />
                )}
                {/* Hit-flash: red circle centered on enemy, visible for HIT_FLASH_DURATION_MS.
                    Sprite color-filter is not supported for <Image> in Skia v2.2.12. */}
                <Circle
                  cx={0}
                  cy={0}
                  r={HIT_FLASH_RADIUS_PX}
                  color="#cc2020"
                  opacity={allSlotFlashOpacities[i]}
                />
              </Group>
            );
          })}

          {/* ── Player ───────────────────────────────────────────────────── */}
          {/* Screen-coord derived value — always at screen center.          */}
          <Group transform={groupTransform}>
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
            NOTE: mutates weaponPose only, NOT equippedWeaponId — animation changes
            but combat stats do not. Unreliable as a weapon indicator. Phase 7 removes this.
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
          <Text style={styles.debugText}>HP: {displayHp}</Text>
          <Text style={styles.debugText}>Score: {displayScore}</Text>
          <Text style={styles.debugText}>XP: {displayXp}</Text>
          <Text style={styles.debugText}>Level: {displayLevel}</Text>
          <Text style={styles.debugText}>Enemies: {displayEnemyCount}</Text>
          <Text style={styles.debugText}>Kills: {displayKillCount}</Text>
          <Text style={styles.debugText}>Time: {formatElapsed(displayElapsed)}</Text>
          <Text style={styles.debugText}>Frame: {displayFrameCount}</Text>
        </View>

        {/* Revive prompt — replaces the old YOU DIED overlay.
            ReviveModal renders null when !visible, so no layout cost when hidden. */}
        <ReviveModal
          visible={displayIsDead}
          backpackStacks={displayBackpackStacks}
          adRevivesUsed={displayAdRevivesUsed}
          onFreeRevive={handleFreeRevive}
          onAdRevive={handleAdRevive}
          onRedeploy={handleRedeploy}
        />

        {/* Level-up modal — unmounts when not pending (returns null internally too).
            Rendered above YOU DIED so both can't simultaneously be the focus. */}
        <LevelUpModal
          visible={displayPendingLevelUp}
          choices={displayChoices}
          playerSkillStacks={displayPlayerSkillStacks}
          onSelect={handleSkillSelect}
        />

        {/* Crate reveal modal — shown when player walks over a crate.
            Engine frozen via pendingCrateReveal while open. */}
        <CrateRevealModal
          visible={displayCrateReveal}
          weaponId={displayCrateWeaponId}
          tier={displayCrateTier}
          onEquip={handleEquip}
          onScrap={handleScrap}
        />
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
