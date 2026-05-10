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
| 4a — Stat skills + level-up | ⚪ | | | | |
| 4b — Ability skills + crates | ⚪ | | | | |
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

**Goal:** XP gems collected, level-up modal opens (using kit Upgrade Preset), 10 stat-modifier skills selectable, weapon progression unlocks at levels 4/8/12/16.

**Status:** Not started

---

## Phase 4b — Ability skills + crates

**Goal:** 10 ability skills (grenades, molotovs, smoke grenades), throwable system with area effects, crate drop system from enemies, crate reveal animation, weapon swap logic.

**Status:** Not started

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
| Effects (explosions, smoke, flames) | ⚪ Not imported | | Phase 6 |
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

