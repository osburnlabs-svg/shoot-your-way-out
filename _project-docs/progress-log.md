# Shoot Your Way Out — Progress Log

**Project:** Shoot Your Way Out (game #1 of OsburnLabs mobile game template initiative)
**Started:** May 2026
**Owner:** Mo (with Bo on business side)
**Repo:** https://github.com/osburnlabs-svg/shoot-your-way-out

---

## How to use this log

After each phase: update the relevant section with what worked, what broke, what changed from plan. Paste this log into Claude (web) at the start of any new chat to restore full project context alongside `shoot-your-way-out-context-v3.md`.

Status legend:
- 🟢 Complete — done, tested on device, committed
- 🟡 In Progress — currently working on it
- 🔴 Blocked — needs decision or has unresolved issue
- ⚪ Not Started

---

## Phase Status

| Phase | Status | Date | Commit | Device-tested? | Notes |
|---|---|---|---|---|---|
| 0 — Pre-build setup | 🟢 Complete | 2026-05-08 | n/a | n/a | Directories, kits, context doc, accounts |
| 1 — Project scaffold | 🟢 Complete | 2026-05-08 | a85087b | Yes | Placeholder screen confirmed on device via Expo Go |
| 2 — Player + drag-to-move | 🟢 Complete | 2026-05-08 | G1: fe57417 G2: 9116c45 G3: 3f618d0 G4: 78fa367 | Yes — all 4 groups | All groups complete |
| 3 — Enemies + auto-fire | 🟢 Complete | 2026-05-10 | G1: c47e000 G2: 083d28d G3: 5715c19 G4b: 738ab95 G4c: a095517 | G1 ✅ G2 ✅ G3 ✅ G4b ✅ G4c ✅ | |
| 4a — Stat skills + level-up | 🟢 Complete | 2026-05-10 | G1: c4daad8 G2: a095517 G3: f297b4b G3-polish: 461b25b→d90aedf→ba505fc G4: ee7f7d5 G4-cleanup: 5690324 | G1 ✅ G2 ✅ G3 ✅ G4 ✅ | Full progression loop closed. G4: weapon unlocks L4/8/12/16 + all 8 weapon renames |
| 4b — Ability skills + crates | 🟢 Complete | 2026-05-10 | G1: 5411988 Slot-fix: 8ff2533 G2: 18b44e3 G3: e2a1deb G4: 8c31b42 G4-polish: 9cb7762 G5: b4091c6 Smoke: 2438bb4 | G1 ✅ G2 ✅ G3 ✅ G4 ✅ G5 ✅ | All 20 v1 skills shipped; throwable system; revive; bloom-hold-dissipate smoke animation |
| 4c — Crate weapons | 🟢 Complete | 2026-05-11 | G1: 75dc967 Fix: 68f5ef3 266fbd6 G2: d6f1c1c G3: 8c390b3 Polish: cd2d2d8 5a29a3e 2daeffd a0b7e61 4eca404 Close: cb8bddb | G1 ✅ G2 ✅ G3 ✅ | World-spawn crates; weapon roll + reveal modal; Shotgun/Rocket Launcher/Flamethrower active; custom weapon icons; debug scaffold cleaned up |
| 5 — Maps + obstacles + vehicle enemies | ⚪ | | | | |
| 6 — Audio + atmospheric effects | ⚪ | | | | |
| 7 — UI + persistence + analytics | ⚪ | | | | |
| 8 — Helicopter boss + hazards | ⚪ | | | | |
| 9 — Monetization + store submission | ⚪ | | | | |

---

## Open Issues / Tech Debt

| Issue | Discovered | Workaround | Must resolve by |
|---|---|---|---|
| SafeAreaProvider native ViewManager not registering on Fabric — react-native-safe-area-context's `RNCSafeAreaProvider` is missing from the New Architecture build despite the package being installed | Phase 2 Group 2 | Hardcoded inset values in DebugOverlay (`top: 50, right: 10`) | Phase 7 — HUD requires real safe-area awareness for notch / dynamic island / home indicator |
| No camera/zoom system — world renders at 1:1 with no `<Group>` wrapper, sprite scale hardcoded per element | Phase 2 G3 | `HERO_SPRITE_SCALE` constant in `gameConstants.ts` as a tunable | Phase 5 — tile rendering and obstacle placement need a camera that follows the player; multiple sprite scales need a unified zoom |
| **Debug overlay** — plain RN `<Text>` lines for HP/Score/XP/Level + Enemies/Kills/Time/Frame; hardcoded safe-area offsets; not kit assets | Phase 2 G2 (extended through Phase 3 and 4a G1) | Hardcoded `top: 50, right: 10` in `GameCanvas.tsx`; extended in each phase as new fields arrive | Phase 7 — replace with kit HUD assets: `HUD/CHARACTER HUD/HP ARMOR AMMO HUD.png`, `HUD/MONEY PANEL/Money Panel HUD.png`, `HUD/WEAPON ICONS/` per equipped weapon, bottom-center XP bar with current level; safe-area insets via real `useSafeAreaInsets` once SafeAreaProvider is fixed |
| **Level-up modal typography is RN default font** — all text in `LevelUpModal.tsx` (skill name, level, description) renders in the system default font | Phase 4a G3 polish | RN default font with kit color palette (`#ffffff` names, `#ffd700` level, `#d0d0d0` desc) | Phase 7 — UI typography pass picks a pixel font and applies consistently across modal, HUD, menus, and YOU DIED overlay (all default-font text is pending replacement in Phase 7, so current consistency is acceptable in the interim) |
| **Open question: kit UI fit vs. custom UI** — kit-first principle is applied to all UI, but the full system hasn't been seen together yet | Phase 4a G3 polish | Kit-first applied throughout; BG.png crop in this commit is one example of forcing a kit asset to fit the game's needs | Phase 7 — with the full UI visible as a system (modal, HUD, menus, overlays), evaluate whether kit UI elements actually fit the intended look. If they don't, kit-first for UI may need to be relaxed in favor of custom pixel UI. This is a strategic judgment call for Phase 7, not a pre-committed rebuild. **First evidence in:** Phase 4a G3 polish followup discovered the kit's Upgrade BG.png has baked-in weapon placeholder icons in each slot that are part of the panel art itself — not separable layers. Even after cropping to one row, the bullet icons sit behind skill cards and bleed around the edges. The kit UI was designed for a weapon-loadout shooter specifically, not a generic skill modal. Phase 7 should evaluate seriously whether to continue building UI from kit assets or rebuild custom. |
| **Hit flash visual tuning** — `HIT_FLASH_RADIUS_PX = 7` (~1/3 of `ENEMY_COLLISION_RADIUS_PX`) is a starting point, not a validated value | Phase 4a G3 polish | Constant in `gameConstants.ts`, one-line tune on device | When device testing confirms feel is right; remove from tech debt once Mo signs off on the radius |
| **Debug cycle button mutates `weaponPose` only — not `equippedWeaponId`** — cycling the button changes the hero animation pose but combat stats (damage, cooldown, range) remain from the previously equipped weapon. The button face is therefore an unreliable indicator of which weapon is actually equipped. | Phase 4a G4 | Button is for visual debugging only; weapon floor unlocks (G4) correctly set both fields | Phase 7 — cycle button is removed entirely when the real HUD weapon icon lands. Do not use the cycle button face to verify weapon equip state. |
| **Kit UI fit vs. custom UI — reinforced by Phase 4b evidence** — ReviveModal (Phase 4b G3) was built as a custom `<View>` layout because the kit's Mission Failed screen is not composable for a mid-run decision prompt. This is the second case after Phase 4a G3 (BG.png baked-in icons) where kit UI did not fit. | Phase 4a G3 polish (updated Phase 4b G3) | Custom layouts with kit color palette | Phase 7 — with full UI visible as a system, make the strategic call: continue kit-first UI or switch to custom pixel UI throughout. Growing evidence favors custom. |
| **Projectiles and pickups predate the fixed-slot nullable-array pattern** — they use an always-render slot approach for Skia transforms but their underlying data management predates the formal `Array<T \| null>` pattern established in Phase 3 G3 (enemies) and Phase 4b G4 (throwables/zones). May have subtle inconsistencies in slot lifecycle. | Phase 4b G4 (identified during pattern audit) | No user-visible impact; entity counts are bounded and FPS is stable | Post-launch template pass — Phase 5 vehicle enemies don't require this fix; schedule for the template cleanup pass after v1 ships |
| **Rocket exhaust trail frames not wired** — TDS kit ships 3 exhaust-trail frames (`rocket-f1/f2/f3.png`) alongside the 2 body frames. Only the body animation (1–2 frame loop at 100ms) is wired in Phase 4c G3. Exhaust trail compositing skipped for v1. | Phase 4c G3 | 2-frame body loop is readable at game scale; exhaust trail is visual polish | Phase 6 — atmospheric effects pass is the natural home for exhaust trail; schedule with muzzle flash and smoke compositing |
| **Weapon selector / inventory not yet implemented** — player currently has one active weapon at a time; EQUIP simply swaps it. Must-have for v1. Design: `weaponInventory: WeaponId[]` on `PlayerState` (starts `['pistol']`), EQUIP appends if not already present and sets active, HUD shows inventory as tappable icon strip. Duplicate EQUIP: switch active only, no second copy added, no score/XP given. SCRAP unchanged (+50 score +25 XP). No carry cap, no drop modal, no quick-select wheel — just tap-to-swap. | Phase 4c close | Active weapon swap works; inventory strip not built | Phase 7 — implement alongside HUD rewrite |
| **Auto-weapon-upgrade alternative design** — current design leaves Pistol as the starter with crates as the sole weapon source. If unlucky-crate-run feels punishing on player testing, a future option is a player-choice modal at L4/L8/L16 ("new weapon available — equip or keep current?"). No fix planned; logged for design awareness. | Phase 4c (dropped 2daeffd) | Crates are sole source — player starts on Pistol | Design review after Phase 5 playtesting |
| **Muzzle flashes + bullet origin correction** — kit ships muzzle flash frames for every weapon archetype in `Effects/` (Pistol Shot/, Rifle Shot/, MachineGun Shot/, Grenade Launcher Shot/). Not wired. Adding them also requires fixing bullet spawn origin: currently player center, not gun barrel tip. Bundle both fixes into a single Phase 6 polish commit. | Phase 4c (identified during G3 review) | Bullets emanate from player center; no muzzle flash | Phase 6 — atmospheric effects + polish pass |
| **Pistol and SMG weapon icons at 64×64 vs others at 80×80** — the custom weapon sprite batch shipped with Pistol.png and SMG.png at 64×64, the other five at 80×80. Causes slight size mismatch in the crate modal icon. Low priority. | Phase 4c weapon sprite swap (a0b7e61) | `resizeMode="contain"` handles it acceptably | Future sprite work — re-source at 80×80 or accept variance |
| **Flamethrower flame effect too small** — current flame zone sprites (`assets/effects/flame/1–7.png`) are 32×32px, rendering at 64×64px at `EFFECT_SPRITE_SCALE=2`. The flame jet is barely visible at game scale. Kit ships ACS Fire frames (`Effects/ACS Fire/ACSF_01–03.png`) at 48×96px — 3× taller, portrait-oriented, suits a directional flame stream. Swap is a pure asset + `sprites.ts` require() update (7 frames → 3). If flame/molotov visuals need to diverge, split into two effect types first. | Phase 4c retrospective | 32×32 flame zones play but are easy to miss visually | Phase 6 — atmospheric effects pass; bundle with muzzle flash and exhaust trail work |

---

## Phase Pre-Flight Checklist

Every phase that touches `package.json` must run through this checklist before starting feature work:

- [ ] List native packages added/removed/changed
- [ ] Pin exact versions (no `~` or `^` for native code)
- [ ] Run `npx expo-doctor` — resolve warnings
- [ ] Rebuild dev client APK if any native changes
- [ ] Install fresh APK on device
- [ ] Run native smoke test (SafeAreaProvider, Skia, GestureDetector, Reanimated)
- [ ] Verify smoke test passes before writing feature code

See "Native Dependency Hygiene" section in v3 master context for the full guideline.

---

## Phase 0 — Pre-build setup

**Goal:** All accounts, directories, and reference materials in place before opening Claude Code.

- [x] GitHub repo created at osburnlabs-svg/shoot-your-way-out
- [x] Expo account created
- [x] Both asset kits acquired (TDS Pixel Art Kit + Top Down Trucks/Cars)
- [x] v3 master context doc produced
- [x] Working directories created on machine
- [x] Kits placed in `_project-docs/kits/`
- [x] Context doc placed in `_project-docs/`
- [x] Node.js v24.14.0, npm 11.9.0, Claude Code 2.1.83 confirmed installed
- [ ] Expo Go installed on phone
- [ ] Phone and dev computer on same Wi-Fi network
- [ ] Apple Developer account ($99/yr) — needed by Phase 9, not before
- [ ] Google Play account ($25) — needed by Phase 9, not before
- [ ] AdMob account — needed by Phase 6, not before

---

## Phase 1 — Project scaffold

**Goal:** Expo project created, all dependencies installed, EAS configured, audio/monetization/analytics modules stubbed, app boots to placeholder screen on physical device.

**Status:** Complete 🟢

**What CC produced:**
- Expo SDK 54 project at MobileGames/shoot-your-way-out/
- Full src/ tree: 7 screens, 6 components, 13 lib files, 11 data files, 3 map stubs
- 4 full stubs: audioEngine.ts, monetization.ts, analytics.ts, persistence.ts (persistence fully implemented)
- Placeholder screen: dark background #0a0d08, gold title text, renders on device

**What worked:**
- All 9 dependency installs clean (expo-in-app-purchases SDK 54 concern was a non-issue)
- EAS login via Google SSO (--sso flag, browser flow)
- eas build:configure required interactive PowerShell terminal (not Claude Code ! prefix)
- git push to osburnlabs-svg/shoot-your-way-out clean on first try
- Placeholder screen loaded on device via Expo Go with no errors

**What broke or changed:**
- @shopify/react-native-skia v2.2.12 does NOT have a config plugin — removed from app.json plugins. Skia uses standard RN auto-linking in this version.
- AdMob all-zeros placeholder IDs replaced with Google official test IDs (ca-app-pub-3940256099942544) — SDK initializes on startup and would reject all-zeros
- eas build:configure and eas login both require a real interactive terminal; the Claude Code ! prefix does not support interactive stdin prompts

**Manual steps needed:**
- eas login --sso (browser SSO, interactive)
- eas build:configure (interactive prompt to create EAS project, answered Yes + All)

**Final commit hash:** a85087b

**Device test result:** Placeholder screen confirmed on physical device via Expo Go. Dark background, gold "SHOOT YOUR WAY OUT" title, rust "Phase 1 Scaffold" subtitle visible.

---

## Phase 2 — Player + drag-to-move

**Goal:** Player character renders with hero sprites, drag-to-move controls work on touch device, walk animation plays, character rotates to face drag direction, weapon pose switches based on equipped weapon.

**Status:** 🟢 Complete

**Groups:**
- G1 🟢 — Sprites + animation system (commit fe57417, device-tested)
- G2 🟢 — Game loop + canvas + screen state machine (commit 9116c45, device-tested)
- G3 🟢 — Drag-to-move + walk animation + rotation (commit 3f618d0, device-tested)
- G4 🟢 — Weapon pose switching + debug cycle button (commit 78fa367, device-tested)

---

## Phase 3 — Group 1: Enemy entities, spawning, AI tick

**Status:** Complete (with one issue queued for G1 followup)
**Final commit:** c47e000
**Verification:** On device — hero moves at normal speed, FPS stable ~70 standing and moving, enemies (Scav + Raider) spawn off-screen and walk toward player, walk animation cycles, density ramps over time, debug overlay shows enemy count and elapsed time.

### What was built

- Enemy entity type and storage in shared game state (50-slot fixed array, soft-cap concurrent enemies)
- `data/enemies.ts` populated for Scav and Raider profiles (HP, speed, contact damage, XP-on-kill)
- Spawner: spawns at random position on circle outside screen edge, rate scales with elapsed time, tunable curve in `gameConstants.ts`
- AI tick: per-frame heading-toward-player + position update via `moveSpeed * dt`
- Asset import: Scav (Soldier kit walk/shot/die), Raider (Soldier 02 fire/die), Money_Small.png staged for G3
- Renderer: enemy data exposed via `getEnemyRenderData`, follows the renderer-returns-data pattern from Phase 2
- Debug overlay extended with `Enemies: N` and `Time: M:SS`

### What this group cost

Five commits to ship — one initial implementation and four bug fixes. The implementation was correct in shape; the bugs were all framework-level interactions between Reanimated, RNGH, and Skia that didn't surface until 50 enemy entities were on screen with an active gesture handler.

The bugs and fixes:
1. **Original Issue 1 (commit 83755c9):** initial G1 had `runOnJS(updateEnemyRenderData)` called every frame inside `useFrameCallback`. Created a per-frame React-state-update feedback loop. FPS read 1100, hero crawled at boot. Diagnosed as runOnJS-in-frame-callback feedback loop.
2. **First fix (ff17633):** moved enemy data through 50 `useDerivedValue` slot hooks (one per enemy slot), each subscribing to `gameState`. Removed the runOnJS-per-frame pattern. Hero moved normally, but FPS settled at 100–200 due to 50 Skia animated-prop subscribers cascading.
3. **Plan B fix (09ba5ff):** collapsed 50 hooks into 1 useDerivedValue returning an array, with `useAnimatedReaction → runOnJS` to push the array into React state. Re-introduced the feedback loop with the call site moved (reaction callback instead of frame callback). FPS back to 1100.
4. **Hero sprite bridge fix (1fe8291, 6bcc3c0):** discovered that even after all enemy fixes, a hero sprite-bridge `runOnJS` call inside `useFrameCallback` was still firing ~10×/sec while moving, contributing to elevated FPS. Moved hero sprite-frame selection into a setInterval polling shared values from JS thread. Useful but did not fully fix symptom.
5. **Real fix (c47e000):** discovered the actual cause was a known Reanimated bug where RNGH gesture events synchronously call `__flushAnimationFrame`, which drains the requestAnimationFrame queue and fires `useFrameCallback` once per gesture event. Android digitizers fire 120–240 events/sec while finger is moving. Fix: add `.runOnJS(true)` to the Pan gesture, routing events through JS thread and bypassing the flush. Single-line fix.

### Architectural decisions made during G1 (now permanent)

- **Zero gameplay-data `runOnJS` calls inside `useFrameCallback`.** Hard rule going forward. Sprite-frame selection and similar slow-updating JS-side state must use a separate setInterval polling shared values directly. This applies to projectiles, pickups, etc. in subsequent groups.
- **50-slot fixed-size enemy array** with `null`-rendering for inactive slots. Provides stable hook count for rules-of-hooks compliance and breaks Skia subscriptions for empty slots. Same pattern will be reused for projectile slots in G2.
- **Pan gesture is on JS thread, not UI thread.** Tradeoff is ~1ms input latency. Acceptable for analog joystick input. Re-evaluate only if precision input (aiming, etc.) is added later.
- **Sprite-frame timer at 100ms.** Reads hero and enemy state in one tick, updates React state once. Decoupled from the frame callback. ~10fps animation update rate; visually indistinguishable from the ideal 8fps.

### Issue 2 (resolved)

Soldier kit ships two-layer sprites (legs + upper body) like the hero kit. G1 originally imported only legs for both Scav and Raider, plus upper body for Raider via BAZOOKA.png. Result: Raider rendered correctly; Scav appeared legs-only.

**Fix:** Imported `Soldier.png` to `assets/sprites/enemies/scav/`, registered as `EnemySprites.scav.body` in `lib/sprites.ts`, composited as a second Skia layer over the walk frames in `GameCanvas.tsx` using the same pattern the hero uses for body + weapon.

Resolved in a separate commit shortly after the main G1 work. Scav now renders with a full upper body matching Raider's behavior. `SoldierWaepon.png` (32×32) and `Soldier02.png` (96×96) remain unimported — their roles are unclear and not needed.

### What this group taught us about working in this stack

Captured in the new "Known Framework Quirks" section of the context doc. Briefly:
- Reanimated gesture handlers force-flush the animation frame queue on every gesture event (Android, fixed via `.runOnJS(true)`)
- Per-frame `runOnJS` from `useFrameCallback` creates a scheduler feedback loop
- Many `useDerivedValue` subscriptions to one shared value cascade into elevated frame rate

Future debugging of similar symptoms starts there.

---

## Phase 3 — Group 2: Auto-fire, projectiles, collision, kills

**Status:** Complete (one cosmetic deferral, see below)
**Verification:** On device — Pistol auto-fires at nearest enemy in range, projectiles travel and hit, Scavs die in 2 shots and Raiders in 5, die animation plays before despawn, kill count tracks correctly, FPS stable ~70 with 30+ enemies and projectiles in flight.

### What was built

- `data/weapons.ts` populated: `WeaponProfile` type + Pistol entry (8 damage, 400ms cooldown, 180px range, 400px/s projectile speed)
- `data/gameConstants.ts` extended with `PROJECTILE_SLOT_COUNT=30`, collision radii, die-frame constants
- `lib/gameEngine.ts`: `EnemyState` extended with `status: 'alive' | 'dying'` and `dyingStartedAtMs`; new `ProjectileState` type; `PlayerState` extended with `equippedWeaponId` and `weaponCooldownMs`; `GameState` extended with `projectiles[]` and `killCount`. New `tickCombat` chained after `tickEnemies`.
- `lib/enemyEngine.ts`: spawn marks status `'alive'`, AI movement skips dying enemies
- `lib/combatEngine.ts` (new): targeting → fire → projectile motion → range despawn → collision → damage → dying transition → die-animation cleanup
- `GameCanvas.tsx`: 30 projectile slot useDerivedValue hooks following the same fixed-slot pattern as enemies; sprite-frame timer handles dying frame selection; render picks die vs walk frames and drops body overlay on dying Scavs; projectiles render as 4px warm-yellow Skia Circles (#f5c842); kill count line added to debug overlay
- Audio call sites marked with `// Phase 6` comments at exact locations (fire, hit, death) — actual `audioEngine.playSFX(...)` stub insertions deferred to Phase 6 wiring

### Architectural decisions made during G2

- **Combat lives in its own module** (`combatEngine.ts`) rather than bloating `gameEngine.ts`. Targeting, projectile motion, collision, damage, and death transitions all flow through `tickCombat`. Pattern will scale to additional weapons (rifle, machine gun, etc.) without restructuring.
- **Projectile slots = 30**, fixed-allocated useDerivedValue hooks in `GameCanvas`, inactive slots render as null. Same pattern as the 50 enemy slots.
- **Cooldown always advances regardless of target presence.** When cooldown elapses with no target, weapon is "ready" — first shot fires immediately when an enemy enters range. Matches Vampire Survivors feel.
- **No projectile pooling.** Allocation per shot is fine at current scales. Pooling remains in Deferred Work, trigger unchanged.
- **Pistol bullet rendered as Skia primitive** (4px Circle, warm yellow) rather than a sprite. Confirmed during G2 that the kit ships muzzle-flash frames under `Effects/Pistol Shot/` but no traveling projectile sprite for pistol. Skia primitive reads cleanly at top-down distance.

### Cosmetic deferral (not blocking, queued for Phase 6)

**Projectile spawn position is the player's center, not the gun barrel tip.** When the player rotates, the gun barrel moves around the hero's center, but the bullet always emerges from center. For most angles this is unnoticeable; at certain orientations the bullet visibly comes out of the hero's side rather than the gun.

Deliberately deferred to Phase 6, where muzzle flash work will need to compute the same barrel-tip offset. Bundling both fixes (muzzle flash position + projectile spawn position) into one focused Phase 6 session avoids doing the offset math twice. Approximately a 20-line change when addressed: compute `(player.x + barrelOffsetX, player.y + barrelOffsetY)` based on player facing.

---

## Design Decisions Pending Implementation

### Stop-to-fire mechanic (Archero-style) ✅ RESOLVED — shipped in Phase 3 G4b (commit 738ab95)

Decision made during G2 brainstorm: shift from constant auto-fire to Archero-style "auto-fire only while standing still." Player still doesn't aim — targeting and aim remain automatic. The only change is that movement gates firing.

**Mechanic:**
- Player is moving → no projectiles spawn (weapon "holstered")
- Player stops → auto-fire resumes immediately, targets nearest enemy as it does today

**Why this change:**
- Better fit for the military-tactical theme than constant-spray-while-sprinting
- Pairs with Phase 5 obstacles to create real tactical play (use cover, stop behind objects, fire, move)
- Adds decision-per-second engagement without requiring aim input — preserves one-thumb mobile UX
- Tiny code change (roughly 3 lines in the auto-fire targeting/fire path)

**Why defer to G4 instead of changing G3 now:**
- G4 is where game-feel tuning lives anyway
- Playing G3 with the current auto-fire model gives a real reference point to compare against when G4 flips it on
- Bundles cleanly with other G4 polish work

**Implementation note for G4:**
- Gate is at the top of the auto-fire logic: if `player.isMoving`, skip targeting/firing for this tick
- Open question for G4: should weapon cooldown pause while moving, or keep ticking so the weapon is "ready" the moment the player stops? Decide during G4 by feel.

**Doc-update reminder:** When this lands in G4, the context doc's auto-fire description (lines 30, 34, 255) should be updated from "auto-fires constantly at nearest enemy" to "auto-fires at nearest enemy when standing still." That's not an errata fix — it's a deliberate design change captured here.

### Map generation system — to land in Phase 5

Decision made during Phase 3 G2 brainstorm: maps in Shoot Your Way Out are procedurally generated each run via seeded scatter, with curated asset pools per map. No hand-authored layouts.

**The model:**

Maps differentiate by what assets are available and how dense they appear, not by where specific objects sit. The Compound feels different from the Outskirts because the asset pool is different (urban junk vs desert sparseness vs forest density), not because we hand-placed every car.

Each map JSON in `data/maps/` specifies:
- Tileset to use for ground
- Central landmark (one fixed sprite at map center — house, watchtower, large tree)
- Obstacle pool (list of valid sprite IDs the scatter can pull from)
- Obstacle density (low / medium / high, mapping to a target obstacle count)
- Background dressing pool (parked cars at edges, etc.)
- Atmosphere parameters (tint, weather, vignette)
- Gameplay parameters (spawn rate multiplier, sniper damage multiplier, etc.)

**Procedural each run, not locked per map:**

Each time the player taps Deploy, the scatter algorithm uses the current time as the random seed. Layout changes every run on every map. This matches genre conventions (every run feels different) and exploits the variety in the installed asset packs (the civilian cars pack adds value here — different cars in different spots each run).

**Four guard rails on the scatter algorithm (mandatory):**

1. **Player spawn zone protection.** Center 200×200 px area always clear of obstacles. Player has room to start.
2. **Minimum obstacle spacing.** No two obstacles spawn within ~60 px of each other (tunable). Prevents overlapping or visually crowded placements.
3. **Central landmark always fixed.** Defined per-map in the JSON. Always sits at the map center regardless of seed. Gives each map a recognizable identity even though everything around it changes.
4. **No-spawn ring around the central landmark.** ~80 px clearance (tunable). Prevents the landmark getting buried in surrounding obstacles.

**Why this approach:**
- Less authoring work than hand-placing obstacles
- Replayability for free — every run looks different on the same map
- Exploits the variety asset packs (especially civilian cars)
- Matches survivor-like genre conventions where mastery is about decision-making, not memorizing layouts
- Procedural-each-run is no harder to implement than locked-per-map — only difference is the seed source

**Implementation notes for Phase 5:**
- Scatter algorithm + four guard rails are CC's job to implement
- Three maps spec'd in the context doc (lines ~420-466): The Compound (urban), The Outskirts (desert), The Treeline (forest)
- Each map = one ~30-line JSON file in `data/maps/`
- Engine reads JSON, applies scatter, places landmark, draws atmosphere overlay
- Mo will tune density and parameters by playing each map and adjusting; CC implements the system, Mo iterates the values

### Enemy ranged fire — to land in Phase 5

Decision made during Phase 3 G4a brainstorm: enemies that visually carry weapons should actually fire them. Currently all enemies are melee (walk up and contact-damage the player). This is appropriate for Scav (basic infantry rushing) but mismatched for Raider (who visually carries a weapon in raised pose) and definitionally wrong for Sniper, Gunner, and vehicle enemies once they arrive.

**The change:**

Ranged enemies stop at their preferred firing range and fire projectiles at the player. Each enemy type gets its own weapon profile (damage, range, fire rate, projectile speed). Sniper has long range and high damage. Gunner has medium range and high fire rate. Raider has short-to-medium range and moderate damage. Scav stays melee. Vehicles (Humvee, BTR, Panzer, ACS) fire too, per their kit.

**Why this matters:**

- Matches the visual fantasy — an enemy holding a weapon should use it
- Adds a tactical dimension beyond positioning (dodge incoming fire, use cover)
- Differentiates enemy types meaningfully — each one plays differently
- On-brand for military theme — distinguishes this game from melee-swarm survivor-likes (Vampire Survivors, Brotato)
- Pairs naturally with Phase 5's obstacles — cover finally has a reason to exist

**Implementation scope (Phase 5):**

The combat infrastructure for this already exists in `lib/combatEngine.ts` from Phase 3 G2 — targeting, projectile motion, collision, damage. The new work is mirroring those systems for enemy-owned projectiles:

- Add weapon profile fields to `data/enemies.ts` per enemy type (range, fire rate, damage, projectile speed). Scav has none — it's melee.
- Extend enemy AI in `enemyEngine.ts`: if in firing range, stop and fire on cooldown; else walk toward player. Currently AI is always "walk toward player."
- Add `owner: 'player' | 'enemy'` field to `ProjectileState`. Update collision logic to handle both directions: player projectiles damage enemies (existing), enemy projectiles damage player (new).
- Enemy projectile rendering — color or sprite-differentiated from player projectiles so the player can read what's coming at them.
- Audio stubs for enemy fire (`enemy_shoot_pistol`, `enemy_shoot_rifle`, etc.) at the right call sites.

**Why Phase 5 (not earlier):**

1. Phase 5 introduces the rest of the ranged enemy roster (Gunner, Sniper, Humvee, BTR, Panzer, ACS). Building enemy-fire infrastructure once for the full roster, including retrofitting Raider, is cleaner than doing it for Raider now and rebuilding for the others later.
2. Without obstacles (Phase 5's other deliverable), enemy fire would be brutal — no cover means no way to dodge. The two features are paired by design.
3. Phase 3's combat loop is already satisfying for what it is. Don't expand scope.
4. The context doc already implies ranged fire as Phase 5 (Sniper "long range, red laser warning"). This entry formalizes that implication.

**Implementation note for Phase 5:** the infrastructure groundwork (the `owner` field on `ProjectileState`, the projectile-vs-player collision path) could optionally be added earlier as scaffolding if it makes Phase 5 cleaner. Decide at Phase 5 planning.

### Magnet feel tuning — to land in Phase 3 G4

Found during G3 device test: money pickup magnet works correctly when player is stationary or close, but is weak when player moves past a pickup. Pickups appear to "follow the player's last position" rather than catch up. Pickup eventually arrives if the player stops; if the player keeps moving, the pickup tail-chases without catching up.

**Root cause:** magnet acceleration is too gentle relative to player movement speed. The pickup recomputes direction toward the player each frame, but its acceleration can't build velocity fast enough to overtake a moving target.

**Fix options (in order of how disruptive):**

1. **Bump magnet acceleration and/or max speed in `gameConstants.ts`.** Two-number tuning change. Probably solves 90%+ of the issue. Try first.
2. **"Lead the player" prediction** — aim pickup at where the player *will be* a few frames ahead based on player velocity. More complex; usually unnecessary if (1) is tuned well.
3. **"Sticky" homing magnet.** Once a pickup enters magnet range, it commits to reaching the player no matter where they go. Matches Vampire Survivors behavior. Most reliable but requires changing the magnet algorithm structure.

**Recommended approach:** start with (1) during G4 polish. Tune by feel on device. If still unsatisfying after a reasonable range of values, escalate to (3).

**Not a blocker for G3.** All G3 systems (damage, pickups, magnet at-rest, collection, death) work correctly. This is feel polish, which is the explicit purpose of G4.

### Feedback design philosophy — grounded, realistic, never "game-noise" ✅ RESOLVED — permanent design rules

Shoot Your Way Out's feedback identity follows Tarkov-style grounded realism, not Vampire Survivors-style chaotic dopamine. Visual and audio feedback should reinforce that the player is in a tactical military situation, not a number-popping action loop. The following rules are permanent — not "for now" deferrals.

**Rule 1: No floating damage numbers, anywhere, ever.**

Damage numbers belong in games where the player optimizes per-hit arithmetic — Borderlands, Diablo, Path of Exile. They break the fiction of a tactical shooter. Effectiveness is communicated through animation (hit flashes, die animations), audio (impact sounds), and visible enemy state, never through numerical readouts above hit targets.

This applies to all weapons, all enemies, all phases, all post-launch updates. If a future feature feels like it wants damage numbers, redesign the feature, not the rule.

**Rule 2: No standalone "kill sounds" on enemy death.**

When an enemy dies, the player hears: the gunshot that killed them + the bullet's impact on flesh. They do not hear a separate "ding," "thunk," or celebratory cue. The death is the natural result of the shot, not a punctuated reward. This is the Tarkov touchstone — kills feel earned and weighty, not gamified.

This applies to common enemies and bosses alike. The helicopter boss may have a death sequence (explosion, falling, crash impact) — that's part of the visual+audio of an exploding helicopter, not a "kill sound." Same principle.

**Rule 3: Player-side feedback is HP-and-screen, not numbers.**

The player's damage feedback is the HP number in the HUD (decreasing) plus screen-level feedback that arrives in Phase 6+ (red vignette flash, brief audio hit indication). No damage numbers floating above the player on hit. Same philosophy as Rule 1, mirrored.

**What's allowed and encouraged:**

- Hit flashes on enemies (brief tint on damage — visual, grounded, shipping in Phase 3 G4c). Flash color is RED (impact/blood), not white. Red reads as "damage" without breaking military fiction.
- Die animations on kill (the existing 4-frame sequence — visual feedback that they're dead)
- Gunshot and impact audio (Phase 6 — diegetic, grounded)
- HUD HP decrease and visual hit indicators on the player (HUD is information, not gamification)

**For Phase 6 to revisit:** the `xp_absorb` SFX call wired during G3 for money pickup collection. Money pickups currently call `audioEngine.playSFX('xp_absorb')` on collect. Phase 6 should decide whether that sound exists at all, and if so, whether it's a subtle pickup confirmation or whether it gets cut for the same reason kill sounds are cut. The current call site is a stub — removing it during Phase 6 is one-line work.

**Implications for the developer:**
- When in doubt, ask "would Tarkov do this?" before adding a feedback element
- "Game feel" achieved through animation, sound, and physics — not text overlays or audio rewards
- Audio is information about what's happening, not commentary on what's happening

---

## Phase 3 — Group 3: Money pickups, magnet pull, contact damage, death state

**Status:** Complete 🟢
**Commit:** 5715c19

### What was built

- `PickupState` type added to `gameEngine.ts`: id, position, velocity (for magnet), type, scoreValue, xpValue, spawnedAtMs
- `PlayerState` extended: hp, maxHp, score, xp, lastDamagedAtMs (all new fields)
- `EnemyState` extended: lastHitPlayerAtMs (per-enemy contact damage cooldown)
- `GameState` extended: pickups[], nextPickupId, isDead
- `createInitialGameState` updated with all new fields (hp=100, score=0, xp=0, isDead=false, etc.)
- `updateGameState` freezes (returns state unchanged) when isDead=true; chains tickPickups as final step
- `pickupEngine.ts` (new): magnet pull (MAGNET_RANGE_PX=80px, accel=1200px/s², cap=800px/s), collection at COLLECT_RADIUS_PX=12px, score+xp grant, audioEngine.playSFX('xp_absorb') call
- `combatEngine.ts` extended: spawns money_small pickup at dying enemy position on HP→0; §8 contact damage with per-enemy 500ms cooldown (CONTACT_DAMAGE_INTERVAL_MS), isDead flag set when hp≤0; audio stubs for shoot/impact/death/hit
- `enemyEngine.ts`: lastHitPlayerAtMs threaded through spawn and movement copies
- `audioEngine.ts`: added 'worklet' directive to playSFX stub so it's callable from UI-thread worklets
- `gameConstants.ts`: PLAYER_STARTING_HP=100, PLAYER_COLLISION_RADIUS_PX=16, CONTACT_DAMAGE_INTERVAL_MS=500, PICKUP_SLOT_COUNT=50, MAGNET_RANGE_PX=80, MAGNET_ACCELERATION_PX_PER_SEC_SQ=1200, MAGNET_MAX_SPEED_PX_PER_SEC=800, COLLECT_RADIUS_PX=12, PICKUP_SPRITE_SCALE=2
- `GameCanvas.tsx`: useImage for Money_Small.png; 50 usePickupSlotTransform hooks (always-render pattern matching projectiles); pickup JSX below projectiles in z-order; 100ms timer extended to read hp/score/xp/isDead; debug overlay gains HP/Score/XP lines; "YOU DIED" RN View overlay (opacity-gated, always in JSX tree)

### Architectural decisions made during G3

- **audioEngine.playSFX marked 'worklet'** so actual call sites (not comments) can live in combat/pickup engine worklets. Phase 6 will change the implementation to an event-queue pattern; call sites need no rework.
- **Pickup z-order:** pickups < projectiles < enemies < player < overlays. Pickups appear below bullets visually.
- **Contact damage is in combatEngine** (not pickupEngine) — it's combat logic. pickupEngine stays focused on pickup physics and collection.
- **Per-enemy lastHitPlayerAtMs** implements the "each enemy has its own 500ms cooldown" requirement. player.lastDamagedAtMs tracks the last hit timestamp globally (available for future G4 hit-flash effect).
- **isDead set in combatEngine** (§8 contact damage) rather than a separate step — HP reaches 0 there, isDead is the immediate consequence.
- **50 pickup slots always-render** following the projectile pattern. If FPS impact is observed on device with large pickup counts, can switch to the enemy pattern (null JSX for inactive slots).

### Verification targets (to confirm on device)

1. Stand still in front of Scav. HP drops in debug overlay at ~500ms intervals.
2. Kill an enemy. Money Small pickup appears at corpse position immediately.
3. Walk past a pickup at >80px — it stays put.
4. Walk within 80px — pickup accelerates toward player, gets collected.
5. On collection: Score and XP increment by 10 in debug overlay.
6. Take enough hits — game freezes, "YOU DIED" overlay appears centered in red.
7. With 20+ enemies killed, FPS stays ~70.
8. Active pickup count returns to 0 when all collected.

---

## Phase 3 — Group 4a: Combat rebalance + balance baseline + magnet direct-pull fix

**Status:** Complete 🟢
**Commits:** multiple (data files only + magnet fix in pickupEngine.ts)

### What was built

- `data/gameConstants.ts`: spawn curve flattened (initial delay 3s, rate 0.25→2.0/s over 120s, was 0.5→3.0/s over 60s); Raider ratio ramp extended to 90s; magnet range widened to 120px; MAGNET_ACCELERATION_PX_PER_SEC_SQ removed entirely
- `data/weapons.ts`: Pistol damage 8→12, range 180→280px, projectile speed 400→500px/s
- `data/enemies.ts`: Scav HP 15→20 (2-shot kill at new damage); Raider unchanged
- `data/balance.ts` (new): documentation-only file capturing V1 demo balance baseline with full tuning rationale; not imported by any engine module — diff target only
- `lib/pickupEngine.ts`: magnet pull replaced from physics-based acceleration to direct-pull (vx = nx × max_speed each tick). Eliminates tail-chase bug. No momentum, no drift.

### Design decisions made during G4a

- **Spawn curve is the primary balance lever, not weapon damage.** Math: player kills ~1.25 Scavs/sec at 400ms cooldown + 2-shot kill. New curve crosses kill capacity at ~70s → first-death window 70-90s. Weapon buff is secondary (extended range makes game feel genuinely ranged, not melee).
- **Direct-pull magnet replaces acceleration-based model.** Acceleration model accumulated velocity in wrong direction when player changed course. Direct-pull recomputes velocity fresh each tick — no history, no drift. See balance.ts for full rationale.
- **balance.ts is demo balance only.** Explicitly scoped to Phase 3 standalone play. Full v1 balance is Phase 5+ work once helicopter boss, tier 5-7 enemies, and level-ups exist.

---

## Phase 3 — Group 4b: Stop-to-fire mechanic

**Status:** Complete 🟢
**Commit:** 738ab95

### What was built

Single-line gate in `lib/combatEngine.ts`: added `&& !player.isMoving` to the auto-fire condition. Player movement and firing are now mutually exclusive. Cooldown continues to advance while moving — weapon fires immediately when player stops if cooldown was ready.

`player.isMoving` was already set correctly in `gameEngine.ts` from Phase 2 (true when inputVector is non-null, false on finger lift). No new state, no new types.

### Design decisions made during G4b

- **Strict isMoving check.** Any joystick input = not firing. No threshold. Matches Archero. If wiggle-correction problems surface in playtesting, revisit in a later polish pass.
- **Cooldown keeps ticking while moving.** First shot fires immediately on stop. Decided during G2 planning — confirmed correct during G4b.
- **No visual indicator added.** Hero weapon-raised pose (standing still) vs walk cycle (moving) already communicates the state. Stop-to-fire mechanic decision resolved — see "Design Decisions Pending Implementation" for original entry.

---

## Phase 3 — Group 4c: Hit flashes + audio cleanup

**Status:** Complete 🟢
**Commit:** a095517

### What was built

**Hit flashes:**
- `EnemyState` gains `hitFlashUntilMs: number` (0 at spawn, set to `elapsedMs + HIT_FLASH_DURATION_MS` on each projectile impact including the kill shot)
- `data/gameConstants.ts` gains `HIT_FLASH_DURATION_MS = 80`
- `lib/enemyEngine.ts`: `hitFlashUntilMs` threaded through spawn and movement copies
- `lib/combatEngine.ts`: `hitFlashUntilMs` set on damage, threaded through all EnemyState copies
- `GameCanvas.tsx`: `useEnemySlotFlash` hook (50 useDerivedValue instances, same pattern as slot transforms) returns flash opacity (0 or 0.75) checked every frame on the UI thread. Red `<Circle>` (color `#cc2020`, radius = `ENEMY_COLLISION_RADIUS_PX`) rendered on top of each enemy's sprite layers, `opacity` prop driven by the derived value — no runOnJS, no polling lag.

**Audio cleanup:**
- Removed `audioEngine.playSFX('enemy_die')` from `combatEngine.ts`. Per "Feedback design philosophy" Rule 2 — no standalone kill sounds. The gunshot + impact pair already communicates the kill.
- `shoot_pistol` and `impact_flesh` call sites were already real calls (wired in G3 when 'worklet' directive was added to playSFX). No other `// Phase 6` stubs remained.

### Design decisions made during G4c

- **Flash runs on UI thread via useDerivedValue, not the 100ms timer.** HIT_FLASH_DURATION_MS = 80ms would be invisible through 100ms polling. Derived value checks `elapsedMs < enemy.hitFlashUntilMs` every frame — sub-millisecond response. Adds 50 derived values (same cost as the existing slot transforms, which proved acceptable for FPS).
- **Red Circle primitive instead of Skia color filter.** Three color-filter approaches were tried and failed in Skia v2.2.12: (1) `<Rect>` overlay filled the full bounding box including transparent sprite areas; (2) `<Paint><ColorMatrix />` as child of `<Image>` had no visible effect — Skia v2.2.12 does not apply Paint children to Image draws; (3) `<Paint><ColorMatrix />` as child of `<Group>` also had no visible effect. `Skia.Paint()` called from a worklet would crash (confirmed in G1 with Skia.PictureRecorder — same runtime). Red Circle centered on the enemy at ENEMY_COLLISION_RADIUS_PX radius is worklet-safe and reads clearly as an impact splash at 0.75 opacity.
- **`enemy_die` call removed, not replaced.** There is no alternative kill sound — the absence is intentional. See "Feedback design philosophy" entry for the permanent rule.

### Verification targets

1. Shoot an enemy → brief red flash on hit (~80ms), returns to normal
2. Shoot again → flash repeats
3. Kill it → flash on kill shot, die animation plays normally, no audio cue at death moment
4. FPS stable ~70 with 30+ enemies on screen
5. combatEngine.ts has no `enemy_die` playSFX call

---

## Phase 4a — Stat skills + level-up

**Goal:** XP gems collected, level-up modal opens, 10 stat-modifier skills selectable, weapon progression unlocks at levels 4/8/12/16.

**Status:** 🟢 Complete

**Groups:**
- G1 🟢 — XP curve, level field, level-up engine freeze (commit c4daad8, device-tested)
- G2 🟢 — 10 stat-modifier skills + skill state on PlayerState (commit a095517, device-tested)
- G3 🟢 — Level-up modal, skill selection, game resume — 3 polish rounds (commits f297b4b, 461b25b, d90aedf, ba505fc, device-tested)
- G4 🟢 — Weapon progression unlocks at levels 4/8/12/16 (commits ee7f7d5 + cleanup, device-tested)

---

## Phase 4a — Group 1: XP curve, level field, level-up engine freeze

**Status:** Complete 🟢
**Commit:** c4daad8
**Verification:** On device — game launches and plays normally with Level: 1 visible in debug overlay from boot. After collecting ~5 money pickups (50 XP), the game freezes cleanly: enemies stop walking, projectiles stop, joystick input has no effect. Debug overlay continues updating (its own 100ms timer is unaffected by the engine freeze) and still shows Level: 1. All Phase 3 systems — stop-to-fire, hit flashes, magnet pickup, contact damage, YOU DIED overlay — work correctly up to the freeze point. No console warnings or errors.

### What was built

- `src/data/balance.ts`: `xpForLevel(level)` exported as a real worklet function (previously the file was documentation-only). Formula: `Math.round(125 * (Math.pow(1.4, level - 1) - 1))`. L2 = 50 XP, L3 = 120, L4 = 218 … L12 ≈ 4942, L15 ≈ 13780. Header comment updated to document both the runtime and documentation purposes of the file.
- `src/lib/progressionEngine.ts` (new): `tickProgression` worklet. Loops `while player.xp >= xpForLevel(checkLevel + 1)` to count thresholds crossed in a single tick, sets `pendingLevelUp = true`, increments `pendingLevelUpCount`, fires `audioEngine.playSFX('level_up_chime')` stub.
- `src/lib/gameEngine.ts`: `level: number` added to `PlayerState` (initialized to 1); `pendingLevelUp: boolean` and `pendingLevelUpCount: number` added to `GameState` (initialized to false/0); `pendingLevelUp` freeze guard added immediately after the `isDead` guard in `updateGameState`; `tickProgression` imported and chained as step 5 after `tickPickups`.
- `src/components/GameCanvas.tsx`: `displayLevel` React state added; read from `player.level` in the 100ms timer alongside HP/Score/XP; `Level: {displayLevel}` line added to the debug overlay.

### Architectural decisions made during G1

- **`tickProgression` lives in its own file.** Follows the established domain-engine pattern (`combatEngine`, `pickupEngine`, `enemyEngine`). Progression logic will grow in G2 (skill modifier application) and G3 (skill selection + level increment) — isolating it now avoids bloating the orchestrator as it expands.
- **Freeze pattern reuses the `isDead` early-return model.** Two sequential guards in `updateGameState`: `if (state.isDead) return state` then `if (state.pendingLevelUp) return state`. Same semantics — return state unchanged — same cost. The symmetry makes the intent obvious and G3's clear-and-resume pattern straightforward to add.
- **`level` does not increment in G1; it increments on skill selection in G3.** Considered alternative: increment immediately when the threshold is crossed, track pending picks separately. Rejected: the level-up modal shows "leveling UP to level N," so the increment logically belongs at selection time, not detection time. This keeps `player.level` as the authoritative source of truth for "what level has been confirmed by a player choice."
- **`pendingLevelUpCount` tracks thresholds crossed in a single tick.** Rare in Phase 4a (money_small gives 10 XP per pickup; crossing two thresholds at once requires a gap of only 10 XP, possible only between L2 and L3 early in a run). Included because the infrastructure cost is one integer and the alternative — silently losing a level-up — is worse than the complexity of tracking it.
- **XP curve numbers are starting points, not final values.** The formula is designed to be tunable via a single multiplier in `balance.ts`. Expect retuning once Phase 4a is fully running with skills active, weapon upgrades unlocking, and real run pacing measured on device. The Phase 3 balance note applies here: don't assume these numbers carry forward without re-validation against actual run length.

---

## Phase 4a — Group 3: Level-up modal, skill selection, game resume

**Status:** Complete 🟢

### What was built

- `assets/ui/upgrade/BG.png` — extracted from kit GUI zip (`PNG/Upgrade/BG.png`, 308×243 empty 3×3 slot grid with "UPGRADE" gold header). Chosen over `Upgrade Preset.png` (weapon silhouettes baked into all 9 slots — can't use only 3).
- `assets/ui/icons/` — 6 icon PNGs: `Ammo.png`, `Pistol_HUD.png`, `SMG_HUD.png`, `Armor_Icon.png`, `HP_Icon.png`, `Speed_01.png`. Icons shared across skill IDs (ammo/subsonic/tracer/stims share Ammo.png; mre/painkillers share HP_Icon.png).
- `src/lib/sprites.ts`: `GuiSprites` export added with `upgrade.bg` (BG.png) and `skillIcons.*` (10 entries, all `as const`). `skillIcon` is NOT embedded on `SkillDefinition` to avoid pulling sprites.ts into the worklet module closure.
- `src/lib/gameEngine.ts`: `currentLevelUpChoices: SkillId[]` added to `GameState`; initialized to `[]` in `createInitialGameState`. Populated by the JS thread during the pendingLevelUp freeze window — never read by worklets.
- `src/components/LevelUpModal.tsx`: Full implementation. Props: `visible`, `choices`, `playerSkillStacks`, `onSelect`. Renders: full-screen dim overlay + BG.png panel (308×243, stretched) + 3 `TouchableOpacity` skill cards absolutely positioned over the top-row slot frames (GRID_TOP=32, SLOT_H=70, SLOT_W=100). Each card shows kit icon + displayName + "Lv X/Y" + description. Returns null when `visible=false` or `choices.length===0`.
- `src/components/GameCanvas.tsx`:
  - Imports: `LevelUpModal`, `SKILLS`, `SKILL_IDS`, `SkillId`
  - React state: `displayPendingLevelUp`, `displayChoices`, `displayPlayerSkillStacks`
  - 100ms timer extended: detects `state.pendingLevelUp && state.currentLevelUpChoices.length === 0`; draws 3 choices via Fisher-Yates shuffle of non-maxed skills; writes to `gameState.value.currentLevelUpChoices` (safe — engine is frozen)
  - `handleSkillSelect(id)`: mutates `gameState.value` directly (JS thread, follows `cycleWeapon` precedent); increments `player.skillStacks[id]`; increments `player.level`; decrements `pendingLevelUpCount`; clears `pendingLevelUp` when count reaches 0; resets `currentLevelUpChoices: []`
  - JSX: `<LevelUpModal>` mounted after YOU DIED overlay; `pointerEvents="box-none"` on overlay wrapper

### Architectural decisions made during G3

- **`skillIcon` stays off `SkillDefinition`.** Embedding it would require `skills.ts` to import `sprites.ts`, pulling the image require chain into the worklet module closure. `GuiSprites.skillIcons` is accessed directly in `LevelUpModal` (React thread only) — no worklet exposure.
- **Modal background = BG.png (Option B).** `Upgrade Preset.png` has weapon silhouettes permanently baked into all 9 slots, making selective use of 3 slots visually wrong. BG.png has empty slot frames — compositing skill cards over them is clean.
- **Choice draw runs on JS thread in the 100ms timer.** `Math.random()` cannot be used in worklets. The engine freeze guarantees no concurrent UI-thread writes to `gameState.value` during the draw, so the JS-thread mutation is safe.
- **3 choices maximum.** With only 10 skill types and some possibly maxed, there may be fewer. The modal handles `choices.length < 3` gracefully by rendering only the available cards.

### Verification targets (on device)

1. Collect ~5 pickups → game freezes, level-up modal appears with BG.png panel and 3 skill cards
2. Cards show correct icon, name, "Lv 0/N" (or current stack), and description
3. Tap a card → modal dismisses, game resumes, Level increments in debug overlay, skill stack applied
4. Equip gear_tactical_boots → move speed visibly increases; equip plate_carrier → survive contact longer
5. Reach max stacks on a skill → it no longer appears as a choice
6. If pendingLevelUpCount > 1 (rare), modal re-appears after first selection
7. YOU DIED overlay still works (isDead still fires correctly)

---

## Phase 4a — Group 4: Weapon unlock floor at levels 4/8/12/16

**Status:** Complete 🟢
**Commits:** ee7f7d5 (content) + G4 cleanup (this commit — removes verification button)
**Verification:** On device — XP button drove level-ups through all four unlock thresholds. L4 (SMG): fire rate change was immediately unmistakable — bullets visibly stream at ~7× the pre-unlock cadence. L8 (Assault Rifle): hero sprite pose switches from pistol stance to rifle stance, confirming both `weaponPose` and `equippedWeaponId` set correctly. L12 (Machine Gun): pose switches to machinegun stance, fire rate increases again. L16 (Sniper Rifle): pose returns to rifle stance, fire rate drops dramatically and projectile range visibly extends — enemies at the edge of the arena are targetable. Skill modal opened and skill picks applied correctly at every unlock level. Non-unlock levels (2, 3, 5–7, 9–11, 13–15) showed no weapon change as expected.

### What was built

- `src/data/weapons.ts`: four previously commented stubs (`aks74u`, `ak74`, `pkm`, `svd`) fully defined with final stats from the context doc table. Three crate-only weapons (`m870`, `gp25`, `rpo`) added as complete stubs for Phase 4b — correct stats but combat engine extensions (pellet spread, AOE, DoT stream) not wired until 4b. All 8 `displayName` fields renamed from Tarkov caliber names to generic player-facing names: Pistol, SMG, Assault Rifle, Machine Gun, Sniper Rifle, Shotgun, Grenade Launcher, Flamethrower.
- `src/components/GameCanvas.tsx`: `WEAPON_UNLOCK_MAP` constant at module level mapping unlock levels to `{ weaponId, weaponPose }` pairs. `handleSkillSelect` extended: computes `newLevel` first, checks the map, spreads both `equippedWeaponId` and `weaponPose` into the player state mutation when a match is found (non-unlock levels skip the spread entirely — zero additional cost). `+500 XP` debug button added for verification, removed in the cleanup commit.

### Architectural decisions made during G4

- **Both `equippedWeaponId` AND `weaponPose` must be set on unlock.** The two fields are independent: `equippedWeaponId` drives combat stats (damage, cooldown, range) via `WEAPON_PROFILES`; `weaponPose` drives hero animation. Pre-review catch — the `cycleWeapon` button in Phase 2 G4 only mutated `weaponPose`, creating a precedent where the two fields appeared coupled. They are not. Any weapon equip operation must set both.
- **Unlock check lives inline in `handleSkillSelect`, not as a separate callback.** The unlock fires only when the modal-driven level increment crosses a threshold — it is not a general "level changed" observer. Inlining it keeps the mutation atomic: level, weapon unlock (if any), and skill stack all commit in one `gameState.value = { ...state }` write. Separate handlers would require two writes or complex coordination.
- **Cycle button weaponPose-only bug discovered during pre-review.** The button's Phase 2 implementation only sets `weaponPose`. Logged as tech debt. Does not affect gameplay — the button is a dev tool, not a player-facing control. Resolves when Phase 7 removes the button entirely and the real HUD weapon icon takes over.
- **Generic weapon names ship now, not at Phase 7.** Names are invisible in current shipping UI (no HUD until Phase 7), but doing the rename while the design judgment was fresh (the Tarkov names were always wrong for a non-Tarkov game) costs nothing and frees Phase 7 from the conversation. Same reasoning applied to the 3 crate weapon stubs — defining them here while the file is open prevents a context-switch into weapons.ts during Phase 4b.
- **SMG and Shotgun reuse `pistol` pose; Sniper Rifle reuses `rifle` pose.** The kit ships 5 hero animations for 8 weapon profiles. Three weapon unlocks (L4 SMG, L8 Assault Rifle, L12 Machine Gun) produce visible pose changes; L4 (SMG) does not because SMG uses `pistol` pose like the starting Pistol. The fire rate change at L4 is the observable signal. Phase 7's HUD weapon icon will visually distinguish SMG from Pistol regardless of shared pose.

### Phase 4a — Final summary

The full progression loop is closed. Run shape: kill → XP → freeze → modal → pick skill → resume → repeat, with auto-weapon-unlock at L4/8/12/16 layered on top of every level-up. Phase 3's static combat loop (shoot, kill, die) is now Phase 4a's dynamic-progression loop: skills compound across a run, weapon tiers change the engagement range and tempo, and runs now have an arc from Pistol scrapping through SMG into Rifle and beyond. Phase 4b adds the remaining 10 ability skills (grenades, molotovs, smoke), the crate drop system with reveal animation, and activates the three crate-only weapon profiles (Shotgun, Grenade Launcher, Flamethrower) already stubbed in `weapons.ts`.

---

## Phase 4b — Ability skills + crates

**Goal:** 10 ability skills (grenades, molotovs, smoke grenades), throwable system with area effects, crate drop system from enemies, crate reveal animation, weapon swap logic.

**Status:** 🟢 Complete

**Groups:**
- G1 🟢 — 5 inline-effect skills (commit 5411988, device-tested)
- Slot-drift fix 🟢 — stable enemy slot indices (commit 8ff2533)
- G2 🟢 — Field Medic Kit + description polish (commit 18b44e3, device-tested)
- G3 🟢 — Revive system: Backpack skill + free/ad revive prompt (commit e2a1deb, device-tested)
- G4 🟢 — Throwable system infrastructure (commits 8c31b42 + 835f8c2 + 9cb7762, device-tested)
- G5 🟢 — Wire throwable skills + Stims rework (commits b4091c6 + 8304fbf, device-tested)
- Smoke 🟢 — Smoke art wired + bloom-hold-dissipate animation (commits 27657d1 + b9ec3a6 + 2438bb4, device-tested)

---

## Phase 4b — Group 1: 5 inline-effect skills

**Status:** Complete 🟢
**Commit:** 5411988
**Verification:** On device — all five skills appear in the level-up draw pool and function as designed. Hollow Points: kill pace noticeably higher at low HP than at full HP — +50% damage threshold confirmed. Suppressor: first-hit kills coming faster than subsequent hits on fresh enemies. Ceramic Insert: damage-reduction stacks with Plate Carrier — confirmed via longer survival in contact-heavy situations. Comms Headset: magnet range visibly expanded — pickups drew from further away without approaching. Helmet: individual negate rolls (15% chance) are hard to isolate, but contact-damage survival improved measurably at 3–4 stacks.

### What was built

- `src/data/skills.ts`: Five new `SkillId`s (`ammo_hollow_points`, `gear_ceramic_insert`, `optics_suppressor`, `provisions_comms_headset`, `gear_helmet`). All use `effect: {}` — inline-effect pattern formalized here. Icons assigned in `GuiSprites.skillIcons` with tech-debt notes for placeholder matches.
- `src/lib/combatEngine.ts`: Hollow Points conditional (+50% damage when player HP < 25% of max, reads `skillStacks` directly at hit time). Suppressor first-hit bonus per enemy (+10% per stack, flag cleared on enemy death). Helmet negate roll at contact-damage time (worklet-safe hash of `elapsedMs ^ enemyId`; 15% × stacks, capped at 60%).
- `src/lib/pickupEngine.ts`: Comms Headset magnet range multiplier (+30% per stack, applied to `MAGNET_RANGE_PX` before distance check).

### Architectural decisions made during G1

- **Inline-effect pattern formalized.** Skills whose effect is conditional (Hollow Points: low-HP trigger) or stateful (Suppressor: per-enemy first-hit flag) cannot be expressed as flat modifiers — the worklet Babel constraint prohibits function-valued fields on `SkillEffect`. These skills use `effect: {}` and the registry entry exists solely for modal display; logic lives in the engine that applies the effect. Pattern documented in skills.ts header.
- **Helmet negate uses a worklet-safe hash, not `Math.random()`.** `Math.random()` is available in Reanimated worklets (confirmed by existing use in enemyEngine.ts), but a deterministic hash of `(elapsedMs ^ enemyId)` ensures each hit's negate roll is stable across any re-computation of the same tick without accumulating RNG state.

---

## Phase 4b — Slot-drift fix: stable enemy slot indices

**Status:** Complete 🟢
**Commit:** 8ff2533
**Verification:** On device — no die-frame flicker or visual artifact observed across 10+ sequential enemy deaths. Enemy sprites transition from alive to death animation cleanly with no one-frame bleed onto adjacent slots.

### What was built

- `src/lib/enemyEngine.ts`: Enemy array converted from compacting (splice on death) to fixed-length nullable (`Array<EnemyState | null>`). Dead enemies' slots are set to `null`; new spawns fill the first-null slot; no slot indices shift after any death event. Matches the existing projectile and pickup slot patterns.

### Architectural decisions

- **Fixed-slot nullable-array is the canonical project pattern for all entity arrays.** Stable slot index = stable React key = no spurious animation state resets. Arrays that compact after removal break key stability: a surviving enemy can shift into a lower slot and inherit a different slot's Skia animation state, producing the die-frame flash this fix eliminates. The pattern now applies to projectiles, pickups, enemies, throwables, and effect zones.

---

## Phase 4b — Group 2: Field Medic Kit + description polish

**Status:** Complete 🟢
**Commit:** 18b44e3
**Verification:** On device — Field Medic Kit appears in the draw pool. Tapping at partial HP restores exactly 25 HP (debug overlay confirmed). Tapping at full HP produces no overheal. Three picks available (maxStacks: 3); after third pick the card no longer appears. All existing skill descriptions visibly shorter — no truncation in cards.

### What was built

- `src/data/skills.ts`: `provisions_field_medic_kit` added with `onSelectEffect: { healHp: 25 }` and `effect: {}`. `OnSelectEffect` type introduced. Description convention updated: "per stack" dropped from all skill descriptions — the "Lv X/Y" indicator already communicates stacking.
- `src/components/GameCanvas.tsx` `handleSkillSelect`: reads `skillDef.onSelectEffect?.healHp` after stack increment; applies `newHp = Math.min(currentHp + healHp, effective.maxHp)`.

### Architectural decisions made during G2

- **`onSelectEffect` optional field on `SkillDefinition`.** Fires once at selection time on the JS thread, inside `handleSkillSelect`, after the stack increment. Separate from passive `effect: {}` modifiers accumulated by `getEffectiveStats`. Enables burst skills (heal, and future XP or ammo grants) without polluting the worklet-safe stat accumulator. Stack count still increments; `maxStacks` gates re-appearance in the draw pool.

---

## Phase 4b — Group 3: Revive system

**Status:** Complete 🟢
**Commit:** e2a1deb
**Verification:** On device — full revive path exercised. Reached L5, died. ReviveModal appeared: FREE REVIVE button (Backpack at 1 stack), WATCH AD, GIVE UP. FREE REVIVE: respawned at center with 50 HP and ~2s invulnerability, Backpack stack decremented to 0 — FREE REVIVE absent on second death. WATCH AD: ad stub ran, revive applied, adRevivesUsed incremented; second WATCH AD suppressed on next death (1/run max). GIVE UP: death state confirmed. No regressions on skill modal or existing combat.

### What was built

- `src/lib/gameEngine.ts`: `PlayerState.invulnerableUntilMs`, `PlayerState.adRevivesUsed` added.
- `src/data/skills.ts`: `gear_backpack` (`effect: {}`, `maxStacks: 1`) — stack count acts as the revive charge counter; decrement on free revive use.
- `src/components/GameCanvas.tsx`: `ReviveModal` (custom RN `<View>` layout — no kit asset fit for a mid-run decision prompt). `handleFreeRevive`: decrements backpack stack, respawns player at center, sets `invulnerableUntilMs = elapsedMs + 2000`. `handleAdRevive`: `adRevivesUsed` guard (1/run max), same respawn. `handleGiveUp`: confirms death state.

### Architectural decisions made during G3

- **ReviveModal is custom layout, not kit art.** The kit's Mission Failed screen is a full stats + retry panel designed for a game-over endpoint, not a mid-run yes/no prompt. Custom `<View>` with kit color palette is faster to ship and more legible for the player. Phase 7 evaluates whether to unify with the kit's Game Over screen. **Closes the YOU DIED overlay tech debt** — the death-state UX is now fully handled by ReviveModal + GIVE UP path.
- **`gear_backpack` stack = revive charge.** Doubles as the charge counter without a separate field: 0 = no free revive, 1 = one charge. `maxStacks: 1` limits draw-pool appearances. Decrement in `handleFreeRevive` on the JS thread (safe — game is frozen during death state).

---

## Phase 4b — Group 4: Throwable system infrastructure

**Status:** Complete 🟢
**Commits:** 8c31b42 (infrastructure) + 835f8c2 (G4 polish: static molotov visual) + 9cb7762 (Reanimated strict-mode fix)
**Verification:** On device via G4 debug spawn buttons (removed in G5). Frag: arc flight to target, 4-frame Explode sprite at landing (400ms), AOE damage hits enemy cluster within 40px. Smoke: zone appears, enemies inside slow to half speed, zone expires at 4s. Molotov: fire-patch zone appears (static Explode frame 3, peak-bloom), DoT deals 5 dmg/250ms in radius, zone expires at 3s. No Reanimated console warnings after strict-mode fix.

### What was built

- `src/data/gameConstants.ts`: All throwable and zone constants (`THROWABLE_SLOT_COUNT=10`, `EFFECT_ZONE_SLOT_COUNT=6`, travel/arc/damage/radius/duration constants for frag/smoke/molotov).
- `src/lib/gameEngine.ts`: `ThrowableState` type (`id`, `type`, `status: 'flying'|'detonating'`, `spawnX/Y`, `targetX/Y`, `thrownAtMs`, `detonationStartedAtMs`). `EffectZoneState` type (`id`, `type: 'smoke'|'molotov'`, `x`, `y`, `spawnedAtMs`, `lastTickAppliedMs`). `GameState.throwables` (10 null-initialized slots), `GameState.effectZones` (6 null-initialized slots). `PlayerState.invulnerableUntilMs` (also used by G3 revive).
- `src/lib/throwableEngine.ts` (new file): `spawnThrowable`, `tickThrowables`, `tickEffectZones`. Arc formula: `y = lerp(spawnY, targetY, frac) − sin(frac × π) × ARC_HEIGHT_PX`. Frag: AOE on landing, status transitions to `'detonating'` and holds slot for 400ms Explode animation. Smoke/molotov: clear throwable slot on landing, spawn EffectZone. `applyAOEDamage` private worklet helper.
- `src/lib/enemyEngine.ts`: Smoke slow inline in movement tick — reads `state.effectZones` per enemy per tick, applies `SMOKE_SLOW_MULT` when enemy is inside a smoke zone radius. First zone match wins (no stacking).
- `src/components/GameCanvas.tsx`: `useThrowableSlotTransform` (always-render, returns transform array with −9999 offset for inactive slots — no `.value` read during JSX render). 10-slot flying-circle render + 6-slot zone render. Molotov G4 polish: static Explode frame 3 (index 2, peak-bloom) replaced the looping flamethrower animation that read as a directional stream rather than a ground patch.

### Architectural decisions made during G4

- **Fixed-slot pattern extended to throwables (10) and zones (6).** Same rationale as enemies: stable slot index = stable render key. Throwable count is bounded by auto-throw cooldowns — 10 slots exceeds any realistic concurrent in-flight count at max skill stacks.
- **Frag holds its slot during detonation; smoke/molotov don't.** Frag needs a fixed visual position for the 400ms Explode animation — the throwable slot provides it. Smoke and molotov clear their throwable slot on landing; the EffectZone carries the persistent visual and gameplay effect.
- **Smoke slow inline in `tickEnemies`, no new EnemyState field.** Mo's recommendation, accepted. 50 enemies × 6 zones = 300 distance checks/tick — negligible vs 1500 projectile collision checks. One-tick lag (≤16ms) imperceptible. Avoids a `smokeSlowUntilMs` field on every enemy that would need to be threaded through all enemy-state copies.
- **Reanimated strict-mode: no `.value` read in JSX render.** `useDerivedValue` callbacks are UI-thread safe. JSX `.map()` runs on the React thread — reading `.value` there triggers `"[Reanimated] Reading from value during component render."` Fixed by returning `SharedValue<Transform[]>` directly from `useThrowableSlotTransform` and passing it to `<Group transform={...}>`. Skia reads it on the UI thread. Matches the existing projectile and pickup slot transform pattern.

---

## Phase 4b — Group 5: Wire throwable skills + Stims rework

**Status:** Complete 🟢
**Commits:** b4091c6 (G5: wire skills + verification button) + 8304fbf (Stims rework + remove +500 XP button)
**Verification:** On device — all three throwable skills appear in the draw pool and fire on cooldown. Frag Grenade: first throw fired immediately on first enemy in range (cooldown init 0), subsequent throws on interval. Smoke Grenade: zones deployed on cooldown, enemies visibly slowed inside. Molotov: fire patches on cooldown, HP draining on enemies in zone. Stims rework: +5% damage at full HP confirmed via kill-speed comparison; −10 max HP per stack confirmed (debug overlay HP ceiling dropped on selection). HP clamped correctly when new max < current HP.

### What was built

- `src/data/skills.ts`: `throwables_frag`, `throwables_smoke`, `throwables_molotov` (`effect: {}`, `maxStacks: 3`, category `'throwables'`). Stims reworked: `effect: { damageMultAdd: 0.05, maxHpAdd: -10 }` (was `hpRegenPerSecAdd: -2`), description `'+5% damage, -10 max HP'`.
- `src/lib/gameEngine.ts`: `PlayerState.fragCooldownMs`, `smokeCooldownMs`, `molotovCooldownMs` (all initialized to 0 — fires on first in-range target after selection).
- `src/lib/throwableEngine.ts`: `tickThrowableSkills` — advances cooldowns, picks a random eligible enemy within `THROWABLE_TARGET_RANGE_PX` (plain `number[]` indices, worklet-safe `Math.random()` selection), calls `spawnThrowable` on expiry. Cooldowns: `max(8000 − 2000×stacks, 4000)` frag, `max(15000 − 3000×stacks, 9000)` smoke, `max(12000 − 3000×stacks, 6000)` molotov.
- `src/components/GameCanvas.tsx` `handleSkillSelect`: unconditionally recomputes `effective = getEffectiveStats(newStacks, weapon, player.maxHp)` after any skill pick, then `newHp = Math.min(newHp, effective.maxHp)` — single clamp covers max HP reductions (Stims), increases (MRE), and on-selection heals (Field Medic Kit).

### Architectural decisions made during G5

- **Cooldown initialized to 0.** First throw fires the moment an enemy enters range after skill selection — immediate payoff. Cooldown stays at 0 while no target is present (no phantom accumulation). Resets to effective cooldown after a successful throw.
- **Stims reworked from drain to structural penalty.** `-2 HP/sec` created an ongoing HP race and partially cancelled Painkillers, muddying both skills' identities. `-10 max HP` is a permanent structural trade-off: higher damage ceiling, lower HP ceiling. Risk/reward is legible; interaction surface with other skills is clean.
- **`handleSkillSelect` HP clamp is unconditional.** A single post-selection `Math.min(newHp, effective.maxHp)` handles all three scenarios (max HP reduction, max HP increase, on-selection heal) without per-skill branching. Applied after stack increment and after heal (if any), so effective.maxHp always reflects the new stack count.

---

## Phase 4b — Smoke art wiring + animation rework

**Status:** Complete 🟢
**Commits:** 27657d1 (smoke art wired: 7-frame LightSmoke replaces Skia Circle) + b9ec3a6 (bloom-hold-dissipate animation) + 2438bb4 (fix: missing SMOKE_DURATION_MS import)
**Verification:** On device — smoke zone triggered. Animation: small wisp appears and grows to full dark-grey cloud over ~1s (bloom), holds as full cloud for ~2s, dissipates back to nothing over ~1s. Zone expires at 4s. Smoke slow applies throughout zone lifetime. No regressions on frag Explode animation or molotov fire patch.

### What was built

- `assets/effects/smoke/1-7.png`: 7-frame LightSmoke sequence sourced from `tds-pixel-art-modern-soldiers-and-vehicles-sprites.zip` (the soldiers kit, not the hero props pack — where the art had been all along). Frame 0 (`1.png`) = largest billow; frame 6 (`7.png`) = smallest wisp.
- `src/lib/sprites.ts`: `EffectSprites.smoke[0–6]` registered. "Phase 6 tech debt: no kit smoke sprite" comment removed — **closes smoke art sourcing tech debt (27657d1).**
- `src/data/gameConstants.ts`: `SMOKE_ANIM_FRAME_COUNT = 7`, `SMOKE_BLOOM_DURATION_MS = 1000`, `SMOKE_DISSIPATE_DURATION_MS = 1000`. `SMOKE_ANIM_FRAME_DURATION_MS` added then removed (phase-based logic doesn't use per-frame duration).
- `src/components/GameCanvas.tsx`: 7 `useImage` calls + `smokeImages[]`. 100ms timer computes per-zone frame via three-phase selector: bloom plays 6→0 over `SMOKE_BLOOM_DURATION_MS`, hold clamps to frame 0 for the middle 2000ms, dissipate plays 0→6 over `SMOKE_DISSIPATE_DURATION_MS`. Replaces `getCurrentFrame` looping call and the grey Skia `<Circle>` placeholder.

### Architectural decisions

- **Frame direction inverted from the investigation report's initial labels.** Frame 0 is the largest puff; the initial report labelled playback order as "big→small (dispersion)" which was correct, but the report also described the existing loop as starting with the biggest frame — making bloom require reverse playback (6→0). Confirmed on device after the art wiring commit.
- **Phase-based animation over looping `getCurrentFrame`.** A continuously looping smoke cloud reads as static magic smoke. Bloom-hold-dissipate reads as a real smoke grenade: puff appears, hangs, clears. The 100ms timer polling granularity (≤100ms jitter per frame transition) is acceptable — smoke transitions are slow enough that the jitter is imperceptible.

---

## Phase 4b — Final summary

All 20 v1 skills shipped: 10 stat-modifier skills from Phase 4a, plus 5 inline-effect skills (G1), Field Medic Kit on-selection heal (G2), Backpack revive charge (G3), and 3 throwable auto-throw skills (G5). The revive system extends runs past first death: one free revive via the Backpack skill, plus one ad revive per run. The throwable system is the engine's first multi-phase entity — spawn → arc flight → landing → detonation or zone effect — with three throwable types and two zone types each with distinct render paths. Runs now have multiple layers of strategic depth: stat compounding, weapon unlocks, burst skills, throwable cooldowns, and a death safety net. The smoke zone graduated from a grey Skia Circle placeholder to sourced kit art with a three-phase animation. Phase 4c picks up crates, crate drop mechanics, and the three crate-only weapon profiles (Shotgun, Grenade Launcher, Flamethrower) already stubbed in `weapons.ts`.

---

## Phase 4b — Post-commit: batch skill icon swap

**Status:** Complete 🟢
**Commits:** c5dbf34 (pilot: Comms Headset), 678d834 (batch: 19 remaining skills)

All 20 skill icons replaced with custom AI-generated 64×64 PNGs sourced via ChatGPT image gen and Adobe Express transparency processing. Comms Headset was the pilot to validate the workflow — confirmed the pipeline (ChatGPT → Adobe Express → transparent PNG → drop into assets/ui/icons/ → one-line registration in GuiSprites.skillIcons) before committing to the full batch. The remaining 19 followed in a single batch swap. Every skill now has a unique, purpose-made icon — no shared kit-asset placeholders remain anywhere in the 20-skill pool. Two icons (Stims, Painkillers) had near-zero fully-opaque pixel coverage flagged in pre-review; both rendered acceptably on device at modal display size.

**Closes:** All skill icon sourcing tech debt entries previously noted in `sprites.ts` (throwables Phase 7 sourcing audit, helmet/plate-carrier icon collision, backpack/Army_Box mismatch, comms headset Money_Small placeholder).

---

## Phase 4c — Crate weapons

**Goal:** Crate entities spawn in the world, player can walk into them for a weapon roll, and all three crate-only weapons (Shotgun, Rocket Launcher, Flamethrower) fire and feel distinct.

**Status:** 🟢 Complete

**Commits:** G1: 75dc967 | Fix: 68f5ef3 266fbd6 | G2: d6f1c1c | G3: 8c390b3 | Polish: cd2d2d8 5a29a3e 2daeffd a0b7e61 4eca404 | Close: cb8bddb

---

### G1 — Crate entity + world spawn logic

**Commit:** 75dc967

New engine module `crateEngine.ts` introduced. Crates are fixed-slot nullable entities (`Array<CrateState | null>`, cap = 3) following the same pattern as enemies and throwables. A crate spawns at a random position on the map every `CRATE_SPAWN_INTERVAL_MS` (12 000 ms); up to `CRATE_SLOT_COUNT` (3) crates may exist simultaneously. On each tick, `pickupEngine` checks player proximity — if the player touches a crate, it is removed from its slot and a pending-open flag triggers the reveal modal. Army Box sprite (`assets/ui/icons/Army_Box.png`) used for the crate visual, registered in `PickupSprites.crate`. A temporary verification button ("Open Crate") was added to `GameCanvas` to confirm the modal fires on demand before device testing.

**Post-G1 fixes:**
- `68f5ef3` — `CRATE_SLOT_COUNT` shrunk from 10 → 3 to match the intended active cap (the 10-slot JSX pre-allocation was wrong)
- `266fbd6` — PKM dropped from the weapon progression table (was unreachable as a crate weapon and had no stub in `weapons.ts`); `gp25` renamed to "Rocket Launcher" in `weapons.ts` for player-facing clarity

---

### G2 — Weapon roll table + crate reveal modal

**Commit:** d6f1c1c

New component `CrateRevealModal.tsx`. When a crate is opened, a weapon is rolled from the pool (`aks74u`, `ak74`, `svd`, `m870`, `gp25`, `rpo`) using uniform random selection — every crate weapon has equal probability. The modal displays:
- Weapon silhouette icon (kit HUD placeholder — one of three shared silhouettes; tech debt logged)
- Weapon name + fire-mode label
- Two buttons: **Equip** (swaps `equippedWeaponId`, closes modal, weapon is now active) and **Scrap** (closes modal with no change)

The Equip flow also resets ammo to the new weapon's `maxAmmo`. Scrap leaves the player's current weapon untouched. Modal dismissal is gated — no tap-outside-to-close; the player must pick a path. Weapon HUD icons registered in `GuiSprites.weaponHudIcons` (6 entries, 3 unique silhouette files from kit).

New constants added to `gameConstants.ts`: `CRATE_WEAPON_POOL`, `CRATE_REVEAL_ANIMATION_MS`, plus the weapon pool array.

---

### G3 — Activate 3 crate weapons

**Commit:** 8c390b3

Three weapons that previously existed only as stubs in `weapons.ts` are now fully active with distinct fire behaviors:

**Shotgun (m870 — 5-pellet spread)**
- On fire: spawns 5 projectiles simultaneously in a 30° fan (`SHOTGUN_SPREAD_DEG`)
- Each pellet is an independent `ProjectileState` with `isRocket: false`
- Angles distributed symmetrically: `baseAngle + (i/(count-1) - 0.5) * spreadRad` for i in 0–4
- Per-pellet damage is the same as the weapon's base damage; DPS is ×5 at point-blank, falls off with spread at range

**Rocket Launcher (gp25)**
- On fire: spawns one projectile with `isRocket: true`
- Rocket flies at standard projectile speed toward the aim point
- On collision with any enemy: AOE detonation at impact position (`ROCKET_AOE_RADIUS_PX = 60`) via `applyAOEDamage` (reused from throwable engine); enemies within radius take damage, money drops per kill
- Explosion effect zone (`'explosion'` type) spawned at impact — renders the 4-frame explode sprite sequence
- Projectile renderer: Skia `<Image>` instead of `<Circle>`, showing a 2-frame rocket body animation; rotated to direction of travel via `Math.atan2(vy, vx) + SPRITE_ROTATION_OFFSET`
- `SPRITE_ROTATION_OFFSET = -Math.PI/2`: TDS kit sprites face down by default; offset aligns body with direction vector
- Rocket assets: `assets/effects/rocket/1.png` and `2.png` (copied from `tds-modern-hero-weapons-and-props/rocket/`)
- `rpo.cooldownMs` bumped from 50 → 250ms to prevent frame-rate-dependent burst fire

**Flamethrower (rpo)**
- On fire: spawns 3 flame zones in a 45° cone (`FLAMETHROWER_CONE_DEG`) at `FLAMETHROWER_SPAWN_DISTANCE_PX = 50px` ahead of the player
- Each zone is a `'flame'` type `EffectZoneState` — DoT, 500ms duration, 3 HP/sec
- Renders the 7-frame kit flame animation (looping, `MOLOTOV_FIRE_FRAME_DURATION_MS` per frame) — same art as molotov fire zone
- No projectile spawned; the weapon fires instantaneously into zones with no bullet travel
- Zone spawning happens entirely in the `combatEngine` fire block via `spawnEffectZoneAt` (new export from `throwableEngine`)

**Infrastructure changes enabling G3:**
- `ProjectileState.isRocket: boolean` — discriminator field; renderer switches Circle → Image; collision loop branches into AOE
- `EffectZoneState.type` expanded: `'smoke' | 'molotov'` → `'smoke' | 'molotov' | 'flame' | 'explosion'`
- `applyAOEDamage` exported from `throwableEngine.ts` (was private) — reused by rocket AOE
- `spawnEffectZoneAt(state, type, x, y)` — new export from `throwableEngine.ts`; spawns a zone at an arbitrary position; used for flamethrower zones (fire block) and rocket explosion (post-collision pass)
- `EFFECT_ZONE_SLOT_COUNT` raised from 6 → 20 to accommodate simultaneous flame zones
- Rocket AOE processed in a post-collision pass (after `survivingEnemies` is finalized) to avoid double-killing enemies already transitioning to die animation
- `GameCanvas` 100ms timer bridges `projIsRocket[]` and `rocketFrame` from SharedValue to React state for conditional render

**Asset inventory (new this phase):**
- `assets/effects/rocket/1.png` — rocket body frame 1 (from TDS kit `tds-modern-hero-weapons-and-props/rocket/rocket1.png`)
- `assets/effects/rocket/2.png` — rocket body frame 2 (from TDS kit `tds-modern-hero-weapons-and-props/rocket/rocket2.png`)

---

### Architectural decisions

- **`isRocket` as a projectile-level discriminator, not a weapon-level flag.** Weapon type is available on `GameState` but the per-projectile flag keeps the renderer stateless — it never has to cross-reference weapon data to decide Circle vs. Image. This also handles edge cases where the player switches weapons while a rocket is in flight.
- **Rocket AOE after die-animation cleanup.** The collision loop marks enemies as dying first; then `survivingEnemies` is the correct input to the AOE pass. Processing AOE inline in the collision loop would double-kill enemies already set to `dying` in the same tick.
- **`spawnEffectZoneAt` extracted vs. inline zone mutation.** The flamethrower fires 3 zones in a single tick (all from the fire block, not the collision loop). Extracting the worklet allowed chaining: each call returns a new state slice that the next call reads — no raw array mutation inside a worklet.
- **Flamethrower renders kit flame art.** The molotov fire zone and the flamethrower cone zone use the same `'flame'` type and the same 7-frame animation. This is intentional — same fire, different delivery mechanic. Phase 6 can differentiate if needed.
- **rpo cooldownMs 50 → 250ms.** At 50ms (same as the machine gun), the flamethrower was firing 20 zone-triples per second, saturating the zone slot pool in one trigger hold. 250ms gives 4 fires/sec — still responsive, zone pool stays healthy.
- **World-spawned crates (time-based, not enemy-tied).** Tarkov-flavored loot identity: weapons are found in the world, not dropped by enemies. Vampiric-drop systems reward kill streaks; world-spawn crates reward map awareness and positioning.
- **3-slot crate array exactly matches the active cap.** Unlike other entity types (projectiles, throwables, zones, pickups) which over-allocate slots beyond the realistic active count, the crate array is sized exactly to `CRATE_MAX_ACTIVE = 3`. Crates are long-lived (12s spawn interval, no expiry), so the realistic maximum equals the cap.
- **Auto-weapon-upgrade at L4/L8/L16 scrapped mid-phase.** The mechanic was implemented in Phase 4a G4 and removed in Phase 4c (2daeffd). It was a Base44 holdover — guaranteed progression unlocks fit a linear action game, not a Tarkov-style loot-driven game. Removing it while Phase 4c was still in progress kept the design coherent: crates are now the sole weapon source, and every weapon found is a player choice.
- **Custom AI-sourced sprites for all 7 weapons.** Closes the kit silhouette duplicate-icon tech debt from Phase 4c G2. Pistol added to `weaponHudIcons` for completeness (was missing from the original 6-weapon registration).
- **Crate visual uses kit Army_Box.png.** Already imported as `PickupSprites.crate` (no new sourcing required). The military crate aesthetic matches the Tarkov-flavored identity.

---

## Phase 4c — Post-G3 polish + tuning

**Status:** 🟢 Complete
**Commits:** cd2d2d8 | 5a29a3e | 2daeffd | a0b7e61 | 4eca404 | cb8bddb
**Verification:** On device. All six commits shipped and tested together as a polish pass after G3 verification.

### Flamethrower: directional jet sprite + cone direction fix (cd2d2d8)

Device testing found two bugs: zones rendered at a fixed downward angle regardless of aim direction, and the visual read as a static fire blob rather than a jet.

**Root cause:** `EffectZoneState` had no `rotation` field. Zone positions were correct (spawning in the right cone direction), but the sprite had no per-zone rotation — it always faced kit-default (downward). The `Effects/Flamethrower/1-7.png` frames are directional jet sprites (thin elongated blue ignition spark → orange teardrop flame), confirmed by direct image inspection. The Molotov zone uses `explodeImages[2]` (static Explode frame 3 peak-bloom) — not the flame frames — so no Molotov regression.

**Fix:** Added `rotation: number` to `EffectZoneState` (required, `0` for all non-directional types). `spawnEffectZoneAt` accepts an optional `rotation` param (default 0). The `rpo` fire block in `combatEngine` passes each zone's exact cone angle as its rotation. The `'flame'` zone renderer wraps sprites in a `<Group transform={[translateX, translateY, rotate: rotation + SPRITE_ROTATION_OFFSET]}>`. DoT tick update objects in `throwableEngine` propagate `rotation: zone.rotation`.

### Flamethrower damage tuning (5a29a3e)

`FLAMETHROWER_ZONE_DAMAGE_PER_SEC`: 3 → 35. Three zones simultaneously at point-blank delivers ~105 effective DPS — enough to melt a Raider (40 HP) in under half a second. Justified by the Legendary tier and very short range.

### Drop auto-weapon-upgrade at L4/L8/L16 (2daeffd)

`WEAPON_UNLOCK_MAP` constant and its call-site lines removed from `GameCanvas.tsx`. The guaranteed upgrade mechanic was a Base44 holdover inconsistent with the Tarkov identity. Player starts on Pistol and stays there until they choose to equip from a crate. All weapon profiles remain intact in `weapons.ts`.

### Weapon sprite swap: 7 custom AI-sourced weapon HUD icons (a0b7e61)

All 7 weapon HUD icons replaced with custom AI-sourced PNGs (64×64 for Pistol and SMG; 80×80 for the remaining five). `pistol` entry added to `GuiSprites.weaponHudIcons` (was missing). Kit silhouette placeholders (`SMG_HUD.png`, `MG_HUD.png`, `Pistol_HUD.png`) removed from `weaponHudIcons`. **Closes CrateRevealModal weapon icon tech debt from Phase 4c G2.**

### Flamethrower range tuning + crate modal icon (4eca404)

- `FLAMETHROWER_SPAWN_DISTANCE_PX`: 50 → 75 px
- `FLAMETHROWER_ZONE_RADIUS_PX`: 25 → 35 px
- `CrateRevealModal` weapon icon: 80×80 → 120×120 with `marginBottom: 4`

### Debug scaffold cleanup (cb8bddb)

Removed `handleSpawnCrate` callback, its JSX button, and three now-unused imports (`CRATE_SLOT_COUNT`, `CRATE_MAX_ACTIVE`, `CRATE_SPAWN_MARGIN_PX`). Remaining debug scaffolding (weapon cycle button, overlay TODO comments) stays until Phase 7 HUD pass.

---

## Phase 4c — Final summary

The world-spawn crate system enables the player to find weapons throughout a run, with a tier-weighted roll and EQUIP/SCRAP choice on each reveal. Three crate-only weapons bring distinct combat archetypes: Shotgun (5-pellet spread — best clearing tightly packed groups), Rocket Launcher (AOE detonation with kit rocket sprite — clears clusters at medium range), and Flamethrower (directional DoT cone with rotation-correct jet sprite — close-range king at 105 DPS). Combined with the removal of auto-upgrade at L4/L8/L16, the weapon progression is now entirely player-driven through loot — you use what you find. Phase 4 is closed; Phase 5 (maps + vehicle enemies + ranged enemy fire + sniper turrets) is next.

---

## Phase 4 — Close

Phase 4 transformed the engine from a static survival loop (Phase 3) into a fully realized roguelite-progression-with-Tarkov-loot hybrid. The complete feature set shipped across 4a/4b/4c: 20 skills across 5 categories with random level-up draws; a revive system with free-charge and ad-backed paths; a multi-phase throwable system with arc flight, detonation, and directional zone effects; a world-spawn crate drop system with tier rolls, EQUIP/SCRAP choice, and 7 weapons each with distinct combat archetypes; and custom AI-sourced art across the entire skill and weapon icon set. The engine is now the intended game — progression, risk/reward, and loot-driven identity are all in place. Phase 5 adds the world.

---

## Phase 5 — Maps + obstacles + vehicle enemies

**Goal:** Three hand-authored maps (Compound, Outskirts, Treeline) with tile rendering, map select screen, obstacle placement and collision, all 8 enemy types working including Humvee/BTR/Panzer/ACS vehicle enemies.

**Status:** Not started

---

## Phase 6 — Audio + atmospheric effects

**Goal:** Audio engine fully implemented (music + SFX channels), all 25 SFX wired and playing, 4 music tracks looping correctly, fog-of-war, weather per map, vignette, explosion and smoke effects rendering.

**Status:** Not started

---

## Phase 7 — UI + persistence + analytics

**Goal:** Polished main menu, settings panel with volume sliders, pause menu, game over screen with stats, persistence (high score, total kills, etc.), minimap, PostHog analytics events firing.

**Status:** Not started

---

## Phase 8 — Helicopter boss + hazards

**Goal:** Helicopter boss spawning every 2 minutes with both phases (normal + enraged), Gas Bomb hazard randomly spawning, Bomber strafe events between bosses, hero death animation polish.

**Status:** Not started

---

## Phase 9 — Monetization + store submission

**Goal:** AdMob integrated (rewarded ads + menu banner), Support the Dev IAP working, revive prompt on death, App Store and Google Play submission packages prepared.

**Status:** Not started

---

## Decisions Log

Major decisions made during development that override or clarify the v3 doc.

| Date | Decision | Why | Affects |
|---|---|---|---|
| 2026-05-08 | `babel.config.js` is required with `react-native-worklets/plugin` | Empirical — app crashed on device without it once Skia was added. `babel-preset-expo` does not auto-register the worklets plugin when Skia is present. | All future phases that use Skia rendering or Reanimated worklets (i.e., all of them) |
| 2026-05-08 | Switched from Expo Go to EAS development build for device testing | Expo Go's bundled native binaries are incompatible with Reanimated v4 + react-native-worklets + Skia v2.2.x. Empirically confirmed in Phase 2 G1 — crashes on startup unfixable from JS side. | All dev workflow going forward: use `eas build --profile development --platform android` once, then `npx expo start --dev-client` |
| 2026-05-08 | Removed `expo-in-app-purchases`, Phase 9 will use `react-native-iap` | Package imports removed `expo-modules-core` APIs (`ExportedModule`, `ExpoMethod`) — fails to compile against SDK 54. EAS dev build failed because of it. `react-native-iap` was already the v3-documented fallback. | `lib/monetization.ts` (Phase 9 wiring) — interface unchanged |
| 2026-05-08 | Native dep added → must rebuild dev client APK before testing | Fabric crashes with `IllegalViewOperationException` if a native module (e.g., `react-native-safe-area-context`) is added after the APK was built. JS hot-reloads; native ViewManagers do not. Discovered in Phase 2 G2. | All phases that add native packages (6, 9 especially) |
| 2026-05-08 | Adopt Native Dependency Hygiene workflow | Phase 2 hit two integration issues (expo-in-app-purchases incompat, SafeAreaProvider Fabric mismatch) that pre-flight checks would have caught | All future phases that touch package.json native deps |

---

## v3 Errata

> **Important for any AI session reading this document:** when v3 context doc and this progress log conflict on technical details, this progress log wins. The v3 doc reflects pre-build planning; this log reflects what actually shipped.

### 1. Skia plugin in app.json

- **v3 says:** `@shopify/react-native-skia` should be added to the `plugins` array in `app.json` (implied by the Phase 1 Setup Commands and file structure sections).
- **Reality:** In Expo SDK 54 with Skia v2.2.x, this is no longer required. Skia auto-configures via Expo's autolinking. Adding it manually to `plugins` causes a fatal error (`eas build:configure` fails with "Unable to resolve a valid config plugin for @shopify/react-native-skia").
- **Why:** Skia v2.2.x does not ship an `app.plugin.js` file. The config plugin mechanism was used in older versions.
- **Action for future sessions:** Do NOT add `@shopify/react-native-skia` to `app.json` plugins. The only plugin entry in `app.json` should be the AdMob plugin. Verified: Phase 1's working `app.json` has only the AdMob plugin.

### 2. Reanimated babel plugin — CORRECTED in Phase 2 G1

- **v3 says:** A `babel.config.js` containing `react-native-reanimated/plugin` should be created (implied by the tech stack section).
- **Original Phase 1 errata said:** Do NOT create a `babel.config.js` — Reanimated v4 + Expo SDK 54 handles it automatically via `babel-preset-expo`.
- **Reality (discovered empirically in Phase 2 G1):** The original Phase 1 errata is WRONG once `@shopify/react-native-skia` is in the project. Skia's worklet integration requires the Reanimated worklets babel plugin to be explicitly registered. Without it, the app crashes on device with: `[runtime not ready]: Error: react-native-reanimated is not installed!`
- **Why:** `babel-preset-expo` does not auto-register the worklets plugin when Skia is present. The plugin must be declared explicitly.
- **Plugin name:** In Reanimated v4, the worklets plugin was extracted into a separate package `react-native-worklets`. Installed version: `0.8.3`. The plugin entry point is `react-native-worklets/plugin` (resolves to `node_modules/react-native-worklets/plugin/index.js`). The old `react-native-reanimated/plugin` string does NOT exist in this version.
- **Root component side-effect imports (discovered empirically in Phase 2 G1 hotfix continuation):** Even with `babel.config.js` correct, the app still crashes unless `src/App.tsx` (the root component) begins with these two side-effect imports, in this order, before any other import:
  ```typescript
  import 'react-native-reanimated';
  import 'react-native-gesture-handler';
  ```
  Skia's worklet integration lazy-requires Reanimated at runtime. Without an explicit upstream import, that lazy require throws `OptionalDependencyNotInstalledError` even though the package is installed. Gesture handler is imported here too so it's initialized before any drag/pan gesture handlers are registered (Phase 2 G3+).
- **Action for future sessions:** `babel.config.js` EXISTS at project root and MUST be preserved. Do not delete it. `src/App.tsx` MUST begin with the two side-effect imports above before any Skia or other imports. Both are engine boilerplate — future template games (game #2+) inherit this pattern. If upgrading Reanimated, verify the plugin path in `babel.config.js` hasn't changed before editing.

### 4. Expo Go incompatibility with Reanimated v4 + Skia

- **v3 says:** Develop and test with Expo Go on device (implied by Phase 1 setup — "Expo Go installed on phone").
- **Reality (confirmed empirically in Phase 2 G1):** Expo Go is incompatible with this project's native module set. Expo Go ships with a fixed snapshot of native binary modules compiled in. Reanimated v4 + Worklets + Skia use TurboModule/JSI signatures that don't match Expo Go's bundled versions, causing crashes on startup that cannot be fixed from the JS side.
- **Why:** Any project using Reanimated v4, react-native-worklets, or @shopify/react-native-skia requires its own compiled native binary. Expo Go cannot provide this — it's a known, documented incompatibility in the Expo ecosystem.
- **Action for future sessions:** This project uses a **custom EAS development build**, not Expo Go. The dev workflow is:
  1. Build once: `eas build --profile development --platform android` (queues on EAS cloud, ~10 min, produces an installable APK)
  2. Install the APK on device (enable "Install from unknown sources" when prompted)
  3. Develop: `npx expo start --dev-client` (Metro server, hot reload works normally)
  - The installed dev client app replaces Expo Go for this project. Rebuild it only when native dependencies change. JS-only changes hot-reload as normal.
- **Future template games (game #2+):** Inherit this requirement. Any game using Skia + Reanimated needs a dev client build.

### 3. AdMob placeholder format

- **v3 says:** Use `'ca-app-pub-PLACEHOLDER/PLACEHOLDER'` for AdMob unit IDs (unit IDs and app IDs treated the same).
- **Reality:** Two separate placeholder patterns are in use:
  - **App IDs** (in `app.json` plugins, used by the SDK at initialization): Google's official test IDs — `ca-app-pub-3940256099942544~3347511713` (Android) and `ca-app-pub-3940256099942544~1458002511` (iOS). All-zeros placeholders risk failing SDK initialization since the AdMob SDK initializes at app startup before any stub code runs.
  - **Unit IDs** (in `lib/monetization.ts`, only called when ads are shown): `'ca-app-pub-PLACEHOLDER/PLACEHOLDER'` with `// TODO: Replace in Phase 9` comments.
  - A `_phase9_todo` field is also present in the `app.json` AdMob plugin config as a JSON-compatible search marker.
- **Why:** App IDs and unit IDs serve different purposes. App IDs must be valid at the native layer; unit IDs are only passed when ads are actually requested (Phase 9).
- **Action for future sessions:** In Phase 9, search for both `_phase9_todo` AND `// TODO: Replace in Phase 9` to find every spot needing real AdMob credentials. Replace app IDs in `app.json` and unit IDs in `lib/monetization.ts`.

### 7. react-native-safe-area-context SafeAreaProvider not registering in New Architecture build

- **Reality (discovered in Phase 2 G2):** `RNCSafeAreaProvider` (the native ViewManager for `<SafeAreaProvider>`) is NOT present in the ViewManagerRegistry despite the package being installed and the dev client being rebuilt. `RCTSafeAreaView` (the plain `<SafeAreaView>`) IS registered. This is a partial JS-vs-native mismatch — likely a version drift introduced when `npx expo install react-native-safe-area-context` updated the JS side after the first dev client APK was built.
- **Symptom:** `IllegalViewOperationException: Couldn't find ViewManager named 'RNCSafeAreaProvider' nor 'RCTRNCSafeAreaProvider' in ViewManagerRegistry` at app startup whenever `<SafeAreaProvider>` is rendered.
- **Workaround (Group 2):** Removed `<SafeAreaProvider>` from `App.tsx`. Debug overlay in `GameCanvas.tsx` uses hardcoded inset values (`top: 50, right: 10`) with a TODO comment. Package left in `package.json` — the native side is in the APK.
- **Action for Phase 7:** Before relying on `<SafeAreaProvider>` or `useSafeAreaInsets` for real HUD positioning, verify that `RNCSafeAreaProvider` appears in the ViewManagerRegistry. A fresh dev client rebuild at that point may resolve it incidentally.
- **Future template games (game #2+):** Install `react-native-safe-area-context` in the initial scaffold before the first dev client build to avoid the version drift.

### 6. Adding native modules requires rebuilding the dev client APK

- **Reality (discovered in Phase 2 G2):** The dev client APK is a compiled native binary. Native ViewManagers and TurboModules are compiled into it at build time — they are NOT hot-reloaded with JS. When a new package with native code is added (e.g., `react-native-safe-area-context` was added in G2 after the G1 dev client was built), the existing APK doesn't contain its native side. Fabric crashes on startup with `IllegalViewOperationException` citing the missing ViewManager by name (e.g., `RNCSafeAreaProvider`).
- **Symptom:** `IllegalViewOperationException: ... 'RNCSafeAreaProvider' in ViewManager...` (or similar missing native module name) at app startup.
- **Action for future sessions:** Any time a new native dependency is added (`npx expo install <package>`), the dev client APK must be rebuilt before testing on device: `eas build --profile development --platform android`. JS-only packages (no native code) can be tested immediately via hot reload without rebuilding.
- **Packages added in each phase that will require a rebuild:**
  - Phase 6: audio deps (`expo-av` already in APK from Phase 1 scaffold — verify before assuming)
  - Phase 9: `react-native-iap`, any new AdMob deps
- **Future template games (game #2+):** Same rule applies. Budget one rebuild per phase that adds native deps.

### 5. expo-in-app-purchases incompatible with Expo SDK 54

- **v3 says:** Install `expo-in-app-purchases` in Phase 1, configure in Phase 9 (with `react-native-iap` as a fallback if SDK 54 compat issues).
- **Reality (confirmed during Phase 2 EAS dev build):** `expo-in-app-purchases` fails to compile against `expo-modules-core` 3.x (shipped with SDK 54). It imports `expo.modules.core.ExportedModule` and `expo.modules.core.interfaces.ExpoMethod`, both removed in the new architecture. The EAS cloud build fails at the Android compile step.
- **Why the fallback existed in v3:** v3 anticipated this risk and named `react-native-iap` as the alternative. That alternative is now the plan.
- **Action:** Package removed in Phase 2 hotfix via `npm uninstall expo-in-app-purchases`. The `lib/monetization.ts` interface is unchanged — Phase 9 will install `react-native-iap` and wire it through `purchaseSupport()` / `isSupportUnlocked()`. No other files reference the old package.
- **Future template games (game #2+):** Do NOT install `expo-in-app-purchases`. Use `react-native-iap` from the start.

---

## Asset Inventory Status

Per-asset tracking of what's been imported and where it lives in the project.

| Asset Category | Status | Location in Project | Notes |
|---|---|---|---|
| Hero sprites | 🟡 Imported, pending device verify | `assets/sprites/hero/` — 31 PNGs across walk/die/pistol/rifle/machinegun/grenade_launcher/flamethrower | Phase 2 G1 |
| Foot soldier sprites | ⚪ Not imported | | Phase 3 |
| Specialist enemy sprites | ⚪ Not imported | | Phase 5 |
| Vehicle enemy sprites | ⚪ Not imported | | Phase 5 |
| Helicopter boss sprites | ⚪ Not imported | | Phase 8 |
| Tilesets | ⚪ Not imported | | Phase 5 |
| Obstacles (props) | ⚪ Not imported | | Phase 5 |
| Civilian vehicles (kit 2) | ⚪ Not imported | | Phase 5 |
| Pickups | ⚪ Not imported | | Phase 4a |
| Weapon crate | ⚪ Not imported | | Phase 4b |
| Effects (explosions, smoke, flames) | 🟡 Partial | explode (4f), flame (7f), smoke (7f) imported; full Phase 6 polish TBD | Phase 6 |
| GUI assets | ⚪ Not imported | | Phase 7 |
| App store icons | ⚪ Not imported | | Phase 9 |
| Music tracks | ⚪ Not sourced yet | | Phase 6 |
| SFX library | ⚪ Not sourced yet | | Phase 6 |

---

## Open Questions / Parking Lot

Things to revisit but don't block current phase.

- App display name — "Shoot Your Way Out" full name? Shortened for icon?
- Logo design — replace `Test Logo.png` in loading screen with what?
- Specific music track licensing per source
- Bundle identifier — `com.osburnlabs.shootyourwayout` or different?
- Will we use haptic feedback in v1 or defer to v1.1?

