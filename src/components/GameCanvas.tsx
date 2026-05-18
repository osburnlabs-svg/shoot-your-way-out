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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { HeroSprites, EnemySprites, PickupSprites, EffectSprites, TileSprites, EnvSprites, FlyoverSprites } from '../lib/sprites';
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
  SNIPER_WALK_FRAME_COUNT,
  SNIPER_WALK_FRAME_DURATION_MS,
  SOLDIER02_WALK_FRAME_COUNT,
  SOLDIER02_WALK_FRAME_DURATION_MS,
  MUZZLE_FLASH_FRAME_COUNT,
  MUZZLE_FLASH_FRAME_DURATION_MS,
  MUZZLE_FLASH_DURATION_MS,
  SNIPER_A_FLASH_OFFSET,
  SNIPER_B_FLASH_OFFSET,
  RAIDER_FLASH_OFFSET,
  ACS_FLASH_OFFSET,
  PANZER_FLASH_OFFSET,
  TANK_SPRITE_SCALE,
  TANK_PROJECTILE_SCALE,
  WALK_FRAME_COUNT,
  WALK_FRAME_DURATION_MS,
  ENEMY_DIE_FRAME_COUNT,
  ENEMY_DIE_FRAME_DURATION_MS,
  PICKUP_SLOT_COUNT,
  PICKUP_SPRITE_SCALE,
  PROP_SPRITE_SCALE,
  STRUCTURE_SPRITE_SCALE,
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
  HELI_SPRITE_SCALE,
  HELI_ROTOR_FRAME_MS,
  HELI_FLYOVER_DURATION_MS,
  HELI_SPAWN_MIN_MS,
  HELI_SPAWN_MAX_MS,
} from '../data/gameConstants';
import type { CrateTier } from '../data/gameConstants';
import type { EnemyType } from '../data/enemies';
import { createInitialGameState, updateGameState } from '../lib/gameEngine';
import type { GameState } from '../lib/gameEngine';
import { buildCollisionData } from '../lib/collision';
import type { CollisionData } from '../lib/collision';
import { getCurrentFrame } from '../lib/animation';
import {
  SPRITE_ROTATION_OFFSET,
  useEnemySlotTransform,
  useProjectileSlotTransform,
  usePickupSlotTransform,
  useCrateSlotTransform,
  useThrowableSlotTransform,
  useEnemySlotFlash,
} from '../lib/slotHooks';

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

  // Scav upper body — NoGunScav (weaponless Gunner body), composited over Soldier kit legs
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

  // Raider walk: 7 frames (SW_01–07, Soldier kit legs — same frames as Scav)
  const raiderWalk0 = useImage(EnemySprites.raider.walk[0]);
  const raiderWalk1 = useImage(EnemySprites.raider.walk[1]);
  const raiderWalk2 = useImage(EnemySprites.raider.walk[2]);
  const raiderWalk3 = useImage(EnemySprites.raider.walk[3]);
  const raiderWalk4 = useImage(EnemySprites.raider.walk[4]);
  const raiderWalk5 = useImage(EnemySprites.raider.walk[5]);
  const raiderWalk6 = useImage(EnemySprites.raider.walk[6]);
  const raiderWalkImages = [raiderWalk0, raiderWalk1, raiderWalk2, raiderWalk3, raiderWalk4, raiderWalk5, raiderWalk6];

  // Raider die: 4 frames (SD_01–04, Soldier kit die — same frames as Scav)
  const raiderDie0 = useImage(EnemySprites.raider.die[0]);
  const raiderDie1 = useImage(EnemySprites.raider.die[1]);
  const raiderDie2 = useImage(EnemySprites.raider.die[2]);
  const raiderDie3 = useImage(EnemySprites.raider.die[3]);
  const raiderDieImages = [raiderDie0, raiderDie1, raiderDie2, raiderDie3];
  const raiderBodyImage = useImage(EnemySprites.raider.body);

  // SniperA walk: 7 frames (SW_01–07), legs-only + Base.png body overlay
  const sniperAWalk0 = useImage(EnemySprites.sniperA.walk[0]);
  const sniperAWalk1 = useImage(EnemySprites.sniperA.walk[1]);
  const sniperAWalk2 = useImage(EnemySprites.sniperA.walk[2]);
  const sniperAWalk3 = useImage(EnemySprites.sniperA.walk[3]);
  const sniperAWalk4 = useImage(EnemySprites.sniperA.walk[4]);
  const sniperAWalk5 = useImage(EnemySprites.sniperA.walk[5]);
  const sniperAWalk6 = useImage(EnemySprites.sniperA.walk[6]);
  const sniperAWalkImages = [sniperAWalk0, sniperAWalk1, sniperAWalk2, sniperAWalk3, sniperAWalk4, sniperAWalk5, sniperAWalk6];
  // SniperA die: 5 frames (SniperDIe_00–04); 5th frame clips before despawn — acceptable
  const sniperADie0 = useImage(EnemySprites.sniperA.die[0]);
  const sniperADie1 = useImage(EnemySprites.sniperA.die[1]);
  const sniperADie2 = useImage(EnemySprites.sniperA.die[2]);
  const sniperADie3 = useImage(EnemySprites.sniperA.die[3]);
  const sniperADie4 = useImage(EnemySprites.sniperA.die[4]);
  const sniperADieImages = [sniperADie0, sniperADie1, sniperADie2, sniperADie3, sniperADie4];
  const sniperABodyImage = useImage(EnemySprites.sniperA.body);

  // SniperB (Soldier02) walk: 5 frames (SF_01–05), full character — no body overlay
  const sniperBWalk0 = useImage(EnemySprites.soldier02.walk[0]);
  const sniperBWalk1 = useImage(EnemySprites.soldier02.walk[1]);
  const sniperBWalk2 = useImage(EnemySprites.soldier02.walk[2]);
  const sniperBWalk3 = useImage(EnemySprites.soldier02.walk[3]);
  const sniperBWalk4 = useImage(EnemySprites.soldier02.walk[4]);
  const sniperBWalkImages = [sniperBWalk0, sniperBWalk1, sniperBWalk2, sniperBWalk3, sniperBWalk4];
  // SniperB die: 4 frames (SD2_01–04)
  const sniperBDie0 = useImage(EnemySprites.soldier02.die[0]);
  const sniperBDie1 = useImage(EnemySprites.soldier02.die[1]);
  const sniperBDie2 = useImage(EnemySprites.soldier02.die[2]);
  const sniperBDie3 = useImage(EnemySprites.soldier02.die[3]);
  const sniperBDieImages = [sniperBDie0, sniperBDie1, sniperBDie2, sniperBDie3];

  // ─── Terrain tilesheet images (loaded once at mount) ─────────────────────
  // Each is a 320×320 sprite sheet of 25 tile variants (5×5 grid of 64×64px).
  // Atlas clipping isolates individual tiles via source rect in the sprites array.
  const dirtTileImage  = useImage(TileSprites.dirt);
  const sandTileImage  = useImage(TileSprites.sand);
  const grassTileImage = useImage(TileSprites.grass);
  // All 3 must be non-null before any Atlas renders — a single null image
  // crashes Skia's JSI layer on first render before the loaded images arrive.
  const tilesReady = !!(dirtTileImage && sandTileImage && grassTileImage);

  // ─── Environment prop images (loaded once at mount, 31 assets) ───────────
  // One useImage per EnvSprites key. Keys match assetKey strings in mapGenerator pools.
  // Rendering is gated per-Atlas on img != null; partial loads render available props.
  const imgEnvHouse01          = useImage(EnvSprites.env_house01);
  const imgEnvHouse02          = useImage(EnvSprites.env_house02);
  const imgEnvWatchtower       = useImage(EnvSprites.env_watchtower);
  const imgEnvTreeLarge1       = useImage(EnvSprites.env_tree_large_1);
  const imgEnvTreeLarge2       = useImage(EnvSprites.env_tree_large_2);
  const imgEnvTreeLarge3       = useImage(EnvSprites.env_tree_large_3);
  const imgEnvTreeLarge4       = useImage(EnvSprites.env_tree_large_4);
  const imgEnvTreeSmall1       = useImage(EnvSprites.env_tree_small_1);
  const imgEnvTreeSmall2       = useImage(EnvSprites.env_tree_small_2);
  const imgEnvTreeSmall3       = useImage(EnvSprites.env_tree_small_3);
  const imgEnvBush1            = useImage(EnvSprites.env_bush_1);
  const imgEnvBush2            = useImage(EnvSprites.env_bush_2);
  const imgEnvBush3            = useImage(EnvSprites.env_bush_3);
  const imgEnvRockLarge        = useImage(EnvSprites.env_rock_large);
  const imgEnvRockMedium       = useImage(EnvSprites.env_rock_medium);
  const imgEnvRockSmall        = useImage(EnvSprites.env_rock_small);
  const imgEnvBoxWood          = useImage(EnvSprites.env_box_wood);
  const imgEnvBoxMilitary      = useImage(EnvSprites.env_box_military);
  const imgEnvBarrelOil        = useImage(EnvSprites.env_barrel_oil);
  const imgEnvBarrel           = useImage(EnvSprites.env_barrel);
  const imgEnvBoxWoodSmall     = useImage(EnvSprites.env_box_wood_small);
  const imgEnvBoxMilitarySmall = useImage(EnvSprites.env_box_military_small);
  const imgEnvCarWreck1        = useImage(EnvSprites.env_car_wreck_1);
  const imgEnvCarWreck2        = useImage(EnvSprites.env_car_wreck_2);
  const imgEnvCarWreck3        = useImage(EnvSprites.env_car_wreck_3);
  const imgEnvTruckWreck1      = useImage(EnvSprites.env_truck_wreck_1);
  const imgEnvTruckWreck2      = useImage(EnvSprites.env_truck_wreck_2);
  const imgEnvSmallTruckWreck  = useImage(EnvSprites.env_small_truck_wreck);
  const imgEnvAmbulanceWreck   = useImage(EnvSprites.env_ambulance_wreck);
  const imgEnvPoliceWreck      = useImage(EnvSprites.env_police_wreck);
  const imgEnvBusWreck         = useImage(EnvSprites.env_bus_wreck);
  const imgEnvHelicopterWreck  = useImage(EnvSprites.env_helicopter_wreck);
  const imgEnvHumveeWreck1     = useImage(EnvSprites.env_humvee_wreck_1);
  const imgEnvHumveeWreck2     = useImage(EnvSprites.env_humvee_wreck_2);
  const imgEnvHumveeWreck3     = useImage(EnvSprites.env_humvee_wreck_3);
  const imgEnvHumveeWreck4     = useImage(EnvSprites.env_humvee_wreck_4);
  const imgEnvHumveeWreck5     = useImage(EnvSprites.env_humvee_wreck_5);
  const imgEnvHumveeWreck6     = useImage(EnvSprites.env_humvee_wreck_6);
  const imgEnvAcsWreck         = useImage(EnvSprites.env_acs_wreck);
  const imgEnvBomberWreck2     = useImage(EnvSprites.env_bomber_wreck_2);
  const imgEnvBomberWreck3     = useImage(EnvSprites.env_bomber_wreck_3);

  // Flat lookup: assetKey string → loaded SkImage (or null during load).
  const propImageLookup: Record<string, ReturnType<typeof useImage>> = {
    env_house01:          imgEnvHouse01,
    env_house02:          imgEnvHouse02,
    env_watchtower:       imgEnvWatchtower,
    env_tree_large_1:     imgEnvTreeLarge1,
    env_tree_large_2:     imgEnvTreeLarge2,
    env_tree_large_3:     imgEnvTreeLarge3,
    env_tree_large_4:     imgEnvTreeLarge4,
    env_tree_small_1:     imgEnvTreeSmall1,
    env_tree_small_2:     imgEnvTreeSmall2,
    env_tree_small_3:     imgEnvTreeSmall3,
    env_bush_1:           imgEnvBush1,
    env_bush_2:           imgEnvBush2,
    env_bush_3:           imgEnvBush3,
    env_rock_large:       imgEnvRockLarge,
    env_rock_medium:      imgEnvRockMedium,
    env_rock_small:       imgEnvRockSmall,
    env_box_wood:         imgEnvBoxWood,
    env_box_military:     imgEnvBoxMilitary,
    env_barrel_oil:       imgEnvBarrelOil,
    env_barrel:           imgEnvBarrel,
    env_box_wood_small:   imgEnvBoxWoodSmall,
    env_box_military_small: imgEnvBoxMilitarySmall,
    env_car_wreck_1:      imgEnvCarWreck1,
    env_car_wreck_2:      imgEnvCarWreck2,
    env_car_wreck_3:      imgEnvCarWreck3,
    env_truck_wreck_1:    imgEnvTruckWreck1,
    env_truck_wreck_2:    imgEnvTruckWreck2,
    env_small_truck_wreck: imgEnvSmallTruckWreck,
    env_ambulance_wreck:  imgEnvAmbulanceWreck,
    env_police_wreck:     imgEnvPoliceWreck,
    env_bus_wreck:        imgEnvBusWreck,
    env_helicopter_wreck: imgEnvHelicopterWreck,
    env_humvee_wreck_1:   imgEnvHumveeWreck1,
    env_humvee_wreck_2:   imgEnvHumveeWreck2,
    env_humvee_wreck_3:   imgEnvHumveeWreck3,
    env_humvee_wreck_4:   imgEnvHumveeWreck4,
    env_humvee_wreck_5:   imgEnvHumveeWreck5,
    env_humvee_wreck_6:   imgEnvHumveeWreck6,
    env_acs_wreck:        imgEnvAcsWreck,
    env_bomber_wreck_2:   imgEnvBomberWreck2,
    env_bomber_wreck_3:   imgEnvBomberWreck3,
  };

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

  const bulletImage = useImage(EffectSprites.bullet);
  // Grenade launcher projectile: single static frame (rocket-f1.png, 3×12 px).
  const rocketF1Image = useImage(EffectSprites.rocketF1);
  // Tank turret rocket (Phase 5 G5): 2-frame body animation — kept for future use.
  const rocket0 = useImage(EffectSprites.rocket[0]);
  const rocket1 = useImage(EffectSprites.rocket[1]);
  const rocketImages = [rocket0, rocket1];

  // Muzzle flash: 3 frames each, non-looping, 50ms/frame. sniperA = Sniper kit, sniperB = Gunner.
  const muzzleFlashA0 = useImage(EffectSprites.muzzle_flash_a[0]);
  const muzzleFlashA1 = useImage(EffectSprites.muzzle_flash_a[1]);
  const muzzleFlashA2 = useImage(EffectSprites.muzzle_flash_a[2]);
  const muzzleFlashAImages = [muzzleFlashA0, muzzleFlashA1, muzzleFlashA2];
  const muzzleFlashB0 = useImage(EffectSprites.muzzle_flash_b[0]);
  const muzzleFlashB1 = useImage(EffectSprites.muzzle_flash_b[1]);
  const muzzleFlashB2 = useImage(EffectSprites.muzzle_flash_b[2]);
  const muzzleFlashBImages = [muzzleFlashB0, muzzleFlashB1, muzzleFlashB2];
  // Raider muzzle flash: reuses gunner frames (Soldier kit has no standalone flash sprites).
  const muzzleFlashRaider0 = useImage(EffectSprites.muzzle_flash_raider[0]);
  const muzzleFlashRaider1 = useImage(EffectSprites.muzzle_flash_raider[1]);
  const muzzleFlashRaider2 = useImage(EffectSprites.muzzle_flash_raider[2]);
  const muzzleFlashRaiderImages = [muzzleFlashRaider0, muzzleFlashRaider1, muzzleFlashRaider2];
  // Tank muzzle flash frames (Phase 5 G5). ACS reuses panzer flash frames.
  const muzzleFlashPanzer0 = useImage(EffectSprites.muzzle_flash_panzer[0]);
  const muzzleFlashPanzer1 = useImage(EffectSprites.muzzle_flash_panzer[1]);
  const muzzleFlashPanzer2 = useImage(EffectSprites.muzzle_flash_panzer[2]);
  const muzzleFlashPanzerImages = [muzzleFlashPanzer0, muzzleFlashPanzer1, muzzleFlashPanzer2];
  // Tank base + tower sprites.
  const acsBaseImage  = useImage(EnemySprites.acs.base);
  const acsTowerImage = useImage(EnemySprites.acs.tower);
  const panzerBaseImage  = useImage(EnemySprites.panzer.base);
  const panzerTowerImage = useImage(EnemySprites.panzer.tower);
  // Helicopter flyover sprites (Phase 5 atmospheric).
  const heliBodyImage  = useImage(FlyoverSprites.heliBody);
  const heliRotor0     = useImage(FlyoverSprites.rotorFrames[0]);
  const heliRotor1     = useImage(FlyoverSprites.rotorFrames[1]);
  const heliRotor2     = useImage(FlyoverSprites.rotorFrames[2]);
  const heliRotorImages = [heliRotor0, heliRotor1, heliRotor2];

  // ─── Map data (generated once per mount; reused on redeploy in Phase 5) ──────
  // Phase 7 will generate a fresh map on each run restart via the menu flow.
  const [initialMapData] = useState(() => loadMap(Date.now()));

  // ─── Game state ────────────────────────────────────────────────────────────
  const gameState = useSharedValue(createInitialGameState(width, height, initialMapData.tanks, initialMapData.solidPropExclusions));

  // ─── Collision data (static; built from map, never mutated after mount) ─────
  // Stored in a SharedValue so worklets can read it on the UI thread. Written
  // once at mount from the JS thread; the early-exit in resolveAABB makes reads
  // cheap when no solid props are nearby.
  const collisionDataShared = useSharedValue<CollisionData>(buildCollisionData(initialMapData));

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
    console.log(`[STUTTER-DIAG] tileAtlas rebuild col=${playerTileCol} row=${playerTileRow}`);
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

  // ─── Prop Atlas data (computed once at mount; static world-space positions) ─
  // Groups each entity list by assetKey → { sprites: SkRect[], transforms: SkRSXform[] }.
  // Rendered in z-order: vegetation → obstacles → barrels → wrecks → buildings.
  // RSXforms are world-space (centered on entity); camera Group handles scrolling.
  const propAtlasData = useMemo(() => {
    console.log('[STUTTER-DIAG] propAtlasData rebuild');
    // Structure assets use STRUCTURE_SPRITE_SCALE; per-asset map handles individual
    // exceptions where a native size is already large enough at the category default.
    const STRUCTURE_ASSETS = new Set(['env_house01', 'env_house02', 'env_watchtower']);
    // Per-asset overrides: add entries here when an individual asset needs a scale
    // different from its category default. Currently empty — all structures use
    // STRUCTURE_SPRITE_SCALE, all other props use PROP_SPRITE_SCALE.
    const PROP_SCALE_OVERRIDES: Record<string, number> = {};

    function scaleFor(assetKey: string): number {
      if (Object.prototype.hasOwnProperty.call(PROP_SCALE_OVERRIDES, assetKey)) return PROP_SCALE_OVERRIDES[assetKey]!;
      if (STRUCTURE_ASSETS.has(assetKey)) return STRUCTURE_SPRITE_SCALE;
      return PROP_SPRITE_SCALE;
    }

    function groupByAssetKey(entities: typeof initialMapData.buildings) {
      const groups: Record<string, { sprites: { x: number; y: number; width: number; height: number }[]; transforms: ReturnType<typeof Skia.RSXform>[] }> = {};
      for (const ent of entities) {
        if (!ent.assetKey) continue;
        if (!groups[ent.assetKey]) {
          groups[ent.assetKey] = { sprites: [], transforms: [] };
        }
        const s = scaleFor(ent.assetKey);
        const θ = ent.rotation ?? 0;
        const a = s * Math.cos(θ);
        const b = s * Math.sin(θ);
        const hw = ent.width / 2;
        const hh = ent.height / 2;
        groups[ent.assetKey]!.sprites.push({ x: 0, y: 0, width: ent.width, height: ent.height });
        groups[ent.assetKey]!.transforms.push(
          Skia.RSXform(a, b, ent.x - a * hw + b * hh, ent.y - b * hw - a * hh),
        );
      }
      return groups;
    }
    return {
      vegetation: groupByAssetKey(initialMapData.vegetation),
      obstacles:  groupByAssetKey(initialMapData.obstacles),
      barrels:    groupByAssetKey(initialMapData.barrels),
      wrecks:     groupByAssetKey(initialMapData.vehicleWrecks),
      buildings:  groupByAssetKey(initialMapData.buildings),
    };
  }, [initialMapData]);

  // ─── Virtual joystick shared values (UI thread) ───────────────────────────
  const joystickOriginX = useSharedValue(0);
  const joystickOriginY = useSharedValue(0);
  const inputVectorX = useSharedValue(0);
  const inputVectorY = useSharedValue(0);
  const inputActive = useSharedValue(false);

  // ─── FPS tracking (UI thread) ──────────────────────────────────────────────
  const fpsAccumMs = useSharedValue(0);
  const fpsFrameCount = useSharedValue(0);

  // ─── Helicopter flyover state (UI thread) ────────────────────────────────────
  const heliFlightSV = useSharedValue<{
    active: boolean;
    startX: number; startY: number;
    endX: number;   endY: number;
    angle: number;
  }>({ active: false, startX: 0, startY: 0, endX: 0, endY: 0, angle: 0 });
  const heliProgress = useSharedValue(0);

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

  // [STUTTER-DIAG] Long-frame logger — called via runOnJS from the UI-thread worklet.
  const logLongFrame = useCallback((dtMs: number, gameElapsedMs: number) => {
    console.log(`[STUTTER-DIAG] long frame dt=${dtMs.toFixed(1)}ms gameElapsed=${gameElapsedMs}ms`);
  }, []);

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
  // Per-slot muzzle flash frame index. -1 = not flashing. 0–2 = active flash frame.
  const [enemySlotFlashFrames, setEnemySlotFlashFrames] = useState<number[]>(
    () => Array.from({ length: ENEMY_SOFT_CAP }, () => -1),
  );
  const [tankFlashFrames, setTankFlashFrames] = useState<[number, number]>([-1, -1]);
  const [heliActive, setHeliActive] = useState(false);
  const [heliRotorFrame, setHeliRotorFrame] = useState(0);

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

  // ─── Preallocated slot buffers for 100ms timer ──────────────────────────────
  // Avoids Array.from() per-tick GC pressure — confirmed JS-thread GC spike source.
  // Each buffer is mutated in place; setState receives .slice() for re-render trigger.
  // Remove this block only if the entire timer is refactored away.
  // [STUTTER-DIAG] Tracks last logged tile position to detect boundary crossings.
  const lastLoggedTileRef = useRef({ col: -1, row: -1 });

  const timerBuffers = useRef({
    enemyTypes:   new Array<EnemyType | null>(ENEMY_SOFT_CAP).fill(null),
    enemyStatus:  new Array<'alive' | 'dying' | null>(ENEMY_SOFT_CAP).fill(null),
    enemyFrames:  new Array<number>(ENEMY_SOFT_CAP).fill(0),
    flashFrames:  new Array<number>(ENEMY_SOFT_CAP).fill(-1),
    pickupActive: new Array<boolean>(PICKUP_SLOT_COUNT).fill(false),
    rockets:      new Array<boolean>(PROJECTILE_SLOT_COUNT).fill(false),
    tSlots: Array.from({ length: THROWABLE_SLOT_COUNT }, () => ({
      type:    null as 'frag' | 'smoke' | 'molotov' | null,
      status:  null as 'flying' | 'detonating' | null,
      frame:   0,
      targetX: 0,
      targetY: 0,
    })),
    zSlots: Array.from({ length: EFFECT_ZONE_SLOT_COUNT }, () => ({
      type:     null as 'smoke' | 'molotov' | 'flame' | 'explosion' | null,
      x: 0, y: 0, frame: 0, rotation: 0,
    })),
  });

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

      // Enemy slot sprite state — buffer pattern (no Array.from per tick).
      const { enemyTypes: et, enemyStatus: es, enemyFrames: ef } = timerBuffers.current;
      for (let i = 0; i < ENEMY_SOFT_CAP; i++) { et[i] = null; es[i] = null; ef[i] = 0; }
      for (let i = 0; i < state.enemies.length; i++) {
        const enemy = state.enemies[i];
        if (!enemy) continue;
        et[i] = enemy.type;
        es[i] = enemy.status;
        if (enemy.status === 'dying') {
          ef[i] = getCurrentFrame(
            { frameCount: ENEMY_DIE_FRAME_COUNT, frameDurationMs: ENEMY_DIE_FRAME_DURATION_MS, loop: false },
            state.elapsedMs - enemy.dyingStartedAtMs,
          );
        } else {
          const t = enemy.type;
          const fc = t === 'scav' ? SCAV_WALK_FRAME_COUNT
            : t === 'raider' ? RAIDER_WALK_FRAME_COUNT
            : t === 'sniperA' ? SNIPER_WALK_FRAME_COUNT
            : SOLDIER02_WALK_FRAME_COUNT; // sniperB
          const fd = t === 'scav' ? SCAV_WALK_FRAME_DURATION_MS
            : t === 'raider' ? RAIDER_WALK_FRAME_DURATION_MS
            : t === 'sniperA' ? SNIPER_WALK_FRAME_DURATION_MS
            : SOLDIER02_WALK_FRAME_DURATION_MS; // sniperB
          ef[i] = getCurrentFrame(
            { frameCount: fc, frameDurationMs: fd, loop: true },
            state.elapsedMs - enemy.walkStartedAtMs,
          );
        }
      }
      setEnemySlotTypes(et.slice());
      setEnemySlotStatuses(es.slice());
      setEnemySlotFrames(ef.slice());

      // Muzzle flash frame per enemy slot — -1 when not flashing.
      const ff = timerBuffers.current.flashFrames;
      for (let i = 0; i < ENEMY_SOFT_CAP; i++) { ff[i] = -1; }
      for (let i = 0; i < state.enemies.length; i++) {
        const enemy = state.enemies[i];
        if (!enemy || (enemy.type !== 'sniperA' && enemy.type !== 'sniperB' && enemy.type !== 'raider')) continue;
        if (enemy.lastFiredAtMs <= 0) continue;
        const flashElapsed = state.elapsedMs - enemy.lastFiredAtMs;
        if (flashElapsed >= 0 && flashElapsed < MUZZLE_FLASH_DURATION_MS) {
          ff[i] = Math.min(
            Math.floor(flashElapsed / MUZZLE_FLASH_FRAME_DURATION_MS),
            MUZZLE_FLASH_FRAME_COUNT - 1,
          );
        }
      }
      setEnemySlotFlashFrames(ff.slice());

      // Tank muzzle flash frames — -1 when not flashing, per tank index.
      const newTankFlashFrames: [number, number] = [-1, -1];
      for (let ti = 0; ti < 2; ti++) {
        const t = state.tanks[ti];
        if (t && t.lastFiredAtMs > 0) {
          const elapsed = state.elapsedMs - t.lastFiredAtMs;
          if (elapsed >= 0 && elapsed < MUZZLE_FLASH_DURATION_MS) {
            newTankFlashFrames[ti] = Math.min(
              Math.floor(elapsed / MUZZLE_FLASH_FRAME_DURATION_MS),
              MUZZLE_FLASH_FRAME_COUNT - 1,
            );
          }
        }
      }
      setTankFlashFrames(newTankFlashFrames);

      // Pickup slot active flags — buffer pattern.
      const pa = timerBuffers.current.pickupActive;
      for (let i = 0; i < PICKUP_SLOT_COUNT; i++) { pa[i] = !!state.pickups[i]; }
      setPickupSlotActive(pa.slice());

      // Throwable slot state — buffer pattern.
      const tBuf = timerBuffers.current.tSlots;
      for (let i = 0; i < THROWABLE_SLOT_COUNT; i++) {
        const s = tBuf[i]!; s.type = null; s.status = null; s.frame = 0; s.targetX = 0; s.targetY = 0;
      }
      for (let i = 0; i < state.throwables.length; i++) {
        const t = state.throwables[i];
        if (!t) continue;
        const s = tBuf[i]!;
        s.type = t.type;
        s.status = t.status;
        s.frame = t.status === 'detonating'
          ? getCurrentFrame(
              { frameCount: FRAG_EXPLODE_FRAME_COUNT, frameDurationMs: FRAG_EXPLODE_FRAME_DURATION_MS, loop: false },
              state.elapsedMs - t.detonationStartedAtMs,
            )
          : 0;
        s.targetX = t.targetX;
        s.targetY = t.targetY;
      }
      setThrowableSlotData(tBuf.slice());

      // Effect zone slot state — buffer pattern.
      const zBuf = timerBuffers.current.zSlots;
      for (let i = 0; i < EFFECT_ZONE_SLOT_COUNT; i++) {
        const s = zBuf[i]!; s.type = null; s.x = 0; s.y = 0; s.frame = 0; s.rotation = 0;
      }
      for (let i = 0; i < state.effectZones.length; i++) {
        const z = state.effectZones[i];
        if (!z) continue;
        let zFrame = 0;
        if (z.type === 'smoke') {
          const elapsed = state.elapsedMs - z.spawnedAtMs;
          const LAST = SMOKE_ANIM_FRAME_COUNT - 1;
          if (elapsed < SMOKE_BLOOM_DURATION_MS) {
            zFrame = LAST - Math.floor((elapsed / SMOKE_BLOOM_DURATION_MS) * SMOKE_ANIM_FRAME_COUNT);
          } else if (elapsed < SMOKE_DURATION_MS - SMOKE_DISSIPATE_DURATION_MS) {
            zFrame = 0;
          } else {
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
        const s = zBuf[i]!;
        s.type = z.type; s.x = z.x; s.y = z.y; s.frame = zFrame; s.rotation = z.rotation;
      }
      setZoneSlotData(zBuf.slice());

      // Projectile rocket flags — buffer pattern.
      const rb = timerBuffers.current.rockets;
      for (let i = 0; i < PROJECTILE_SLOT_COUNT; i++) { rb[i] = !!(state.projectiles[i]?.isRocket); }
      setProjIsRocket(rb.slice());
      setRocketFrame(Math.floor(state.elapsedMs / ROCKET_FRAME_DURATION_MS) % ROCKET_FRAME_COUNT);

      // Crate reveal modal bridge.
      setDisplayCrateReveal(state.pendingCrateReveal);
      setDisplayCrateWeaponId(state.crateRevealWeaponId);
      setDisplayCrateTier(state.crateRevealTier);

      // Tile viewport culling: update player tile position so useMemo rebuilds
      // Atlas arrays for the visible window when the player crosses a tile boundary.
      const newTileCol = Math.floor(state.player.x / TILE_SIZE);
      const newTileRow = Math.floor(state.player.y / TILE_SIZE);
      // [STUTTER-DIAG] Log tile boundary crossings.
      const lt = lastLoggedTileRef.current;
      if (lt.col !== -1 && (newTileCol !== lt.col || newTileRow !== lt.row)) {
        console.log(`[STUTTER-DIAG] tile crossing (${lt.col},${lt.row})→(${newTileCol},${newTileRow})`);
      }
      lastLoggedTileRef.current = { col: newTileCol, row: newTileRow };
      setPlayerTileCol(newTileCol);
      setPlayerTileRow(newTileRow);
    }, 100);
    return () => clearInterval(id);
  }, [gameState]);

  // ─── Helicopter flyover scheduler ────────────────────────────────────────────
  // Viewport-relative: paths defined in screen coords. 8 routes (4 cardinal + 4 diagonal).
  // withTiming drives heliProgress 0→1; completion callback fires runOnJS to schedule next.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function scheduleNext() {
      if (cancelled) return;
      const delay = HELI_SPAWN_MIN_MS + Math.random() * (HELI_SPAWN_MAX_MS - HELI_SPAWN_MIN_MS);
      timeoutId = setTimeout(launch, delay);
    }

    function launch() {
      if (cancelled) return;
      const margin = 80;
      const hw = width / 2;
      const hh = height / 2;
      // 8 paths: route index 0-7
      const route = Math.floor(Math.random() * 8);
      let startX: number, startY: number, endX: number, endY: number;
      switch (route) {
        case 0: startX = -margin;       startY = hh;           endX = width + margin;  endY = hh;           break; // L→R
        case 1: startX = width + margin; startY = hh;           endX = -margin;         endY = hh;           break; // R→L
        case 2: startX = hw;            startY = -margin;       endX = hw;              endY = height+margin; break; // T→B
        case 3: startX = hw;            startY = height+margin; endX = hw;              endY = -margin;      break; // B→T
        case 4: startX = -margin;       startY = -margin;       endX = width+margin;    endY = height+margin; break; // TL→BR
        case 5: startX = width+margin;  startY = -margin;       endX = -margin;         endY = height+margin; break; // TR→BL
        case 6: startX = -margin;       startY = height+margin; endX = width+margin;    endY = -margin;      break; // BL→TR
        default: startX = width+margin; startY = height+margin; endX = -margin;         endY = -margin;      break; // BR→TL
      }
      const dx = endX - startX;
      const dy = endY - startY;
      const angle = Math.atan2(dy, dx) + SPRITE_ROTATION_OFFSET;
      heliFlightSV.value = { active: true, startX, startY, endX, endY, angle };
      heliProgress.value = 0;
      heliProgress.value = withTiming(1, { duration: HELI_FLYOVER_DURATION_MS }, (finished) => {
        if (finished) {
          heliFlightSV.value = { ...heliFlightSV.value, active: false };
          runOnJS(setHeliActive)(false);
          runOnJS(scheduleNext)();
        }
      });
      setHeliActive(true);
    }

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helicopter rotor animation (only runs while flyover is active) ───────────
  useEffect(() => {
    if (!heliActive) return;
    const id = setInterval(() => {
      setHeliRotorFrame((f) => (f + 1) % 3);
    }, HELI_ROTOR_FRAME_MS);
    return () => clearInterval(id);
  }, [heliActive]);

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

  // ─── Tank transforms (UI thread, no runOnJS) ──────────────────────────────
  // One base + one tower derived value per tank slot (always 2 — hooks must be unconditional).
  // Base: translate only. Tower: translate + rotate. Off-screen when slot is empty.
  const tankBaseTransform0 = useDerivedValue(() => {
    const tank = gameState.value.tanks[0];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!tank) return [{ translateX: -9999 }, { translateY: -9999 }];
    return [
      { translateX: width / 2 + (tank.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (tank.y - py) * CAMERA_ZOOM },
    ];
  });
  const tankTowerTransform0 = useDerivedValue(() => {
    const tank = gameState.value.tanks[0];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!tank) return [{ translateX: -9999 }, { translateY: -9999 }, { rotate: 0 }];
    return [
      { translateX: width / 2 + (tank.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (tank.y - py) * CAMERA_ZOOM },
      { rotate: tank.towerAngle + SPRITE_ROTATION_OFFSET },
    ];
  });
  const tankBaseTransform1 = useDerivedValue(() => {
    const tank = gameState.value.tanks[1];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!tank) return [{ translateX: -9999 }, { translateY: -9999 }];
    return [
      { translateX: width / 2 + (tank.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (tank.y - py) * CAMERA_ZOOM },
    ];
  });
  const tankTowerTransform1 = useDerivedValue(() => {
    const tank = gameState.value.tanks[1];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!tank) return [{ translateX: -9999 }, { translateY: -9999 }, { rotate: 0 }];
    return [
      { translateX: width / 2 + (tank.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (tank.y - py) * CAMERA_ZOOM },
      { rotate: tank.towerAngle + SPRITE_ROTATION_OFFSET },
    ];
  });
  const tankBaseTransforms = [tankBaseTransform0, tankBaseTransform1];
  const tankTowerTransforms = [tankTowerTransform0, tankTowerTransform1];

  // ─── Tank projectile transforms (UI thread, no runOnJS) ──────────────────
  // Max 2 active tank projectiles (one per tank, 6s cooldown ~2.25s flight).
  const tankProjectileTransform0 = useDerivedValue(() => {
    const proj = gameState.value.tankProjectiles[0];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!proj) return [{ translateX: -9999 }, { translateY: -9999 }, { rotate: 0 }];
    return [
      { translateX: width / 2 + (proj.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (proj.y - py) * CAMERA_ZOOM },
      { rotate: Math.atan2(proj.vyPxPerSec, proj.vxPxPerSec) + SPRITE_ROTATION_OFFSET },
    ];
  });
  const tankProjectileTransform1 = useDerivedValue(() => {
    const proj = gameState.value.tankProjectiles[1];
    const px = gameState.value.player.x;
    const py = gameState.value.player.y;
    if (!proj) return [{ translateX: -9999 }, { translateY: -9999 }, { rotate: 0 }];
    return [
      { translateX: width / 2 + (proj.x - px) * CAMERA_ZOOM },
      { translateY: height / 2 + (proj.y - py) * CAMERA_ZOOM },
      { rotate: Math.atan2(proj.vyPxPerSec, proj.vxPxPerSec) + SPRITE_ROTATION_OFFSET },
    ];
  });
  const tankProjectileTransforms = [tankProjectileTransform0, tankProjectileTransform1];

  // ─── Helicopter flyover transform (viewport-relative, UI thread) ───────────
  const heliTransform = useDerivedValue(() => {
    const f = heliFlightSV.value;
    if (!f.active) return [{ translateX: -9999 }, { translateY: -9999 }, { rotate: 0 }];
    const prog = heliProgress.value;
    const x = f.startX + (f.endX - f.startX) * prog;
    const y = f.startY + (f.endY - f.startY) * prog;
    return [{ translateX: x }, { translateY: y }, { rotate: f.angle }];
  });

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
    gameState.value = createInitialGameState(width, height, initialMapData.tanks, initialMapData.solidPropExclusions);
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
    state = updateGameState(state, Math.min(dtMs, 50), collisionDataShared.value);
    gameState.value = state;

    // [STUTTER-DIAG] Detect long frames (>20ms = stutter candidate).
    if (dtMs > 20) {
      runOnJS(logLongFrame)(dtMs, state.elapsedMs);
    }

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

          {/* ── Scatter props (z=1: vegetation → rocks → barrels → wrecks → structures) */}
          {/* One Atlas per assetKey type. Static world-space RSXforms; camera Group  */}
          {/* scrolls them. Skipped per-entry if image is still null during load.     */}
          {[
            ...Object.entries(propAtlasData.vegetation),
            ...Object.entries(propAtlasData.obstacles),
            ...Object.entries(propAtlasData.barrels),
            ...Object.entries(propAtlasData.wrecks),
            ...Object.entries(propAtlasData.buildings),
          ].map(([assetKey, { sprites, transforms }]) => {
            const img = propImageLookup[assetKey];
            if (!img) return null;
            return (
              <Atlas
                key={`prop-${assetKey}`}
                image={img}
                sprites={sprites}
                transforms={transforms}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
            );
          })}

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
          {/* Rockets: rocketF1 sprite (3×12, 2× scale). Bullets: GunnerBullet (1×3, 2× scale). */}
          {/* Transform includes rotation from atan2(vy, vx) — sprite points in travel dir.  */}
          {allProjectileTransforms.map((transform, i) => {
            if (projIsRocket[i]) {
              if (!rocketF1Image) {
                return (
                  <Group key={`proj-${i}`} transform={transform}>
                    <Circle cx={0} cy={0} r={4} color="#f5c842" />
                  </Group>
                );
              }
              const rw = rocketF1Image.width() * EFFECT_SPRITE_SCALE;
              const rh = rocketF1Image.height() * EFFECT_SPRITE_SCALE;
              return (
                <Group key={`proj-${i}`} transform={transform}>
                  <Image
                    image={rocketF1Image}
                    x={-rw / 2}
                    y={-rh / 2}
                    width={rw}
                    height={rh}
                    sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                  />
                </Group>
              );
            }
            if (!bulletImage) {
              return (
                <Group key={`proj-${i}`} transform={transform}>
                  <Circle cx={0} cy={0} r={4} color="#f5c842" />
                </Group>
              );
            }
            const bw = bulletImage.width() * EFFECT_SPRITE_SCALE;
            const bh = bulletImage.height() * EFFECT_SPRITE_SCALE;
            return (
              <Group key={`proj-${i}`} transform={transform}>
                <Image
                  image={bulletImage}
                  x={-bw / 2}
                  y={-bh / 2}
                  width={bw}
                  height={bh}
                  sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                />
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

          {/* ── Tank turrets (Phase 5 G5) ─────────────────────────────────── */}
          {/* One ACS + one Panzer. Two sibling animated Groups per tank      */}
          {/* (base + tower) — avoids animated-wrapping-animated stutter.     */}
          {initialMapData.tanks.map((mapTank, ti) => {
            const baseTransform  = tankBaseTransforms[ti]!;
            const towerTransform = tankTowerTransforms[ti]!;
            const projTransform  = tankProjectileTransforms[ti]!;
            const baseImg  = mapTank.variant === 'acs' ? acsBaseImage  : panzerBaseImage;
            const towerImg = mapTank.variant === 'acs' ? acsTowerImage : panzerTowerImage;
            if (!baseImg || !towerImg) return null;
            const flashOffset = mapTank.variant === 'acs' ? ACS_FLASH_OFFSET : PANZER_FLASH_OFFSET;
            const flashFrame  = tankFlashFrames[ti] ?? -1;
            const flashImg    = flashFrame >= 0 ? (muzzleFlashPanzerImages[flashFrame] ?? null) : null;
            const bw = baseImg.width()  * TANK_SPRITE_SCALE;
            const bh = baseImg.height() * TANK_SPRITE_SCALE;
            const tw = towerImg.width()  * TANK_SPRITE_SCALE;
            const th = towerImg.height() * TANK_SPRITE_SCALE;
            return (
              <React.Fragment key={`tank-${ti}`}>
                <Group transform={baseTransform}>
                  <Image
                    image={baseImg}
                    x={-bw / 2}
                    y={-bh / 2}
                    width={bw}
                    height={bh}
                    sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                  />
                </Group>
                <Group transform={towerTransform}>
                  <Image
                    image={towerImg}
                    x={-tw / 2}
                    y={-th / 2}
                    width={tw}
                    height={th}
                    sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                  />
                  {flashImg && (
                    <Image
                      image={flashImg}
                      x={flashOffset.x * TANK_SPRITE_SCALE - (flashImg.width() * TANK_SPRITE_SCALE) / 2}
                      y={flashOffset.y * TANK_SPRITE_SCALE - (flashImg.height() * TANK_SPRITE_SCALE) / 2}
                      width={flashImg.width() * TANK_SPRITE_SCALE}
                      height={flashImg.height() * TANK_SPRITE_SCALE}
                      sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                    />
                  )}
                </Group>
                <Group transform={projTransform}>
                  {rocket0 && (() => {
                    const rw = rocket0.width()  * TANK_PROJECTILE_SCALE;
                    const rh = rocket0.height() * TANK_PROJECTILE_SCALE;
                    return (
                      <Image
                        image={rocket0}
                        x={-rw / 2}
                        y={-rh / 2}
                        width={rw}
                        height={rh}
                        sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                      />
                    );
                  })()}
                </Group>
              </React.Fragment>
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
              ? (type === 'scav' ? scavDieImages
                : type === 'raider' ? raiderDieImages
                : type === 'sniperA' ? sniperADieImages
                : sniperBDieImages)
              : (type === 'scav' ? scavWalkImages
                : type === 'raider' ? raiderWalkImages
                : type === 'sniperA' ? sniperAWalkImages
                : sniperBWalkImages);

            const img = images[enemySlotFrames[i]] ?? null;
            if (!img) return null;
            const w = img.width() * ENEMY_SPRITE_SCALE;
            const h = img.height() * ENEMY_SPRITE_SCALE;

            const bodyOverlay = !isDying
              ? (type === 'scav' ? scavBodyImage
                : type === 'raider' ? raiderBodyImage
                : type === 'sniperA' ? sniperABodyImage
                : null) // sniperB (Soldier02) is full-character — no overlay needed
              : null;
            const bw = bodyOverlay ? bodyOverlay.width() * ENEMY_SPRITE_SCALE : 0;
            const bh = bodyOverlay ? bodyOverlay.height() * ENEMY_SPRITE_SCALE : 0;

            const flashFrame = (type === 'sniperA' || type === 'sniperB' || type === 'raider') ? (enemySlotFlashFrames[i] ?? -1) : -1;
            const flashImgs = type === 'sniperA' ? muzzleFlashAImages : type === 'raider' ? muzzleFlashRaiderImages : muzzleFlashBImages;
            const flashImg = flashFrame >= 0 ? (flashImgs[flashFrame] ?? null) : null;
            const flashOffset = type === 'sniperA' ? SNIPER_A_FLASH_OFFSET : type === 'raider' ? RAIDER_FLASH_OFFSET : SNIPER_B_FLASH_OFFSET;

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
                {flashImg && (
                  <Image
                    image={flashImg}
                    x={-flashImg.width() * EFFECT_SPRITE_SCALE / 2 + flashOffset.x}
                    y={-flashImg.height() * EFFECT_SPRITE_SCALE / 2 + flashOffset.y}
                    width={flashImg.width() * EFFECT_SPRITE_SCALE}
                    height={flashImg.height() * EFFECT_SPRITE_SCALE}
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

          {/* Helicopter ambient flyover — viewport-relative, above player/enemies, below UI.
              Two-layer composite: static body + animated rotor overlay at same center.
              Spawns off-screen edge, crosses viewport in ~4.5s, despawns at far edge. */}
          {heliActive && heliBodyImage && (() => {
            const rotorImg = heliRotorImages[heliRotorFrame] ?? null;
            const hw = heliBodyImage.width() * HELI_SPRITE_SCALE;
            const hh = heliBodyImage.height() * HELI_SPRITE_SCALE;
            return (
              <Group transform={heliTransform}>
                <Image
                  image={heliBodyImage}
                  x={-hw / 2}
                  y={-hh / 2}
                  width={hw}
                  height={hh}
                  sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                />
                {rotorImg && (
                  <Image
                    image={rotorImg}
                    x={-hw / 2}
                    y={-hh / 2}
                    width={hw}
                    height={hh}
                    sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                  />
                )}
              </Group>
            );
          })()}

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
