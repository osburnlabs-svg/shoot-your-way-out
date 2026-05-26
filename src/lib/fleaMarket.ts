import { SKILL_IDS } from '../data/skills';
import type { SkillId } from '../data/skills';

/**
 * Returns today's date as a YYYY-MM-DD string in device-local time.
 * Used to seed the daily flea market inventory and daily login bonus checks.
 * No UTC, no server time — device-local intentionally (exploit-tolerance accepted).
 */
export function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Mulberry32 seeded PRNG. Pure function — same seed always produces the same sequence.
 * Same family of PRNG used by mapGenerator for procedural map seeds.
 */
function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s += 0x9e3779b9;
    let t = s;
    t = Math.imul(t ^ (t >>> 16), 0x85ebca6b);
    t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35);
    return ((t ^ (t >>> 16)) >>> 0) / 0xffffffff;
  };
}

/**
 * Returns the 15 skill IDs available in the flea market for the given date key.
 *
 * Properties:
 *   - Deterministic: same dateKey → same 15 IDs on every call, every device.
 *   - Different dates → different selections (different seed → different shuffle).
 *   - All 15 are distinct — Fisher-Yates shuffle over a copy of SKILL_IDS.
 *   - Pure function — no side effects, no I/O.
 *
 * Seed derivation: strip dashes from the date string and parse as integer.
 * "2026-05-26" → 20260526. Safe integer range for all foreseeable calendar dates.
 */
export function getDailyInventory(dateKey: string): SkillId[] {
  const seed = parseInt(dateKey.replace(/-/g, ''), 10);
  const rng = mulberry32(seed);

  const pool = SKILL_IDS.slice(); // shallow copy — never mutate the imported array
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, 15);
}
