/**
 * Phase 4a + 4b G1 skills — stat-only upgrades selectable from the level-up modal.
 *
 * Design rules:
 *   - Most effects are flat additive modifiers applied via getEffectiveStats (worklet-safe).
 *   - Additive stacking: +20% per stack × 3 stacks = 1 + (0.2 × 3) = 1.6× total.
 *   - getEffectiveStats is a pure worklet — safe to call on the Reanimated UI thread.
 *   - No function-valued effect fields — flat number fields only (worklet Babel constraint).
 *   - Circular-dependency guard: takes (skillStacks, weapon, baseMaxHp) instead of
 *     full PlayerState/GameState so data/skills.ts never imports from lib/gameEngine.ts.
 *
 * Inline-effect skills (Phase 4b G1): Hollow Points, Suppressor, Helmet, Comms Headset.
 *   These skills have effect: {} — their logic is conditional or contextual and cannot be
 *   expressed as flat modifiers. combatEngine.ts and pickupEngine.ts read skillStacks
 *   directly and apply the effect inline. The registry entry is still needed for modal
 *   display (displayName, description, maxStacks, icon).
 */

import { PLAYER_MOVE_SPEED_PX_PER_SEC } from './gameConstants';
import type { WeaponProfile } from './weapons';

// ─── Skill IDs ────────────────────────────────────────────────────────────────

export type SkillId =
  | 'ammo_545bt'
  | 'ammo_subsonic'
  | 'ammo_tracer'
  | 'ammo_hollow_points'
  | 'optics_red_dot'
  | 'optics_pso_scope'
  | 'optics_suppressor'
  | 'gear_plate_carrier'
  | 'gear_tactical_boots'
  | 'gear_mre'
  | 'gear_ceramic_insert'
  | 'gear_helmet'
  | 'provisions_painkillers'
  | 'provisions_stims'
  | 'provisions_comms_headset';

// ─── Effect descriptor ────────────────────────────────────────────────────────

/**
 * Flat additive modifier fields. Each field is optional — omit means no effect.
 * Multiplied by stack count in getEffectiveStats.
 *
 * Mult fields: added to a base of 1.0 before multiplication.
 *   e.g. damageMultAdd: 0.2 → damageMult += 0.2 per stack → 1 + (0.2 × stacks)
 *
 * Add fields: summed directly across stacks.
 *   e.g. maxHpAdd: 15 → maxHp += 15 per stack
 *
 * pierceAdd: integer pierce penetrations per stack (e.g. 1 → projectile hits 1 extra enemy).
 */
type SkillEffect = {
  damageMultAdd?: number;
  fireRateMultAdd?: number;
  rangeMultAdd?: number;
  damageTakenMultAdd?: number;
  moveSpeedMultAdd?: number;
  maxHpAdd?: number;
  hpRegenPerSecAdd?: number;
  pierceAdd?: number;
};

// ─── Skill definition ─────────────────────────────────────────────────────────

export type SkillDefinition = {
  id: SkillId;
  displayName: string;
  description: string;
  category: 'ammo' | 'optics' | 'gear' | 'provisions';
  maxStacks: number;
  effect: SkillEffect;
};

// ─── Skill registry ───────────────────────────────────────────────────────────

export const SKILLS: Record<SkillId, SkillDefinition> = {
  ammo_545bt: {
    id: 'ammo_545bt',
    displayName: 'Armor-Piercing Rounds',
    description: '+20% damage per stack.',
    category: 'ammo',
    maxStacks: 3,
    effect: { damageMultAdd: 0.2 },
  },
  ammo_subsonic: {
    id: 'ammo_subsonic',
    displayName: 'Subsonic Rounds',
    description: '+10% fire rate per stack.',
    category: 'ammo',
    maxStacks: 3,
    effect: { fireRateMultAdd: 0.1 },
  },
  ammo_tracer: {
    id: 'ammo_tracer',
    displayName: 'Tracer Rounds',
    description: 'Projectiles pierce +1 enemy per stack.',
    category: 'ammo',
    maxStacks: 3,
    effect: { pierceAdd: 1 },
  },
  optics_red_dot: {
    id: 'optics_red_dot',
    displayName: 'Red Dot',
    description: '+15% range per stack.',
    category: 'optics',
    maxStacks: 3,
    effect: { rangeMultAdd: 0.15 },
  },
  optics_pso_scope: {
    id: 'optics_pso_scope',
    displayName: 'Holographic Sight',
    description: '+30% range, -10% fire rate per stack.',
    category: 'optics',
    maxStacks: 2,
    effect: { rangeMultAdd: 0.3, fireRateMultAdd: -0.1 },
  },
  gear_plate_carrier: {
    id: 'gear_plate_carrier',
    displayName: 'Plate Carrier',
    description: '-10% damage taken per stack.',
    category: 'gear',
    maxStacks: 3,
    effect: { damageTakenMultAdd: -0.1 },
  },
  gear_tactical_boots: {
    id: 'gear_tactical_boots',
    displayName: 'Tactical Boots',
    description: '+12% move speed per stack.',
    category: 'gear',
    maxStacks: 3,
    effect: { moveSpeedMultAdd: 0.12 },
  },
  gear_mre: {
    id: 'gear_mre',
    displayName: 'MRE',
    description: '+15 max HP per stack.',
    category: 'gear',
    maxStacks: 3,
    effect: { maxHpAdd: 15 },
  },
  provisions_painkillers: {
    id: 'provisions_painkillers',
    displayName: 'Painkillers',
    description: '+2 HP/sec regen per stack.',
    category: 'provisions',
    maxStacks: 3,
    effect: { hpRegenPerSecAdd: 2 },
  },
  provisions_stims: {
    id: 'provisions_stims',
    displayName: 'Stims',
    description: '+5% damage, -2 HP/sec regen per stack.',
    category: 'provisions',
    maxStacks: 3,
    effect: { damageMultAdd: 0.05, hpRegenPerSecAdd: -2 },
  },

  // ── Phase 4b G1 ─────────────────────────────────────────────────────────────

  ammo_hollow_points: {
    id: 'ammo_hollow_points',
    displayName: 'Hollow Points',
    description: '+50% damage to enemies below 50% HP per stack.',
    category: 'ammo',
    maxStacks: 5,
    // Inline effect: combatEngine reads skillStacks directly at hit time.
    effect: {},
  },
  gear_ceramic_insert: {
    id: 'gear_ceramic_insert',
    displayName: 'Ceramic Insert',
    description: '-8% damage taken per stack.',
    category: 'gear',
    maxStacks: 2,
    effect: { damageTakenMultAdd: -0.08 },
  },
  optics_suppressor: {
    id: 'optics_suppressor',
    displayName: 'Suppressor',
    description: '+10% damage to first enemy hit per stack.',
    category: 'optics',
    maxStacks: 5,
    // Inline effect: combatEngine reads skillStacks directly at hit time.
    effect: {},
  },
  provisions_comms_headset: {
    id: 'provisions_comms_headset',
    displayName: 'Comms Headset',
    description: '+30% magnet range per stack.',
    category: 'provisions',
    maxStacks: 5,
    // Inline effect: pickupEngine reads skillStacks directly for magnet range.
    effect: {},
  },
  gear_helmet: {
    id: 'gear_helmet',
    displayName: 'Helmet',
    description: '15% chance per stack to negate a hit (max 60%).',
    category: 'gear',
    maxStacks: 4,
    // Inline effect: combatEngine reads skillStacks directly at contact-damage time.
    effect: {},
  },
};

/**
 * Ordered array of all skill IDs — used to iterate SKILLS in getEffectiveStats.
 * Iteration order must be stable; index-based loop avoids Object.keys() (not worklet-safe).
 */
export const SKILL_IDS: SkillId[] = [
  // Phase 4a
  'ammo_545bt',
  'ammo_subsonic',
  'ammo_tracer',
  'optics_red_dot',
  'optics_pso_scope',
  'gear_plate_carrier',
  'gear_tactical_boots',
  'gear_mre',
  'provisions_painkillers',
  'provisions_stims',
  // Phase 4b G1
  'ammo_hollow_points',
  'gear_ceramic_insert',
  'optics_suppressor',
  'provisions_comms_headset',
  'gear_helmet',
];

// ─── Effective stats ──────────────────────────────────────────────────────────

/**
 * Resolved stat values after all active skill stacks are applied.
 * Consumed by combatEngine (damage, cooldownMs, rangePx, pierce),
 * gameEngine movement block (moveSpeedPxPerSec), and progressionEngine tickRegen
 * (hpRegenPerSec, maxHp, damageTakenMult).
 */
export type EffectiveStats = {
  /** Projectile damage after all damage multipliers. */
  damage: number;
  /** Weapon cooldown in ms after fire-rate multipliers. Floored at 10ms. */
  cooldownMs: number;
  /** Projectile max range in px after range multipliers. */
  rangePx: number;
  /** Multiplier applied to incoming contact damage. Clamped [0.1, 1.0]. */
  damageTakenMult: number;
  /** Player move speed in px/sec after speed multipliers. */
  moveSpeedPxPerSec: number;
  /** Max HP after additive HP bonuses. */
  maxHp: number;
  /** HP regenerated per second (can be negative from stims). */
  hpRegenPerSec: number;
  /** Number of additional enemies a projectile can pierce through. 0 = no pierce. */
  pierce: number;
};

/**
 * Compute effective player stats from current skill stacks.
 *
 * Pure function — no side effects. Marked 'worklet' so it can be called
 * from the Reanimated UI thread inside the game loop.
 *
 * @param skillStacks  Record<SkillId, number> — current stack count per skill.
 * @param weapon       The player's equipped weapon (base stats).
 * @param baseMaxHp    Player's base max HP before any gear bonuses.
 */
export function getEffectiveStats(
  skillStacks: Record<string, number>,
  weapon: WeaponProfile,
  baseMaxHp: number,
): EffectiveStats {
  'worklet';

  let damageMult = 1;
  let fireRateMult = 1;
  let rangeMult = 1;
  let damageTakenMult = 1;
  let moveSpeedMult = 1;
  let maxHpAdd = 0;
  let hpRegenPerSec = 0;
  let pierce = 0;

  for (let i = 0; i < SKILL_IDS.length; i++) {
    const id = SKILL_IDS[i];
    const stacks = skillStacks[id] ?? 0;
    if (stacks === 0) continue;
    const e = SKILLS[id].effect;
    if (e.damageMultAdd      !== undefined) damageMult      += e.damageMultAdd      * stacks;
    if (e.fireRateMultAdd    !== undefined) fireRateMult    += e.fireRateMultAdd    * stacks;
    if (e.rangeMultAdd       !== undefined) rangeMult       += e.rangeMultAdd       * stacks;
    if (e.damageTakenMultAdd !== undefined) damageTakenMult += e.damageTakenMultAdd * stacks;
    if (e.moveSpeedMultAdd   !== undefined) moveSpeedMult   += e.moveSpeedMultAdd   * stacks;
    if (e.maxHpAdd           !== undefined) maxHpAdd        += e.maxHpAdd           * stacks;
    if (e.hpRegenPerSecAdd   !== undefined) hpRegenPerSec   += e.hpRegenPerSecAdd   * stacks;
    if (e.pierceAdd          !== undefined) pierce          += e.pierceAdd          * stacks;
  }

  return {
    damage: weapon.damage * damageMult,
    cooldownMs: Math.max(10, weapon.cooldownMs / fireRateMult),
    rangePx: weapon.rangePx * rangeMult,
    damageTakenMult: Math.min(1, Math.max(0.1, damageTakenMult)),
    moveSpeedPxPerSec: PLAYER_MOVE_SPEED_PX_PER_SEC * moveSpeedMult,
    maxHp: baseMaxHp + maxHpAdd,
    hpRegenPerSec,
    pierce: Math.max(0, Math.round(pierce)),
  };
}
