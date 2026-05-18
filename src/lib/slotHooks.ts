import {
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import {
  CAMERA_ZOOM,
  THROWABLE_TRAVEL_TIME_MS,
  THROWABLE_ARC_HEIGHT_PX,
} from '../data/gameConstants';
import type { GameState } from './gameEngine';

// Rotation offset: TDS kit sprites face DOWN by default.
// Subtract π/2 to align with atan2 convention (0 = right).
// Applied to both hero and enemy transforms.
export const SPRITE_ROTATION_OFFSET = -Math.PI / 2;

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
export function useEnemySlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
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
export function useProjectileSlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
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
export function usePickupSlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
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
export function useCrateSlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
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
export function useThrowableSlotTransform(gameState: SharedValue<GameState>, slotIndex: number, width: number, height: number) {
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
export function useEnemySlotFlash(gameState: SharedValue<GameState>, slotIndex: number) {
  return useDerivedValue((): number => {
    const enemy = gameState.value.enemies[slotIndex];
    return !!enemy && gameState.value.elapsedMs < enemy.hitFlashUntilMs ? 0.75 : 0;
  });
}
