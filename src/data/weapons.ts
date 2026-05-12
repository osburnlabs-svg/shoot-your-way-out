/**
 * Weapon stat profiles — content layer, not engine logic.
 *
 * Each profile maps to one of the 5 hero animation poses.
 * Engine code (combatEngine.ts) reads these; never hardcodes weapon stats.
 *
 * G2: Pistol only — auto-fire, projectile travel, collision.
 * Phase 4a adds: AKS-74U (pistol pose), AK-74 (rifle), SVD (rifle). PKM defined but
 *   dormant — removed from level progression and crate pool (Phase 4c G2 decision).
 *   Guaranteed progression: Pistol → SMG (L4) → Assault Rifle (L8) → Sniper Rifle (L16).
 * Phase 4b adds crate-only weapons: M870 Shotgun (machinegun pose),
 *   RPO Rocket Launcher (grenade_launcher pose), RPO Flamethrower (flamethrower pose).
 */

import type { HeroWeaponPose } from '../lib/sprites';

export type WeaponProfile = {
  id: string;
  displayName: string;
  /** Hero animation pose used when this weapon is equipped. */
  animationPose: HeroWeaponPose;
  /** Damage dealt per projectile hit. */
  damage: number;
  /**
   * Time between shots in ms. Cooldown always advances regardless of whether a
   * target is in range — when it expires with no target, the weapon is "ready"
   * and fires immediately the moment an enemy walks into range.
   */
  cooldownMs: number;
  /** Max projectile travel range in pixels. Projectile despawns at this distance. */
  rangePx: number;
  /** Projectile travel speed in pixels per second. */
  projectileSpeedPxPerSec: number;
};

export const WEAPON_PROFILES: Record<string, WeaponProfile> = {
  // ── Guaranteed progression (earned by leveling) ──────────────────────────────

  pistol: {
    id: 'pistol',
    displayName: 'Pistol',
    animationPose: 'pistol',
    // damage=12: kills Scav (20HP) in 2 shots, Raider (40HP) in 4 shots at 400ms cooldown
    damage: 12,
    cooldownMs: 400,
    // rangePx=280: feels like actual ranged combat vs the original 180px melee distance
    rangePx: 280,
    // 500px/s: bullet crosses 280px range in 0.56s — snappy without feeling hitscan
    projectileSpeedPxPerSec: 500,
  },

  aks74u: {
    id: 'aks74u',
    displayName: 'SMG',
    animationPose: 'pistol',
    // High fire rate compensates for lower damage. 6dmg × 1/0.15s = 40dmg/s vs pistol's 30dmg/s.
    damage: 6,
    cooldownMs: 150,
    rangePx: 220,
    projectileSpeedPxPerSec: 550,
  },

  ak74: {
    id: 'ak74',
    displayName: 'Assault Rifle',
    animationPose: 'rifle',
    // Solid all-rounder. Same damage as pistol but faster cooldown and longer range.
    damage: 12,
    cooldownMs: 200,
    rangePx: 280,
    projectileSpeedPxPerSec: 600,
  },

  pkm: {
    id: 'pkm',
    displayName: 'Machine Gun',
    animationPose: 'machinegun',
    // Highest sustained DPS of the guaranteed tier. 14dmg × 10shots/s = 140dmg/s.
    damage: 14,
    cooldownMs: 100,
    rangePx: 260,
    projectileSpeedPxPerSec: 500,
  },

  svd: {
    id: 'svd',
    displayName: 'Sniper Rifle',
    animationPose: 'rifle',
    // One-shots Scavs (20HP), two-shots Raiders (40HP), near-one-shots Gunners (60HP).
    // Slow fire rate demands stop-to-fire discipline; huge range rewards positioning.
    damage: 45,
    cooldownMs: 1000,
    rangePx: 400,
    projectileSpeedPxPerSec: 800,
  },

  // ── Crate-only weapons (Phase 4b) ─────────────────────────────────────────
  // Stats from context doc table. Not reachable via progression — crate drop only.
  // Renamed here alongside the guaranteed weapons; combat wiring lands in Phase 4b.

  m870: {
    id: 'm870',
    displayName: 'Shotgun',
    animationPose: 'machinegun',
    // Each "shot" is one pellet; Phase 4b multi-pellet spread is a combatEngine change.
    damage: 25,
    cooldownMs: 800,
    rangePx: 140,
    projectileSpeedPxPerSec: 400,
  },

  gp25: {
    id: 'gp25',
    displayName: 'Rocket Launcher',
    animationPose: 'grenade_launcher',
    // AOE damage radius handled by Phase 4b combatEngine extension.
    damage: 35,
    cooldownMs: 600,
    rangePx: 220,
    projectileSpeedPxPerSec: 350,
  },

  rpo: {
    id: 'rpo',
    displayName: 'Flamethrower',
    animationPose: 'flamethrower',
    // Per-tick damage; continuous stream handled by Phase 4b combatEngine extension.
    damage: 6,
    // cooldownMs matches FLAMETHROWER_ZONE_DURATION_MS (1000ms) so exactly one batch
    // of zones is alive at a time — clean single animation cycle with no multi-batch
    // phase overlap. Was 250ms (4 overlapping batches caused animation churn).
    cooldownMs: 900,
    rangePx: 140,
    projectileSpeedPxPerSec: 200,
  },
};

/** The weapon every run begins with. */
export const STARTING_WEAPON_ID = 'pistol';
