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

import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Circle,
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

import { HeroSprites, EnemySprites, PickupSprites, EffectSprites } from '../lib/sprites';
import type { HeroWeaponPose } from '../lib/sprites';
import { SKILLS, SKILL_IDS, getEffectiveStats } from '../data/skills';
import type { SkillId } from '../data/skills';
import { WEAPON_PROFILES } from '../data/weapons';
import LevelUpModal from './LevelUpModal';
import ReviveModal from './ReviveModal';
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
  MOLOTOV_FIRE_FRAME_COUNT,
  MOLOTOV_FIRE_FRAME_DURATION_MS,
  EFFECT_SPRITE_SCALE,
  SMOKE_RADIUS_PX,
} from '../data/gameConstants';
import type { EnemyType } from '../data/enemies';
import { createInitialGameState, updateGameState } from '../lib/gameEngine';
import type { GameState } from '../lib/gameEngine';
import { spawnThrowable } from '../lib/throwableEngine';
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

/**
 * Guaranteed weapon floor unlocks — triggers inside handleSkillSelect when
 * player.level increments to one of these values.
 * Both equippedWeaponId (combat stats) and weaponPose (animation) are set together.
 * NOTE: the debug cycle button only mutates weaponPose — it is NOT a reliable
 * indicator of which weapon is equipped. Verify unlocks via combat behavior
 * (fire rate, range, damage), not by reading the cycle button face.
 */
const WEAPON_UNLOCK_MAP: Record<number, { weaponId: string; weaponPose: HeroWeaponPose }> = {
  4:  { weaponId: 'aks74u', weaponPose: 'pistol' },
  8:  { weaponId: 'ak74',   weaponPose: 'rifle' },
  12: { weaponId: 'pkm',    weaponPose: 'machinegun' },
  16: { weaponId: 'svd',    weaponPose: 'rifle' },
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
function useEnemySlotTransform(gameState: SharedValue<GameState>, slotIndex: number) {
  return useDerivedValue(() => {
    const enemy = gameState.value.enemies[slotIndex];
    if (!enemy) return [{ translateX: 0 }, { translateY: 0 }, { rotate: 0 }];
    const dx = gameState.value.player.x - enemy.x;
    const dy = gameState.value.player.y - enemy.y;
    return [
      { translateX: enemy.x },
      { translateY: enemy.y },
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
 * 30 constant Skia subscriptions are safe given the runOnJS(true) gesture fix
 * that resolved the frame-flush issue in G1.
 */
function useProjectileSlotTransform(gameState: SharedValue<GameState>, slotIndex: number) {
  return useDerivedValue(() => {
    const proj = gameState.value.projectiles[slotIndex];
    if (!proj) return [{ translateX: -9999 }, { translateY: -9999 }];
    return [{ translateX: proj.x }, { translateY: proj.y }];
  });
}

/**
 * Per-slot pickup transform — one useDerivedValue per pre-allocated slot.
 * Same always-render pattern as projectile slots: inactive slots go to
 * (-9999, -9999). No React state needed for pickup slot activity — position
 * updates happen every frame via derived value.
 */
function usePickupSlotTransform(gameState: SharedValue<GameState>, slotIndex: number) {
  return useDerivedValue(() => {
    const pickup = gameState.value.pickups[slotIndex];
    if (!pickup) return [{ translateX: -9999 }, { translateY: -9999 }];
    return [{ translateX: pickup.x }, { translateY: pickup.y }];
  });
}

/**
 * Throwable arc position — one useDerivedValue per pre-allocated throwable slot.
 * Computes the parabolic arc screen position for a flying throwable.
 * Returns {x: -9999, y: -9999} when the slot is null or 'detonating'
 * (detonating frags are rendered at their static targetX/Y via React state).
 *
 * Arc formula:
 *   fraction = clamp((elapsedMs - thrownAtMs) / THROWABLE_TRAVEL_TIME_MS, 0, 1)
 *   x = lerp(spawnX, targetX, fraction)
 *   y = lerp(spawnY, targetY, fraction) - sin(fraction * PI) * THROWABLE_ARC_HEIGHT_PX
 */
function useThrowableSlotPos(gameState: SharedValue<GameState>, slotIndex: number) {
  return useDerivedValue(() => {
    const t = gameState.value.throwables[slotIndex];
    if (!t || t.status !== 'flying') return { x: -9999, y: -9999 };
    const elapsed = gameState.value.elapsedMs - t.thrownAtMs;
    const frac = Math.min(elapsed / THROWABLE_TRAVEL_TIME_MS, 1);
    const arcX = t.spawnX + (t.targetX - t.spawnX) * frac;
    const arcY = (t.spawnY + (t.targetY - t.spawnY) * frac)
               - Math.sin(frac * Math.PI) * THROWABLE_ARC_HEIGHT_PX;
    return { x: arcX, y: arcY };
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

  // ─── Pickup sprite image ──────────────────────────────────────────────────
  const moneySmallImage = useImage(PickupSprites.money.small);

  // ─── Effect sprite images (loaded once at mount, all unconditional) ───────
  // Explode: 4 frames (Explode/1–4.png) — frag detonation, non-looping.
  // Flame: 7 frames (Flamethrower/1–7.png) — molotov zone, looping.
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
        type: null as 'smoke' | 'molotov' | null,
        x: 0,
        y: 0,
        frame: 0,
      }));
      for (let i = 0; i < state.effectZones.length; i++) {
        const z = state.effectZones[i];
        if (!z) continue;
        let zFrame = 0;
        if (z.type === 'molotov') {
          zFrame = getCurrentFrame(
            { frameCount: MOLOTOV_FIRE_FRAME_COUNT, frameDurationMs: MOLOTOV_FIRE_FRAME_DURATION_MS, loop: true },
            state.elapsedMs - z.spawnedAtMs,
          );
        }
        zSlots[i] = { type: z.type, x: z.x, y: z.y, frame: zFrame };
      }
      setZoneSlotData(zSlots);
    }, 100);
    return () => clearInterval(id);
  }, [gameState]);

  // ─── Per-slot enemy transforms (UI thread, no runOnJS) ────────────────────
  // One useDerivedValue per slot. Only slots with an active enemy are rendered
  // in JSX, so only those create Skia animated-prop subscriptions.
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
  const pTransform0  = useProjectileSlotTransform(gameState, 0);
  const pTransform1  = useProjectileSlotTransform(gameState, 1);
  const pTransform2  = useProjectileSlotTransform(gameState, 2);
  const pTransform3  = useProjectileSlotTransform(gameState, 3);
  const pTransform4  = useProjectileSlotTransform(gameState, 4);
  const pTransform5  = useProjectileSlotTransform(gameState, 5);
  const pTransform6  = useProjectileSlotTransform(gameState, 6);
  const pTransform7  = useProjectileSlotTransform(gameState, 7);
  const pTransform8  = useProjectileSlotTransform(gameState, 8);
  const pTransform9  = useProjectileSlotTransform(gameState, 9);
  const pTransform10 = useProjectileSlotTransform(gameState, 10);
  const pTransform11 = useProjectileSlotTransform(gameState, 11);
  const pTransform12 = useProjectileSlotTransform(gameState, 12);
  const pTransform13 = useProjectileSlotTransform(gameState, 13);
  const pTransform14 = useProjectileSlotTransform(gameState, 14);
  const pTransform15 = useProjectileSlotTransform(gameState, 15);
  const pTransform16 = useProjectileSlotTransform(gameState, 16);
  const pTransform17 = useProjectileSlotTransform(gameState, 17);
  const pTransform18 = useProjectileSlotTransform(gameState, 18);
  const pTransform19 = useProjectileSlotTransform(gameState, 19);
  const pTransform20 = useProjectileSlotTransform(gameState, 20);
  const pTransform21 = useProjectileSlotTransform(gameState, 21);
  const pTransform22 = useProjectileSlotTransform(gameState, 22);
  const pTransform23 = useProjectileSlotTransform(gameState, 23);
  const pTransform24 = useProjectileSlotTransform(gameState, 24);
  const pTransform25 = useProjectileSlotTransform(gameState, 25);
  const pTransform26 = useProjectileSlotTransform(gameState, 26);
  const pTransform27 = useProjectileSlotTransform(gameState, 27);
  const pTransform28 = useProjectileSlotTransform(gameState, 28);
  const pTransform29 = useProjectileSlotTransform(gameState, 29);
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
  const pkTransform0  = usePickupSlotTransform(gameState, 0);
  const pkTransform1  = usePickupSlotTransform(gameState, 1);
  const pkTransform2  = usePickupSlotTransform(gameState, 2);
  const pkTransform3  = usePickupSlotTransform(gameState, 3);
  const pkTransform4  = usePickupSlotTransform(gameState, 4);
  const pkTransform5  = usePickupSlotTransform(gameState, 5);
  const pkTransform6  = usePickupSlotTransform(gameState, 6);
  const pkTransform7  = usePickupSlotTransform(gameState, 7);
  const pkTransform8  = usePickupSlotTransform(gameState, 8);
  const pkTransform9  = usePickupSlotTransform(gameState, 9);
  const pkTransform10 = usePickupSlotTransform(gameState, 10);
  const pkTransform11 = usePickupSlotTransform(gameState, 11);
  const pkTransform12 = usePickupSlotTransform(gameState, 12);
  const pkTransform13 = usePickupSlotTransform(gameState, 13);
  const pkTransform14 = usePickupSlotTransform(gameState, 14);
  const pkTransform15 = usePickupSlotTransform(gameState, 15);
  const pkTransform16 = usePickupSlotTransform(gameState, 16);
  const pkTransform17 = usePickupSlotTransform(gameState, 17);
  const pkTransform18 = usePickupSlotTransform(gameState, 18);
  const pkTransform19 = usePickupSlotTransform(gameState, 19);
  const pkTransform20 = usePickupSlotTransform(gameState, 20);
  const pkTransform21 = usePickupSlotTransform(gameState, 21);
  const pkTransform22 = usePickupSlotTransform(gameState, 22);
  const pkTransform23 = usePickupSlotTransform(gameState, 23);
  const pkTransform24 = usePickupSlotTransform(gameState, 24);
  const pkTransform25 = usePickupSlotTransform(gameState, 25);
  const pkTransform26 = usePickupSlotTransform(gameState, 26);
  const pkTransform27 = usePickupSlotTransform(gameState, 27);
  const pkTransform28 = usePickupSlotTransform(gameState, 28);
  const pkTransform29 = usePickupSlotTransform(gameState, 29);
  const pkTransform30 = usePickupSlotTransform(gameState, 30);
  const pkTransform31 = usePickupSlotTransform(gameState, 31);
  const pkTransform32 = usePickupSlotTransform(gameState, 32);
  const pkTransform33 = usePickupSlotTransform(gameState, 33);
  const pkTransform34 = usePickupSlotTransform(gameState, 34);
  const pkTransform35 = usePickupSlotTransform(gameState, 35);
  const pkTransform36 = usePickupSlotTransform(gameState, 36);
  const pkTransform37 = usePickupSlotTransform(gameState, 37);
  const pkTransform38 = usePickupSlotTransform(gameState, 38);
  const pkTransform39 = usePickupSlotTransform(gameState, 39);
  const pkTransform40 = usePickupSlotTransform(gameState, 40);
  const pkTransform41 = usePickupSlotTransform(gameState, 41);
  const pkTransform42 = usePickupSlotTransform(gameState, 42);
  const pkTransform43 = usePickupSlotTransform(gameState, 43);
  const pkTransform44 = usePickupSlotTransform(gameState, 44);
  const pkTransform45 = usePickupSlotTransform(gameState, 45);
  const pkTransform46 = usePickupSlotTransform(gameState, 46);
  const pkTransform47 = usePickupSlotTransform(gameState, 47);
  const pkTransform48 = usePickupSlotTransform(gameState, 48);
  const pkTransform49 = usePickupSlotTransform(gameState, 49);
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

  // ─── Throwable slot arc positions (UI thread, no runOnJS) ────────────────
  // 10 pre-allocated slots. Flying slots interpolate the arc each frame.
  // Detonating/null slots return {x:-9999,y:-9999} — rendered off-screen.
  const tPos0 = useThrowableSlotPos(gameState, 0);
  const tPos1 = useThrowableSlotPos(gameState, 1);
  const tPos2 = useThrowableSlotPos(gameState, 2);
  const tPos3 = useThrowableSlotPos(gameState, 3);
  const tPos4 = useThrowableSlotPos(gameState, 4);
  const tPos5 = useThrowableSlotPos(gameState, 5);
  const tPos6 = useThrowableSlotPos(gameState, 6);
  const tPos7 = useThrowableSlotPos(gameState, 7);
  const tPos8 = useThrowableSlotPos(gameState, 8);
  const tPos9 = useThrowableSlotPos(gameState, 9);
  const allThrowablePos = [tPos0, tPos1, tPos2, tPos3, tPos4, tPos5, tPos6, tPos7, tPos8, tPos9];

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
  // frame drives molotov flame animation.
  const [zoneSlotData, setZoneSlotData] = useState<Array<{
    type: 'smoke' | 'molotov' | null;
    x: number;
    y: number;
    frame: number;
  }>>(() => Array.from({ length: EFFECT_ZONE_SLOT_COUNT }, () => ({
    type: null, x: 0, y: 0, frame: 0,
  })));

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

  // ─── Debug throwable spawn buttons ────────────────────────────────────────
  // TEMPORARY — G5 TODO: remove these buttons when throwable skills are wired.
  // Spawn target = 100px ahead of player in facing direction.
  const spawnDebugThrowable = useCallback((type: 'frag' | 'smoke' | 'molotov') => {
    const state = gameState.value;
    const targetX = state.player.x + Math.cos(state.player.rotation) * 100;
    const targetY = state.player.y + Math.sin(state.player.rotation) * 100;
    gameState.value = spawnThrowable(state, type, targetX, targetY);
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

    // On-selection effect: fires after stack increment, before modal close.
    // Uses newStacks so any passive bonuses from this same selection apply to the cap.
    const skillDef = SKILLS[id];
    let newHp = state.player.hp;
    if (skillDef.onSelectEffect?.healHp) {
      const weapon = WEAPON_PROFILES[state.player.equippedWeaponId];
      const effective = getEffectiveStats(newStacks, weapon, state.player.maxHp);
      newHp = Math.min(state.player.hp + skillDef.onSelectEffect.healHp, effective.maxHp);
    }

    // Weapon floor unlock: levels 4, 8, 12, 16 auto-equip the next weapon tier.
    // Sets both equippedWeaponId (combat stats) and weaponPose (animation).
    const unlock = WEAPON_UNLOCK_MAP[newLevel];

    gameState.value = {
      ...state,
      player: {
        ...state.player,
        skillStacks: newStacks,
        level: newLevel,
        hp: newHp,
        ...(unlock !== undefined
          ? { equippedWeaponId: unlock.weaponId, weaponPose: unlock.weaponPose }
          : {}),
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
    gameState.value = createInitialGameState(width, height);
    accumulator.value = 0;
  }, [gameState, accumulator, width, height]);

  // ─── Virtual joystick gesture ──────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .runOnJS(true)
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

  return (
    <GestureDetector gesture={panGesture}>
      <View style={StyleSheet.absoluteFill}>
        {/* TODO Phase 5: wrap world rendering in <Group> with camera transform.
            scale = zoom level, translate = camera offset following player.
            Visual sprite scale (currently 2×) will likely need tuning once
            tiles + enemies + HUD are all visible together. */}
        <Canvas style={StyleSheet.absoluteFill}>

          {/* ── Effect zones (below pickups) ──────────────────────────────── */}
          {/* Z-order: zones < pickups < projectiles < throwables < enemies.  */}
          {/* Smoke: grey Skia Circle (Phase 6: no kit smoke sprite).         */}
          {/* Molotov: looping Flamethrower sprite (7 frames × 120ms).        */}
          {zoneSlotData.map((z, i) => {
            if (!z.type) return null;
            if (z.type === 'smoke') {
              return (
                <Circle
                  key={`zone-${i}`}
                  cx={z.x}
                  cy={z.y}
                  r={SMOKE_RADIUS_PX}
                  color="rgba(160, 200, 160, 0.45)"
                />
              );
            }
            // Molotov — flame sprite
            const flameImg = flameImages[z.frame] ?? null;
            if (!flameImg) return null;
            const fw = flameImg.width() * EFFECT_SPRITE_SCALE;
            const fh = flameImg.height() * EFFECT_SPRITE_SCALE;
            return (
              <Image
                key={`zone-${i}`}
                image={flameImg}
                x={z.x - fw / 2}
                y={z.y - fh / 2}
                width={fw}
                height={fh}
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
            );
          })}

          {/* ── Pickups (below projectiles and enemies) ───────────────────── */}
          {/* Always render all 50 slots. Inactive slots sit at (-9999,-9999). */}
          {/* Z-order: pickups < projectiles < enemies < player < overlays.    */}
          {moneySmallImage && allPickupTransforms.map((transform, i) => (
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
          ))}

          {/* ── Projectiles (below enemies, above pickups) ─────────────────── */}
          {/* Always render all 30 slots. Inactive slots sit at (-9999,-9999). */}
          {allProjectileTransforms.map((transform, i) => (
            <Group key={`proj-${i}`} transform={transform}>
              <Circle cx={0} cy={0} r={4} color="#f5c842" />
            </Group>
          ))}

          {/* ── Throwables (above projectiles, below enemies) ─────────────── */}
          {/* Flying: colored circle following arc (useDerivedValue per slot). */}
          {/* Detonating (frag): Explode sprite at static targetX/Y.           */}
          {throwableSlotData.map((t, i) => {
            if (!t.type) return null;

            if (t.status === 'flying') {
              const pos = allThrowablePos[i]!;
              const color = THROWABLE_COLORS[t.type];
              return (
                <Group key={`throw-${i}`} transform={[{ translateX: pos.value.x }, { translateY: pos.value.y }]}>
                  <Circle cx={0} cy={0} r={5} color={color} />
                </Group>
              );
            }

            if (t.status === 'detonating') {
              const expImg = explodeImages[t.frame] ?? null;
              if (!expImg) return null;
              const ew = expImg.width() * EFFECT_SPRITE_SCALE;
              const eh = expImg.height() * EFFECT_SPRITE_SCALE;
              return (
                <Image
                  key={`throw-${i}`}
                  image={expImg}
                  x={t.targetX - ew / 2}
                  y={t.targetY - eh / 2}
                  width={ew}
                  height={eh}
                  sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                />
              );
            }

            return null;
          })}

          {/* ── Enemies (below player) ────────────────────────────────────── */}
          {/* transform = per-slot useDerivedValue (UI thread, no runOnJS).   */}
          {/* Only active slots render a <Group>, breaking Skia subscriptions */}
          {/* for empty slots.                                                 */}
          {allSlotTransforms.map((transform, i) => {
            const type = enemySlotTypes[i];
            if (!type) return null;
            const status = enemySlotStatuses[i];
            const isDying = status === 'dying';

            // Select image array based on type and current state.
            // Dying enemies use die frames; alive enemies use walk/fire frames.
            const images = isDying
              ? (type === 'scav' ? scavDieImages : raiderDieImages)
              : (type === 'scav' ? scavWalkImages : raiderFireImages);

            const img = images[enemySlotFrames[i]] ?? null;
            if (!img) return null;
            const w = img.width() * ENEMY_SPRITE_SCALE;
            const h = img.height() * ENEMY_SPRITE_SCALE;

            // Body overlay: only for alive Scavs.
            // Dying Scavs show die frames which are full-body — no overlay needed.
            const bodyOverlay = (type === 'scav' && !isDying) ? scavBodyImage : null;
            const bw = bodyOverlay ? bodyOverlay.width() * ENEMY_SPRITE_SCALE : 0;
            const bh = bodyOverlay ? bodyOverlay.height() * ENEMY_SPRITE_SCALE : 0;

            return (
              <Group key={i} transform={transform}>
                {/* Bottom layer: walk/fire frame (alive) or die frame (dying) */}
                <Image
                  image={img}
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
                />
                {/* Top layer: Scav upper body — only while alive */}
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
                    Radius uses HIT_FLASH_RADIUS_PX (~1/3 of collision radius) so the flash
                    reads as an impact splash rather than enveloping the sprite.
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

        {/* Debug throwable spawn buttons — TEMPORARY, G5 TODO: remove.
            Spawn target = 100px in front of player facing direction.         */}
        <View style={[styles.debugOverlay, { top: 110, left: 10 }]} pointerEvents="box-none">
          <Pressable onPress={() => spawnDebugThrowable('frag')}>
            <Text style={[styles.debugText, { color: THROWABLE_COLORS.frag }]}>▶ FRAG</Text>
          </Pressable>
          <Pressable onPress={() => spawnDebugThrowable('smoke')}>
            <Text style={[styles.debugText, { color: THROWABLE_COLORS.smoke }]}>▶ SMOKE</Text>
          </Pressable>
          <Pressable onPress={() => spawnDebugThrowable('molotov')}>
            <Text style={[styles.debugText, { color: THROWABLE_COLORS.molotov }]}>▶ MOLOTOV</Text>
          </Pressable>
        </View>

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
