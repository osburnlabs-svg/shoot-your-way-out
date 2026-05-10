/**
 * Weapon stat profiles — content layer, not engine logic.
 *
 * Each profile maps to one of the 5 hero animation poses.
 * Engine code (combatEngine.ts) reads these; never hardcodes weapon stats.
 *
 * G2: Pistol only — auto-fire, projectile travel, collision.
 * Phase 4a adds: AKS-74U (pistol pose), AK-74 (rifle), PKM (machinegun), SVD (rifle).
 * Phase 4b adds crate-only weapons: M870 Shotgun (machinegun pose),
 *   GP-25 (grenade_launcher pose), RPO Flamethrower (flamethrower pose).
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
  pistol: {
    id: 'pistol',
    displayName: 'MP-443 Pistol',
    animationPose: 'pistol',
    damage: 8,
    cooldownMs: 400,
    rangePx: 180,
    projectileSpeedPxPerSec: 400,
  },
  // Phase 4a:
  // aks74u: { animationPose: 'pistol', damage: 6, cooldownMs: 150, rangePx: 220, ... },
  // ak74:   { animationPose: 'rifle',  damage: 12, cooldownMs: 200, rangePx: 280, ... },
  // pkm:    { animationPose: 'machinegun', damage: 14, cooldownMs: 100, rangePx: 260, ... },
  // svd:    { animationPose: 'rifle',  damage: 45, cooldownMs: 1000, rangePx: 400, ... },
};

/** The weapon every run begins with. */
export const STARTING_WEAPON_ID = 'pistol';
