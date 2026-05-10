# Kit Asset Audit — Skill Icons & New-Skill Candidates

**Date:** 2026-05-10
**Scope:** Kit 1a (GUI zip + Props/Ammo, Props/HP, Props/Armor, Props/Speed sub-packs) and Kit 2 (vehicles — ruled out immediately). All sprites physically inspected; dimensions confirmed via System.Drawing.

---

## Section 0 — Stims / Medical Sprite Check

No syringe, pill bottle, stim injector, vial, ampoule, or pharmaceutical art of any kind exists anywhere in the kit. The only medical-adjacent assets are: `HP Icon.png` (abstract red-cross/heart HUD glyph, 15x14px), `HP.png` (32x32 health pickup collectible), and `HP Box.png` (32x32 medkit crate prop). There is nothing that reads unambiguously as a stimulant. The best available workaround for `provisions_stims` is a speed icon, since the skill's primary mechanical identity is a damage/speed burst — that association is stronger than the current ammo icon and clearly superior to a health icon.

---

## Section 1 — Icon-Eligible Sprite Inventory

Eligibility criteria: single subject, transparent background, recognizable at 32x32, static (not multi-frame), not a tile/sheet/UI panel.

### Currently used

| File (assets/ui/icons/) | Source path | Size | Subject | Skills using it |
|---|---|---|---|---|
| `Ammo.png` | Props/Ammo/Ammo.png | ~32x32 | Single bullet/cartridge | ammo_545bt, ammo_subsonic, ammo_tracer, provisions_stims |
| `Armor_Icon.png` | PNG/Inventory and Stats/Armor Icon.png | ~32x32 | Armor vest graphic | gear_plate_carrier |
| `HP_Icon.png` | PNG/Inventory and Stats/HP Icon.png | ~32x32 | Abstract HP glyph | gear_mre, provisions_painkillers |
| `Pistol_HUD.png` | PNG/HUD/WEAPON ICONS/Pistol HUD.png | ~79x46 | Pistol silhouette | optics_red_dot |
| `SMG_HUD.png` | PNG/HUD/WEAPON ICONS/SMG HUD.png | ~79x46 | SMG silhouette | optics_pso_scope |
| `Speed_01.png` | Props/Speed/Iocn_Speed_01.png | 32x32 | Speed/boot icon | gear_tactical_boots |

### Unused — icon-eligible (recommended for use)

| File | Source path | Size | Subject | Notes |
|---|---|---|---|---|
| `Ammo_Box.png` | Props/Ammo/Ammo Box.png | 32x32 | Ammo crate/box | Distinct from single-bullet Ammo.png; ideal for differentiating ammo skills |
| `HP_pickup.png` | Props/HP/HP.png | 32x32 | Health pickup collectible | Reads as "medkit/painkiller" better than abstract HP glyph |
| `HP_Box.png` | Props/HP/HP Box.png | 32x32 | Medkit crate | Larger medical supply; good for a future "field medic" skill |
| `Armor_Small.png` | Props/Armor/Armor Small.png | 32x32 | Small armor pickup | Lighter tier of armor; good for a new defensive skill |
| `Speed_02.png` | Props/Speed/Icon Speed 02.png | 32x32 | Speed icon variant | Second speed design; ideal for Stims (energy burst) |
| `MG_HUD.png` | PNG/HUD/WEAPON ICONS/MG HUD.png | 79x46 | Heavy MG silhouette | Completely unused; good icon for a heavy-weapon skill |
| `RPG_HUD.png` | PNG/HUD/WEAPON ICONS/RPG HUD.png | 79x46 | Rocket launcher silhouette | Completely unused; obvious icon for an explosive/AOE skill |
| `Flamethrower_HUD.png` | PNG/HUD/WEAPON ICONS/Flamethrower HUD.png | 79x46 | Flamethrower silhouette | Completely unused; good for incendiary/DoT skill |

### Not icon-eligible

| File | Size | Reason |
|---|---|---|
| `HUD_Ammo_Icon.png` | 11x8 | HUD chrome — too small, illegible at any display size |
| `HUD_HP_Icon.png` | 15x14 | HUD chrome — too small |
| `HUD_Armor.png` | 15x16 | HUD chrome — too small |
| `Weight_Icon.png` | 15x16 | HUD chrome — too small; weight mechanic not in game |
| `PLUS_off.png` | 7x7 | UI button state — not a subject icon |
| `Bonus_01.png` | 83x79 | Badge/star shape — no clear meaning at a glance; ambiguous |
| `Speed_empty.png` | 32x32 | Empty/outline state of speed bar — no fill, not a standalone subject |

### Standalone weapon art (hero folders, not in sprites.ts)

These exist as extracted PNG assets but are not referenced in `sprites.ts`. Usable as icon sources.

| Approximate source | Subject |
|---|---|
| Hero folder: Pistol.png | Pistol (top-down render) |
| Hero folder: Rifle.png | Rifle (top-down render) |
| Hero folder: Hero_MachineGun/MachineGun.png | Machine gun (top-down render) |
| Hero folder: Grenade Launcher.png | Grenade launcher (top-down render) |
| Hero folder: Flamethrower.png | Flamethrower (top-down render) |

---

## Section 2 — Skill Icon Recommendations (All 10 Skills)

### Problems with current mapping
- **4 skills share `Ammo.png`**: ammo_545bt, ammo_subsonic, ammo_tracer, provisions_stims — the player cannot distinguish them at a glance
- **2 skills share `HP_Icon.png`**: gear_mre, provisions_painkillers — identical icons for different mechanics
- **Stims uses ammo icon**: actively misleading (stims = damage + speed burst, not ammunition)

### Recommended mapping

| Skill ID | Display Name | Current Icon | Recommended Icon | Rationale |
|---|---|---|---|---|
| `ammo_545bt` | Armor-Piercing Rounds | Ammo.png | **Keep `Ammo.png`** | Single bullet correctly reads as AP round |
| `ammo_subsonic` | Subsonic Rounds | Ammo.png | **`Ammo_Box.png`** | Box of rounds differentiates from single-bullet; "bulk/specialty load" |
| `ammo_tracer` | Tracer Rounds | Ammo.png | **`MG_HUD.png`** | No tracer-specific art; MG silhouette implies spray/stream — closest visual concept for tracers |
| `optics_red_dot` | Red Dot | Pistol_HUD.png | **Keep `Pistol_HUD.png`** | No scope/sight art in kit; pistol = compact/close optic; acceptable workaround |
| `optics_pso_scope` | Holographic Sight | SMG_HUD.png | **Keep `SMG_HUD.png`** | No scope art; SMG = longer-range platform than pistol; acceptable workaround |
| `gear_plate_carrier` | Plate Carrier | Armor_Icon.png | **Keep `Armor_Icon.png`** | Correct — armor icon for plate carrier |
| `gear_tactical_boots` | Tactical Boots | Speed_01.png | **Keep `Speed_01.png`** | Correct — speed icon for boots |
| `gear_mre` | MRE | HP_Icon.png | **Keep `HP_Icon.png`** | No food art; HP icon is acceptable (MRE = max HP bonus, health association holds) |
| `provisions_painkillers` | Painkillers | HP_Icon.png | **`HP_pickup.png`** | Medkit collectible reads as "painkiller" better than abstract glyph; breaks MRE/Painkillers collision |
| `provisions_stims` | Stims | Ammo.png | **`Speed_02.png`** | Speed icon matches stims' mechanical identity (energy/damage burst); eliminates misleading ammo icon |

**Net result:** From 3 distinct icons for 10 skills → 7 distinct icons. The only remaining collision is optics_red_dot / optics_pso_scope both using weapon silhouettes, which is acceptable because they're in the same category and visually different weapons.

**Files to copy into `assets/ui/icons/`:**
- `Ammo_Box.png` ← Props/Ammo/Ammo Box.png
- `HP_pickup.png` ← Props/HP/HP.png
- `Speed_02.png` ← Props/Speed/Icon Speed 02.png
- `MG_HUD.png` ← PNG/HUD/WEAPON ICONS/MG HUD.png

---

## Section 3 — New Skill Candidates from Unused Art

These are design proposals only — no commitment to implement. Sorted by confidence that the art will read clearly at 30x30 display size.

### High confidence

| Icon | Skill ID (proposed) | Display Name | Mechanic sketch | Max stacks |
|---|---|---|---|---|
| `RPG_HUD.png` | `weapon_rpg` | "RPG Round" | Equip a one-shot rocket: on next fire, projectile deals 3× damage in 24px AOE radius; single charge, refills on level-up | 1 |
| `Armor_Small.png` | `gear_ceramic_plate` | "Ceramic Insert" | +8% damage reduction per stack (lighter than Plate Carrier; good low-cost pick) | 2 |
| `HP_Box.png` | `provisions_field_kit` | "Field Medic Kit" | +25 HP restored immediately on selection (burst heal, not regen) | 3 |
| `Speed_02.png` | Already recommended for Stims above | — | — | — |

### Medium confidence

| Icon | Skill ID (proposed) | Display Name | Mechanic sketch | Note |
|---|---|---|---|---|
| `Flamethrower_HUD.png` | `ammo_incendiary` | "Incendiary Rounds" | Projectiles apply 2 damage/sec burn for 2 sec on hit | Burn requires a new DoT field in EnemyState; non-trivial |
| `MG_HUD.png` | Already recommended for ammo_tracer icon above | — | — | Could instead be its own "Suppressive Fire" skill if tracer gets a different icon |
| `Hero_MachineGun/MachineGun.png` | `weapon_mg_kit` | "MG Conversion Kit" | Swap to MG weapon profile: +40% damage, −30% fire rate, +50% range | Requires weapon-swap mechanic; Phase 4b scope |

### Low confidence / deferred

| Icon | Reason |
|---|---|
| `Bonus_01.png` | Badge shape — no clear gameplay meaning without text label overlay |
| `Weight_Icon.png` | Weight/encumbrance mechanic does not exist in game; would require new system |

---

## Section 4 — Summary

The kit ships solid 32x32 prop art and 79x46 weapon silhouettes but no pharmaceutical or stimulant art whatsoever — the stims icon question is definitively answered: use a speed icon. The most impactful fix is the `provisions_stims` → `Speed_02.png` swap, which eliminates a misleading icon that actively confuses the skill's identity. The second most impactful fix is breaking the `HP_Icon.png` collision between MRE and Painkillers by giving Painkillers the `HP_pickup.png` collectible instead. The ammo collision is partially solved by routing `ammo_subsonic` and `ammo_tracer` both to `Ammo_Box.png` (ammo box — distinct from the single-bullet `Ammo.png` kept for ammo_545bt). The optics pair remains on weapon silhouettes — no scope art exists in the kit and they are already distinguishable (pistol vs. SMG). On the new-skill side, `RPG_HUD.png` (one-shot AOE round), `Armor_Small.png` (ceramic plate), and `HP_Box.png` (field medic kit burst heal) are the three strongest candidates: the art is clear, the mechanics are additive stat changes or simple new behaviors, and none require new subsystems. Flamethrower and MG conversion are interesting but push toward Phase 4b weapon-swap scope.

---

## Status

**Section 2 icon recommendations applied** in commit `(Phase 4a G3 polish)`. Swaps shipped:
- `ammo_subsonic` → `Ammo_Box.png`
- `ammo_tracer` → `Ammo_Box.png` (same icon; sharing within category is acceptable)
- `provisions_painkillers` → `HP_pickup.png`
- `provisions_stims` → `Speed_02.png`

Note: audit recommended `MG_HUD.png` for `ammo_tracer`; changed to `Ammo_Box.png` before implementation (owner preference — same icon as subsonic is fine).

**Section 3 new-skill candidates** remain proposals for Phase 4b planning. None implemented.
