import type { SkillId } from './skills';

// Per-skill flea market prices. Tier assignment locked 2026-05-26.
// Source: strategy-monetization-v1.md §4.2. Re-tune Phase 10.
export const FLEA_MARKET_PRICES: Record<SkillId, number> = {
  // Premium — $5,000
  gear_plate_carrier:           5000,
  gear_heavy_plate:             5000,
  gear_helmet:                  5000,
  gear_backpack:                5000,
  provisions_field_medic_kit:   5000,
  throwables_frag:              5000,
  ammo_hollow_points:           5000,
  // Standard — $3,000
  ammo_545bt:                   3000,
  optics_pso_scope:             3000,
  gear_ceramic_insert:          3000,
  gear_mre:                     3000,
  gear_energy_bar:              3000,
  gear_tactical_boots:          3000,
  provisions_painkillers:       3000,
  throwables_smoke:             3000,
  throwables_molotov:           3000,
  // Cheap — $2,000
  optics_red_dot:               2000,
  optics_acog:                  2000,
  optics_suppressor:            2000,
  ammo_fmj:                     2000,
  ammo_subsonic:                2000,
  ammo_tracer:                  2000,
  gear_knee_pads:               2000,
  provisions_stims:             2000,
  provisions_comms_headset:     2000,
};
