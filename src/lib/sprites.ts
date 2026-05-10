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
 *   Phase 3+5: EnemySprites  (scav, raider, gunner, sniper, humvee, btr, panzer, acs)
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
 * Scav  = Soldier (kit 1a): 7-frame walk, 1-frame shot, 4-frame die.
 * Raider = Soldier 02 (kit 1a): 5-frame fire (used as walk cycle), 4-frame die.
 *   Raider has no separate walk frames — fire frames are used for locomotion
 *   (gives a "charging with weapon raised" look, keeps Raider visually distinct).
 *
 * Shot and die frames are imported now (one asset-import pass for all of Phase 3)
 * even though G1 only uses walk/fire frames for rendering.
 */
export const EnemySprites = {
  scav: {
    /** Upper body overlay — composited over walk frames (same two-layer pattern as hero). */
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
    /** Fire frames used as walk/move animation (no separate walk cycle in kit). */
    fire: [
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
} as const;
