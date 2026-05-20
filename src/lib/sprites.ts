/**
 * Sprite registry — pre-resolves all require() calls at module load time.
 *
 * All require() paths are static string literals. Metro bundler requires this:
 * it statically analyzes require() at build time and cannot handle dynamic strings.
 * Every asset needed at runtime must appear as a literal here.
 *
 * Consuming modules import HeroSprites and pass values directly to Skia's useImage().
 *
 * This file grows with each phase — future registries follow the same pattern:
 *   Phase 3+5: EnemySprites  (scav, raider, gunner, sniper, humvee, acs, panzer)
 *   Phase 4a:  PickupSprites (hp, armor, speed, ammo, money, crate)
 *   Phase 6:   EffectSprites (explode, flame, smoke, muzzle_flashes, rocket)
 *   Phase 7:   GuiSprites    (menu, hud, upgrade, pause, settings, mission_failed, etc.)
 *   Phase 8:   BossSprites   (helicopter parts + bomber)
 */

export const HeroSprites = {
  // 7-frame walk cycle (With Kneepads variant)
  walk: [
    require('../../assets/sprites/hero/walk/1.png'),
    require('../../assets/sprites/hero/walk/2.png'),
    require('../../assets/sprites/hero/walk/3.png'),
    require('../../assets/sprites/hero/walk/4.png'),
    require('../../assets/sprites/hero/walk/5.png'),
    require('../../assets/sprites/hero/walk/6.png'),
    require('../../assets/sprites/hero/walk/7.png'),
  ],

  // 4-frame death animation
  die: [
    require('../../assets/sprites/hero/die/1.png'),
    require('../../assets/sprites/hero/die/2.png'),
    require('../../assets/sprites/hero/die/3.png'),
    require('../../assets/sprites/hero/die/4.png'),
  ],

  // Weapon poses: idle (full mag), empty (mag out), shot frames (muzzle flash sequence)
  pistol: {
    idle: require('../../assets/sprites/hero/pistol/Hero_Pistol.png'),
    empty: require('../../assets/sprites/hero/pistol/Hero_Pistol_Empty.png'),
    shot: [
      require('../../assets/sprites/hero/pistol/shot/HPistolFire_01.png'),
      require('../../assets/sprites/hero/pistol/shot/HPistolFire_02.png'),
      require('../../assets/sprites/hero/pistol/shot/HPistolFire_03.png'),
    ],
  },

  rifle: {
    idle: require('../../assets/sprites/hero/rifle/Hero_Rifle.png'),
    empty: require('../../assets/sprites/hero/rifle/Hero_Rifle_Empty.png'),
    shot: [
      require('../../assets/sprites/hero/rifle/shot/Hero_Rifle_Fire.png'),
    ],
  },

  machinegun: {
    idle: require('../../assets/sprites/hero/machinegun/Hero_MachineGun.png'),
    empty: require('../../assets/sprites/hero/machinegun/Hero_MachineGun_Empty.png'),
    shot: [
      require('../../assets/sprites/hero/machinegun/shot/Hero_MachineGunFire.png'),
    ],
  },

  grenade_launcher: {
    idle: require('../../assets/sprites/hero/grenade_launcher/Hero_GrenadeLauncher.png'),
    empty: require('../../assets/sprites/hero/grenade_launcher/Hero_GrenadeLauncher_Empty.png'),
    shot: [
      require('../../assets/sprites/hero/grenade_launcher/shot/Hero_GrenadeLauncher_Fire01.png'),
      require('../../assets/sprites/hero/grenade_launcher/shot/Hero_GrenadeLauncher_Fire02.png'),
    ],
  },

  flamethrower: {
    idle: require('../../assets/sprites/hero/flamethrower/Hero_Flamethrower.png'),
    empty: require('../../assets/sprites/hero/flamethrower/Hero_Flamethrower_Empty.png'),
    shot: [
      require('../../assets/sprites/hero/flamethrower/shot/Hero_Flamethrower_Fire01.png'),
      require('../../assets/sprites/hero/flamethrower/shot/Hero_Flamethrower_Fire02.png'),
      require('../../assets/sprites/hero/flamethrower/shot/Hero_Flamethrower_Fire03.png'),
    ],
  },
} as const;

export type HeroWeaponPose = 'pistol' | 'rifle' | 'machinegun' | 'grenade_launcher' | 'flamethrower';

/**
 * Enemy sprite registry — same require() / asset-map pattern as HeroSprites.
 *
 * Scav    = NoGunScav body overlay + Soldier kit legs (kit 1a): 7-frame walk, 1-frame shot, 4-frame die.
 * Raider  = Soldier body overlay + Soldier kit legs (kit 1a): 7-frame walk, 4-frame die.
 *   Raider is melee-only — no fire frame wired. Walk frames cover all non-dying states.
 * Gunner  = Gunner kit (kit 2): registered but unreferenced — kept for future enemy class assignment.
 * SniperA = Sniper (kit 2): 7-frame walk (SW_01–07), 5-frame die (SniperDIe_00–04).
 *   Two-layer compositing: walk legs-only + Base.png body overlay (same pattern as scav/raider).
 *   Fires GunnerBullet projectile. Variant B = Soldier02 below (full-character SF frames, no overlay).
 * Soldier02 = variant B sniper: SF_01–05 walk (full character, no overlay), SD2_01–04 die.
 */
export const EnemySprites = {
  scav: {
    /** Upper body overlay — weaponless Gunner body, composited over Soldier kit legs. */
    body: require('../../assets/sprites/enemies/scav/NoGunScav.png'),
    walk: [
      require('../../assets/sprites/enemies/scav/walk/SW_01.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_02.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_03.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_04.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_05.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_06.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_07.png'),
    ],
    shot: [
      require('../../assets/sprites/enemies/scav/shot/Soldier_Shot.png'),
    ],
    die: [
      require('../../assets/sprites/enemies/scav/die/SD_01.png'),
      require('../../assets/sprites/enemies/scav/die/SD_02.png'),
      require('../../assets/sprites/enemies/scav/die/SD_03.png'),
      require('../../assets/sprites/enemies/scav/die/SD_04.png'),
    ],
  },
  raider: {
    /** Upper body overlay — Soldier kit body, composited over Soldier kit legs. */
    body: require('../../assets/sprites/enemies/scav/Soldier.png'),
    walk: [
      require('../../assets/sprites/enemies/scav/walk/SW_01.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_02.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_03.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_04.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_05.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_06.png'),
      require('../../assets/sprites/enemies/scav/walk/SW_07.png'),
    ],
    die: [
      require('../../assets/sprites/enemies/scav/die/SD_01.png'),
      require('../../assets/sprites/enemies/scav/die/SD_02.png'),
      require('../../assets/sprites/enemies/scav/die/SD_03.png'),
      require('../../assets/sprites/enemies/scav/die/SD_04.png'),
    ],
  },
  /** ACS armored vehicle — base (static) and rotating tower. Phase 5 G5. */
  acs: {
    base:  require('../../assets/sprites/enemies/tank/acs/ACS_Base.png'),
    tower: require('../../assets/sprites/enemies/tank/acs/ACS_Tower.png'),
  },
  /** Panzer tank — base (static) and rotating tower. Phase 5 G5. */
  panzer: {
    base:  require('../../assets/sprites/enemies/tank/panzer/PanzerBase.png'),
    tower: require('../../assets/sprites/enemies/tank/panzer/PanzerTower.png'),
  },
  /** Gunner kit (kit 2) — unreferenced by any enemy class. Registered for future reuse. */
  gunner: {
    body: require('../../assets/sprites/enemies/raider/Gunner.png'),
    walk: [
      require('../../assets/sprites/enemies/raider/walk/GunnerWalk_01.png'),
      require('../../assets/sprites/enemies/raider/walk/GunnerWalk_02.png'),
      require('../../assets/sprites/enemies/raider/walk/GunnerWalk_03.png'),
      require('../../assets/sprites/enemies/raider/walk/GunnerWalk_04.png'),
      require('../../assets/sprites/enemies/raider/walk/GunnerWalk_05.png'),
      require('../../assets/sprites/enemies/raider/walk/GunnerWalk_06.png'),
      require('../../assets/sprites/enemies/raider/walk/GunnerWalk_07.png'),
    ],
    die: [
      require('../../assets/sprites/enemies/raider/die/GDS_01.png'),
      require('../../assets/sprites/enemies/raider/die/GDS_02.png'),
      require('../../assets/sprites/enemies/raider/die/GDS_03.png'),
      require('../../assets/sprites/enemies/raider/die/GDS_04.png'),
      require('../../assets/sprites/enemies/raider/die/GDS_05.png'),
    ],
  },
  /** SniperA — Sniper kit (kit 2): legs-only walk + Base.png body overlay + 5-frame die. */
  sniperA: {
    body: require('../../assets/sprites/enemies/sniper/Base.png'),
    walk: [
      require('../../assets/sprites/enemies/sniper/walk/SW_01.png'),
      require('../../assets/sprites/enemies/sniper/walk/SW_02.png'),
      require('../../assets/sprites/enemies/sniper/walk/SW_03.png'),
      require('../../assets/sprites/enemies/sniper/walk/SW_04.png'),
      require('../../assets/sprites/enemies/sniper/walk/SW_05.png'),
      require('../../assets/sprites/enemies/sniper/walk/SW_06.png'),
      require('../../assets/sprites/enemies/sniper/walk/SW_07.png'),
    ],
    die: [
      require('../../assets/sprites/enemies/sniper/die/SniperDIe_00.png'),
      require('../../assets/sprites/enemies/sniper/die/SniperDIe_01.png'),
      require('../../assets/sprites/enemies/sniper/die/SniperDIe_02.png'),
      require('../../assets/sprites/enemies/sniper/die/SniperDIe_03.png'),
      require('../../assets/sprites/enemies/sniper/die/SniperDIe_04.png'),
    ],
  },
  /** Soldier02 — Sniper variant B: full-character SF fire frames used as walk, no body overlay. */
  soldier02: {
    walk: [
      require('../../assets/sprites/enemies/raider/fire/SF_01.png'),
      require('../../assets/sprites/enemies/raider/fire/SF_02.png'),
      require('../../assets/sprites/enemies/raider/fire/SF_03.png'),
      require('../../assets/sprites/enemies/raider/fire/SF_04.png'),
      require('../../assets/sprites/enemies/raider/fire/SF_05.png'),
    ],
    die: [
      require('../../assets/sprites/enemies/raider/die/SD2_01.png'),
      require('../../assets/sprites/enemies/raider/die/SD2_02.png'),
      require('../../assets/sprites/enemies/raider/die/SD2_03.png'),
      require('../../assets/sprites/enemies/raider/die/SD2_04.png'),
    ],
  },
} as const;

/**
 * Pickup sprite registry — staged here for Phase 3 use.
 * Money_Small is used by G3 (drop on kill). Not rendered in G1.
 */
export const PickupSprites = {
  money: {
    small: require('../../assets/sprites/pickups/money/Money_Small.png'),
  },
  crate: require('../../assets/ui/icons/Army_Box.png'),
} as const;

/**
 * GUI sprite registry — introduced in Phase 4a G3 for the level-up modal.
 *
 * All skill icons are custom AI-sourced 64×64 PNGs (pilot c5dbf34, batch 678d834).
 * To swap a sprite: drop the new file at assets/ui/icons/<Name>.png and update the
 * require() path in the matching GuiSprites.skillIcons entry below. No other changes
 * needed — Metro picks up the new file on next reload.
 *
 * upgrade.bg: kit Upgrade/BG.png (cropped to 308×105). Registered but unreferenced —
 *   BG.png has baked-in weapon placeholder icons; Phase 7 will evaluate kit UI fit.
 * skillIcons.*: 20 skills, 20 distinct icons.
 */
/**
 * Effect sprite registry — introduced in Phase 4b G4 for throwable detonations.
 *
 * explode: Effects/Explode/1–4.png (4 frames, 100ms each, linear non-looping).
 *   Used for frag grenade detonation visual — plays once in-slot then clears.
 *
 * flame: Effects/ACS Fire/ACSF_01–03.png (3 frames, 120ms each, looping).
 *   48×96px portrait sprites — suit a directional flame stream better than
 *   the original 32×32 Flamethrower frames. Swapped for diagnostic test;
 *   revert to assets/effects/flame/1–7.png if ACS art doesn't read well.
 *
 * smoke: Effects/LightSmoke/1–7.png (7 frames, 150ms each, looping).
 *   Used for smoke zone visual — dissipation sequence (large puff → tiny wisp),
 *   loops ~3.8× over SMOKE_DURATION_MS (4000ms). Sourced from
 *   tds-pixel-art-modern-soldiers-and-vehicles-sprites.zip; replaces the
 *   Skia Circle placeholder that shipped with Phase 4b G5.
 */
export const EffectSprites = {
  explode: [
    require('../../assets/effects/explode/1.png'),
    require('../../assets/effects/explode/2.png'),
    require('../../assets/effects/explode/3.png'),
    require('../../assets/effects/explode/4.png'),
  ],
  bullet: require('../../assets/effects/bullet/GunnerBullet.png'),
  // Grenade launcher projectile sprite (3×12 px, static single frame).
  rocketF1: require('../../assets/effects/rocket/rocket-f1.png'),
  // 2-frame rocket body animation — kept for tank turret projectile (Phase 5 G5).
  rocket: [
    require('../../assets/effects/rocket/1.png'),
    require('../../assets/effects/rocket/2.png'),
  ],
  flame: [
    require('../../assets/effects/flame/1.png'),
    require('../../assets/effects/flame/2.png'),
    require('../../assets/effects/flame/3.png'),
    require('../../assets/effects/flame/4.png'),
    require('../../assets/effects/flame/5.png'),
    require('../../assets/effects/flame/6.png'),
    require('../../assets/effects/flame/7.png'),
  ],
  smoke: [
    require('../../assets/effects/smoke/1.png'),
    require('../../assets/effects/smoke/2.png'),
    require('../../assets/effects/smoke/3.png'),
    require('../../assets/effects/smoke/4.png'),
    require('../../assets/effects/smoke/5.png'),
    require('../../assets/effects/smoke/6.png'),
    require('../../assets/effects/smoke/7.png'),
  ],
  /** Muzzle flash for sniperA (Sniper kit): 3 frames × 50ms = 150ms, non-looping. */
  muzzle_flash_a: [
    require('../../assets/effects/muzzle_flash/sniper_1.png'),
    require('../../assets/effects/muzzle_flash/sniper_2.png'),
    require('../../assets/effects/muzzle_flash/sniper_3.png'),
  ],
  /** Muzzle flash for sniperB (Soldier02): 3 frames × 50ms = 150ms, non-looping. */
  muzzle_flash_b: [
    require('../../assets/effects/muzzle_flash/gunner_1.png'),
    require('../../assets/effects/muzzle_flash/gunner_2.png'),
    require('../../assets/effects/muzzle_flash/gunner_3.png'),
  ],
  /**
   * Muzzle flash for raider: reuses gunner_1–3 frames (Soldier kit has no standalone
   * flash sprites; Soldier Shot.png is a full-character pose, not a flash overlay).
   */
  muzzle_flash_raider: [
    require('../../assets/effects/muzzle_flash/gunner_1.png'),
    require('../../assets/effects/muzzle_flash/gunner_2.png'),
    require('../../assets/effects/muzzle_flash/gunner_3.png'),
  ],
  muzzle_flash_panzer: [
    require('../../assets/effects/muzzle_flash/panzer_fire_1.png'),
    require('../../assets/effects/muzzle_flash/panzer_fire_2.png'),
    require('../../assets/effects/muzzle_flash/panzer_fire_3.png'),
  ],
} as const;

/**
 * Terrain tilesheet registry — Phase 5 G2.
 *
 * Each PNG is a 320×320 sprite sheet of 25 tile variants arranged in a 5×5 grid.
 * Individual tiles are 64×64px. Use Atlas component for sub-rectangle rendering.
 *
 * Variant index → sheet position: col = index % 5, row = floor(index / 5).
 * Source rect: { x: col*64, y: row*64, width: 64, height: 64 }.
 */
export const TileSprites = {
  dirt:  require('../../assets/sprites/environment/tilesets/dirt.png'),
  sand:  require('../../assets/sprites/environment/tilesets/sand.png'),
  grass: require('../../assets/sprites/environment/tilesets/grass.png'),
  road:  require('../../assets/sprites/environment/tilesets/road.png'),
} as const;

/**
 * Environment prop sprite registry — Phase 5 G3.
 *
 * Flat key → require() map. Keys match assetKey strings in mapGenerator.ts pools.
 * Metro requires static string literals in require() — no dynamic paths allowed.
 *
 * Used in GameCanvas: one useImage() call per key, assembled into propImageLookup
 * Record<string, SkImage | null>, then rendered as one Atlas per assetKey type.
 */
export const EnvSprites = {
  // Structures
  env_house01:    require('../../assets/sprites/environment/structures/house_01.png'),
  env_house02:    require('../../assets/sprites/environment/structures/house_02.png'),
  env_watchtower: require('../../assets/sprites/environment/structures/watchtower.png'),
  // Trees
  env_tree_large_1: require('../../assets/sprites/environment/props/trees/tree_large_1.png'),
  env_tree_large_2: require('../../assets/sprites/environment/props/trees/tree_large_2.png'),
  env_tree_large_3: require('../../assets/sprites/environment/props/trees/tree_large_3.png'),
  env_tree_large_4: require('../../assets/sprites/environment/props/trees/tree_large_4.png'),
  env_tree_small_1: require('../../assets/sprites/environment/props/trees/tree_small_1.png'),
  env_tree_small_2: require('../../assets/sprites/environment/props/trees/tree_small_2.png'),
  env_tree_small_3: require('../../assets/sprites/environment/props/trees/tree_small_3.png'),
  // Bushes
  env_bush_1: require('../../assets/sprites/environment/props/bushes/bush_1.png'),
  env_bush_2: require('../../assets/sprites/environment/props/bushes/bush_2.png'),
  env_bush_3: require('../../assets/sprites/environment/props/bushes/bush_3.png'),
  // Rocks
  env_rock_large:  require('../../assets/sprites/environment/props/rocks/rock_large.png'),
  env_rock_medium: require('../../assets/sprites/environment/props/rocks/rock_medium.png'),
  env_rock_small:  require('../../assets/sprites/environment/props/rocks/rock_small.png'),
  // Barrels / crates
  env_box_wood:           require('../../assets/sprites/environment/props/barrels/box_wood.png'),
  env_box_military:       require('../../assets/sprites/environment/props/barrels/box_military.png'),
  env_barrel_oil:         require('../../assets/sprites/environment/props/barrels/barrel_oil.png'),
  env_barrel:             require('../../assets/sprites/environment/props/barrels/barrel.png'),
  env_box_wood_small:     require('../../assets/sprites/environment/props/barrels/box_wood_small.png'),
  env_box_military_small: require('../../assets/sprites/environment/props/barrels/box_military_small.png'),
  // Vehicle wrecks
  env_car_wreck_1:       require('../../assets/sprites/environment/vehicles/wrecks/car_wreck_1.png'),
  env_car_wreck_2:       require('../../assets/sprites/environment/vehicles/wrecks/car_wreck_2.png'),
  env_car_wreck_3:       require('../../assets/sprites/environment/vehicles/wrecks/car_wreck_3.png'),
  env_truck_wreck_1:     require('../../assets/sprites/environment/vehicles/wrecks/truck_wreck_1.png'),
  env_truck_wreck_2:     require('../../assets/sprites/environment/vehicles/wrecks/truck_wreck_2.png'),
  env_small_truck_wreck: require('../../assets/sprites/environment/vehicles/wrecks/small_truck_wreck.png'),
  env_ambulance_wreck:   require('../../assets/sprites/environment/vehicles/wrecks/ambulance_wreck.png'),
  env_police_wreck:      require('../../assets/sprites/environment/vehicles/wrecks/police_wreck.png'),
  env_bus_wreck:         require('../../assets/sprites/environment/vehicles/wrecks/bus_wreck.png'),
  env_helicopter_wreck:  require('../../assets/sprites/environment/vehicles/wrecks/helicopter_wreck.png'),
  env_humvee_wreck_1:    require('../../assets/sprites/environment/vehicles/wrecks/humvee_wreck_1.png'),
  env_humvee_wreck_2:    require('../../assets/sprites/environment/vehicles/wrecks/humvee_wreck_2.png'),
  env_humvee_wreck_3:    require('../../assets/sprites/environment/vehicles/wrecks/humvee_wreck_3.png'),
  env_humvee_wreck_4:    require('../../assets/sprites/environment/vehicles/wrecks/humvee_wreck_4.png'),
  env_humvee_wreck_5:    require('../../assets/sprites/environment/vehicles/wrecks/humvee_wreck_5.png'),
  env_humvee_wreck_6:    require('../../assets/sprites/environment/vehicles/wrecks/humvee_wreck_6.png'),
  env_acs_wreck:         require('../../assets/sprites/environment/vehicles/wrecks/acs_wreck.png'),
  env_bomber_wreck_2:    require('../../assets/sprites/environment/vehicles/wrecks/bomber_wreck_2.png'),
  env_bomber_wreck_3:    require('../../assets/sprites/environment/vehicles/wrecks/bomber_wreck_3.png'),
} as const;

export const GuiSprites = {
  upgrade: {
    bg: require('../../assets/ui/upgrade/BG.png'),
  },
  /**
   * Weapon HUD icons for the CrateRevealModal (and future weapon HUD in Phase 7).
   * All 7 icons are custom AI-sourced 64×64 or 80×80 RGBA PNGs (batch: weapon sprite swap).
   * Kit silhouette placeholders (Pistol_HUD, SMG_HUD, MG_HUD) no longer used here.
   */
  weaponHudIcons: {
    pistol: require('../../assets/ui/icons/Pistol.png'),
    aks74u: require('../../assets/ui/icons/SMG.png'),
    ak74:   require('../../assets/ui/icons/Assault_Rifle.png'),
    svd:    require('../../assets/ui/icons/Sniper_Rifle.png'),
    m870:   require('../../assets/ui/icons/Shotgun.png'),
    gp25:   require('../../assets/ui/icons/Rocket_Launcher.png'),
    rpo:    require('../../assets/ui/icons/Flame_Thrower.png'),
  },
  skillIcons: {
    ammo_545bt:               require('../../assets/ui/icons/AP_Rounds.png'),
    ammo_subsonic:            require('../../assets/ui/icons/Subsonic.png'),
    ammo_tracer:              require('../../assets/ui/icons/Tracer.png'),
    optics_red_dot:           require('../../assets/ui/icons/Red_Dot.png'),
    optics_pso_scope:         require('../../assets/ui/icons/Holographic.png'),
    gear_plate_carrier:       require('../../assets/ui/icons/Plate_Carrier.png'),
    gear_tactical_boots:      require('../../assets/ui/icons/Tactical_Boots.png'),
    gear_mre:                 require('../../assets/ui/icons/MRE.png'),
    provisions_painkillers:   require('../../assets/ui/icons/Painkillers.png'),
    provisions_stims:         require('../../assets/ui/icons/Stims.png'),
    ammo_hollow_points:       require('../../assets/ui/icons/Hollow_Points.png'),
    gear_ceramic_insert:      require('../../assets/ui/icons/Ceramic_Insert.png'),
    optics_suppressor:        require('../../assets/ui/icons/Suppressor.png'),
    provisions_comms_headset: require('../../assets/ui/icons/Comms_Headset.png'),
    gear_helmet:              require('../../assets/ui/icons/Helmet.png'),
    provisions_field_medic_kit: require('../../assets/ui/icons/Field_Medic_Kit.png'),
    gear_backpack:            require('../../assets/ui/icons/Backpack.png'),
    throwables_frag:          require('../../assets/ui/icons/Frag.png'),
    throwables_smoke:         require('../../assets/ui/icons/Smoke.png'),
    throwables_molotov:       require('../../assets/ui/icons/Molotov.png'),
    gear_heavy_plate:         require('../../assets/ui/icons/Heavy_Plate.png'),
    gear_knee_pads:           require('../../assets/ui/icons/Kneepads.png'),
    ammo_fmj:                 require('../../assets/ui/icons/FMJ.png'),
    optics_acog:              require('../../assets/ui/icons/ACOG.png'),
    gear_energy_bar:          require('../../assets/ui/icons/Energy_Bar.png'),
  },
} as const;

// ─── Flyover sprites ──────────────────────────────────────────────────────────

export const FlyoverSprites = {
  heliBody: require('../../assets/sprites/boss/helicopter/heli_body.png'),
  rotorFrames: [
    require('../../assets/sprites/boss/helicopter/rotor_1.png'),
    require('../../assets/sprites/boss/helicopter/rotor_2.png'),
    require('../../assets/sprites/boss/helicopter/rotor_3.png'),
  ],
} as const;
