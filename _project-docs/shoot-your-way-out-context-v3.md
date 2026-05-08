# Shoot Your Way Out — Master Context Document v3
*Last updated: May 2026 · Replaces v2 · For use at the start of any new Claude or CC session*

---

## How to Use This Document

Paste this document at the start of any new Claude chat or CC session to instantly restore full context. The document is the single source of truth — if anything in conversation contradicts the doc, the doc wins until updated.

This is **v3**, written after a complete audit of both asset kits. Asset paths in this doc are verified against the actual files. Earlier versions described the kits from memory and were partially wrong.

---

## People

**Mo** — Co-founder and product lead at OsburnLabs. Project manager background, 15 years IT experience, 5 PM certifications. Not a developer but highly capable of following technical instructions, running commands, and working step by step. Prefers PowerShell commands over manual file edits. Likes to plan and discuss before building. Thinks in systems and sequences.

**Bo** — Co-founder, business and sales side. Involved in business decisions and direction.

**OsburnLabs** — GitHub org: `osburnlabs-svg` · Email: `osburnlabs@gmail.com`

---

## What Shoot Your Way Out Is

A top-down rogue-lite mobile game themed like Escape from Tarkov but playing like Vampire Survivors.

**The core loop:**
- Player drags finger to move character around an arena
- Character auto-fires at the nearest enemy
- Fight off waves of enemies, earn XP, level up, unlock skills and weapons
- Survive as long as possible — score is based on kills and time

**Inspirations:** Escape from Tarkov (aesthetic, weapons, military theme) + Vampire Survivors (auto-fire, wave survival, skill progression).

**Platform:** iOS and Android (mobile native via React Native + Expo).

---

## The Larger Initiative — This Is a Template

Shoot Your Way Out is **game #1 of a series of mobile games**. We are building a **reusable engine** that can produce a new mobile game in **under one day** by swapping content.

**What gets templated (engine code, written once, reused):**
- Project scaffold (Expo + Skia + Reanimated + EAS config)
- Game loop (delta-time, fixed timestep, render separation)
- Input system (drag-to-move, swipe, tap)
- Entity system (player, enemies, projectiles, pickups, hazards)
- Spawning system (waves, scaling, boss timers)
- HUD framework (HP, XP, score, timers — data-driven)
- Persistence layer (AsyncStorage with typed schema)
- Audio engine (music + SFX channels with volume control)
- Monetization layer (ads, IAP, support button)
- Analytics layer (event logging)
- Screen flow (Menu → Map Select → Game → GameOver)
- Asset loader (sprite sheet parsing, animation system)
- Map system (tile rendering, obstacle placement from JSON)
- Skill system (modifier framework, level-up modal)
- Crate/loot drop system

**What gets swapped per game (content, written per-title):**
- Asset packs (sprites, sounds, music)
- `gameConstants.ts` (weapons, enemies, skills, balance)
- Theme tokens (colors, fonts)
- Map JSON files
- Win/loss conditions

**Implication:** engine code lives in `lib/` and uses generic names. Tarkov-flavored content lives in `data/` and `assets/`. Game #2 is "swap `data/` and `assets/`, ship."

---

## Build Status

**Decision locked:** Building from scratch using Claude Code. Not converting from Base44 prototype. The Base44 version was a React + Canvas web app — wrong stack for mobile. The context document is detailed enough that CC can rebuild without reference to the old code.

**Base44 published version (reference only — DO NOT port):** https://shoot-tactical-out.base44.app/

---

## Tech Stack — Locked

| Layer | Technology | Why |
|---|---|---|
| Framework | React Native (managed Expo workflow) | Industry standard for cross-platform mobile; managed Expo handles tooling pain |
| Build & Submit | EAS Build + EAS Submit | Cloud builds (iOS works on Windows), one-command store submission |
| OTA Updates | EAS Update | Ship balance changes and bug fixes without store review |
| Rendering | `@shopify/react-native-skia` | 2D graphics on UI thread via Reanimated worklets, hits 60fps reliably |
| Animation | `react-native-reanimated` | Powers Skia worklets and HUD transitions |
| Gestures | `react-native-gesture-handler` | Drag-to-move input |
| Storage | `@react-native-async-storage/async-storage` | Standard mobile persistence |
| Audio | `expo-av` | Music + SFX with concurrent playback, ships with Expo |
| Ads | `react-native-google-mobile-ads` (AdMob) | Standard, supports rewarded + banner |
| IAP | `expo-in-app-purchases` (or `react-native-iap` if SDK 54 compat issues) | TBD at Phase 9 |
| Analytics | PostHog or Amplitude (free tier) | Decided at Phase 1 |
| Routing | Plain React state (no `expo-router`) | Three screens, file-based routing is overkill |
| Frame rate | 60fps target, delta-time loop | Drag-to-move feels sluggish below 60; degrades gracefully |

**Capacitor is dropped** — that was for wrapping the web app, irrelevant since we're going native.

**Accounts needed:**
- Apple Developer ($99/yr)
- Google Play ($25 one-time)
- Expo account (free, expo.dev)
- AdMob account (free)

---

## Native Dependency Hygiene

**Engine-level rule** — applies to this game and all future games built from this template.

Any change to `package.json` that adds, removes, or upgrades a package with native code (anything that compiles into the APK / IPA) must be treated as a separate, deliberate workflow with its own checklist. Do not mix native dependency changes with feature work in the same session.

### Why this rule exists

Phase 2 hit two integration issues that pre-flight checks would have caught:
1. `expo-in-app-purchases` — incompatible with SDK 54. Failed at first EAS dev build. Would have been caught by running `npx expo-doctor` before building.
2. `react-native-safe-area-context` — `RNCSafeAreaProvider` native ViewManager not registering in the Fabric build. Added JS-side after the dev client APK was already built, causing a mismatch. Would have been caught by a smoke test after rebuilding.

### Native Dependency Change Checklist

When adding, removing, or upgrading a package with native code:

1. **Identify scope.** List every package being added/changed. Confirm each is needed for the current phase.
2. **Pin exact versions.** Native packages get exact-pinned (`"4.1.1"` not `"~4.1.1"` or `"^4.1.1"`). Patch updates on native code can break view manager registration silently.
3. **Run `npx expo-doctor`.** Resolve all warnings before rebuilding. If a warning is intentionally ignored, document why.
4. **Rebuild dev client APK via EAS** (`eas build --profile development --platform android`).
5. **Install new APK on device.**
6. **Smoke test.** Before writing any new feature code, render a minimal test screen that exercises every native module: SafeAreaProvider, Skia Canvas, GestureDetector, Reanimated useFrameCallback, etc. If any fails to mount, debug the native integration *first*. Do not start feature work until the smoke test passes.
7. **Document any issues** in the progress log errata + Open Issues table.

Native modules ship as compiled C++/Java/Kotlin paired with JS bindings. The two halves must match. JS-only changes are free; native changes are expensive and must be verified independently.

---

## Pre-Phase-1 Checklist (status)

- [x] GitHub repo created: `osburnlabs-svg/shoot-your-way-out`
- [x] Expo account created
- [x] EAS Build approved for use (free tier, 30 builds/month)
- [x] Both asset kits acquired and audited
- [ ] Apple Developer account (needed at Phase 9, not before)
- [ ] Google Play account (needed at Phase 9, not before)
- [ ] AdMob account (needed at Phase 6 for monetization integration)
- [ ] Music tracks sourced (4 tracks needed, see Audio section)
- [ ] SFX library sourced (~25 sounds, see Audio section)

---

## Asset Inventory (verified from extracted kits)

Both kits are from Free Game Assets / craftpix.net — same publisher, same style, zero art consistency risk. Total spend: $1.90.

### Kit 1: TDS Modern Pixel Game Kit

Six sub-packs containing:

**Hero (player character) — `tds-modern-hero-weapons-and-props/`**
- `Hero_Walk/With Kneepads/1.png` through `7.png` — 7-frame walk cycle, kneepads variant (use this one)
- `Hero_Walk/Without Kneepads/1.png` through `7.png` — 7-frame walk cycle, no kneepads
- `Hero_Die/1.png` through `4.png` — 4-frame death animation
- **Five weapon poses, each with idle + empty + shot frames:**
  - `Hero_Pistol/Hero_Pistol.png`, `Hero_Pistol_Empty.png`, `Shot/HPistolFire_01-03.png`
  - `Hero_Rifle/Hero_Rifle.png`, `Hero_Rifle_Empty.png`, `Shot/Hero_Rifle_Fire.png`
  - `Hero_MachineGun/Hero_MachineGun.png`, `Hero_MachineGun_Empty.png`, `Shot/Hero_MachineGunFire.png`
  - `Hero_GrenadeLauncher/Hero_GrenadeLauncher.png`, `Hero_GrenadeLauncher_Empty.png`, `Shot/Hero_GrenadeLauncher_Fire01-02.png`
  - `Hero_Flamethrower/Hero_Flamethrower.png`, `Hero_Flamethrower_Empty.png`, `Shot/Hero_Flamethrower_Fire01-03.png`

**Pickups (props) — `tds-modern-hero-weapons-and-props/Props/`**
- `Ammo/Ammo.png` (icon), `Ammo Box.png` (drop), `Army Box.png` (**weapon crate**)
- `Armor/Armor.png` (regular), `Armor Small.png`
- `HP/HP.png`, `HP Box.png`
- `Money/Money Big.png`, `Money Small.png`
- `Speed/Iocn_Speed_01.png`, `Icon Speed 02.png`

**Effects — `tds-modern-hero-weapons-and-props/Effects/`**
- `Explode/1.png` through `4.png` — 4-frame explosion (64x64)
- `Flamethrower/1.png` through `7.png` — 7-frame flame stream
- Per-weapon muzzle flashes: `Pistol Shot/`, `Rifle Shot/`, `MachineGun Shot/`, `Grenade Launcher Shot/`
- `rocket/rocket1.png`, `rocket2.png`, `rocket-f1.png` through `f3.png` — projectile sprites

**Foot soldiers — `tds-pixel-art-modern-soldiers-and-vehicles-sprites/` (kit 1a)**
- `Soldier/Walk/SW_01-07.png` — 7-frame walk
- `Soldier/Shot/` and `Soldier/Die/` — fire and death animations
- `Soldier 02/Fire/SF_01-05.png` — second soldier variant fire
- `Soldier 02/Die/SD2_01-04.png` — second variant death

**Specialist enemies — `tds-modern-soldiers-and-vehicles-sprites-2/` (kit 1b)**
- `Gunner/` — heavy machine gunner: 7-frame walk, fire, die, with bullet sprite + muzzle flash
- `Sniper/` — sniper: 7-frame walk, shot frame, 5-frame die, bullet + muzzle flash, base/tower for stationary turrets

**Ground vehicle enemies — `tds-pixel-art-modern-soldiers-and-vehicles-sprites/` and kit 1b**
- `BTR/BTR_Move/` (2-frame), `BTR_Broken/`, `BTR_Shot/` — wheeled IFV
- `Panzer/Panzer_Move/` (4-frame), `Panzer_Broken/`, `Panzer_Fire/` (3-frame) — tank
- `Humvee/Humvee.png`, `Humvee2.png`, `Humvee3.png` (3 paint variants), `Broken/`
- `ACS/Move/` (5-frame), `ACS/Broken/`, fire effect — tracked IFV

**Air bosses — `tds-modern-soldiers-and-vehicles-sprites-2/`**
- `Helicopter/Parts/` — `Helicopter_Base.png`, `Body Without Wings.png`, `Wings.png`, `MachineGun.png`, `Rocket 1x.png`, `Rocket 2x.png`, multiple rotor speeds (`Helicopter_Screw_2x/3x/4x/4x Cross.png`)
- `Helicopter/Move/4x Smooth/1-3.png` (rotor animation), other speeds available
- `Helicopter/Broken/` — crashed wreck states
- `Effects/Helicopter MachineGun/HMGF_01-03.png` — heli MG muzzle flash
- `Bomber/Bomber_Source.png`, `BONUS Bomber Mini.png` — flyover hazard

**Tilesets — `tds-modern-tilesets-environment/PNG/`**
- `Tiles/_0000_WTiles.png` (water), `_0001_DirtTiles.png`, `_0002_SandTiles.png`, `_0003_GrassTiles.png`, `_0004_RoadTiles.png` — 5 ground textures
- Transition tiles: `_0006_GrassToRoad.png`, `_0007_SandToRoad.png`, `_0008_DirtToRoad.png`, `_0005_RoadDecals.png`
- `BridgeTiles.png` — wood bridge (potential 4th-map content)
- Structures: `House/TDS04_0000_House01.png`, `TDS04_House02.png`, `WatchTower/TDS04_0009_WatchTower.png`
- Cover: `SandBag/TDS04_0002_Sandbags.png`, `Rocks/TDS04_0003-0005_Rock01-03.png`
- Foliage: `Trees Bushes/TDS04_0006-0022_Tree*.png` (4 trees), `Bush-01-03.png` (3 bushes)
- Props: `Crates Barrels/TDS04_0013-0018_*.png` (boxes, oil barrels, regular barrels)

**GUI — `tds-modern-gui-pixel-art/PNG/`** (this saves us enormous design time)
- `Main menu/` — `BTN PLAY.png`, `BTN SETTINGS.png`, `BTN Exit.png`, `Button BG.png`, `Button BG shadow.png`
- `HUD/CHARACTER HUD/` — `HP ARMOR AMMO HUD.png` (combined strip), individual icons
- `HUD/MONEY PANEL/` — `Money Panel HUD.png`, `Money Icon.png`
- `HUD/WEAPON ICONS/` — `Pistol HUD.png`, `SMG HUD.png`, `MG HUD.png`, `RPG HUD.png`, `Flamethrower HUD.png`
- `Upgrade/Upgrade Preset.png` — **pre-built level-up modal** with 8 slots, weapon icons, skill icons, progress bars
- `Upgrade/BG.png` — empty version of same
- `Pause menu/` — full pause UI with `Pause.png` logo, `BTN BACK.png`, `BTN MENU.png`, `BTN SETTINGS.png`, `BG.png`
- `Settings/` — `Settings BG.png`, `Bar BG.png`, `Bar.png` (volume sliders), 3 checkbox styles, `BTN OK.png`, `Mark.png`
- `Mission Failed/` — `BG.png`, `BG Preset.png`, `BTN Retry.png`
- `Victory/` — `Victory panel Preset.png`, `Star.png`, `BTN MENU.png`, `BTN OK.png`
- `Loading Screen/` — `Background.png`, `Loading Bar BG.png`, `Loading Bar.png`, `Loading icon.png`, `Test Logo.png` (replace with our logo)
- `Levels Menu/` — numbered tiles `1.png` through `18.png`, `Arrow Left.png`, `Arrow Right.png` (used for map select if needed)
- `Inventory and Stats/` — `Inventory Cell.png` (grid cell), `Inventory Stats.png` (stat row), `HP Icon.png`, `Armor Icon.png`, `Weight Icon.png`
- `Bonus/Bonus 01-03.png` — bonus indicators (perfect for run modifier display)
- `Minimap/` — `Minimap BG.png` plus 5 unit types (Soldier/Helicopter/Jeep/Panzer/Air) × 3 colors (A=ally, E=enemy, N=neutral) = 15 markers

**App store icons — `icons/`**
- `512x512.png`, `1024x1024.png`, `2048x2048.png` — pre-made, depicts armored soldier, ready for store submission

### Kit 2: Top Down Trucks and Cars

Path: `top-down-trucks-and-cars-pixel-art-asset-pack/PNG/`

- **336 pristine vehicle sprites** across 19 color folders
  - 10 sedan/hatchback colors (`car1_bright_blue/` through `car10_yellow/`), each with car/bus/truck/small_truck variants
  - 9 cargo truck colors (`cargo1_beige/` through `cargo9_white/`), each with technical_element variants
- **Special vehicles — `ambulance_police_technical_fire/`**
  - `ambulance.png`, `police_car.png`, `fire engine.png`, `taxi.png`
  - `flatten_technical_part_long.png`, `flatten_technical_part_small.png`
- **35 wrecked variants — `Broken_assets/`** (bullet-riddled, burned-out shells)
  - Mirrors the pristine vehicles with damaged versions
  - Tarkov-perfect aesthetic — these ARE the wrecked-car obstacles
- Source overview sheets: `Civil_cars_source.png`, `Civil_cars_broken_source.png`

---

## Core Gameplay — Locked

### Controls
- **Drag-to-move** — finger on screen, character follows finger position
- **Auto-fire** — character shoots nearest enemy automatically
- **60fps target** — delta-time game loop, frame-rate-independent

### Weapons (5 visual tiers, 8 stat profiles)

Each weapon is a stat profile that uses one of 5 hero animations.

| Weapon | Animation | Tier | Acquisition | Damage | Fire Rate | Range | Spread |
|---|---|---|---|---|---|---|---|
| MP-443 Pistol | Pistol | 1 | Start | 8 | 400ms | 180 | 0.05 |
| AKS-74U | Pistol | 2 | Level 4 | 6 | 150ms | 220 | 0.12 |
| AK-74 | Rifle | 3 | Level 8 | 12 | 200ms | 280 | 0.08 |
| PKM | MachineGun | 4 | Level 12 | 14 | 100ms | 260 | 0.15 |
| SVD Sniper | Rifle | 5 | Level 16 | 45 | 1000ms | 400 | 0.02 |
| M870 Shotgun | MachineGun | 3 | **Crate-only (uncommon)** | 25, 5 pellets | 800ms | 140 | 0.35 |
| GP-25 | GrenadeLauncher | 5 | **Crate-only (rare)** | 35 AOE | 600ms | 220 | 0.10 |
| RPO Flamethrower | Flamethrower | 5 | **Crate-only (legendary)** | 6/tick, ignite DoT | 50ms | 110 | 0.30 |

Numbers are starting values, balanced during playtesting.

### Weapon Progression (hybrid system)

**Guaranteed unlocks (the floor):**
- Levels 4, 8, 12, 16 each grant a guaranteed weapon upgrade
- Player can never have a worse run than baseline

**Crate drops (the upside):**
- Spawned by bosses (see drop table below)
- Walk over crate → 1.5s open animation → weapon reveal
- If crate weapon tier > current → auto-equip with flash effect
- If crate weapon tier ≤ current → converts to bonus score + 5 XP
- **No mid-combat decisions, no inventory UI**

GP-25 and Flamethrower are **crate-exclusive** — never granted by leveling. This makes finding them feel rare and creates run-to-run variance without breaking the floor.

### Skills — 20-skill pool

Skills are stackable modifiers selected via the level-up modal (3 random choices on level up, max 5 stacks per skill unless noted). Modal uses the kit's pre-built `Upgrade Preset.png`.

**AMMO category (damage modifiers)**
- **5.45 BT (AP rounds)** — +20% damage per stack
- **7.62 BP (hollow points)** — +25% crit chance per stack
- **Tracer rounds** — bullets pierce 1 extra enemy per stack
- **Subsonic rounds** — +10% fire rate per stack

**OPTICS & WEAPON MODS category (range/accuracy)**
- **Red Dot Sight** — +15% range per stack
- **PSO Scope** — +30% range, -10% fire rate per stack (sniper trade-off)
- **Suppressor** — +10% damage to first enemy hit per stack
- **Foregrip** — -25% spread per stack

**THROWABLES & EXPLOSIVES category (new attack patterns)**
- **Frag Grenade** — auto-throw at strongest nearby enemy every 8s; per-stack reduces cooldown 1s
- **Smoke Grenade** — every 15s, drop smoke that slows enemies inside (uses `LightSmoke` sprite)
- **Molotov** — every 12s, throw fire patch that does DoT (reuses Flamethrower flame frames)

**GEAR category (defense/survivability)**
- **Plate Carrier** — -10% damage taken per stack
- **Tactical Boots** — +12% movement per stack
- **Helmet** — 15% chance per stack to negate hits (caps at 60%)
- **Backpack** — +1 max revive per stack (caps at 2)

**PROVISIONS category (regen/utility)**
- **MRE** — +15 max HP per stack
- **Water Bottle** — +10% movement and fire rate for 30s after kill streak (refreshes)
- **Painkillers** — +2 HP regen per stack
- **Stims** — +5% damage per stack, but -2 HP/sec (high-risk)

**SPECIALS (rare, max 1 stack)**
- **Night Vision** — extended fog-of-war view, +10% all stats
- **Comms Headset** — money pickups pull toward player from longer range

**Skill icons:** the kit's Upgrade Preset already shows weapons + heart (HP) + armor + helmet. We extend by reusing icon archetypes:
- Damage skills → bullet/ammo icon
- Range skills → optic/scope icon (use one of the rifle silhouettes)
- Defense skills → armor/helmet/heart icons
- Throwables → grenade silhouette (we'll create from grenade launcher rocket sprite)
- Movement → speed icon
- Specials → unique colored badges

This is acceptable for v1. Generating 20 unique pixel-art icons isn't necessary — Vampire Survivors uses very simple icons too.

### Enemies

| Enemy | Sprite Source | HP | Speed | Damage | XP | Wave Tier | Notes |
|---|---|---|---|---|---|---|---|
| Scav | Soldier (kit 1a) | 15 | 1.2 | 5 | 3 | 1+ | Basic foot soldier |
| Raider | Soldier 02 (kit 1a) | 40 | 1.8 | 12 | 8 | 2+ | Faster, more dangerous |
| Gunner | Gunner (kit 1b) | 60 | 0.9 | 8/tick | 12 | 3+ | Stationary fire bursts |
| Sniper | Sniper (kit 1b) | 30 | 0.7 | 30 | 15 | 4+ | Long range, red laser warning |
| **Humvee** | Humvee | 80 | 1.5 | 15 | 18 | 5+ | Drives through, rams player |
| **BTR** | BTR | 150 | 1.0 | 18 | 30 | 6+ | Drops guaranteed pickup |
| **Panzer** | Panzer | 250 | 0.6 | 25 | 50 | 7+ | Mini-boss tank — drops crate (15% chance) |
| **ACS** | ACS | 200 | 0.7 | 20 | 40 | 7+ | Alt to Panzer, drops crate (15% chance) |

The Juggernaut concept is removed — Panzer and ACS replace it with proper sprites.

### Boss: The Hunter (Helicopter)

Spawns every 2 minutes. Uses helicopter assets from kit 1b. Replaces all earlier "sniper nest" boss concepts.

**Phase 1 (100% → 50% HP):**
- Hovers at edge of arena, slowly tracks player
- Fires `MachineGun.png` bursts (uses `Helicopter MachineGun` muzzle flash)
- Every 5s, fires a homing rocket (uses `Rocket 1x.png` projectile)
- Animated rotor uses `Helicopter_Screw_4x.png` rotation
- Rotor wash effect: `LightSmoke` particles fan out beneath it

**Phase 2 — ENRAGED (50% → 0% HP):**
- Switches to faster strafing pattern
- Rotor speeds up to `Helicopter_Screw_4x Cross.png`
- Fires twin rockets (uses `Rocket 2x.png`)
- MG fire rate doubles
- "ENRAGED" badge appears on boss HP bar

**Death sequence:**
- Crash spin (rotor frames slow down)
- Falls and uses `Helicopter/Broken/` wreck sprite
- 4-frame `Explode/` plays
- Wreck remains as a permanent obstacle on the map for the rest of the run
- **Reward:** +3000 score, 12 money pickups, **guaranteed weapon crate**, +1 skill point

### Hazard Event: Bomber Strafe Run

Between boss spawns (at 1-minute mark, 3-minute mark, 5-minute mark, etc.), a `BONUS Bomber Mini.png` flies across the screen on a fixed path with a 3-second telegraph (red warning line on minimap + "INCOMING ORDNANCE" banner).

- Drops 4-6 explosive markers along its path that detonate after 1.5s (uses `Explode/` animation)
- Player has time to dodge — adds tactical pressure without insta-killing
- Bomber itself is invulnerable, just flies past

### Environmental Hazard: Gas Bomb

Periodically spawns at random arena location. Telegraph: small pulsing circle for 1.5s. Then expanding green-tinted smoke cloud (uses `LightSmoke` 7-frame loop). Damage-over-time inside radius. Dissipates after 8 seconds.

This is the only environmental hazard in v1. All other hazard concepts (toxic puddles, electric boxes, crumbling floors) are dropped — no sprites for them.

### Pickups (consumable buffs that drop in combat)

| Pickup | Effect | Drop Chance |
|---|---|---|
| HP (regular) | +30 HP instantly | 2% common, 25% bosses |
| HP Box | +50 HP instantly | Boss only |
| Armor (Small) | +25 overshield (depletes before HP) | 2% common |
| Armor (regular) | +50 overshield | 25% bosses |
| Speed | +30% movement for 8s | 2% common, weighted up on bosses |
| Ammo | +20% fire rate for 8s | 2% common, weighted up on bosses |
| Money (Small) | +10 score, magnets at close range | drops from kills |
| Money (Big) | +50 score, drops only from bosses | 25% bosses |
| **Weapon Crate** (Army Box) | Triggers crate reveal sequence | See drop table |

**Weapon Crate drop table:**
- Common enemy: 0%
- Raider: 1%
- Gunner/Sniper: 3%
- Humvee: 8%
- BTR: 15%
- Panzer/ACS: 25%
- Helicopter boss: 100% guaranteed

**Crate weapon roll table (when player walks over crate):**
- 50% Common: shotgun, pistol-tier alt
- 30% Uncommon: tier-3 weapon ahead of current unlock
- 15% Rare: GP-25 grenade launcher
- 5% Legendary: RPO flamethrower

### Three Maps (replaces procedural reseeding)

Players choose a location from main menu before deploying. Each map is a hand-authored JSON file specifying tile layout, obstacle pool, and atmosphere overrides.

**1. The Compound (Urban Decay)**
- Base tileset: `_0004_RoadTiles.png` (asphalt) with `_0005_RoadDecals.png` accents
- Obstacles: wrecked cars from kit 2 `Broken_assets/` (cars, trucks, small_trucks, ambulance, police_car), `SandBag.png`, `Crates Barrels/` props
- Background dressing: pristine cars from kit 2 (10 colors) parked along edges
- One central `House01.png` structure
- Slightly higher enemy density (1.1× spawn rate)
- Atmosphere: cold gray-blue tint, less ambient light
- Theme caption: *"Close-quarters firefight."*

**2. The Outskirts (Desert Compound)**
- Base tileset: `_0002_SandTiles.png`, transitions via `_0007_SandToRoad.png`
- Obstacles: `Rocks/Rock01-03.png`, `SandBag.png`, oil barrels, BTR/ACS wrecks (using broken sprites)
- One `WatchTower.png` at center (tactical landmark)
- Sparser cover, longer sightlines
- Sniper enemies hit harder (1.3× damage), longer range
- Atmosphere: warm sand tint, dust haze, brighter
- Theme caption: *"The snipers favor this terrain."*

**3. The Treeline (Forest)**
- Base tileset: `_0003_GrassTiles.png`, transitions via `_0006_GrassToRoad.png`
- Obstacles: `Trees Bushes/Tree1-7.png` (multiple variants), `Bush-01-03.png`, `Stumps`, `Rocks`
- More obstacles overall (1.4× cover density), tighter sightlines
- Mid-range engagements favored
- Atmosphere: green tint, slight fog, occasional bird sounds (if SFX available)
- Theme caption: *"Watch the brush."*

Each map JSON specifies:
```typescript
{
  id: 'compound',
  displayName: 'The Compound',
  caption: 'Close-quarters firefight.',
  baseTile: 'road',
  decalTiles: ['road_decals'],
  centralStructure: { sprite: 'house_01', x: 0.5, y: 0.5 },
  obstaclePool: ['wreck_car', 'wreck_truck', 'sandbag', 'crate', 'barrel'],
  obstacleDensity: 0.6,
  backgroundDressing: { sprites: ['car_blue', 'car_red', ...], placement: 'edges' },
  spawnRateMultiplier: 1.1,
  atmosphereTint: '#8a90a0',
  vignette: 0.5,
}
```

Map files live in `data/maps/`. Adding a 4th map for v1.1 (River Crossing — uses water tiles + bridge) is a single new JSON.

### Visual & Atmosphere

**Color palette (base):**
- Background dark: `#0a0d08`
- Accent gold: `#c9a356`
- Rust orange: `#a8501f`
- Warning red: `#cc3333`
- Toxic green: `#4CAF50`

Per-map tints layer on top via Skia color matrix.

**Atmospheric effects:**
- Dynamic fog-of-war — dark mask softens around player with breathing animation, warm amber torch tint
- Corner vignette — permanent dark edges
- Weather: diagonal rain on Compound, dust motes on Outskirts, falling leaves on Treeline (single weather variable, swap particles per map)
- Lightning flashes (Compound only)

---

## HUD

Composed using kit GUI assets. All visible HUD elements:

- **Top-left:** Money panel (`Money Panel HUD.png` + `Money Icon.png`) showing current score
- **Top-center:** Time elapsed (mm:ss) and kill count
- **Top-right:** Weapon icon (one of the 5 `WEAPON ICONS/` PNGs based on equipped tier)
- **Bottom-left:** HP/Armor bars (using `HP ARMOR AMMO HUD.png` strip)
- **Bottom-center:** XP bar with current level
- **Bottom-right:** Active skill chips (small icons stacked horizontally)
- **Top-right corner:** **Minimap** (`Minimap BG.png`) with player (A-Soldier green), enemies (E-* red), helicopter boss (E-Helicopter red), bomber (E-Air red), pickups (N-* yellow). 60×40 pixels, ~10% screen size.
- **Boss wave UI:** Boss HP bar slides in from top, "ENRAGED" badge appears in phase 2
- **Banners:** "BOSS WAVE — HIGH VALUE TARGET INBOUND" (20s warning), "INCOMING ORDNANCE" (bomber strafe warning)
- **Bonus indicator:** if a run modifier is active (from rewarded ad), `Bonus 01-03.png` icon shows top-left near time

Safe area insets are respected — iPhone notch and dynamic island get padding. HUD elements never overlap interactive zones (drag area).

---

## Screens & Flow

```
[Loading] → [Main Menu] → [Map Select] → [Game] ⇄ [Pause] → [Game Over] → loop back to Main Menu
```

**Loading Screen** — Uses `Loading Screen/Background.png`, `Loading Bar BG/Loading Bar.png`. Replaces `Test Logo.png` with our logo (TBD). Preloads all SFX into memory during this screen.

**Main Menu** — Uses kit's `Main menu/` assets. Layout:
- Centered title (custom text rendered in pixel font)
- Meta-stats panel (high score, best time, total kills, total runs) using `Inventory Stats.png` styling
- DEPLOY button (`BTN PLAY.png`) — large, prominent
- Settings button (`BTN SETTINGS.png`) — corner
- Support the Dev button — small, corner ("☕ Support" — see Monetization)
- Background music: menu loop track

**Map Select** — Uses kit's `Levels Menu/` assets reframed as 3 location cards. Each card shows:
- Map preview thumbnail (rendered from tile assets)
- Map name (Compound / Outskirts / Treeline)
- Caption
- "Best run" stat for that map
- Run modifier offer (from rewarded ad — see Monetization): "Watch ad for: Bonus XP / Cursed Run / Mystery Crate"
- DEPLOY button at bottom

**Game** — Full gameplay with HUD overlay. Music: combat loop. On boss spawn, ducks combat → boss loop. Returns to combat on boss death.

**Pause Menu** — Uses kit's `Pause menu/PAUSE PRESET.png` overlay with `BTN BACK.png` (resume), `BTN MENU.png` (quit to main), `BTN SETTINGS.png`. Triggered by tap on pause icon (`BTN MENU HUD.png`) in HUD corner.

**Settings** — Uses kit's `Settings/` assets. Two volume sliders (Music + SFX), three checkboxes (Vibration, Weather Effects, Show FPS — for debug). `BTN OK.png` saves and closes.

**Game Over** — Uses kit's `Mission Failed/BG.png`. Shows:
- Hero death animation playing in center (4-frame loop)
- Stats: score, time survived, level reached, kills
- "NEW HIGH SCORE" star badge if applicable (uses `Star.png`)
- Two buttons: REDEPLOY (instant restart same map), RETURN TO HQ (back to main menu)
- **Revive prompt** if first death: "Watch ad to revive?" (rewarded ad, free first time, ad second time — see Monetization)
- Music: short game-over sting, then silence or menu music return

---

## Monetization (4 touchpoints, all opt-in except menu banner)

### 1. "Support the Dev" IAP — $2.99 one-time
- Removes all ads permanently
- Permanent +5% XP boost on every run (small enough not to feel pay-to-win, big enough to feel like thanks)
- Button: small, polite, on main menu corner ("☕ Support" with subtle gold accent matching kit palette)
- Implementation: `expo-in-app-purchases`, single non-consumable product `support_dev_v1`
- Persistence: AsyncStorage flag `support_unlocked: true`

### 2. Pre-run Rewarded Ad — Run Modifiers
- Shown on Map Select screen
- "Watch ad for a perk?" with 3 random options:
  - **Bonus loadout** — start with tier-2 weapon already equipped
  - **+50% XP run** — accelerates skill unlocks for one run
  - **Cursed run** — enemies +30% HP and +30% damage, score 2× (high-skill option)
- Player can skip, run starts normal
- One ad max per run

### 3. Mid-run Rewarded Ad — Revive
- On death, if it's the player's first death this run: "Continue? (Watch ad)"
- Player gets full HP, brief invulnerability (3s), respawns at center
- One revive max per run on free tier
- "Backpack" skill stacks add additional revives (those are free)

### 4. Banner Ad — Main Menu only
- AdMob banner at bottom of main menu
- **Never shown:** in-game, on game-over screen, on pause menu, during loading, on map select
- Game-over especially is off-limits — players are emotional, ads there are predatory
- Hidden entirely if Support IAP purchased

### Architecture: `lib/monetization.ts`
Single module abstracting AdMob + IAP behind a simple interface:
```typescript
monetization.showRewardedAd(callback): Promise<{ rewarded: boolean }>
monetization.showBanner(): void
monetization.hideBanner(): void
monetization.purchaseSupport(): Promise<{ success: boolean }>
monetization.isSupportUnlocked(): boolean
```

This is engine code. Game #2 inherits all four touchpoints by swapping product IDs.

---

## Audio System

### Library: `expo-av`

Two independent channels with separate volume controls:
- **Music channel** — one track at a time, looping, fades on screen change, volume slider 0-100 (default 70)
- **SFX channel** — many concurrent sounds, no looping, volume slider 0-100 (default 100)

### iOS Silent Switch Override
Game audio plays even when phone is on silent (standard for games). One-line config:
```typescript
Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
```

### Music — 4 tracks needed (sourcing TBD, royalty-free metal/aggressive instrumental)
1. **Menu loop** — moodier, slower, "before deployment" vibe
2. **Combat loop** — driving, aggressive, plays during run
3. **Boss loop** — heavier, kicks in when helicopter spawns, ducks back to combat on death
4. **Game over sting** — short 3-5 second one-shot, not a loop

**Sourcing approach:** look at Free Music Archive (CC-BY metal), OpenGameArt.org (CC0/CC-BY game music), Kenney audio packs (CC0). Verify license per track before use. Avoid Ollie Beanz — his license excludes video games.

### SFX — ~25 sounds needed

**Weapons (one base sound per tier, pitch-shift at runtime for variation):**
- `shoot_pistol`, `shoot_rifle`, `shoot_mg`, `shoot_shotgun`, `shoot_grenade_launcher_thunk`, `grenade_whistle`, `flamethrower_whoosh` (looping while firing)

**Combat:**
- `impact_flesh`, `impact_metal`, `explosion_small`, `explosion_large`
- `helicopter_rotor` (loop during boss wave), `heli_rocket_launch`
- `bomber_passby` (low rumble loop during strafe event)

**Player:**
- `footstep` (subtle, paced to walk cycle)
- `hit_grunt`, `player_death`

**UI:**
- `pickup_pop`, `xp_absorb`, `level_up_chime`, `crate_open_reveal`, `button_click`, `menu_swoosh`

**Ambient (loops during gameplay at low volume):**
- `distant_gunfire` (sells the warzone)
- `wind` (Outskirts only)

**Sourcing approach:**
- **Sonniss GameAudioGDC bundles** — annual free release, explicit royalty-free commercial license, weapon sounds and explosions
- **Freesound.org** — filter strictly to CC0
- **Kenney audio packs** — UI sounds in CC0

### Architecture: `lib/audioEngine.ts`

```typescript
audioEngine.preloadSFX(): Promise<void>     // call during loading screen
audioEngine.playSFX(id: string, options?: { volume?, pitch? }): void
audioEngine.playMusic(id: string, fadeMs?: number): Promise<void>
audioEngine.duckMusic(toVolume: number): void   // for boss spawn
audioEngine.unduckMusic(): void
audioEngine.setMusicVolume(0-100): void
audioEngine.setSFXVolume(0-100): void
audioEngine.stopAll(): void
```

Stub implementation in Phase 1 (all methods are no-ops). Real implementation in Phase 6. This means Phases 2-5 can call `audioEngine.playSFX('shoot_pistol')` and have it silently do nothing — when Phase 6 wires it up, every existing call starts working.

---

## Analytics

**Library:** PostHog (free tier, 1M events/month) — decision over Amplitude due to better React Native SDK and friendlier free tier.

**Events from day one:**
- `app_opened`
- `run_started` (props: map_id, modifier_active, support_unlocked)
- `run_ended` (props: map_id, duration_sec, kills, level_reached, score, weapon_at_death, cause_of_death)
- `level_up` (props: skill_chosen, current_level)
- `crate_opened` (props: weapon_received, was_upgrade)
- `boss_spawned`, `boss_defeated`, `boss_killed_player`
- `iap_purchased` (props: product_id)
- `rewarded_ad_shown`, `rewarded_ad_completed`

**Architecture: `lib/analytics.ts`** — wrapper around PostHog SDK so we can swap providers later. Stub in Phase 1, real in Phase 7.

---

## File Structure (Target)

```
shoot-your-way-out/
  app.json                       — Expo config
  eas.json                       — EAS Build config
  package.json
  tsconfig.json
  src/
    App.tsx                      — root, screen state machine
    screens/
      LoadingScreen.tsx
      MenuScreen.tsx
      MapSelectScreen.tsx
      GameScreen.tsx
      GameOverScreen.tsx
      SettingsScreen.tsx
      PauseScreen.tsx
    components/
      GameCanvas.tsx             — Skia canvas, game loop orchestration
      HUD.tsx                    — overlay HUD, composed of kit GUI assets
      Minimap.tsx
      LevelUpModal.tsx           — uses kit Upgrade Preset
      CrateRevealOverlay.tsx
      Button.tsx                 — kit-styled button wrapper
    lib/
      gameEngine.ts              — state, physics, spawning, combat, hazards
      gameRenderer.ts            — Skia draw calls for entities, fog, weather
      gameLoop.ts                — fixed-timestep delta loop
      input.ts                   — drag-to-move handler
      sprites.ts                 — sprite loading and atlas management
      animation.ts               — frame-based animation system
      mapLoader.ts               — load and render map JSON
      pathfinding.ts             — simple enemy AI movement
      collision.ts               — entity-vs-entity, entity-vs-obstacle
      audioEngine.ts             — music + SFX (stubbed Phase 1, full Phase 6)
      monetization.ts            — ads + IAP abstraction (Phase 6)
      analytics.ts               — event logging (Phase 7)
      persistence.ts             — AsyncStorage typed wrapper
    data/
      weapons.ts                 — 8 weapon stat profiles
      skills.ts                  — 20 skill definitions
      enemies.ts                 — 8 enemy types
      bosses.ts                  — Hunter (helicopter) definition
      hazards.ts                 — Gas Bomb, Bomber Strafe
      pickups.ts                 — pickup types and effects
      crateTable.ts              — drop tables and roll tables
      maps/
        compound.ts
        outskirts.ts
        treeline.ts
      theme.ts                   — palette, fonts, per-map tints
  assets/
    sprites/
      hero/
        walk/                    — 7-frame Hero_Walk With Kneepads
        die/                     — 4-frame Hero_Die
        pistol/                  — Hero_Pistol + shot frames
        rifle/                   — Hero_Rifle + shot frame
        machinegun/              — Hero_MachineGun + shot frame
        grenade_launcher/        — Hero_GrenadeLauncher + shot frames
        flamethrower/            — Hero_Flamethrower + shot frames
      enemies/
        scav/                    — Soldier walk/shot/die
        raider/                  — Soldier 02 fire/die
        gunner/                  — Gunner walk/fire/die + bullet
        sniper/                  — Sniper walk/shot/die + bullet + base
        humvee/
        btr/
        panzer/
        acs/
      boss/
        helicopter/              — base, rotors, MG, rockets, broken
        bomber/                  — full + mini
      pickups/
        hp/
        armor/
        money/
        speed/
        ammo/
        crate/                   — Army Box
      effects/
        explode/                 — 4-frame
        flame/                   — 7-frame
        smoke/                   — 7-frame light smoke
        muzzle_flashes/          — per-weapon shots
        rocket/                  — projectile sprites
      environment/
        tilesets/                — 5 ground textures + transitions
        structures/              — house, watchtower
        obstacles/               — rocks, sandbags, trees, bushes, crates, barrels
        vehicles_civilian/       — pristine cars from kit 2
        vehicles_wrecked/        — broken cars from kit 2
    ui/
      menu/
      hud/
      upgrade/                   — pre-built level-up modal
      pause/
      settings/
      mission_failed/
      victory/
      loading/
      minimap/
      bonus/
      icons/                     — app store icons
    audio/
      music/                     — 4 tracks (TBD)
      sfx/                       — ~25 sounds (TBD)
      ui/                        — button clicks, transitions
    fonts/                       — pixel font for HUD and titles
```

---

## Build Phase Plan

Each phase = one focused CC session. Commit to GitHub after each phase. Test on device after each phase.

| Phase | Focus | Output |
|---|---|---|
| 1 | Project setup, file structure, audio/monetization/analytics stubs, asset import, repo, EAS configured | App boots to placeholder screen on device |
| 2 | Player character with hero sprites, drag-to-move, walk animation, weapon pose switching, basic camera | Player walks and rotates, no enemies yet |
| 3 | Enemy spawning (Scav + Raider only), wave scaling, auto-fire targeting, basic AI, projectile system, kill/XP | Survive a 60-second basic wave |
| 4a | Money pickups (XP source), level-up modal (kit Upgrade Preset), 10 stat-modifier skills, weapon progression unlocks (level 4/8/12/16) | Full progression for stat skills works |
| 4b | 10 ability skills (grenades, molotovs, smoke), throwable system, crate drop system + reveal animation | All 20 skills functional, crates working |
| 5 | Tile rendering, three map JSONs, map select screen, obstacle placement, collision with obstacles, all enemy types (Gunner/Sniper/Humvee/BTR/Panzer/ACS), world camera system | Three playable maps with full enemy roster + camera/zoom system implemented |
| 6 | Audio engine full implementation, all SFX wired, music tracks playing, atmospheric effects (fog, weather, vignette), explosions, smoke | Game feels and sounds complete |
| 7 | Full UI — main menu, map select polish, settings, pause, game over, persistence (high score, stats), minimap, analytics integration | Production-ready menu flow |
| 8 | Helicopter boss (both phases), Gas Bomb hazard, Bomber strafe events, hero death animation polish | Boss encounters working |
| 9 | Monetization implementation (AdMob + IAP), Support Dev button, rewarded ad integration, App Store and Google Play submission prep | Ready to submit |

**Audio is added incrementally** — stubbed in Phase 1, called by all phases, fully wired in Phase 6.

**Vehicle enemies (Humvee/BTR/Panzer/ACS)** are introduced in Phase 5 alongside maps because they need obstacle collision systems.

**Phase 5 also owns the world camera system.** Deliverable: wrap all rendered world entities (tiles, player, enemies, projectiles, obstacles) in a single Skia `<Group>` with a camera transform — scale for zoom level, translate for follow-the-player offset. This replaces all per-sprite scale hardcoding (`HERO_SPRITE_SCALE` and equivalents). Final zoom level cannot be determined until tiles + enemies + HUD are all visible together, so Phase 5 is the right time to lock it.

**Boss is Phase 8** — late, intentionally. Boss needs all other systems (audio, hazards, projectile system, multiple enemy AI) already working.

---

## Phase 1 Setup Commands

```powershell
# Create the project
npx create-expo-app@latest shoot-your-way-out --template blank-typescript
cd shoot-your-way-out

# Core rendering + animation + gestures
npx expo install @shopify/react-native-skia
npx expo install react-native-reanimated
npx expo install react-native-gesture-handler

# Audio + persistence
npx expo install expo-av
npx expo install @react-native-async-storage/async-storage

# Monetization (Phase 6 will configure, install now)
npx expo install react-native-google-mobile-ads
npx expo install expo-in-app-purchases

# Analytics (Phase 7 will configure)
npm install posthog-react-native

# EAS for builds and submission
npm install -g eas-cli
eas login
eas build:configure

# Git
git init
git branch -M main
git remote add origin https://github.com/osburnlabs-svg/shoot-your-way-out.git
git add .
git commit -m "phase 1: project scaffold with expo + skia + reanimated + audio/monetization stubs"
git push -u origin main
```

**Notes:**
- `npx expo install` (not `npm install`) — Expo picks SDK-compatible versions
- `eas login` requires your Expo account
- AdMob and IAP packages installed but not configured until later phases
- Skia + Reanimated need a config plugin in `app.json` — CC handles this in Phase 1

---

## Persistence Schema (AsyncStorage)

All keys namespaced with `syo_` prefix:

```typescript
syo_high_score: number
syo_best_time: number
syo_total_kills: number
syo_total_runs: number
syo_high_score_per_map: { compound: number, outskirts: number, treeline: number }
syo_settings: { music_volume: number, sfx_volume: number, vibration: boolean, weather: boolean }
syo_support_unlocked: boolean
syo_revives_remaining_session: number    // resets on app close
syo_seen_tutorial: boolean
syo_install_date: string                  // for analytics cohort
```

---

## Key CC Guidelines

**General:**
- Always read existing files before writing — prevents pattern mismatches
- Plan and discuss before building — confirm approach before any code is written
- Commit to GitHub after every phase
- Test on real device after every phase — emulator touch behavior differs
- Engine code (`lib/`) uses generic names. Game-specific content lives in `data/` and `assets/`
- Never hardcode Tarkov-flavored names inside engine modules

**Mobile-specific:**
- Test touch on real device early
- Safe area insets matter on iPhone — HUD elements need padding for notch and dynamic island
- 60fps target — profile performance before adding visual effects
- AsyncStorage for all persistence (no localStorage)
- iOS silent switch override is required for audio

**Asset integration:**
- Verify file paths against this doc before assuming structure
- Five hero weapon animations, eight weapon stat profiles, mapped by `weapon.animation` field
- Helicopter boss uses componentized parts (base + rotor + MG + rocket) layered at runtime, not a single sprite sheet
- Three pre-authored maps via JSON, never procedural reseeding
- 20 skills, modular effects, all swap-out-able

**Phase discipline:**
- One focused phase per CC session
- Don't bleed scope between phases
- If a phase grows, split it (Phase 4 was already split into 4a and 4b)

---

## How Mo Likes to Work

- Clear step-by-step instructions
- PowerShell commands preferred over manual file edits
- Explain WHY not just WHAT
- Plan and discuss before building
- Commit to GitHub regularly
- Conversational and friendly working relationship
- Honest feedback welcome — push back constructively
- Uses Claude Code (CC) in terminal for all code changes
- Brother Bo handles business/sales decisions
- OS: Windows 11, PowerShell
- Previous shipped project: Dull (horror game, Unity 6, live at osburnlabs.itch.io/dull)
- Previous project: locale. (local dining marketplace, live at getlocale.co, paused for this pivot)

---

## v1 Scope Summary (what ships day one)

**Locked in v1:**
- Three maps (Compound, Outskirts, Treeline)
- 8 weapons across 5 visual tiers (incl. crate-only GP-25 + Flamethrower)
- 20 skills across 5 categories
- 8 enemy types (incl. 4 vehicle enemies)
- Helicopter boss (2 phases) every 2 minutes
- Bomber strafe hazard event
- Gas Bomb hazard
- Crate drop system
- Three-tier pickup system (HP, Armor, Speed, Ammo, Money + Weapon Crate)
- Full menu flow with map select, settings, pause, game over
- Minimap
- Atmospheric effects (fog of war, weather per map, vignette)
- 4 music tracks + ~25 SFX
- Monetization: Support IAP + Run Modifier rewarded ad + Revive rewarded ad + menu banner
- Analytics: 9 events
- Persistence: full meta-stats and settings
- Hero death animation on game over
- App store icons (pre-made)
- iOS + Android via EAS Build/Submit

**Deferred to v1.1:**
- Bomber as full second boss type
- Daily/weekly contracts
- Soft currency / Unlock Tokens
- "Overcharge revive" tier
- Sound effects beyond core SFX (ambient variety)
- 4th map (River Crossing — water + bridge tiles)

**Deferred to v2.0+:**
- Multiplayer/leaderboards
- Meta-progression between runs
- Cosmetic skin packs
- Additional weapon/enemy/boss types
- Haptic feedback (could be moved up if quick)

---

## Roadmap — Post-Launch Template Use

After Shoot Your Way Out ships, the engine becomes a template for game #2. Steps to ship game #2 in one day:

1. Clone repo, rename, replace bundle ID
2. Drop in new asset packs to `assets/`
3. Replace `data/weapons.ts`, `skills.ts`, `enemies.ts`, `bosses.ts`, map JSONs
4. Replace music + SFX in `assets/audio/`
5. Update theme tokens in `data/theme.ts`
6. Replace AdMob unit IDs in `lib/monetization.ts`
7. Adjust `gameConstants.ts` balance numbers
8. EAS Build → EAS Submit
9. Ship

Engine improvements from each game flow back into the template. Game #3 inherits everything game #2 fixed.
