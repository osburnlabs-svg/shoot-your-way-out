/**
 * progressionEngine.ts — HP regen (tickRegen) and XP → level-up detection (tickProgression).
 *
 * tickRegen:
 *   Runs after tickPickups in updateGameState. Applies per-second HP regeneration from
 *   provisions_painkillers / provisions_stims stacks. Uses getEffectiveStats to read
 *   the live hpRegenPerSec value (may be negative if stims outweigh painkillers).
 *   HP is clamped to [0, effective.maxHp].
 *
 * tickProgression:
 *   Runs after tickRegen in updateGameState. Checks whether the player's accumulated XP
 *   has crossed one or more level thresholds. If so, sets pendingLevelUp = true and
 *   increments pendingLevelUpCount by the number of levels crossed.
 *
 *   The player's level field does NOT increment here — that happens in G3 when the player
 *   selects a skill from the level-up modal. The level shown in the modal is "what you're
 *   leveling UP to," so the increment belongs at selection time, not detection time.
 *
 *   Multi-level detection: if a single XP grant crosses two thresholds at once (rare —
 *   e.g., a large bonus XP pickup in Phase 4b), both are counted in pendingLevelUpCount
 *   so G3 can queue subsequent modals.
 *
 * All functions marked 'worklet' — run on the Reanimated UI thread inside
 * the useFrameCallback game loop.
 */

import { xpForLevel } from '../data/balance';
import { getEffectiveStats } from '../data/skills';
import { WEAPON_PROFILES } from '../data/weapons';
import { audioEngine } from './audioEngine';
import type { GameState } from './gameEngine';

/**
 * Apply HP regeneration for this tick.
 *
 * Reads hpRegenPerSec and maxHp from effective stats (provisions_painkillers /
 * provisions_stims stacks). Clamps resulting HP to [0, effective.maxHp].
 * Returns state unchanged when the net regen rate is 0 or HP is already at max.
 */
export function tickRegen(state: GameState, dtMs: number): GameState {
  'worklet';

  const { player } = state;
  const weapon = WEAPON_PROFILES[player.equippedWeaponId];
  if (!weapon) return state;

  const effective = getEffectiveStats(player.skillStacks, weapon, player.maxHp);
  if (effective.hpRegenPerSec === 0) return state;

  const regenThisTick = effective.hpRegenPerSec * (dtMs / 1000);
  const newHp = Math.min(effective.maxHp, Math.max(0, player.hp + regenThisTick));
  if (newHp === player.hp) return state;

  return {
    ...state,
    player: {
      ...player,
      hp: newHp,
    },
  };
}

/**
 * Check whether the player's XP has crossed any level thresholds this tick.
 * If so, freeze the game via pendingLevelUp and record how many levels were earned.
 *
 * Returns state unchanged when no threshold was crossed.
 */
export function tickProgression(state: GameState): GameState {
  'worklet';

  let levelsEarned = 0;
  let checkLevel = state.player.level;

  while (state.player.xp >= xpForLevel(checkLevel + 1)) {
    levelsEarned++;
    checkLevel++;
  }

  if (levelsEarned === 0) return state;

  // Phase 6 wires the actual sound — stub is a no-op but the call site is correct.
  audioEngine.playSFX('level_up_chime');

  return {
    ...state,
    pendingLevelUp: true,
    pendingLevelUpCount: state.pendingLevelUpCount + levelsEarned,
  };
}
