// V1 DEMO BALANCE — captured at end of Phase 3 G4a.
//
// These values target Phase 3 standalone play: pistol-only, no progression,
// no bosses, no level-ups, no armor/HP pickups. Design target: new player
// dies in 60-90 seconds.
//
// Full v1 balance is a Phase 5+ concern. Once helicopter (minute 2 boss),
// tier 5-7 enemies (Humvee/BTR/Panzer/ACS), level-ups, weapon upgrades, and
// skill stacks exist, these numbers WILL need to be retuned. The target then
// is: new player reaches the first helicopter (minute 2), skilled player
// reaches multiple helicopter cycles (minutes 6-8). Do not assume Phase 3
// numbers carry forward without re-validation.

/**
 * Purpose: this file is documentation, not runtime code. It does not affect
 * game behavior and is not imported by any engine module. Its value is as a
 * diff target: if future tuning shifts balance unexpectedly, compare the live
 * values in weapons.ts / enemies.ts / gameConstants.ts against this file to
 * identify what drifted and why.
 *
 * How to use it: if the game feels noticeably easier or harder than intended
 * and you're not sure why, search for any value here that differs from its
 * counterpart in the data files. The mismatch is the culprit.
 *
 * Tuning rationale is inline. Key design target:
 *   - First-death (stationary player) at 60-90 seconds
 *   - Skilled run: 5-8 minutes before overwhelmed
 *   - Scav dies in 2 shots, Raider in 4 shots (pistol, 400ms cooldown)
 *   - Magnet catches pickups even when player is moving at full speed
 */

export const V1_BASELINE = {

  // ─── Pistol (MP-443) ───────────────────────────────────────────────────────

  /** damage=12 — kills Scav (20HP) in 2 shots, Raider (40HP) in 4 shots. */
  pistolDamage: 12,

  /** cooldownMs=400 — 2.5 shots/sec. Player kill capacity: ~1.25 Scavs/sec. */
  pistolCooldownMs: 400,

  /** rangePx=280 — genuine ranged feel. Original 180px felt like melee distance. */
  pistolRangePx: 280,

  /** projectileSpeedPxPerSec=500 — crosses 280px in 0.56s. Snappy but not hitscan. */
  pistolProjectileSpeedPxPerSec: 500,

  // ─── Scav ──────────────────────────────────────────────────────────────────

  /** hp=20 — 2-shot kill at pistol damage 12 (20/12=1.67→2 shots). */
  scavHp: 20,

  /**
   * contactDamage=5 per 500ms tick — 10 HP/sec from one overlapping Scav.
   * Player at 100HP has ~10 seconds to react to a single Scav before death.
   * Intentionally forgiving so individual enemies feel threatening but not lethal.
   */
  scavContactDamage: 5,

  /** moveSpeed=1.2× (1.2 × 80px/s base = 96px/s). Player at 250px/s can always outrun. */
  scavMoveSpeed: 1.2,

  // ─── Raider ────────────────────────────────────────────────────────────────

  /** hp=40 — 4-shot kill at pistol damage 12 (40/12=3.33→4 shots). */
  raiderHp: 40,

  /**
   * contactDamage=12 per 500ms tick — 24 HP/sec. Meaningfully more dangerous than Scav.
   * A stationary player dies to a single Raider in ~4 seconds — get moving.
   */
  raiderContactDamage: 12,

  /** moveSpeed=1.8× (1.8 × 80px/s base = 144px/s). Noticeably faster than Scav. */
  raiderMoveSpeed: 1.8,

  // ─── Spawn curve ───────────────────────────────────────────────────────────

  /** spawnInitialDelayMs=3000 — 3s grace period before anything spawns. */
  spawnInitialDelayMs: 3000,

  /**
   * spawnRateInitial=0.25/s — one enemy every 4 seconds at game start.
   * Comfortable opening; player can orient and kill cleanly before pressure builds.
   */
  spawnRateInitial: 0.25,

  /**
   * spawnRateMax=2.0/s — peak rate after ramp completes.
   * Player pistol kills ~1.25 Scavs/sec; rate above that means enemies accumulate.
   * At 2.0/s peak, net accumulation rate = ~0.75 enemies/sec when overwhelmed.
   */
  spawnRateMax: 2.0,

  /**
   * spawnRateRampDurationMs=120000 (2 minutes) — slow, deliberate escalation arc.
   * Rate crosses player kill capacity (1.25/sec) at ~70s into the run.
   * First-death window for a stationary player: 70-90s. Matches design target.
   */
  spawnRateRampDurationMs: 120000,

  /**
   * raiderRatioInitial=0.1 — 10% Raiders at game start.
   * Raiders deal 12 contact damage vs Scav's 5; mixing them in early would compress
   * the first-death window more than intended.
   */
  raiderRatioInitial: 0.1,

  /** raiderRatioMax=0.4 — 40% Raiders at ramp peak (90s). Mix stays Scav-heavy. */
  raiderRatioMax: 0.4,

  /** raiderRatioRampDurationMs=90000 — Raiders phase in over 90s. */
  raiderRatioRampDurationMs: 90000,

  // ─── Magnet ────────────────────────────────────────────────────────────────

  /**
   * magnetRangePx=120 — activation radius.
   * Once within this distance the pickup snaps to direct-pull behavior.
   */
  magnetRangePx: 120,

  /**
   * magnetMaxSpeedPxPerSec=1200 — speed of direct-pull toward player.
   *
   * Magnet model: direct-pull, not physics-based acceleration.
   * Each tick: vx = nx * magnetMaxSpeedPxPerSec, vy = ny * magnetMaxSpeedPxPerSec.
   * No momentum, no acceleration constant. Pickup always moves at full speed
   * toward current player position — eliminates tail-chase entirely.
   * Net closing speed (player moving away): 1200 - 250 = 950px/s.
   */
  magnetMaxSpeedPxPerSec: 1200,

  /** collectRadiusPx=12 — collection hitbox around player center. Unchanged from G3. */
  collectRadiusPx: 12,

  // ─── Player ────────────────────────────────────────────────────────────────

  /**
   * playerStartingHp=100 — unchanged. Tuning damage and spawn rate is preferred
   * over tuning HP because HP changes feel less impactful than pacing changes.
   */
  playerStartingHp: 100,

  /**
   * contactDamageIntervalMs=500 — per-enemy cooldown between damage ticks.
   * Each enemy has its own independent 500ms gate.
   */
  contactDamageIntervalMs: 500,

} as const;
