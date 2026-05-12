# Shoot Your Way Out — Master Context Document v3
*Last updated: May 2026 · Replaces v2 · For use at the start of any new Claude or CC session*

---

## Working with this project — read first

This project is built by a non-technical solo developer working with Claude as the technical lead. The collaboration model matters as much as the architecture, so:

**Mo is non-technical.** When a term comes up that isn't common English (state management, ECS, atlasing, worklets, refs, useDerivedValue, etc.), translate it the first time it appears. Do not assume Mo knows what it means just because it's standard. Mo will ask if something is unclear, but the default should be plain language with the technical term in parentheses, not the other way around.

**Mo owns scope and product decisions. Claude owns technical decisions.** Mo catches the strategic mistakes — terminology drift, mechanic inconsistencies, "wait, that doesn't match the asset kit." Claude catches the technical mistakes — bad data structures, regression risks, scope creep within a phase. When Claude is uncertain about a product decision (gameplay feel, balance, visual choice), Claude asks Mo. When Mo is uncertain about a technical decision, Mo trusts Claude's recommendation but expects Claude to flag tradeoffs in plain English.

**This is a solo-built mobile game, not a studio production.** The right level of engineering rigor is "well-organized house," not "50-floor skyscraper." Concretely:
- The architectural bones (single shared game state, UI-thread fixed-timestep loop, renderer-returns-data pattern, lib/ vs data/ separation) are correct and stable. Don't propose redoing them.
- Implementation shortcuts that work for the current scale (per-frame require() calls, no object pooling, no texture atlasing, no spatial partitioning) are intentional. Defer cleanup until there's a concrete reason — a measured perf problem, or asset count crossing a threshold.
- Don't over-engineer. If a simple array works, use a simple array. If a feature isn't needed for the next two phases, don't build it now.
- Don't under-engineer. If something needs to scale to 60 enemies on screen, the math has to work for 60. Don't ship something that breaks at 20.

**Decisions that are hard to reverse, get right early. Decisions that are easy to reverse, defer.** The first category: data shapes, tick loop structure, render pattern. The second: tuning numbers, animation polish, asset organization. Spend prompt budget on the first, ship the second and revisit.

**Verification is on-device, by hand.** No automated tests. Mo runs each group's code on a physical device and reports back. This means each group must be independently verifiable — clean state, single visible change, no stacked speculative fixes.

**Sessions can overflow phase boundaries.** The original plan was "one CC session per phase." Reality is closer to "one CC session per group, with overflow allowed when bugs emerge that cross framework boundaries." Mo runs one chat session per phase as the strategic context anchor; CC sessions are spawned as needed for execution. The discipline that matters is "one verifiable change per commit" and "diagnose before fixing," not session count.

**Communication style:** Mo prefers honest tradeoffs over confident recommendations. If two approaches are reasonable, say so. If you're uncertain, say so. Don't bury caveats. Don't paper over disagreements with the docs — the doc has known errata and Mo will catch drift faster than you will.

**The three-stage workflow.** Work on this project flows through three stages, in order. Skipping a stage tends to produce wrong-direction work that's expensive to undo.

1. **Strategic planning (Mo + Claude in chat).** Scope, decisions, tradeoffs, design direction. No code is written. Claude pushes back where appropriate and surfaces things Mo might not see; Mo drives direction and catches strategic drift. Output: an aligned understanding of what to build and why, plus locked decisions on anything contestable.

2. **Prompt drafting and CC pre-review (Claude writes, CC reviews).** Claude writes a CC prompt that captures the goal, locked decisions, scope (in and out), and verification criteria. CC reads the context docs and the relevant code, then confirms understanding in 2-3 sentences and flags any ambiguity, stale information, or technical concerns before writing code. Mo reviews CC's confirmation — if it's off, Mo corrects before approving. If it's right, Mo approves with a short go-ahead.

3. **Execution and verification (CC + Mo).** CC writes the code. Mo runs on device, reports what works and what doesn't, and commits. Each group's work is independently verifiable — one focused change at a time, no stacked speculative fixes.

**Why the three stages matter.** The pre-review checkpoint in stage 2 is the most important and least obvious part of the workflow. It catches mistakes before any code is written: scope drift (CC understood the wrong group), stale data (constant values that have changed), technical incompatibilities (a function that won't work from a worklet, a sprite asset that doesn't exist). Each catch in pre-review saves an execute-test-revert cycle. This checkpoint is not optional — even when the prompt feels obviously correct, the confirmation step is the safety rail.

**When stages overlap.** Sometimes stage 1 and stage 2 collapse together — a tiny fix where the decision is obvious and the prompt is two lines. That's fine. The discipline isn't about adding ceremony to small tasks; it's about not skipping the checkpoint on tasks that actually need it. When in doubt, do all three stages. The cost of an unnecessary confirmation step is 30 seconds; the cost of a missed one can be hours.

**Kit-first principle.** The asset kits (`tds-modern-hero-weapons-and-props`, `tds-modern-tilesets-environment`, and the civilian cars pack) are the canonical source for visual content. Before building any custom UI element, sprite, icon, button, panel, or visual effect, check the kit first. If the kit ships an asset that fits the need, use the kit asset. Custom builds — even small ones like placeholder text or a quick rectangle — are only justified when no kit asset is appropriate AND the alternative is blocking progress. When a custom asset is used as a temporary stub (e.g., a placeholder text overlay before the real kit UI ships in a later phase), call it out explicitly in the progress log so it doesn't get forgotten or shipped accidentally. The kits were chosen and paid for to provide visual coherence; bypassing them in small pieces erodes that coherence quickly.

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

> **Phase 5 stats TBD.** Gunner is renamed to **Spec Ops**. Humvee/BTR/Panzer/ACS collapse into a single **Tank** class with 3 visual variants (Light/Medium/Heavy). This table will be rewritten as 6 rows (Scav, Raider, Spec Ops, Sniper, Tank, Helicopter boss) once Phase 5 balance stats are locked.

| Enemy | Sprite Source | HP | Speed | Damage | XP | Wave Tier | Notes |
|---|---|---|---|---|---|---|---|
| Scav | Soldier (kit 1a) | 15 | 1.2 | 5 | 3 | 1+ | Basic foot soldier |
| Raider | Soldier 02 (kit 1a) | 40 | 1.8 | 12 | 8 | 2+ | Faster, more dangerous |
| Gunner → **Spec Ops** | Gunner (kit 1b) | 60 | 0.9 | 8/tick | 12 | 3+ | Stationary fire bursts |
| Sniper | Sniper (kit 1b) | 40–50 | — | 40–50 | 0 | Run start | Stationary rooftop turret — see design note below |
| **Humvee** *(Tank-Light)* | Humvee | 80 | 1.5 | 15 | 18 | 5+ | *stale — merging into Tank class* |
| **BTR** *(Tank-Medium)* | BTR | 150 | 1.0 | 18 | 30 | 6+ | *stale — merging into Tank class* |
| **Panzer** *(Tank-Heavy)* | Panzer | 250 | 0.6 | 25 | 50 | 7+ | *stale — merging into Tank class* |
| **ACS** *(Tank-Heavy alt)* | ACS | 200 | 0.7 | 20 | 40 | 7+ | *stale — merging into Tank class* |

### Sniper — Design Note (rooftop turret, Phase 5)

**Decision (Phase 4c planning):** The kit's ghillie-suit sniper sprite is designed for stationary rooftop use, not mobile infantry. The reference art shows snipers mounted on building rooftops, not walking the arena. The Sniper is implemented as a building-mounted turret, not a walking enemy.

**Behavior:** Spawns on building rooftops at run start — count per run set in the procedural generator's parameter budget. Does not move or path-find. Fires at the player when in range.

**Fire pattern:** Slow rate (~3–5 second cooldown). High single-shot damage (~40–50, versus pistol baseline of 12). Visible telegraph: laser sight or muzzle flash glow for ~1 second before the shot fires. Player has time to break line of sight or rush the position.

**Loot drops:** None. Snipers are environmental hazards, not loot sources. The reward for clearing one is eliminating that line of fire.

**Tactical role:** Building placement on each map defines lines of fire the player must navigate around or clear before holding that area. Snipers turn structures into tactical terrain rather than passive props.

**Numbers:** HP, damage, and spawn counts are Phase 5 balance targets. All values in the table above are starting points.

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
- Spec Ops/Sniper: 3%
- ~~Humvee: 8%~~ *(stale — collapsing into Tank)*
- ~~BTR: 15%~~ *(stale — collapsing into Tank)*
- ~~Panzer/ACS: 25%~~ *(stale — collapsing into Tank)*
- **Tank (all variants):** TBD% — Phase 5 balance
- Helicopter boss: 100% guaranteed

**Crate weapon roll table (when player walks over crate):**
- 50% Common: shotgun, pistol-tier alt
- 30% Uncommon: tier-3 weapon ahead of current unlock
- 15% Rare: GP-25 grenade launcher
- 5% Legendary: RPO flamethrower

### Procedural Map Generator

Every run generates a unique map at game start. There are no pre-authored map files. `lib/mapGenerator.ts` runs once on game start, takes a seed (timestamp-based), and returns the full map state: tile grid, obstacle list with positions and bounds, building list with rooftop sniper positions, and weather variable.

**Generator parameters (tunable constants):**
```typescript
{
  seed: number,                   // from Date.now() at run start
  arenaWidth: number,             // world units
  arenaHeight: number,
  baseTilePool: string[],         // e.g. ['road', 'dirt', 'sand'] — mix weighted by roll
  buildingBudget: { min: 1, max: 3 },
  obstacleBudget: { min: 20, max: 40 },
  vehicleWreckBudget: { min: 5, max: 15 },
  vegetationBudget: { min: 0, max: 20 },  // trees/bushes when rolled
  sniperCountPerBuilding: { min: 0, max: 1 },
  weather: 'rain' | 'dust' | 'leaves' | 'clear',  // rolled at generation time
}
```

**Placement rules:**
- Buildings placed first, minimum spacing enforced (no two buildings closer than N world units)
- Each placed building carries a `rooftopPositions: [{x, y}]` array — the Sniper spawn system reads this
- Obstacles placed after buildings, with clearance zones around buildings and player spawn point
- Vehicle wrecks, sandbags, crates, barrels drawn from a single pool weighted by what was placed
- Vegetation (trees/bushes) only included when weather ≠ rain (aesthetic consistency)

**Asset pools the generator draws from — inherited from the original three-map concepts:**
- *Urban-heavy bias:* road/asphalt tiles, wrecked cars (kit 2 `Broken_assets/`), pristine parked cars along edges, `House01.png` structures, sandbags, crates/barrels
- *Open/desert bias:* sand + dirt tiles, rocks, sandbags, oil barrels, watchtower landmark, longer obstacle spacing (wider sightlines)
- *Woodland bias:* grass tiles, trees (`Tree1-7.png` variants), bushes, stumps, rocks — no buildings, no wrecked vehicles
- The generator blends these pools based on tile rolls; it does not have named "modes." Any run may include elements from multiple biases.

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
- Weather: randomly assigned per run — generator rolls one of: rain / dust / leaves / clear. Lightning is a sub-effect of rain rolls.

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
[Loading] → [Main Menu] → [Pre-Run Modal] → [Game] ⇄ [Pause] → [Game Over] → loop back to Main Menu
```

**Loading Screen** — Uses `Loading Screen/Background.png`, `Loading Bar BG/Loading Bar.png`. Replaces `Test Logo.png` with our logo (TBD). Preloads all SFX into memory during this screen.

**Main Menu** — Uses kit's `Main menu/` assets. Layout:
- Centered title (custom text rendered in pixel font)
- Meta-stats panel (high score, best time, total kills, total runs) using `Inventory Stats.png` styling
- DEPLOY button (`BTN PLAY.png`) — large, prominent
- Settings button (`BTN SETTINGS.png`) — corner
- Support the Dev button — small, corner ("☕ Support" — see Monetization)
- Background music: menu loop track

**Pre-Run Modal** — Appears after tapping DEPLOY on Main Menu. Single-screen offer: "Watch ad for a perk?" with 3 random modifier options (Bonus Loadout / +50% XP / Cursed Run). One-tap skip. Tapping DEPLOY or skipping starts the run immediately — the procedural map generator runs at this point.

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
- Shown on pre-run modal (appears after tapping DEPLOY on Main Menu)
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
- **Never shown:** in-game, on game-over screen, on pause menu, during loading
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
      mapGenerator.ts            — procedural map generator (seed, tile grid, building + obstacle placement)
      mapLoader.ts               — render procedurally generated map data (tiles, obstacles, structures)
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
      theme.ts                   — palette, fonts, per-run weather tints
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
| 5 | Procedural map generator, tile rendering, obstacle placement + collision, all remaining enemy types (Spec Ops / Sniper / Tank variants), world camera system | Single dynamic map generates each run; full 6-type enemy roster active; camera/zoom locked |
| 6 | Audio engine full implementation, all SFX wired, music tracks playing, atmospheric effects (fog, weather, vignette), explosions, smoke | Game feels and sounds complete |
| 7 | Full UI — main menu, pre-run modal polish, settings, pause, game over, persistence (high score, stats), minimap, analytics integration | Production-ready menu flow |
| 8 | Helicopter boss (both phases), Gas Bomb hazard, Bomber strafe events, hero death animation polish | Boss encounters working |
| 9 | Monetization implementation (AdMob + IAP), Support Dev button, rewarded ad integration, App Store and Google Play submission prep | Ready to submit |

**Audio is added incrementally** — stubbed in Phase 1, called by all phases, fully wired in Phase 6.

**Vehicle enemies (Tank class — Light/Medium/Heavy variants)** are introduced in Phase 5 alongside the map system because they need obstacle collision systems.

**Phase 5 ships two new specialist enemy classes alongside the vehicle roster:** Spec Ops (mobile, stationary fire bursts; formerly "Gunner") and the Sniper (stationary rooftop turret). Both use kit 1b sprites. Spec Ops follows the standard wave-spawner path. Sniper uses a rooftop spawn system separate from the wave spawner — spawns at run start at building positions tracked in the procedural generator's building metadata (a `rooftopPositions` array per placed building). Count per run is set in the generator's parameter budget. No pathfinding required for Sniper — AI is: find player in range → telegraph (~1s) → fire.

**Phase 5 G1 shipped the entity follow camera.** All entities compute screen position inline as `width/2 + (entity.x - player.x) * CAMERA_ZOOM`. `CAMERA_ZOOM = 1.0` is a placeholder — final zoom level cannot be locked until tiles + enemies + HUD are visible together. **Remaining Phase 5 camera work:** integrate tile rendering into the same coordinate system, replace per-sprite scale hardcoding (`HERO_SPRITE_SCALE` and equivalents) with a unified zoom constant, lock zoom by feel once the full visual context exists.

**Boss is Phase 8** — late, intentionally. Boss needs all other systems (audio, hazards, projectile system, multiple enemy AI) already working.

---

## Deferred Work / Tech Debt

These are intentional shortcuts the project carries. Each is taken deliberately — not as oversight — because doing the work now would either be premature, expensive, or both. Each entry has an explicit trigger condition for when to revisit.

**Asset loading consolidation (texture atlases)**

Current implementation uses individual `require()` calls per sprite frame, each loaded via `useImage` in `GameCanvas.tsx`. This works at small asset counts but scales linearly: by end of Phase 5 we'll have 80–100 individual `useImage` calls in the render component.

The right end-state is a texture atlas system: pack all sprites into one or a small number of large PNGs, load each atlas once at boot, and look up frames by name + UV coordinates. This is faster, cleaner, and matches industry practice for mobile games.

*Trigger:* Address before launch, as part of Phase 9 readiness. Do NOT do this earlier — atlasing requires knowing the final asset list, and the asset list isn't finalized until Phase 8 ships.

*Estimated work:* One focused session. Tooling: TexturePacker (free for personal use) or equivalent. Runtime change: replace `useImage(require(...))` calls with a single asset-manager lookup. No gameplay code changes required if `lib/sprites.ts` is the only thing that changes.

*Note:* Line ~705 of this doc references `sprites.ts — sprite loading and atlas management`. Atlas management was always planned; the implementation just hasn't landed yet. This entry codifies the deferral.

**Object pooling for short-lived entities (projectiles, pickups, damage numbers, hit effects)**

Currently when a projectile is fired, an object is allocated. When it hits or expires, it's garbage-collected. Same for pickup spawns, damage numbers, and hit-flash effects later. On modern devices this is fine. On lower-end Android devices with 50 enemies and 20 projectiles in flight, garbage collection can cause frame stutters.

The fix is object pooling: pre-allocate a fixed-size pool of projectile objects at boot, mark them inactive when "despawned" instead of deleting them, and reuse inactive objects when "spawning" new ones. No GC pressure, no allocation churn.

*Trigger:* Implement when device testing on a representative low-end Android phone shows measurable frame stutters during heavy combat. Don't pre-optimize without evidence.

*Estimated work:* One focused session per pooled entity type. Engine impact: medium. Game logic impact: minimal.

---

## Known Framework Quirks

Things the underlying frameworks (React Native, Reanimated, Skia, RNGH) do that are non-obvious and have already bitten this project at least once. Future debugging starts here when symptoms match.

**Reanimated gesture handlers force-flush the animation frame queue (Android)**

When a Pan gesture (or any RNGH gesture) runs as a UI-thread worklet, every gesture event calls `__flushAnimationFrame` internally — which synchronously drains the requestAnimationFrame queue and runs `useFrameCallback` early. On Android digitizers firing at 120–240 Hz, this drives the frame callback far above vsync rate. Symptom: FPS counter reads 100–200+ while gesture is active, normal-ish at rest. Reanimated's own source comments acknowledge this with a TODO.

*Original fix pattern (c47e000):* Add `.runOnJS(true)` to the gesture. Routes events through the JS thread, bypassing the flush. Tradeoff: introduces variable input latency (~1 JS-thread queue delay, up to one full frame) — imperceptible for large input changes but causes visible stutter for stationary world objects because `player.x` can advance by a variable amount per vsync.

*Revised understanding (Phase 5 G1, commit 3c17fac):* `.runOnJS(true)` is only necessary when the gesture callbacks (as UI-thread worklets) trigger expensive derived-value cascades or Skia re-renders that interfere with the frame pipeline. Once nested animated Skia Groups were eliminated (commit 02acfad), the gesture worklets no longer triggered such cascades — they only write to `inputVectorX/Y`, which no derived value directly subscribes to. Removing `.runOnJS(true)` restored synchronous UI-thread input writes and eliminated the variable-latency stutter. If the gesture flush symptom (frame callback firing at digitizer rate) ever reappears, check whether any gesture-triggered SharedValue write has a downstream `useDerivedValue` subscribed to it that also feeds a Skia animated prop.

**Per-frame runOnJS from useFrameCallback creates a feedback loop**

Any `runOnJS(...)` call inside `useFrameCallback` — even gated by a condition — schedules JS-thread work that Reanimated's scheduler interprets as "more animation work pending." The scheduler responds by firing `useFrameCallback` again before the next vsync. With more than one such call per frame on average, the loop drives the frame callback rate above vsync and drops effective dt to near-zero.

*Fix pattern:* No gameplay-data `runOnJS` calls inside `useFrameCallback`. Move sprite-frame selection and similar slow-changing JS-side state to a separate `setInterval` that polls shared values directly on the JS thread. Used in `GameCanvas.tsx` for both hero and enemy sprite frame updates.

**Many useDerivedValue subscriptions to a single shared value cascade**

Adding many (50+) `useDerivedValue` instances all reading from the same shared value, especially when each is wired to a Skia animated prop, produces enough scheduler "pending work" signals per tick to push the frame callback above vsync. Symptom: FPS reads 100–200, scaling with subscriber count.

*Fix pattern:* Collapse N derived values into 1 derived value returning an array, OR keep separate hooks but render inactive slots as `null` in JSX (breaks the Skia subscription for that slot, the hook still runs cheaply). Used in `GameCanvas.tsx` for the 50 enemy slots.

**Nested animated Skia Groups cause intermediate-frame stutter**

Wrapping animated entity Groups inside an animated camera Group creates two layers of Skia subscriptions. Skia can render a frame where the outer (camera) transform has updated but the inner (entity) transforms haven't fired yet — producing a frame where the camera moved but entities didn't. Symptom: every entity stutters in sync with camera movement; enemies appear to rubber-band toward the player on each frame.

*Fix pattern:* Never nest animated Groups. Instead, compute each entity's screen position inline in its own `useDerivedValue` as `width/2 + (entity.x - player.x) * CAMERA_ZOOM`. The entity is always at the correct screen position relative to the current player position in a single transform. Used in `GameCanvas.tsx` for all entity slot transforms (commit 02acfad).

**Per-frame input via .runOnJS(true) causes variable camera lag**

Routing gesture callbacks through `.runOnJS(true)` writes input SharedValues from the JS thread via Reanimated's async queue. `useFrameCallback` can read a stale input vector on any vsync where the JS thread hasn't flushed the write yet. For stationary world objects, variable `player.x` advancement per frame manifests as visible stutter. Moving entities (enemies walking) mask the same artifact via their own velocity.

*Fix pattern:* Gesture handlers that feed game state must run as UI-thread worklets (default, no `.runOnJS`). Input SharedValue writes are then synchronous on the UI thread and always available before the next `useFrameCallback` invocation. Only add `.runOnJS(true)` if the gesture worklet triggers a downstream derived-value → Skia subscription cascade that causes the gesture-flush symptom described above. Used in `GameCanvas.tsx` (runOnJS removed commit 3c17fac after nested-group fix eliminated the original cascade).

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
- Single procedural map generator (`lib/mapGenerator.ts`) — runs once at game start, every run unique, no pre-authored map files
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
- Single procedural map (dynamically generated per run)
- 8 weapons across 5 visual tiers (incl. crate-only GP-25 + Flamethrower)
- 20 skills across 5 categories
- 6 enemy types: Scav, Raider (Phase 3); Spec Ops, Sniper, Tank (Phase 5); Helicopter boss (Phase 8). Tank has 3 visual variants sharing one mechanical class.
- Helicopter boss (2 phases) every 2 minutes
- Bomber strafe hazard event
- Gas Bomb hazard
- Crate drop system
- Three-tier pickup system (HP, Armor, Speed, Ammo, Money + Weapon Crate)
- Full menu flow with pre-run modal, settings, pause, game over
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
- Additional map biome expansion (e.g. water/bridge tiles, additional asset pools)

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
