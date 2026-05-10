/**
 * progressionEngine.ts — XP → level-up detection.
 *
 * Runs after tickPickups in updateGameState. Checks whether the player's
 * accumulated XP has crossed one or more level thresholds. If so, sets
 * pendingLevelUp = true and increments pendingLevelUpCount by the number
 * of levels crossed.
 *
 * The player's level field does NOT increment here — that happens in G3
 * when the player selects a skill from the level-up modal. The level shown
 * in the modal is "what you're leveling UP to," so the increment belongs
 * at selection time, not detection time.
 *
 * Multi-level detection: if a single XP grant crosses two thresholds at once
 * (rare at low levels — e.g., a large bonus XP pickup in Phase 4b), both are
 * counted in pendingLevelUpCount so G3 can queue subsequent modals.
 *
 * All functions marked 'worklet' — runs on the Reanimated UI thread inside
 * the useFrameCallback game loop.
 */

import { xpForLevel } from '../data/balance';
import { audioEngine } from './audioEngine';
import type { GameState } from './gameEngine';

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
