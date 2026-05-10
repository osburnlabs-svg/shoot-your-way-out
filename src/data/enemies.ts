/**
 * Enemy stat profiles — content layer, not engine logic.
 *
 * Engine code in lib/ reads these values but never hardcodes them.
 * G1: Scav + Raider only (foot soldiers).
 * Phase 5 adds: Gunner, Sniper, Humvee, BTR, Panzer, ACS.
 *
 * moveSpeed is a multiplier on ENEMY_BASE_SPEED_PX_PER_SEC from gameConstants.
 * contactDamage is on the profile so G3 can apply it — unused in G1.
 * xpOnKill is on the profile so G3/4a can consume it — unused in G1.
 */

export type EnemyType = 'scav' | 'raider';

export type EnemyProfile = {
  id: EnemyType;
  displayName: string;
  /** Starting HP. G2 will read this when creating runtime enemy instances. */
  hp: number;
  /**
   * Movement speed multiplier on ENEMY_BASE_SPEED_PX_PER_SEC.
   * Scav 1.2 → 96 px/sec. Raider 1.8 → 144 px/sec.
   */
  moveSpeed: number;
  /** Damage dealt to player on contact. Applied in G3. */
  contactDamage: number;
  /** XP awarded on kill. Consumed in G3/4a. */
  xpOnKill: number;
};

export const ENEMY_PROFILES: Record<EnemyType, EnemyProfile> = {
  scav: {
    id: 'scav',
    displayName: 'Scav',
    // hp=20: dies in 2 shots at pistol damage=12 (20/12=1.67→2 shots)
    hp: 20,
    moveSpeed: 1.2,
    // contactDamage=5: 10 HP/sec from one overlapping Scav — player has time to react
    contactDamage: 5,
    xpOnKill: 3,
  },
  raider: {
    id: 'raider',
    displayName: 'Raider',
    // hp=40: dies in 4 shots at pistol damage=12 (40/12=3.33→4 shots)
    hp: 40,
    moveSpeed: 1.8,
    // contactDamage=12: meaningfully more threatening than Scav; 24 HP/sec from one Raider
    contactDamage: 12,
    xpOnKill: 8,
  },
};
