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

**In-session doc updates.** Doc updates land in-session, as their own commit, immediately after the relevant change or finding. Not batched, not deferred to end-of-session, not promised for later. Hot context produces accurate edits; cold context produces approximations. If a doc claim is confirmed wrong during a session, the correction ships before the session continues. If an item ships and changes inventory state, the inventory update ships next, not "soon." End-of-session doc updates were the source of significant doc drift during Phase 5; the in-session-immediate pattern was confirmed during Phase 6 as the working norm.

Each doc update is its own focused commit, separate from code commits. Same single-focused-change discipline applies to docs as to code. A doc update that bundles "mark item X complete + add new known issue Y + fix typo Z" is three commits, not one.

**Brainstorm mode vs. build mode.** Sessions operate in one of two modes — build mode (default) or brainstorm mode (signaled). Build mode is the standard execution posture: scope discipline, push back on additions, validate against locked decisions. Brainstorm mode is for open exploration: no scope reflexes, no "that's not in this phase" pushback. Ideas explored on their merits.

*Triggers.* Mo signals entry with "brainstorm mode" or "brainstorming session." Mo signals exit with "back to build mode" or equivalent. Claude follows the signal explicitly — does not stay in build mode out of caution when brainstorm has been requested, and does not stay in brainstorm mode when build has been requested.

*In brainstorm mode.* No "this isn't in scope" reflexes. Ideas float by default. Claude is still honest — if an idea has a real problem (technically infeasible, conflicts with the game's identity, bad for retention), Claude says so as part of exploring, not as a gate. Ideas that graduate from "fun riff" to "we should remember this" are explicitly noted by Mo, who then says so and the idea gets captured in the appropriate doc. Otherwise ideas float and get dropped.

*Frame.* This project is a side project meant to be fun. Side projects only work if they stay fun. The strategy doc is a thinking space, not a monetization spec. Treating every casual idea like a scope-creep threat kills the fun and filters interesting ideas before they get a chance.

**Per-phase doc audit.** Before drafting any implementation prompts for a new phase, run a scoped audit of the v3 context doc claims that affect the planned work. Scope is the sections relevant to this phase only — not the whole doc. Findings get corrected in their own focused commit before any phase implementation prompts are drafted. Phases run as: plan the phase → audit the phase → implement the phase.

*Why scoped, not full.* A full whole-doc audit produces speculative findings against code that doesn't exist yet (Phase 7 audit cannot meaningfully verify Phase 9 claims). A scoped per-phase audit produces actionable findings on code that's stable enough to verify against. The full audit task was deferred multiple times during Phase 5 and 6 precisely because "audit everything" never finishes — replacing it with per-phase audits closes drift without the unfinishable-task problem.

*What this protects.* Three things: (1) Drift compounds when audits are deferred indefinitely. (2) Audits scoped to "everything" never finish or produce stale findings. (3) Implementation prompts drafted against unverified doc claims produce wrong-direction work — the pattern that bit Phase 6 five times before being corrected mid-session.

*Mechanics.* CC reads the v3 doc sections in scope plus the relevant code files. Produces a findings report: what the doc claims, what the code actually does, where they disagree. Mo reviews findings, approves corrections. Corrections land as a single focused doc commit. Then implementation prompts begin.

**UI principles (mobile game best practices, boring is good).** All UI in this game follows shipped mobile game conventions. Players do not want novelty in menus — they want speed, clarity, and predictable patterns. The principles below apply to all UI work in Phase 7 and beyond.

*Layout.* HUD: corner-pinned, minimal. Top corners for stats. Bottom for context buttons. Center reserved for gameplay and momentary action callouts only. Menus: single-column vertical layouts. Mobile screens are narrow; never split horizontally except for icon+label pairings. One primary action per screen — visually dominant (big button, full-width or near-full-width, distinct color from secondary actions). Secondary actions are smaller, lower contrast, often text-link style. No nested menus. Settings is its own screen, not a sub-sheet inside pause menu.

*Touch targets.* Minimum tap target 44pt × 44pt. Ideally 60pt+ for primary actions. Generous spacing between interactive elements (12pt+ between adjacent buttons). Thumbs are imprecise.

*Motion.* No animations longer than 250ms. Players want to move on. Modal background dims to ~70% black (matches existing LevelUpModal, ReviveModal, CrateRevealModal pattern). No bouncy, elastic, or decorative animations. Snap or fade only.

*Standard patterns for the screens this game needs.* Pause menu: Resume, Settings, Quit. Three buttons, vertical stack, full-width. Resume is the primary action (dominant). Death screen: Stats summary at top, primary "Try Again" or "Watch Ad to Continue" button, secondary "Main Menu" link below. Main menu: Game logo, big "Play" / "Deploy" button (primary), smaller secondary buttons (Settings, About, optional shop/flea market in v1.1+). Loading screen: Game logo or static image, small loading indicator, optional tip text — no mini-games, no progress bars unless actual loading progress can be measured. Settings: Sound (music + SFX sliders), haptics toggle (if applicable), reset progress (with confirmation), credits link. Vertical scrolling list.

*Visual language.* Kit color palette: `#0a0d08` (background dark), `#c9a356` (gold accent), `#cc3333` (action red). Locked from May 12 2026 decision (progress log line 53). Pixel font throughout — no mixing with RN default font. No kit layout PNGs as UI panels — palette and typography only.

*When in doubt, copy the convention from a shipped mobile game in the same genre.* Survivor-likes and arcade shooters have well-established UI patterns. If a UI question doesn't have an obvious answer from these principles, the answer is "what does Vampire Survivors / Brotato / Archero do?" — not "what would be creative or interesting here."

*What this protects.* UI work is the easiest place for creative ambition to inflate scope. A "fancy" pause menu adds days of work and zero player value. These principles cap scope at "competently boring" — which is the correct target for a side-project mobile game prioritizing ship velocity.

**Docs are reference, not narrative.** The v3 context doc, inventory, and progress log are read by cold-context sessions and pay token cost on every read. Entries capture the minimum needed for state recovery, not a complete history of what was discussed. Commit messages capture what changed. File contents capture current state. Progress log captures decisions and learnings not obvious from those sources alone. Avoid duplication across docs.

*When in doubt, terser.* A doc entry that re-narrates content already in commit messages or already in the current state of another doc is bloat. Cut it. A progress log entry of three terse sentences usually serves cold-context recovery better than a multi-section block, because the multi-section block buries the recoverable signal in repeated context.

*Bloat tolerance varies by file.* v3 doc bloat is most expensive (read every session, signal-to-noise matters). Inventory bloat is moderate (status entries can be terse — "shipped, see commit X" is often sufficient). Progress log bloat is cheap-ish per entry but accumulates across hundreds of entries over a multi-month project.

*What this protects.* Doc bloat accumulates silently. Each individual entry feels reasonable; the aggregate becomes expensive in token cost on every read. Without an explicit "terser by default" rule, entries inflate to fill available space. With the rule, entries default to the minimum needed and stay there.

**The three-stage workflow.** Work on this project flows through three stages, in order. Skipping a stage tends to produce wrong-direction work that's expensive to undo.

1. **Strategic planning (Mo + Claude in chat).** Scope, decisions, tradeoffs, design direction. No code is written. Claude pushes back where appropriate and surfaces things Mo might not see; Mo drives direction and catches strategic drift. Output: an aligned understanding of what to build and why, plus locked decisions on anything contestable.

2. **Prompt drafting and CC pre-review (Claude writes, CC reviews).** Claude writes a CC prompt that captures the goal, locked decisions, scope (in and out), and verification criteria. CC reads the context docs and the relevant code, then confirms understanding in 2-3 sentences and flags any ambiguity, stale information, or technical concerns before writing code. Mo reviews CC's confirmation — if it's off, Mo corrects before approving. If it's right, Mo approves with a short go-ahead.

3. **Execution and verification (CC + Mo).** CC writes the code. Mo runs on device, reports what works and what doesn't, and commits. Each group's work is independently verifiable — one focused change at a time, no stacked speculative fixes.

**Why the three stages matter.** The pre-review checkpoint in stage 2 is the most important and least obvious part of the workflow. It catches mistakes before any code is written: scope drift (CC understood the wrong group), stale data (constant values that have changed), technical incompatibilities (a function that won't work from a worklet, a sprite asset that doesn't exist). Each catch in pre-review saves an execute-test-revert cycle. This checkpoint is not optional — even when the prompt feels obviously correct, the confirmation step is the safety rail.

**When stages overlap.** Sometimes stage 1 and stage 2 collapse together — a tiny fix where the decision is obvious and the prompt is two lines. That's fine. The discipline isn't about adding ceremony to small tasks; it's about not skipping the checkpoint on tasks that actually need it. When in doubt, do all three stages. The cost of an unnecessary confirmation step is 30 seconds; the cost of a missed one can be hours.

**Lean toward easiest implementation where possible.** When evaluating any decision — design, scope, or implementation — "easiest" is a primary axis, not a tiebreaker. If a more polished option costs meaningful complexity vs. a good-enough option, default to good-enough. Time-to-ship is a real cost; "we could do better" is not always worth paying for. Mo is willing to make exceptions on features if the more difficult path is genuinely warranted.

*Exception: when "easier now" creates rework later, the "easier" frame is false — it's relocating work and adding revert risk in between. Name the relocation cost when proposing easy paths; Mo decides whether to override.*

*What this protects.* Complexity creep. The gap between "works" and "elegant" is expensive and often invisible in a playtest. Default to shipping the thing that works.

**Kit-first principle (in-world assets only).** The asset kits (`tds-modern-hero-weapons-and-props`, `tds-modern-tilesets-environment`, and the civilian cars pack) are the canonical source for in-world visual content — sprites for weapons, enemies, throwables, props, vehicles, environment, particle effects. Before building any custom in-world sprite or visual effect, check the kit first. If the kit ships an asset that fits the need, use the kit asset. Custom in-world art is only justified when no kit asset is appropriate AND the alternative is blocking progress. When a custom in-world asset is used as a temporary stub, call it out in the progress log so it doesn't get forgotten.

*UI is the exception.* The kit-first principle does NOT apply to UI elements — HUD, menus, modals, panels, screens, navigation, settings, game-over screens. Per locked decision May 12 2026 (progress log line 53), all UI is built custom using the kit color palette (`#0a0d08`, `#c9a356`, `#cc3333`) and pixel font, not kit layout PNGs. Two kit UI attempts (BG.png weapon silhouette issue, ReviveModal Mission Failed art mismatch) confirmed kit UI panels do not fit the game's UI needs. Kit GUI assets remain registered in `GuiSprites` as reference but are not used as primary layout panels.

The kits were chosen and paid for to provide visual coherence in the gameplay layer. UI coherence is achieved via custom builds that share the kit's palette and typography rather than its layout PNGs.

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
| Rendering | `@shopify/react-native-skia` | 2D graphics on UI thread via Reanimated worklets; capped at 30fps via time accumulator (Phase 5.5) |
| Animation | `react-native-reanimated` | Powers Skia worklets and HUD transitions |
| Gestures | `react-native-gesture-handler` | Drag-to-move input |
| Storage | `@react-native-async-storage/async-storage` | Standard mobile persistence |
| Audio | `expo-av` | Music + SFX with concurrent playback, ships with Expo |
| Ads | `react-native-google-mobile-ads` (AdMob) | Standard, supports rewarded + banner |
| IAP | `expo-in-app-purchases` (or `react-native-iap` if SDK 54 compat issues) | TBD at Phase 9 |
| Analytics | PostHog or Amplitude (free tier) | Decided at Phase 1 |
| Routing | Plain React state (no `expo-router`) | ~5-6 screens (Main Menu, Loading, Game, Pause, Game Over, Settings stub), file-based routing is overkill |
| Frame rate | 30fps cap via time accumulator (Phase 5.5) | SurfaceFlinger buffer stuffing at 60fps caused stutter — 30fps is the fix, not a constraint |

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
- **30fps cap** — time accumulator in `useFrameCallback`; game logic and rendering both throttled. Fixed SurfaceFlinger buffer stuffing (Phase 5.5 Session 6, commit 67c0bfb). Do not revert.

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

### Skills — 25-skill pool

Skills are stackable modifiers selected via the level-up modal (3 random choices on level up, max 5 stacks per skill unless noted).

See `src/data/skills.ts` for the canonical 25-skill pool — names, descriptions, categories, maxStacks, and effect definitions. That file is authoritative; do not maintain a duplicate list here.

**Phase 8 starter skill injection:** `createInitialGameState` accepts an optional `starterSkills: SkillId[]` parameter. `App.tsx` reads `pendingAdSkill` and `pendingPurchasedSkill` from AsyncStorage on Deploy, passes them through `GameScreen → GameCanvas → createInitialGameState`, then clears both slots. Max 2 starter skills per run.

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
| Gunner → **Spec Ops** | Gunner (kit 1b) | 60 | 0.9 | 8/tick | 12 | 3+ | Stationary fire bursts |
| Sniper | Sniper (kit 1b) | 40–50 | — | 40–50 | 0 | Run start | Stationary rooftop turret — see design note below |
| **Panzer** | Panzer (kit 1b) | invincible | — | 30% maxHP/rocket | 0 | Run start | Permanent map fixture; tower tracks player; 6s rocket cooldown, 450px range |
| **ACS** | ACS (kit 1b) | invincible | — | 30% maxHP/rocket | 0 | Run start | Permanent map fixture; tower tracks player; 6s rocket cooldown, 450px range |

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
  buildingBudget: { min: 2, max: 3 },       // min 2: snipers must have a rooftop every run; max 3 matches distinct building sprite count (House01, House02, WatchTower)
  obstacleBudget: { min: 20, max: 40 },
  vehicleWreckBudget: {
    bus: { min: 0, max: 1 },              // 256×256 centerpiece — use sparingly; 3 variants in pool
    scatter: { min: 4, max: 14 },         // 128×128 standalones from Broken_assets — 25 in pool (excludes bus + 7 component parts)
  },
  vegetationCount: 70-100,  // inline 70 + floor(rng() * 31) at mapGenerator.ts:380. Every run, regardless of weather. All 10 tree/bush sprites eligible. Rain suppression removed in Phase 5 G3.
  sniperCountPerBuilding: { min: 0, max: 1 },
  weather: 'clear' | 'rain',             // two values only — rolled at generation time; dust and leaves dropped
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
- Weather: randomly assigned per run — generator rolls one of: **clear** or **rain**. No other weather types. Dust and leaves are permanently removed from the model.

**Rain atmospheric components (Phase 6 implementation work):**
- Rain particle visual — falling rain rendered over the scene
- Drifting clouds — slow-moving cloud overlay during rain runs
- No additional fields needed in `MapData` — Phase 6 reads `weather === 'rain'` directly from the existing field

---

## HUD

Scope locked in `pending-work-inventory.md` Phase 7 section (commit 8913333, 2026-05-21). Earlier v3 HUD description (kit-asset HUD with armor bars, skill chips, minimap, boss UI) is obsolete — superseded by kit-UI-abandoned decision (May 12 2026, progress log line 53) and scope cuts (May 13 2026 — boss UI removed). For HUD data sources: Money displays `player.score` (no separate money field exists in Phase 7), weapon icon reads `player.equippedWeaponId` (not `weaponPose` — that's the animation-only field), killCount is on GameState (not PlayerState), XP bar fill formula in `src/data/balance.ts:65`.

---

## Screens & Flow

Actual App.tsx screen states (Phase 7): `'menu' | 'loading' | 'game'`. Pause and Game Over are overlays rendered on top of the game screen — they are NOT separate screen states in the state machine. `PauseScreen.tsx` and `GameOverScreen.tsx` exist as zombie stub files (`return null`) that are not referenced by `App.tsx`. Phase 8 extends the type to add `'flea_market'`. Pre-Run Modal deferred to Phase 9 (when ad SDK is wired). All Phase 7 screens are custom builds using kit color palette (`#0a0d08`, `#c9a356`, `#cc3333`) and VT323 pixel font. No kit layout PNGs — kit-UI direction abandoned May 12 2026 (progress log line 53).

**Main Menu.** Background image at `assets/ui/screens/MainMenu.png`. Persistent money display — live value from `syo_flea_currency` (AsyncStorage, wired Phase 7). Buttons in vertical stack: DEPLOY (primary, functional — triggers loading screen then game), FLEA MARKET (disabled stub, Phase 8 — will become `<Pressable>` setting screen to `'flea_market'`), UPGRADE (disabled stub, Phase 8), SETTINGS (disabled stub, Phase 9). No meta-stats panel — concept scrapped, persistent money display replaces it.

**Loading Screen.** Bridges the blank-frame gap on GameCanvas mount. Background image at `assets/ui/screens/LoadingScreen.png`. Triggered after Deploy button tap on main menu (NOT on app cold start — Expo splash handles cold start, swap planned for Phase 9 ship prep). Content: game logo placeholder until Phase 9 logo art lands, "Loading..." text with cycling dots animation (`.`, `..`, `...` at ~400ms via setState), random tip text chosen on mount from a 15–20 tip array (does not rotate during a single load).

**Game.** Existing GameCanvas. HUD shipped Phase 7 (custom build, kit palette + VT323). See HUD scope in `pending-work-inventory.md` (locked commit 8913333).

**Pause.** Custom overlay consistent with existing modal style (semi-transparent dark background, rounded panel, VT323). Buttons: RESUME (primary), END RUN. No Settings button in Phase 7. Triggered by pause icon in HUD corner. No kit layout PNGs.

**Game Over.** Existing ReviveModal (`src/components/ReviveModal.tsx`) — already built, kit palette + VT323, watch-ad revive prompt and existing Redeploy button. Phase 7 work: add "Return to Main Menu" button alongside existing Redeploy. Run stats display is existing modal content. No custom rebuild — additive change only.

**Settings.** Deferred entirely to Phase 9. Phase 7 main menu Settings button is a disabled stub. When it ships: custom vertical list with kit palette + VT323, music and SFX volume sliders, plus credits and privacy policy link. No kit layout PNGs.

---

## Monetization

Design superseded by `strategy-monetization-v1.md` — that doc is the authoritative source. Summary: single IAP gates daily login bonus multiplier (free $1,000/day, paid $5,000/day — 5× advantage). Flea market is not paywalled. NO banner ads, NO forced interstitials. Rewarded ad touchpoints (player-initiated): in-run revive, pre-run buff (start with one random skill). Pre-run buff ad lives inside flea market screen per strategy doc.

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

### Music — 6 tracks needed (sourcing TBD, royalty-free metal/aggressive instrumental)
1. **Menu loop** — moodier, slower, "before deployment" vibe
2–6. **Combat pool (5 tracks)** — driving, aggressive; one track picked at random on raid start, plays through to end. No transitions on game state changes.

**No game-over sting. No boss loop (boss cut from v1). Music volume controlled by user via Settings.**

**Sourcing approach:** look at Free Music Archive (CC-BY metal), OpenGameArt.org (CC0/CC-BY game music), Kenney audio packs (CC0). Verify license per track before use. Avoid Ollie Beanz — his license excludes video games.

### SFX — 5–6 sounds needed (lean categories)

- **Explosions** — one shared sound for frag grenade, Molotov, rocket launcher
- **Footsteps** — subtle, paced to walk cycle
- **Player hit** — grunt on taking damage
- **Gunshots** — one shared gunshot sound; flamethrower as a separate looping variant
- **Helicopter ambient** — looping low-pass ambient pass during gameplay

*SFX volume controlled by user via Settings.*

**Sourcing approach:**
- **Sonniss GameAudioGDC bundles** — annual free release, explicit royalty-free commercial license, weapon sounds and explosions
- **Freesound.org** — filter strictly to CC0
- **Kenney audio packs** — UI sounds in CC0

**Open question for Phase 8 audio brainstorm:** Settings panel is currently Phase 9-deferred. Audio without volume control on day one is bad UX. Two options: (a) audio ships without user volume control — Settings panel adds sliders in Phase 9; (b) Settings panel pulled into Phase 8 alongside audio so volume control ships with sounds. Decide before implementation.

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

Stub implementation in Phase 1 (all methods are no-ops). Real implementation in Phase 8. This means Phases 2-5 can call `audioEngine.playSFX('shoot_pistol')` and have it silently do nothing — when Phase 6 wires it up, every existing call starts working.

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
      HUD.tsx                    — overlay HUD
      Minimap.tsx
      LevelUpModal.tsx
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
      weapons.ts                 — 7 weapon stat profiles
      skills.ts                  — 25 skill definitions
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
| 5 | Procedural map generator (in progress) + 3 new enemy types: Spec Ops (mobile), Sniper turret (stationary rooftop), Tank turret (stationary, 3 visual variants) + enemy ranged fire + camera zoom lock | Single dynamic map generates each run; full 5-type enemy roster active; camera/zoom locked |
| 6 | Audio + simplified atmospheric effects (rain particles + drifting clouds only — no lightning/thunder) + muzzle flashes + bullet origin correction + impact effects | Game feels and sounds complete |
| 7 | Custom UI rebuild (all screens, Phase 4b direction) + persistence layer (high score, stats, flea_currency, last_claim_date) + analytics + loading screen | Production-ready menu flow |
| 8 | Folded into Phase 9 — buffer space for late-discovery polish if needed, otherwise unused. Helicopter flyby shipped Phase 5. See `_project-docs/pending-work-inventory.md` for canonical scope. | Unused / folded into Phase 9 |
| 9 | IAP SDK + Ad SDK integration + entitlement caching + App Store and Google Play submission prep | Ready to submit |
| 10 | Flea market UI + daily login bonus logic (free: $50/day, paid: $300/day) + balance pass | Monetization meta-game live |

**Audio is added incrementally** — stubbed in Phase 1, called by all phases, fully wired in Phase 6.

**Tank turret class (3 visual variants: Humvee/BTR/Panzer)** is introduced in Phase 5. Stationary — no pathfinding. Shares the same engine architecture as the Sniper turret (stationary-fire AI, no movement). ACS is cut from v1.

**Phase 5 ships two new specialist enemy classes alongside the vehicle roster:** Spec Ops (mobile, stationary fire bursts; formerly "Gunner") and the Sniper (stationary rooftop turret). Both use kit 1b sprites. Spec Ops follows the standard wave-spawner path. Sniper uses a rooftop spawn system separate from the wave spawner — spawns at run start at building positions tracked in the procedural generator's building metadata (a `rooftopPositions` array per placed building). Count per run is set in the generator's parameter budget. No pathfinding required for Sniper — AI is: find player in range → telegraph (~1s) → fire.

**Phase 5 G1 shipped the entity follow camera.** All entities compute screen position inline as `width/2 + (entity.x - player.x) * CAMERA_ZOOM`. `CAMERA_ZOOM = 1.0` is a placeholder — final zoom level cannot be locked until tiles + enemies + HUD are visible together. **Remaining Phase 5 camera work:** integrate tile rendering into the same coordinate system, replace per-sprite scale hardcoding (`HERO_SPRITE_SCALE` and equivalents) with a unified zoom constant, lock zoom by feel once the full visual context exists.

**Helicopter ambient flyby is Phase 8** — small scope (~1 day), may fold into Phase 7 or 9. No health pool, no phased attacks, no boss mechanics. The helicopter boss design is cut from v1 — see `strategy-monetization-v1.md` Section 14 for the locked flyby design.

---

## Deferred Work / Tech Debt

These are intentional shortcuts the project carries. Each is taken deliberately — not as oversight — because doing the work now would either be premature, expensive, or both. Each entry has an explicit trigger condition for when to revisit.

**Asset loading consolidation (texture atlases)**

Current implementation uses individual `require()` calls per sprite frame, each loaded via `useImage` in `GameCanvas.tsx`. This works at small asset counts but scales linearly: by end of Phase 5 we'll have 80–100 individual `useImage` calls in the render component.

The right end-state is a texture atlas system: pack all sprites into one or a small number of large PNGs, load each atlas once at boot, and look up frames by name + UV coordinates. This is faster, cleaner, and matches industry practice for mobile games.

*Trigger:* Address before launch, as part of Phase 9 readiness. Do NOT do this earlier — atlasing requires knowing the final asset list, and the asset list isn't finalized until Phase 8 ships.

*Estimated work:* One focused session. Tooling: TexturePacker (free for personal use) or equivalent. Runtime change: replace `useImage(require(...))` calls with a single asset-manager lookup. No gameplay code changes required if `lib/sprites.ts` is the only thing that changes.

*Note:* Line ~705 of this doc references `sprites.ts — sprite loading and atlas management`. Atlas management was always planned; the implementation just hasn't landed yet. This entry codifies the deferral.

**World size placeholder — WORLD_WIDTH/HEIGHT = 2000 is too small**

`WORLD_WIDTH = WORLD_HEIGHT = 2000` (in `gameConstants.ts`) was a G1 placeholder value, chosen before tile rendering existed. On device with Phase 5 G2 tile rendering active, the playable area feels cramped — the map boundary is reached quickly. Mo confirmed this on device.

Target: 4000×4000 or 6000×6000 world units. Final value to be locked by feel during Step 2, tested alongside FPS optimization work (larger world = more tiles to Atlas-draw = potential GPU cost increase that must be profiled).

*Trigger:* Step 2 of Phase 5 G2. Fix alongside FPS profiling — the two interact. The tile Atlas currently renders all 1024 tiles on every frame regardless of camera viewport; a larger world increases tile count, making viewport culling more important. Address culling and world size together.

*Dependencies:* Player spawn position (`canvasWidth/2, canvasHeight/2`) stays at world center. Enemy spawn logic uses world bounds — validate that spawn positions remain within the new bounds after the change. Crate spawn logic also needs review (see next entry).

**Crate spawn bounds — crates spawn outside the playable area**

Crates are spawning at positions the player cannot reach, either at the world boundary or beyond it. Mo confirmed this on device. Likely cause: crate spawn logic uses `WORLD_WIDTH`/`WORLD_HEIGHT` directly as bounds without a margin, OR camera clamping means the world edges aren't reachable and spawn didn't account for that. A second possible cause: the camera Group offset means world coordinates near (0,0) or (WORLD_WIDTH, WORLD_HEIGHT) are off-screen and unreachable, but crate spawner doesn't exclude them.

*Trigger:* Step 2 of Phase 5 G2, when spawn logic is revisited alongside the world size change. Fix the bounds used for crate spawning at the same time as the world size bump — the two constants are coupled (changing world size changes what "playable area" means).

*Fix approach when triggered:* Define a `PLAYABLE_MARGIN` constant (e.g. 300 world units from each edge) and use `margin + rng() * (WORLD_SIZE - 2*margin)` for all random spawn positions. Applies to crates, obstacles, vehicle wrecks, and vegetation — audit all spawners when fixing.

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

*G1 refinement (Phase 5 G2, confirmed on device):* The prohibition is specifically animated-wrapping-animated. An animated Group wrapping **static** children is the correct pattern for camera-driven world rendering (tile atlases, static prop layers, etc.) and does not produce the stutter artifact. The G1 stutter was caused by both the outer Group transform and the inner entity transforms updating per-frame, with Skia flushing intermediate states between the two layers. Static children have no independent animated transform — the outer Group moves them cleanly in a single GPU pass. Animated-wrapping-static is therefore a softer constraint than animated-wrapping-animated: it works correctly at low child counts and is the right pattern for camera-driven world layers, but may require optimization or child distribution if the count grows significantly (empirical threshold appears around 25+ Atlas children). Tile atlases use this pattern in Phase 5 G2 (commit 67cdf12) with 28 total Atlas children (25 prop + 3 tile) and are visually correct on device.*

**Per-frame input via .runOnJS(true) causes variable camera lag**

Routing gesture callbacks through `.runOnJS(true)` writes input SharedValues from the JS thread via Reanimated's async queue. `useFrameCallback` can read a stale input vector on any vsync where the JS thread hasn't flushed the write yet. For stationary world objects, variable `player.x` advancement per frame manifests as visible stutter. Moving entities (enemies walking) mask the same artifact via their own velocity.

*Fix pattern:* Gesture handlers that feed game state must run as UI-thread worklets (default, no `.runOnJS`). Input SharedValue writes are then synchronous on the UI thread and always available before the next `useFrameCallback` invocation. Only add `.runOnJS(true)` if the gesture worklet triggers a downstream derived-value → Skia subscription cascade that causes the gesture-flush symptom described above. Used in `GameCanvas.tsx` (runOnJS removed commit 3c17fac after nested-group fix eliminated the original cascade).

**GameState SharedValue must contain ONLY fields read by UI-thread worklets**

Reanimated's `SharedValue.value = x` deep-copies the entire object tree through JSI to the C++ worklet runtime on every write. `gameState.value = updateGameState(...)` runs every frame at 30fps — so every field in `GameState`, however deeply nested, is serialized 30 times per second. Fields that worklets never read are pure serialization overhead.

Symptom: adding a large data structure (e.g. an 8,836-element tile grid) to GameState that no worklet reads produces 9× JSI serialization cost per frame and a multi-minute initial SharedValue allocation. The performance cliff is invisible at small sizes (32×32 = 1,024 cells tolerable; 94×94 = 8,836 cells fatal at 30fps). Discovered in Phase 5 G2: tileGrid in GameState caused 3-minute initial load times and 1 FPS during gameplay at 6000×6000. Putting non-worklet data in the SharedValue forces per-frame JSI serialization for no benefit and breaks at scale.

*Binding rule:* Any data that only the JS thread reads (tile grids, map metadata, weather, static entity lists, any future pre-computed lookup tables) must live in regular React `useState` or `useRef`, NOT in `GameState`. Conceptual ownership ("this is game data") does not override this rule. The criterion is: **does a UI-thread worklet read it?** If no, it stays out of `GameState`. Applied in Phase 5 G2 (commit d91b4ce): `MapData` (including `tileGrid: TileCell[][]`) removed from `GameState`; lives as `initialMapData` in `GameCanvas` React state. Tile rendering reads `initialMapData.tileGrid` directly, never through `gameState.value`.

**useImage results must be null-guarded before use in Skia components**

Skia's `useImage()` hook returns `null` on first render and resolves the asset asynchronously. Passing a null result to `<Atlas>`, `<Image>`, or any Skia component that expects a non-null `SkImage` causes a silent render skip or a runtime error depending on the component. Every `useImage` result in the render path needs a null guard.

*Fix pattern:* Gate each Atlas or Image on `if (!img) return null;` — the layer simply renders nothing for the 1–2 frames before the asset resolves. Acceptable cost: a brief empty-layer flash on initial mount, invisible in practice. Applied in `GameCanvas.tsx` for all `propImageLookup` entries via the per-assetKey `if (!img) return null` check in the Atlas map. Used in Phase 5 G2 for the 31-asset prop render pipeline.

**Spacing and exclusion checks must use scaled (rendered) footprint dimensions**

With `PROP_SPRITE_SCALE = 2` and `STRUCTURE_SPRITE_SCALE = 3`, the rendered footprint of a prop is multiple times its native PNG size. A 263×139px PNG renders at 789×417px on screen. Using native dimensions in placement exclusion checks allows visually overlapping props: two entities whose native bounds don't overlap can completely overlap each other once their scale is applied.

*Fix pattern:* Any spacing or exclusion check involving scaled entities must compute `max(width, height) × scale / 2` as the effective exclusion radius. Applied in Phase 5 G2 via `scaledHalfSize()` in `mapGenerator.ts` — looks up the appropriate scale (STRUCTURE vs PROP) by assetKey, computes the rendered half-size, and feeds it into `tooCloseScaled()` for all cross-category placement checks. Keep `scaledHalfSize()` and the `STRUCTURE_ASSET_KEYS` set in sync with the renderer's scale logic (`scaleFor()` in `propAtlasData` useMemo) — if a new structure type is added, both sets must be updated together.

**Spawn bounds must derive from the same expression as the player wall, not duplicate it as a constant**

The player movement wall is defined at runtime in `gameEngine.ts` as `canvasWidth / (2 * CAMERA_ZOOM)` and `canvasHeight / (2 * CAMERA_ZOOM)` — device-dependent values that vary by screen size. A separate margin constant that approximates the wall distance on the development device will silently fail on devices with different canvas dimensions: a constant of 200px may sit inside the playable area on a small phone while sitting outside it on a tablet, or vice versa.

*Binding rule:* Runtime entity spawners that place entities in world space must compute their world-edge bounds using `viewHalfW = canvasWidth / (2 * CAMERA_ZOOM)` and `viewHalfH = canvasHeight / (2 * CAMERA_ZOOM)` — the same expression the player wall uses — not a separate constant. Applied in Phase 5.5 Session 1 (commit f0856d1): `crateEngine.ts` replaced a hardcoded `PLAYABLE_MARGIN = 200` with `viewHalfW`/`viewHalfH`, which are already computed in the same function for viewport math. Any future spawner placing runtime entities in the world (pickups, hazards, spawned props) must follow the same pattern.

**useImage diagnostic instrumentation must account for async load timing**

`useImage()` returns `null` synchronously on first render. A `console.log` that fires at component mount will always report `null` for every image, even when all images are loading correctly and will resolve 1–2 frames later. The null log is a false negative — it looks like an image load failure but the image is fine. Discovered in Phase 5 G2 when `[DIAG-HELI]` logged `imgEnvHelicopterWreck: null` during a session where the helicopter was visually rendering correctly on device.

*Fix pattern:* Wrap `useImage` diagnostics in a `useEffect` that fires when the value transitions from null → non-null (`useEffect(() => { if (img) { console.log(...); } }, [img])`), or use a ref-guarded `setTimeout` (~500ms) to log after the async load window. As an alternative, confirm placement by counting entity records in `initialMapData` directly (e.g., `vehicleWrecks.filter(e => e.assetKey === 'env_helicopter_wreck').length`) — this verifies the generator produced the entity without touching image load state at all.

**Sprite frame index lives in React state and is not reliable for sub-600ms intermediate overrides**

`enemySlotFrames` and `enemySlotFlashFrames` are updated by a 100ms `setInterval` on the JS thread. This is acceptable for walk-cycle progression and binary states (flash active / inactive) because those transitions are coarse enough that the 100ms cadence always catches them. It is NOT reliable for intermediate frame overrides shorter than approximately 600ms — attempting to freeze a sprite at frame N for 200ms or 400ms during a flash event will fail because React reconciliation may batch and discard the intermediate state before the next paint. Discovered in Phase 5 G4 when two frame-freeze override commits (0970763 at 200ms, 3d45dfe at 600ms) both failed and were reverted.

*Fix pattern:* For effects that require frame-accurate control (e.g., holding a firing-pose frame for the exact duration of a muzzle flash), sprite frame selection must move off React state into a worklet-readable `SharedValue`. The 100ms timer pathway cannot provide sub-600ms frame guarantees. Cross-reference tech debt [L]: Sniper Variant A muzzle flash position varies across walk frames for this reason.

**Two-layer compositing for legs-only walk sprites**

Some kit sprites (Gunner body, Soldier body) ship walk-cycle frames with only legs, expecting a separate static body overlay PNG to be composited on top. The body overlay is a full-character-height transparent PNG with only the upper body drawn — it composites cleanly over any walk frame leg position.

*Registration pattern:* Register both the walk frames AND the body overlay in `sprites.ts` as `EnemySprites.{type}.body`. Load via `useImage` with null-guard. Render the body overlay as an additional `<Image>` inside the same Skia Group that contains the walk frame — the overlay naturally sits above the legs at identical world position. Required for: Scav (`NoGunScav.png` body overlay over Soldier kit legs), Raider (`Soldier.png` body overlay over Soldier kit legs). NOT required for: Sniper Variant B (Soldier02 frames are full-character firing poses), Sniper Variant A (`Base.png` overlay over Sniper kit walk frames — same pattern, different asset name).

**Per-variant muzzle flash offset constants**

Each enemy class that shows a muzzle flash has a `{VARIANT}_FLASH_OFFSET = {x: number, y: number}` constant in `gameConstants.ts`. Coordinates are in sprite-local space — they auto-rotate with entity facing direction via the parent Skia Group's transform. 1 sprite-pixel = 2 rendered world units.

Current constants: `SNIPER_A_FLASH_OFFSET`, `SNIPER_B_FLASH_OFFSET`, `RAIDER_FLASH_OFFSET`. Any future enemy class that shows a muzzle flash requires its own offset constant; there is no default. Tune by deploying to device and adjusting until the flash origin sits at the weapon barrel in the firing-pose frame.

Note: offset tuning is only reliable for enemies that render from a stable firing-pose frame set (Variant B, Raider). For enemies that animate through a walk cycle while firing (Variant A), a fixed offset will drift across frames due to lateral weapon movement in the sprite — see tech debt [L].

**Sprite asset registry decoupled from class binding**

Sprite asset files can be registered in `sprites.ts` (creating active `useImage` hooks that load the asset into the bundle) without being referenced by any active enemy class. This pattern preserves an asset for future reuse — the image is loaded and resident in memory, but no render path draws it.

Current example: `EnemySprites.gunner` is fully registered in `sprites.ts` with walk/body/die frames and flash frames, but is unreferenced after the Phase 5 G4 Scav/Raider sprite swap freed the Gunner visual for future use. The asset hooks exist; the render path does not. Any future enemy class can bind to `EnemySprites.gunner` by referencing it in `GameCanvas.tsx` without touching `sprites.ts`.

**Rotating-overlay two-layer compositing (Phase 5 G5)**

When a sprite has a static base layer and a rotating tower overlay, use two sibling Skia Groups — not nested Groups. The base Group has no per-frame transform (or a static initial transform); the tower Group's `useDerivedValue` computes `[translateX, translateY, rotate]`. Any child of the tower Group (flash image, barrel tip effect) automatically rotates with the tower because it inherits the Group transform. Animated-wrapping-static is permitted; animated-wrapping-animated causes the intermediate-frame stutter described above.

*First use:* `GameCanvas.tsx` tank render — `tankBaseTransform` (static Group) + `tankTowerTransform` (animated sibling Group with flash inside). Applicable to any future entity with a rotating subcomponent over a fixed body.

**Auto-aim exclusion via array membership**

Entities that should be excluded from auto-aim targeting, combat tick, wave counting, and slot rendering do not need an `isAutoAimTarget: false` flag or explicit exclusion check. Simply do not add them to `enemies[]`. All auto-aim, combat, and wave logic iterates `enemies[]` — entities outside the array are excluded automatically. Use separate state arrays (e.g. `state.tanks[]`) for entities that need their own tick logic.

*Applied in G5:* Tank turrets live in `state.tanks[]` and are ticked by `tickTank` after the main combat pass. No `enemies[]` entry, no flag, no filter. Extend this pattern to any future non-enemy entity that needs per-frame simulation but must not participate in the player-shooting loop.

**Enemy-vs-prop hybrid entity wiring**

Stationary damaging entities (turrets, future hazards) combine prop-like and enemy-like properties. Wire as:
1. NOT in `enemies[]` — excluded from auto-aim, combat tick, slot rendering, wave accounting
2. Added to the circle collision pool at map-gen time — player and enemies resolve against it like any wreck
3. State in a separate `GameState` array (e.g. `state.tanks: TankState[]`) — tick function called inline in `updateGameState` after the main combat pass
4. Rendered in `GameCanvas.tsx` via a separate JSX block with its own derived values — separate from the `enemies` slot render loop

*Applied in G5:* `buildCollisionData` adds each tank to `circleGrid` via `addCircle`; `tickTank` ticks all tanks; GameCanvas renders tanks in a separate `initialMapData.tanks.map(...)` block.

**Multi-instance entities with bounded useDerivedValue per slot**

React hooks require a stable call count across renders. For entities whose count is small and bounded (e.g., always exactly 2 tanks), declare one `useDerivedValue` per slot per transform type unconditionally at component mount — never inside a condition or loop. Skip rendering when a slot is inactive by returning `null` from the JSX map; the hook still runs cheaply with no Skia subscriber.

*Applied in G5:* 2 tanks × 3 transform types (base, tower, projectile) = 6 fixed `useDerivedValue` calls at mount, regardless of how many tanks actually spawned. `tankBaseTransforms[ti]`, `tankTowerTransforms[ti]`, `tankProjectileTransforms[ti]` are accessed by index. If a tank didn't spawn, the derived values compute a position at `(0, 0)` and the JSX map returns `null` for that slot.

**Game runs at 30fps — do not revert to 60fps without re-introducing the buffer stuffing fix**

The game is capped at 30fps via a time accumulator in `useFrameCallback`. Implementation: `TICK_INTERVAL_MS = 33.333` constant; `tickAccMs` SharedValue; remainder-carry-forward gate at the top of `useFrameCallback` that returns early when `tickAccMs < TICK_INTERVAL_MS`. Game logic and rendering both throttled: engine tick, camera transform, all entity rendering fire only when the accumulator crosses the threshold.

*Why this is locked:* At 60fps, every vsync produced a `gameState.value` write that triggered a full Skia re-composition of all tile Atlas children inside the animated camera `Group` (GH#3327 — animated Skia Group invalidates its entire subtree on every transform change). The composition itself fit in per-frame budget (~9ms), but 60 submissions/sec filled SurfaceFlinger's buffer queue faster than it could drain. The resulting `dequeueBuffer` wait was the visible stutter — not per-frame render cost. Session Trace data showed App thread work of only 1.4–2.5ms/frame with 17–26ms total duration; the gap was queue-wait, not work. At 30fps, half the submissions; queue drains between them; buffer stuffing eliminated.

*Do not revert:* Restoring `useFrameCallback` to fire every vsync without the accumulator gate re-introduces the buffer stuffing. The stutter will return. This is not a cosmetic frame rate preference — the 30fps cap is the architectural fix for GH#3327 in this rendering stack. Shipped Phase 5.5 Session 6 (commit 67c0bfb).

---

## Collision Architecture (Phase 5 G3)

**Dual-pool design.** `CollisionData` holds two independent collision pools — `rects: ColliderRect[]` for AABB and `circles: ColliderCircle[]` for circle — both backed by their own flat spatial grid (`grid` / `circleGrid`, 12×12 cells × 500px). Each grid stores indices into the corresponding pool. Both pools are built once at map load in `buildCollisionData`; neither is mutated at runtime.

**When to use each pool:**
- **AABB (`resolveAABB`)** — asset is fixed-orientation (no `rotation` field set by the map generator) and the PNG silhouette fills its canvas in a near-rectangular shape. Current AABB assets: structures, medium/large rocks, small trees.
- **Circle (`resolveCircle`)** — asset rotates randomly OR the PNG silhouette is non-square or doesn't fill its canvas (significant transparent padding). Current circle assets: all vehicle wrecks (17 variants), large trees (4 variants). Circle math is rotation-invariant; no axis-separation edge cases.

**Per-frame resolution order.** For each movement frame, both resolvers run in sequence: `resolveAABB` first, then `resolveCircle` on the output. The pools are disjoint — no asset appears in both — so order doesn't matter for correctness, but running AABB first is conventional.

**`CIRCLE_COLLIDER_RADIUS` map.** Radii are world-px values stored in `collision.ts`, keyed by `assetKey`. New assets routed to the circle pool require a radius entry. There is no default — every circle collider needs an explicit value sized against the visible sprite silhouette on device.

**`CollisionData` ownership rule.** `CollisionData` lives in its own `SharedValue<CollisionData>` in `GameCanvas.tsx`, outside `GameState`. It is never embedded in game state. Built once from `initialMapData` at mount; passed directly to `updateGameState` and `tickEnemies`. Same JSI-serialization rule as `tileGrid` from G2: static world data that worklets read every frame must not inflate per-frame `GameState` write cost.

**`SOLID_ASSET_KEYS` is the AABB opt-in set.** Any prop absent from `SOLID_ASSET_KEYS` and absent from `CIRCLE_COLLIDER_RADIUS` is passable. When routing a new asset, pick one: add to `SOLID_ASSET_KEYS` for AABB, add to `CIRCLE_COLLIDER_RADIUS` for circle, or add to neither for passable.

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
- 30fps cap — time accumulator fix for SurfaceFlinger buffer stuffing; do not revert (Phase 5.5)
- AsyncStorage for all persistence (no localStorage)
- iOS silent switch override is required for audio

**Asset integration:**
- Verify file paths against this doc before assuming structure
- Five hero weapon animations, seven weapon stat profiles, mapped by `weapon.animationPose` field
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
- Single procedurally-generated map (6000×6000, biome-based tile terrain, seeded at run start)
- 7 weapons across 5 animation poses (including crate-only Grenade Launcher + Flamethrower)
- 25 skills across 5 categories (20 base + 5 confirmed clones — see `strategy-monetization-v1.md` Section 7)
- 5 enemy types: Scav, Raider (Phase 3); Spec Ops (mobile), Sniper turret (stationary rooftop), Tank turret (Phase 5). Tank turret has 3 visual variants (Humvee/BTR/Panzer) sharing one mechanical class.
- Helicopter ambient flyby (no attacks — see `strategy-monetization-v1.md` Section 14)
- Weapon rarity tiers (Common/Uncommon/Rare/Legendary — see `strategy-monetization-v1.md` Section 11)
- Crate drop system
- Three-tier pickup system (HP, Armor, Speed, Ammo, Money + Weapon Crate)
- Custom UI throughout (kit UI direction abandoned — locked Phase 4b; all screens built as custom `<View>` layouts with kit color palette)
- Full menu flow: main menu, pre-run modal, settings, pause, game over
- Minimap
- Atmospheric effects: fog of war + corner vignette (always-on); rain particles + drifting clouds (rain runs only). No lightning, no thunder.
- 4 music tracks + ~25 SFX
- Monetization: Support IAP + daily login bonus differential (free: $50/day; paid: $300/day) + Revive rewarded ad + Pre-run buff rewarded ad + menu banner
- Analytics: 9 events
- Persistence: full meta-stats + settings + flea_currency + last_claim_date
- Hero death animation on game over
- App store icons (pre-made)
- iOS + Android via EAS Build/Submit
- Loading screen during map generation (covers generation time at 6000×6000 world scale)

**Deferred to v1.1:**
- Lightning flash + thunder SFX for rain runs
- Streak counters / calendar bonuses for daily login bonus
- Daily/weekly quest system (design preserved in `strategy-monetization-v1.md` Section 3)
- Soft currency / Unlock Tokens (if distinct from flea-market currency)
- "Overcharge revive" tier
- Additional weather types (dust, leaves)
- Additional map biome expansion (water/bridge tiles, additional asset pools)

**Deferred to v2.0+:**
- Multiplayer / leaderboards
- Meta-progression between runs
- Cosmetic skin packs
- Additional weapon / enemy / boss types
- Haptic feedback

---

## Open Questions / Parking Lot

Items that need a decision before the relevant phase begins. No decisions locked here — this is the holding area.

- **App display name** — "Shoot Your Way Out" tentative final game name; needs lock before Phase 7 menu work and Phase 9 ship prep. Shortened icon label TBD (character limit on iOS/Android home screen is ~12 chars).
- **Studio name** — "OsburnLabsGaming" referenced in dev paths; needs lock as public-facing brand identity before logo work begins.
- **Logo design** — sourcing options discussed in strategy chat post-Phase-5.5: Fiverr/99designs ($50–300), commissioned freelancer ($300–1000), or AI generation + manual cleanup. Blocked on game name + studio name decisions. Implementation path: replace Expo splash image via app.json config (Phase 9 ship prep).
- **Bundle identifier** — com.osburnlabs.shootyourwayout pending app store account setup in Phase 9.
- **Specific music track licensing per source** — verify per-track before use. Sources in scope: Free Music Archive (CC-BY metal), OpenGameArt.org (CC0/CC-BY), Kenney audio packs (CC0). Avoid Ollie Beanz (license excludes video games).
- **Will we use haptic feedback in v1 or defer to v1.1?** — currently deferred to v2.0+ in v1 Scope Summary. Revisit if playtesting surfaces it as a meaningful feel improvement.

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
