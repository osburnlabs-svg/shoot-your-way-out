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
| 4a — Stat skills + level-up | 🟢 Complete | 2026-05-10 | G1: c4daad8 G2: a095517 G3: f297b4b G3-polish: 461b25b→d90aedf→ba505fc G4: ee7f7d5 G4-cleanup: 5690324 | G1 ✅ G2 ✅ G3 ✅ G4 ✅ | Full progression loop closed. G4: weapon unlocks L4/8/12/16 + all 7 weapon renames (pkm removed Phase 4c G2) |
| 4b — Ability skills + crates | 🟢 Complete | 2026-05-10 | G1: 5411988 Slot-fix: 8ff2533 G2: 18b44e3 G3: e2a1deb G4: 8c31b42 G4-polish: 9cb7762 G5: b4091c6 Smoke: 2438bb4 | G1 ✅ G2 ✅ G3 ✅ G4 ✅ G5 ✅ | All 20 v1 skills shipped; throwable system; revive; bloom-hold-dissipate smoke animation |
| 4c — Crate weapons | 🟢 Complete | 2026-05-11 | G1: 75dc967 Fix: 68f5ef3 266fbd6 G2: d6f1c1c G3: 8c390b3 Polish: cd2d2d8 5a29a3e 2daeffd a0b7e61 4eca404 Close: cb8bddb | G1 ✅ G2 ✅ G3 ✅ | World-spawn crates; weapon roll + reveal modal; Shotgun/Rocket Launcher/Flamethrower active; custom weapon icons; debug scaffold cleaned up |
| 5 — Maps + obstacles + vehicle enemies | 🟢 Complete | 2026-05-13 → 2026-05-17 | G1: 99bf87d→3c17fac G2: 86c1a33→44cb822 G3: 6ed8a3c→b391493→30fb59c→2c04ed9→656fddf→c979729→93bc790→289a832→f9c30e7→74b6376→a311bdb→c3450b7 G4: 81a0cbd→832828a→1e94df5→ee1e503→345c364→eb0ceec→384566a→fb1f99d→1029ab4→40cb8bb→5937a47→d18dc5a G5: 25bdb9f→6b97271→4a0ccec→338f884→5cf5883→7c05592 Flyover: 7bac617→1677616→e985445 | G1 ✅ G2 ✅ G3 ✅ G4 ✅ G5 ✅ Flyover ✅ | G5 tank turret (ACS + Panzer, genuine rocket fire); ambient helicopter flyover system |
| 5.5 — Gameplay completion | 🟢 Complete | 2026-05-17 → 2026-05-19 | 67c0bfb aeb1d8c 5a342e5 c3a86d6 3d1fc57 623f4bd 745cb70 23fe135 6fff044 4c43cba 92dab24 28ab327 b1fe4c8 | Yes (all features device-tested) | Stutter fixed (30fps cap); hero auto-rotation; muzzle flash; weapon rarity tiers; 5 skill clones; 25-skill pool |
| 6 — Audio + atmospheric effects | ⚪ | | | | |
| 7 — UI + persistence + analytics | ⚪ | | | | |
| 8 — Helicopter boss + hazards | ⚪ | | | | |
| 9 — Monetization + store submission | ⚪ | | | | |

---

## Open Issues / Tech Debt

| Issue | Discovered | Workaround | Must resolve by |
|---|---|---|---|
| SafeAreaProvider native ViewManager not registering on Fabric — react-native-safe-area-context's `RNCSafeAreaProvider` is missing from the New Architecture build despite the package being installed | Phase 2 Group 2 | Hardcoded inset values in DebugOverlay (`top: 50, right: 10`) | Phase 7 — HUD requires real safe-area awareness for notch / dynamic island / home indicator |
| **Player world-bounds clamping + camera edge-clamping not implemented** — player can walk off the map edge; camera follows into void. Deferred from G1 because the artifact is invisible until tiles render (currently open space looks the same as void). | Phase 5 G1 (deferred to G2) | Not visible without tiles | Phase 5 G2 — add player position clamp to world bounds and stop the camera from scrolling past world edges |
| **Debug overlay** — plain RN `<Text>` lines for HP/Score/XP/Level + Enemies/Kills/Time/Frame; hardcoded safe-area offsets; not kit assets | Phase 2 G2 (extended through Phase 3 and 4a G1) | Hardcoded `top: 50, right: 10` in `GameCanvas.tsx`; extended in each phase as new fields arrive | Phase 7 — replace with kit HUD assets: `HUD/CHARACTER HUD/HP ARMOR AMMO HUD.png`, `HUD/MONEY PANEL/Money Panel HUD.png`, `HUD/WEAPON ICONS/` per equipped weapon, bottom-center XP bar with current level; safe-area insets via real `useSafeAreaInsets` once SafeAreaProvider is fixed |
| **Level-up modal typography is RN default font** — all text in `LevelUpModal.tsx` (skill name, level, description) renders in the system default font | Phase 4a G3 polish | RN default font with kit color palette (`#ffffff` names, `#ffd700` level, `#d0d0d0` desc) | Phase 7 — UI typography pass picks a pixel font and applies consistently across modal, HUD, menus, and YOU DIED overlay (all default-font text is pending replacement in Phase 7, so current consistency is acceptable in the interim) |
| ~~**Open question: kit UI fit vs. custom UI**~~ — **Resolved 2026-05-12. See entry below.** Decision locked: kit UI abandoned for v1, custom UI throughout. | Phase 4a G3 polish | — | ✅ Closed — decision made |
| **Hit flash visual tuning** — `HIT_FLASH_RADIUS_PX = 7` (~1/3 of `ENEMY_COLLISION_RADIUS_PX`) is a starting point, not a validated value | Phase 4a G3 polish | Constant in `gameConstants.ts`, one-line tune on device | When device testing confirms feel is right; remove from tech debt once Mo signs off on the radius |
| **Debug cycle button mutates `weaponPose` only — not `equippedWeaponId`** — cycling the button changes the hero animation pose but combat stats (damage, cooldown, range) remain from the previously equipped weapon. The button face is therefore an unreliable indicator of which weapon is actually equipped. | Phase 4a G4 | Button is for visual debugging only; weapon floor unlocks (G4) correctly set both fields | Phase 7 — cycle button is removed entirely when the real HUD weapon icon lands. Do not use the cycle button face to verify weapon equip state. |
| **Kit UI → custom UI rebuild (Phase 7)** — Kit UI abandoned for v1. Decision locked 2026-05-12. Evidence: (1) BG.png has weapon silhouettes baked into all 9 slot frames — not separable; forced BG.png crop was a workaround, not a fit. (2) ReviveModal could not use kit Mission Failed art (wrong composition for mid-run prompt). Two kit UI failures before Phase 7 is enough. **Decision:** Phase 7 builds all UI custom — modal panels, HUD, menus, game-over screen — using kit color palette (`#0a0d08`, `#c9a356`, `#cc3333`) and pixel font, not kit layout PNGs. Kit GUI assets remain registered in `GuiSprites` as reference but will not be used as primary layout panels in v1. | Phase 4a G3 polish (updated Phase 4b G3; **decision locked 2026-05-12**) | Custom `<View>` layouts with kit color palette (already the pattern in LevelUpModal, ReviveModal, CrateRevealModal) | **Phase 7 — planned rebuild.** Not an open question. |
| **UI-thread worklet GC allocation churn (Phase 9 tech debt)** — `updateGameState` and all tick functions follow an immutable-update pattern: every frame creates ~10 new `GameState` objects, ~50–100 `EnemyState` objects, and ~12 intermediate arrays (6–50 slots each) on the Reanimated UI-thread heap. At 60fps this is ~36,000–60,000 objects/second. Produces periodic UI-thread GC pauses (~2–4ms) that contribute to residual stutter after the JS-thread fix. Root cause: object-spread style (`{ ...state, ... }`) used throughout `gameEngine.ts`, `enemyEngine.ts`, `combatEngine.ts`, `pickupEngine.ts`, `throwableEngine.ts`. Fix requires rewriting all tick functions to mutate a single stable `GameState` buffer in place — structural change touching every engine file. **Deferred to Phase 9** (same window as texture atlasing and spatial partitioning) once the full asset list is locked and the engine is feature-complete. Do not mix this refactor with feature work. Per-engine allocation breakdown: `gameEngine` ~10 `GameState` objects/frame; `enemyEngine` ~50–100 `EnemyState` objects/frame; `combatEngine` ~6 intermediate arrays (50 slots each) + per-projectile objects/frame; `pickupEngine` `.slice()` per frame; `throwableEngine` intermediate arrays/frame. | Phase 5 G2 Step 3 stutter investigation (2026-05-14) | Stutter bounded/accepted for v1 | Phase 9 — engine-wide mutable-state refactor |
| **Projectiles still use compact array pattern** — pickups were converted to fixed-slot `Array<PickupState \| null>` in Phase 5 G1 (commit d01b341) as part of the stutter investigation. Projectiles remain compact. No reported stutter; deferred because the pickup fix should ship in isolation. | Phase 4b G4 (pickups resolved Phase 5 G1) | No user-visible impact; entity counts bounded | Post-launch template cleanup pass |
| **Rocket exhaust trail frames not wired** — TDS kit ships 3 exhaust-trail frames (`rocket-f1/f2/f3.png`) alongside the 2 body frames. Only the body animation (1–2 frame loop at 100ms) is wired in Phase 4c G3. Exhaust trail compositing skipped for v1. | Phase 4c G3 | 2-frame body loop is readable at game scale; exhaust trail is visual polish | Phase 6 — atmospheric effects pass is the natural home for exhaust trail; schedule with muzzle flash and smoke compositing |
| **Weapon selector / inventory not yet implemented** — player currently has one active weapon at a time; EQUIP simply swaps it. Must-have for v1. Design: `weaponInventory: WeaponId[]` on `PlayerState` (starts `['pistol']`), EQUIP appends if not already present and sets active, HUD shows inventory as tappable icon strip. Duplicate EQUIP: switch active only, no second copy added, no score/XP given. SCRAP unchanged (+50 score +25 XP). No carry cap, no drop modal, no quick-select wheel — just tap-to-swap. | Phase 4c close | Active weapon swap works; inventory strip not built | Phase 7 — implement alongside HUD rewrite |
| **Auto-weapon-upgrade alternative design** — current design leaves Pistol as the starter with crates as the sole weapon source. If unlucky-crate-run feels punishing on player testing, a future option is a player-choice modal at L4/L8/L16 ("new weapon available — equip or keep current?"). No fix planned; logged for design awareness. | Phase 4c (dropped 2daeffd) | Crates are sole source — player starts on Pistol | Design review after Phase 5 playtesting |
| **Muzzle flashes + bullet origin correction** — kit ships muzzle flash frames for every weapon archetype in `Effects/` (Pistol Shot/, Rifle Shot/, MachineGun Shot/, Grenade Launcher Shot/). Not wired. Adding them also requires fixing bullet spawn origin: currently player center, not gun barrel tip. Bundle both fixes into a single Phase 6 polish commit. | Phase 4c (identified during G3 review) | Bullets emanate from player center; no muzzle flash | Phase 6 — atmospheric effects + polish pass |
| **Pistol and SMG weapon icons at 64×64 vs others at 80×80** — the custom weapon sprite batch shipped with Pistol.png and SMG.png at 64×64, the other five at 80×80. Causes slight size mismatch in the crate modal icon. Low priority. | Phase 4c weapon sprite swap (a0b7e61) | `resizeMode="contain"` handles it acceptably | Future sprite work — re-source at 80×80 or accept variance |
| **`persistence.ts` `highScorePerMap` stale type + getter** — `HighScorePerMap` type and its getter still reference `{ compound, outskirts, treeline }` keys. Dropped from persistence schema in context v3 update (13066f1) but not yet removed from code. | Docs update 2026-05-12 | Key is never written or read by any live game code yet (persistence not wired until Phase 7) | Phase 7 — persistence implementation pass; remove `HighScorePerMap` type, drop `highScorePerMap` getter entirely |
| **[F] CC context bloat from large source files** — `GameCanvas.tsx` alone is ~30k tokens and responsible for an estimated 40–50% of per-prompt CC token cost. Other large files (`gameEngine.ts`, `combatEngine.ts`, `enemyEngine.ts`, `mapGenerator.ts`) contribute additional cost. Forces CC to load extensive context per prompt, causing slow response times and frequent auto-compaction (50k+ tokens/turn, sessions auto-compacting every 1–2 turns). Two mitigation paths to evaluate: (a) **targeted split** — separate `GameCanvas.tsx` derived-value hooks and timer logic into dedicated files, roughly halving its token cost (recommended, Phase 5.5 window between G3 and G4); (b) **full code-organization pass** — split all engine files into focused modules, larger investment, deferred to Phase 6. CC self-identified workflow improvement: use Grep + offset-limited Reads instead of full-file reads; apply this discipline going forward. | Phase 5 G3 session (2026-05-14) | Accept cost for now; token burn confirmed | Phase 5.5 — evaluate targeted split before G4 begins |
| **[G] resolveAABB rotated-wreck AABB approximation** — Helicopter and bomber rotation produces ~1.4× phantom collision zone due to AABB-on-rotated-sprite (unrotated box used for rotated visual). Per-asset scale overrides compensate visually but the underlying math limitation remains. Accepted for v1. OBB (oriented bounding box) deferred indefinitely. | Phase 5 G3 (2026-05-14) | Per-asset COLLISION_SCALE_OVERRIDES shrink to roughly match visible silhouette | Deferred indefinitely — acceptable for v1 |
| **[H] useImage diagnostic instrumentation timing** — `useImage` returns null synchronously on first render; the image resolves async via Skia's internal loader. Diagnostic logs that read the `useImage` return value at mount always report null. Always wrap useImage diagnostic reads in `useEffect` or a delayed `setTimeout`. Helicopter-rendering false alarm in G2 was the original example; confirmed pattern in G3. | Phase 5 G2 helicopter false alarm (2026-05-14) | None — awareness note only | Pattern established; no code change needed |
| **`theme.ts` per-map tint keys (compound/outskirts/treeline) stale** — `mapTints` object still has three named map keys. Should become a per-run weather-driven tint (rain/dust/leaves/clear) to match the procedural generator. | Docs update 2026-05-12 | Tint values are not read at runtime yet | Phase 5 G2 — procedural generator color/atmosphere pass; replace named map keys with weather-variant tints |
| ~~**`App.tsx` routing comment stale**~~ — **Resolved.** Comment already reads `PreRunModal` not `MapSelect`. No action needed. | Docs update 2026-05-12 | n/a | ✅ Closed Phase 5 G1 |
| **`useFrameCallback` spurious zero-dt invocations** — frame callback fires extra times (~every 100ms) with `timeSincePreviousFrame=0`, correlated with the 100ms `setInterval` used for sprite-frame polling. Cause: JS-thread timer activity appears to trigger spurious UI-thread frame callbacks in Reanimated. Worked around by skipping `dtMs <= 0` frames at the top of `useFrameCallback`. Functional impact: none after workaround. Worth revisiting if Reanimated is upgraded or if a future feature needs the sprite-frame polling to run at a different cadence. | Phase 5 G1 stutter investigation 2026-05-12 | None after guard; without it, player movement stutters ~10×/sec | Keep guard in place; investigate root cause if Reanimated major version bump |
| **RN `<Image>` filtering — pattern established** — RN `<Image>` defaults to bilinear filtering, which blurs pixel-art and AI-sourced sprite icons. All Skia `<Image>` sprites in `GameCanvas.tsx` already use `sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}`. RN modal components must mirror this with `filterQuality="none"`. Applied to `LevelUpModal` and `CrateRevealModal` (commit 48be14b). **Pattern:** any future modal or screen using RN `<Image>` to render a sprite icon must include `filterQuality="none"`. | 2026-05-12 | `filterQuality="none"` on both affected components | ✅ Fixed — pattern to follow for all future RN `<Image>` sprite renders |

| ~~**Phase 5 G2 Step 3 — device-test blockers 2+3 remaining**~~ — Commit f12a73d shipped scatter props. Three blockers found. Blocker 1 (stutter): diagnosed to JS-thread GC pressure from `Array.from()` per 100ms tick + UI-thread worklet allocation churn. JS-thread fix shipped (5187d0d — timer buffer mutation pattern, ~90% young-gen reduction). UI-thread churn unchanged; stutter reduced but not eliminated; **accepted for v1**. Half-dist Atlas A/B test (b2e6e88) disproved the camera-Group child-count theory — Option D is not the fix; reverted. **Diagnostic value for Phase 9:** distributing 12 atlases into their own camera-Group wrappers produced no improvement vs keeping them in the shared Group — confirming the stutter is NOT caused by child count inside an animated Skia Group. Any future render-pipeline investigation should not re-test this vector; the cause is worklet GC churn (see UI-thread tech debt entry), not Skia Group structure. Blocker 2 (houses and most vehicle wrecks not appearing): **current focus** — candidate: assetKey mismatch between mapGenerator pools and EnvSprites registry. Blocker 3 (prop sprites near native size): need `PROP_SPRITE_SCALE` constant in propAtlasData useMemo. | Phase 5 G2 Step 3 (2026-05-13) | Game playable; props partially visible; stutter bounded | ✅ Closed — all blockers resolved 2026-05-14 |
| ~~**G4 sniper count cap needed — rooftop availability ≠ spawn budget**~~ — map density increase (2026-05-14) raised buildings to 4–6 houses + 4–6 watchtowers = 8–12 structures per run. With 2–3 sniper rooftop positions per building, each run will have 16–36 valid rooftop slots. G4 sniper enemy class must define its own `MAX_ACTIVE_SNIPERS` cap independent of rooftop availability — otherwise sniper density scales with building count in ways that can feel punishing on high-building-count seeds. Cap must be set before wiring sniper placement logic. | Phase 5 G2 density increase (2026-05-14) | No snipers implemented yet | ✅ Closed Phase 5 G3 — `SNIPER_MAX_ACTIVE = 5` in `gameConstants.ts`; enforced in `enemyEngine.ts` |
| **Loading screen needed** — At 6000×6000 with 250+ scatter props and 31+ `useImage` assets, initial mount produces a noticeable blank frame (~1–3s) before the canvas is ready. A loading screen (static image or progress bar) must intercept this gap. A blank screen on launch reads as a crash to new players. | Phase 5 G2 (2026-05-14) | Blank frame on mount; game loads correctly | Phase 7 — implement before user-testing |
| **Projectile rendering: bullets as Circle vs Rect** — Bullets render as Skia `<Circle>` primitives (4px warm yellow). A `<Rect>` oriented with velocity (~2×8px) reads more convincingly as a traveling projectile. Low visual priority at current size but worth bundling with Phase 6 projectile-path work since muzzle flash, bullet origin, and bullet shape all touch the same render path. | Phase 5 G2 close-out (2026-05-14) | Circle renders acceptably | Phase 6 — bundle with muzzle flash + bullet origin correction + projectile rect shape change |
| **Camera Group child count threshold** — Phase 5 G2 A/B test (b2e6e88, reverted c5c1e5c) confirmed that 28 Atlas children inside an animated Skia camera Group does NOT cause measurable stutter. The stutter is UI-thread worklet GC churn, not Group child count. Any future render-pipeline investigation should not re-test this vector. Re-evaluate only if child count grows significantly post-launch. | Phase 5 G2 A/B test (2026-05-13) | 28 Atlas children; performance acceptable at current count | Post-launch — re-evaluate if child count grows significantly |
| **[I] Enemies do not collide with each other** — Enemies clip through one another. Genre-typical for Vampire Survivors / Brotato style; stacking is expected and not disorienting at current enemy density. If post-launch playtesting shows enemy stacking creates gameplay problems (e.g. blob AI trivializes flanking), revisit with a soft push-apart force in v1.1+. | Phase 5 G3 (2026-05-15) | Enemies clip through each other | Deferred — v1.1+ only if playtesting surfaces a real problem |
| **[J] Bullets do not collide with props** — Projectiles pass through all buildings, wrecks, rocks, and trees. Genre-typical. Adding prop-bullet collision would require adding a second spatial query in `combatEngine.ts` and deciding whether to block projectiles or pass through. | Phase 5 G3 (2026-05-15) | Bullets pass through everything | Phase 6 polish — add only if playtesting surfaces this as a felt problem |
| **[K] Small trees still use AABB collision** — `env_tree_small_1/2/3` remain in the rect pool. They're small enough that any directional inconsistency is invisible at gameplay scale. If a specific small-tree variant ever shows one-direction-only blocking, move it to the circle pool with radius ~25–30. | Phase 5 G3 (2026-05-15) | AABB for small trees; no reported issues | When and if a specific variant shows visible inconsistency |
| **[L] Variant A muzzle flash position varies across walk frames** — The Sniper kit walk frames (SW_01–07) have the rifle in different x-positions per frame due to lateral body movement in the walk cycle. A fixed flash offset can't align perfectly across all 7 frames. Variant B (Soldier02 with rocket launcher) is stable because its frames are firing-pose with consistent weapon position. Attempted fixes via frame freeze override at 200ms and 600ms durations both failed — React state + 100ms timer pathway can't reliably commit intermediate frame states before subsequent timer ticks override them. Fundamental fix would require moving sprite frame selection from React state to a worklet-readable SharedValue, or replacing walk frames with a stable firing-pose set. Deferred. Current behavior: flash spawns near the rifle area, but exact position varies across frames. | Phase 5 G4 (2026-05-15) | Flash spawns near rifle area; position varies per-frame | Deferred — fix requires sprite frame selection moving off React-state pathway |

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

Decision updated: a single dynamic procedural map generator runs once at game start, producing a fresh layout every run. No per-map config files, no map select screen, no per-map themes. Single consistent military theme throughout.

**The model:**

One generator with parameterized asset budgets (buildings, vehicles, props, vegetation). Each run seeds from the current time and scatters assets within those budgets. Building sprites carry rooftop metadata so sniper enemies can be assigned valid positions at spawn time.

**Procedural each run:**

Each time the player taps Deploy, the generator uses the current time as the random seed. Layout changes every run. This matches genre conventions (every run feels different) and exploits the variety in the installed asset packs (different buildings, vehicles, and props each run).

**Four guard rails on the scatter algorithm (mandatory):**

1. **Player spawn zone protection.** Center 200×200 px area always clear of obstacles. Player has room to start.
2. **Minimum obstacle spacing.** No two obstacles spawn within ~60 px of each other (tunable). Prevents overlapping or visually crowded placements.
3. **Central landmark always fixed.** One fixed landmark always sits at map center regardless of seed. Gives the player a consistent reference point each run.
4. **No-spawn ring around the central landmark.** ~80 px clearance (tunable). Prevents the landmark getting buried in surrounding obstacles.

**Why this approach:**
- Simpler to build than authoring separate configs for three distinct maps
- Replayability for free — every run looks different
- Exploits the variety asset packs (especially civilian vehicles and props)
- Matches survivor-like genre conventions where mastery is about decision-making, not memorizing layouts
- Single generator eliminates the map select screen entirely; one less system to build and maintain

**Implementation notes for Phase 5:**
- Scatter algorithm + four guard rails are CC's job to implement
- Single generator config in `data/mapConfig.ts` (asset budgets, spacing params, landmark)
- Building sprites carry rooftop metadata — sniper spawn system reads this at run start
- Mo will tune density and parameters by playing runs and adjusting; CC implements the system, Mo iterates the values

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

- `src/data/weapons.ts`: three previously commented stubs (`aks74u`, `ak74`, `svd`) fully defined with final stats from the context doc table. Three crate-only weapons (`m870`, `gp25`, `rpo`) added as complete stubs for Phase 4b — correct stats but combat engine extensions (pellet spread, AOE, DoT stream) not wired until 4b. All 7 `displayName` fields renamed from Tarkov caliber names to generic player-facing names: Pistol, SMG, Assault Rifle, Sniper Rifle, Shotgun, Rocket Launcher, Flamethrower. (pkm/Machine Gun was removed in Phase 4c G2; `WEAPON_UNLOCK_MAP` system also removed at that time — all non-Pistol weapons are crate-only drops.)
- `src/components/GameCanvas.tsx`: `WEAPON_UNLOCK_MAP` constant at module level mapping unlock levels to `{ weaponId, weaponPose }` pairs. `handleSkillSelect` extended: computes `newLevel` first, checks the map, spreads both `equippedWeaponId` and `weaponPose` into the player state mutation when a match is found (non-unlock levels skip the spread entirely — zero additional cost). `+500 XP` debug button added for verification, removed in the cleanup commit.

### Architectural decisions made during G4

- **Both `equippedWeaponId` AND `weaponPose` must be set on unlock.** The two fields are independent: `equippedWeaponId` drives combat stats (damage, cooldown, range) via `WEAPON_PROFILES`; `weaponPose` drives hero animation. Pre-review catch — the `cycleWeapon` button in Phase 2 G4 only mutated `weaponPose`, creating a precedent where the two fields appeared coupled. They are not. Any weapon equip operation must set both.
- **Unlock check lives inline in `handleSkillSelect`, not as a separate callback.** The unlock fires only when the modal-driven level increment crosses a threshold — it is not a general "level changed" observer. Inlining it keeps the mutation atomic: level, weapon unlock (if any), and skill stack all commit in one `gameState.value = { ...state }` write. Separate handlers would require two writes or complex coordination.
- **Cycle button weaponPose-only bug discovered during pre-review.** The button's Phase 2 implementation only sets `weaponPose`. Logged as tech debt. Does not affect gameplay — the button is a dev tool, not a player-facing control. Resolves when Phase 7 removes the button entirely and the real HUD weapon icon takes over.
- **Generic weapon names ship now, not at Phase 7.** Names are invisible in current shipping UI (no HUD until Phase 7), but doing the rename while the design judgment was fresh (the Tarkov names were always wrong for a non-Tarkov game) costs nothing and frees Phase 7 from the conversation. Same reasoning applied to the 3 crate weapon stubs — defining them here while the file is open prevents a context-switch into weapons.ts during Phase 4b.
- **SMG reuses `pistol` pose; Shotgun uses `machinegun` pose; Sniper Rifle reuses `rifle` pose.** The kit ships 5 hero animations for 7 weapon profiles. Phase 7's HUD weapon icon will visually distinguish SMG from Pistol regardless of shared pose.

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

- **Fixed-slot nullable-array is the canonical project pattern for all entity arrays.** Stable slot index = stable React key = no spurious animation state resets. Arrays that compact after removal break key stability: a surviving enemy can shift into a lower slot and inherit a different slot's Skia animation state, producing the die-frame flash this fix eliminates. The pattern applies to enemies, throwables, effect zones, crates, and pickups (converted post-G1 to fix pickup stutter — see Phase 5 G1 pickup fix commit). Projectiles still compact — deferred because no reported stutter and the pickup fix should ship in isolation. Revisit during template cleanup pass post-launch.

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

**Goal:** Single dynamic procedural map generator (runs at game start, every run is unique), parameterized asset budgets (buildings, vehicles, props, vegetation), seeded random placement with spacing constraints, building metadata for sniper rooftop positions, world camera system, all 8 enemy types working including Humvee/BTR/Panzer/ACS vehicle enemies, enemy ranged fire, single consistent military theme.

**Status:** 🟢 Complete — G1 ✅ G2 ✅ G3 ✅ G4 ✅ G5 ✅ Flyover ✅

---

## Phase 5 — Group 1: Entity follow camera + stutter fix

**Status:** Complete 🟢
**Date:** 2026-05-12
**Commits:** 99bf87d (camera ship) → 89504df → 2b43fd9 → 1e5adb7 → db7bc5c → 02acfad (nested-group stutter fix) → 2fc88ec → d01b341 (pickup compact-array cleanup) → 3c17fac (runOnJS root cause fix) → 3283833 (diag cleanup)

### What shipped

- `GameCanvas.tsx`: World camera system — player always at screen center; all entities compute screen position inline as `width/2 + (entity.x - player.x) * CAMERA_ZOOM`. `CAMERA_ZOOM = 1.0` (placeholder until Phase 5 tile rendering establishes visual context for zoom locking). Entities rendered outside any animated camera Group — nested animated Skia Groups were the initial stutter root cause.
- `pickupEngine.ts`: Converted `state.pickups` from compact `PickupState[]` to fixed-slot `Array<PickupState | null>` (same pattern as enemies, crates, throwables). Collecting a pickup nulls its slot rather than splicing. Related cleanup prompted by stutter investigation; pickup stutter had a separate root cause.

### Stutter investigation summary

Multi-session debug across two sessions:

1. **Nested animated Skia Groups (commit 02acfad):** Initial camera shipped with a camera `<Group transform={cameraTransform}>` wrapping entity Groups — both outer and inner groups were animated (Skia subscriptions). Intermediate frames could render with camera updated but entities not. Fix: inline camera math per entity, remove outer camera group from animated entities.

2. **Pickup compact-array slot-shift (commit d01b341):** After nested-group fix, pickups still stuttered. Diagnosed as `state.pickups` compact array rebuilding each tick — collected pickups shifted slot indices, causing one-frame visual teleport. Fix: fixed-slot nullable array. This was a real cleanup but NOT the root cause of the remaining stutter (crates shared the same stutter despite already being on the fixed-slot pattern).

3. **Root cause — `.runOnJS(true)` cross-thread input lag (commit 3c17fac):** `.runOnJS(true)` on the Pan gesture routed gesture callbacks through the JS thread. The cross-thread SharedValue write (inputVectorX/Y) was processed asynchronously by Reanimated's queue. `useFrameCallback` could read a stale input vector on any vsync where the JS thread queue hadn't flushed yet — causing variable `player.x` advancement per frame. Stationary world objects (crates, pickups) exhibited this as visible stutter; moving enemies masked it via their own velocity. Fix: remove `.runOnJS(true)`. Gesture callbacks are now UI-thread worklets. The original reason for `.runOnJS(true)` (RNGH gesture flush bug causing useFrameCallback to fire at digitizer rate) no longer applies after the nested-group architecture was removed.

### Architectural decisions made during G1

- **Inline camera math is the canonical entity rendering pattern.** Each entity's `useDerivedValue` computes screen position directly as `width/2 + (entity.x - player.x) * CAMERA_ZOOM`. No outer animated camera Group wrapping animated entity Groups — that architecture causes Skia intermediate frames where the camera has updated but entities haven't.
- **Gesture handlers feeding game state must run as UI-thread worklets.** Using `.runOnJS(true)` on input gestures routes the input update through the JS thread queue, adding variable latency to `player.x` that manifests as camera stutter for stationary world objects. The original reason for `.runOnJS(true)` (RNGH flush bug) is an architecture-specific issue that doesn't apply once nested animated Groups are eliminated.

---

## Phase 5 — Group 2: Procedural map + scatter props

**Status:** ✅ COMPLETE
**Date:** 2026-05-13 → 2026-05-14
**Commits:** Steps 1+2: 86c1a33→8407c5e — Step 3 + close-out: 3c94b82, f12a73d→44cb822

### Steps completed and stable

**Step 1 — Noise-based biome tile generation**
- `mapGenerator.ts`: simplex noise (`createNoise2D`) seeded from mulberry32 PRNG. Each tile samples `noise2D(col * 0.05, row * 0.05)` → 3 terrain types (grass / dirt / sand). Variant picker restricted to inner 3×3 of 5×5 tilesheet (`FILL_VARIANTS = [6,7,8,11,12,13,16,17,18]`) — outer ring has feathered transparent edges that caused seam gaps when used as fill.
- Atlas render in `GameCanvas.tsx`: one `<Atlas>` per terrain type; RSXforms in world space; camera Group scrolls them.

**Step 2 — World size 6000×6000 + viewport culling + JSI serialization fix**
- `WORLD_WIDTH/HEIGHT` bumped 2000→6000; `TILE_COLS/TILE_ROWS` are derived (`Math.ceil(6000/64) = 94`), so grid automatically scaled 32×32→94×94.
- Viewport culling: player tile position tracked in 100ms timer; `useMemo` rebuilds Atlas arrays for only the visible ~9×15 window. O(1) range math, O(visible) loop.
- **JSI serialization fix (architectural):** `mapData: MapData` (containing 8,836 TileCell objects) was stored in `GameState` SharedValue. At 6000×6000 this was fatal — Reanimated deep-copies the entire value tree through JSI on every `gameState.value = ...` at 60fps. Removed `mapData` entirely from GameState. `initialMapData` lives in React `useState` in `GameCanvas` (the only reader). No worklet ever read `state.mapData`. 60fps confirmed on device after fix.
- **Rule established:** SharedValue must contain ONLY fields read by UI-thread worklets. Non-worklet data (tile grids, map metadata, static entity lists) lives in React state or ref regardless of conceptual ownership.

**Step 3 — Scatter prop asset survey**
- `_project-docs/environmental-asset-audit.md` Section 14: surveyed all single-sprite static props in `_project-docs/kits/`. 7 categories confirmed: structures (3), trees (7), bushes (3), rocks (3), barrels/crates (6), vehicle wrecks (9). Sandbags deferred to G3 — need collision orientation logic. Placement rules per category established. 31 PNGs copied to `assets/sprites/environment/`.

### Step 3 — Code committed, device test blocked (commit f12a73d)

**What shipped:**
- `mapTypes.ts`: `barrels: PlacedEntity[]` added to `MapData`; header comment updated (not in GameState; 94×94 grid).
- `mapGenerator.ts`: real asset pools (`ROCK_POOL`, `VEGETATION_POOL`, `WRECK_SCATTER_POOL`, `WRECK_BUS`, `BARREL_POOL`) with assetKeys + native dimensions; `isNearSpawn()` 200px exclusion zone around player spawn (3000, 3000); `buildBarrels()` clusters 2–5 per building; all builders use spawn clearance; `buildObstacles` → rocks only (sandbags deferred to G4).
- `sprites.ts`: `EnvSprites` flat assetKey→require() map for all 31 prop images.
- `GameCanvas.tsx`: 31 `useImage` calls + `propImageLookup` Record; `propAtlasData` useMemo groups entity lists by assetKey → SkRect[]/SkRSXform[]; one `<Atlas>` per assetKey type inside camera Group in z-order (vegetation → obstacles → barrels → wrecks → buildings).

**Three blocking issues found on device:**

1. **Stuttering during player movement** — 60fps regressed after Step 3. Diagnosis not yet performed. Most likely cause: adding 31 `useImage` hooks plus the `propAtlasData` useMemo is introducing overhead on the JS thread that re-introduces the inter-thread timing issue from G1. Could also be a new Skia subscription pattern. **Diagnose first before touching anything else.**

2. **Missing prop categories** — device showed rocks, stumps, one bus, watchtower, crates. Did NOT show houses or most vehicle wrecks. Two candidate causes: (a) placement retry loops gave up early (spawn-clearance or spacing constraints too tight), or (b) assets are placed but not rendering (assetKey mismatch between generator pool and EnvSprites, or image null at render time). Check by logging `initialMapData.buildings.length` and `initialMapData.vehicleWrecks.length` at mount.

3. **Sprite scale too small** — watchtower and crates render at near-native PNG size (72×72 and 30×31 respectively), reading as tiny relative to the player sprite. Needs a `PROP_SPRITE_SCALE` constant applied in `propAtlasData` useMemo (scale applied to RSXform `scos`/`ssin` + adjusted tx/ty to keep centered). Similar pattern to `HERO_SPRITE_SCALE` and `ENEMY_SPRITE_SCALE`.

### Debugging stories

**JSI serialization at 6000×6000 (Step 2):** `mapData: MapData` (8,836 TileCell objects) was stored in GameState SharedValue. Fatal at 6000×6000: Reanimated deep-copies the entire value tree through JSI on every `gameState.value = ...` at 60fps → 3-minute initial load, 1 FPS during gameplay. No worklet ever read `state.mapData`. Fix: remove from GameState; `initialMapData` lives in React `useState`. 60fps restored immediately. Rule established: SharedValue must contain ONLY fields read by UI-thread worklets.

**Edge-tile transparent gap (Step 1):** Tilesheet outer ring uses feathered transparent edges (intended for blending). Using outer-ring variants as fill produced visible seam gaps between tiles. Fix: `FILL_VARIANTS` restricted to inner 3×3 of the 5×5 tilesheet (indices `[6,7,8,11,12,13,16,17,18]`).

**Half-dist Atlas A/B test (Step 3 stutter):** Hypothesis that 28 Atlas children inside the animated camera Group was the GC overhead source. Test (b2e6e88): split scatter Atlases outside camera Group with per-entity derived-value world positioning. Result: no measurable FPS improvement. Hypothesis disproved — confirmed stutter is UI-thread worklet GC churn (see tech debt), not Skia Group child count. Reverted (c5c1e5c). Any future investigation should not re-test this vector.

**GC stutter root cause (Step 3):** Residual stutter after JS-thread fix 5187d0d confirmed via worklet allocation logging: immutable-update pattern across all five engine files generates ~36,000–60,000 objects/second on UI-thread heap → periodic 2–4ms GC pauses. Accepted for v1. Deferred to Phase 9.

**Helicopter Metro bundle staleness (close-out):** Helicopter PNG added after last Metro bundle compile. `useImage` returned null (silent render skip); `initialMapData.vehicleWrecks` showed placed: 1. Placement succeeded; rendering failed. Fix: `npx expo start --clear`. No code change. Lesson: when `useImage` is null but entity count confirms placement, check Metro cache before investigating logic.

### Final state

G2 ships a fully procedural 6000×6000 military map:
- **Tile terrain:** simplex noise → grass / dirt / sand biomes; inner-3×3 tilesheet variants; 50/50 per-seed terrain theme (desert or vegetation)
- **Structures:** 1× house02 (large) + 3–5× house01 (medium) + 4–6× watchtowers; inter-building spacing via `tooCloseScaled()`
- **Vehicle wrecks:** 1× helicopter centerpiece + 1× bomber centerpiece (50/50 variant) + 2–3× buses + 8–14× scatter wrecks
- **Scatter props:** rocks, vegetation (trees + bushes), barrels (clustered around buildings)
- **Viewport culling:** visible ~9×15 tile window in Atlas arrays; `propAtlasData` useMemo rebuilds on tile-position change
- **Sprite scaling:** `PROP_SPRITE_SCALE=2` (props/scatter), `STRUCTURE_SPRITE_SCALE=3` (buildings)
- **Spacing:** all inter-entity checks via `tooCloseScaled()` (rendered footprint = `max(w,h) × scale / 2 + 20px gap`)

---

## Phase 5 — Group 3: Static-prop collision

**Status:** 🟢 Complete
**Date:** 2026-05-15
**Commits:** C1 (collision module): 6ed8a3c | C2 (engine wiring): b391493 | C3 (scale overrides): 30fb59c | C4 (diag logging): 2c04ed9 | C5 (sign fix): 656fddf | C6 (wasOutsideX/Y guard): c979729 | C7 (boundary <=): 93bc790 | C8 (circle pool): 289a832 | C9 (radius tuning): f9c30e7 | C10 (large trees → circles): 74b6376 | C11 (AABB cleanup): a311bdb | C12 (strip diag): c3450b7

---

### Goal

Player and enemies are blocked by solid props (buildings, vehicle wrecks, rocks, trees). Passable props (bushes, barrels, small rocks) remain walkable.

---

### Final architecture: hybrid AABB + circle pool

**Problem encountered:** After 8+ commits of AABB tuning on wrecks (scale overrides, sign fix, wasOutsideX/Y axis-gate, boundary <= patch), wreck collision remained inconsistent across map seeds and approach angles. Root cause: rotated wrecks paired with axis-separated AABB response produce compounding edge cases. Any fix for one angle introduced a regression on another. The approach was not economically fixable.

**Decision (C8):** Switch all vehicle wrecks to circle collision. Circle math is rotation-invariant — single push-outward-along-vector, no axis-separation, no perpendicular-axis boundary conditions. Extended to large trees in C10 when the same symptom appeared (non-square PNG dimensions producing an asymmetric AABB hitbox).

**Final pool routing in `buildCollisionData`:**
- `mapData.buildings` → rect pool (AABB) — non-rotated, rectangular silhouette
- `mapData.obstacles` (rocks medium/large) → rect pool (AABB) — non-rotated
- `mapData.vehicleWrecks` → circle pool — all 17 variants, random rotation
- `mapData.vegetation` large trees → circle pool — non-square silhouette
- `mapData.vegetation` small trees + bushes → rect pool (small trees) or passable (bushes)
- `mapData.barrels` → not added to either pool (all passable)

**`CIRCLE_COLLIDER_RADIUS` map** (keyed by `assetKey`, world-px radii, device-tuned):

| Asset | Radius |
|---|---|
| env_helicopter_wreck | 120 |
| env_bomber_wreck_2/3 | 144 |
| env_bus_wreck | 100 |
| env_acs_wreck | 110 |
| env_humvee_wreck_1–6 | 80 |
| env_car_wreck_1–3 | 70 |
| env_police_wreck | 75 |
| env_ambulance_wreck | 75 |
| env_small_truck_wreck | 75 |
| env_tree_large_1–4 | 50 |

**Spatial grid:** 12×12 flat grid, cellSize=500px, covers full 6000×6000 world. Both rect and circle pools share the same grid dimensions; rect pool uses `grid`, circle pool uses `circleGrid`. Fixed-grid chosen over viewport-cull because enemies spawn at screen edge and walk toward player — a building just off-screen would produce clip-through until it entered the viewport.

**Per-frame resolution order (player and each enemy):**
1. `resolveAABB(currentX, currentY, proposedX, proposedY, entityRadius, collData)` — structures + small rocks + small trees
2. `resolveCircle(resolvedX, resolvedY, entityRadius, collData)` — wrecks + large trees

Both passes run every frame; pools never overlap.

---

### Debugging journey (preserved for context)

- **656fddf — AABB sign bug:** `dxDir`/`dyDir` derived from proposed/resolved position caused teleport when a large step crossed the rect centre. Fixed to use `currentX`/`currentY` as the sign source.
- **c979729 — wasOutsideX/Y guard:** Helicopter rubber-band fix. If entity was already inside the rect's X range (placed there by Y resolution), the X pass would push it laterally to the far X edge. Guard: only push axis N if entity was outside that axis's range before this frame.
- **93bc790 — boundary <= fix:** After a Y push resolved entity to exactly `rect.y + exHalfH`, next frame `|dy| == exHalfH`. Strict `<` returned false; X push never fired. Entity slid freely along the Y boundary. Fixed `<` → `<=` in perpendicular checks.
- **289a832 — circle pool:** After 8+ AABB tuning commits still produced cross-seed inconsistency, switched wrecks to circle collision. All wreck behavior normalized immediately on device.
- **74b6376 — large trees:** Same one-direction-only symptom appeared on a large tree. Trees have no rotation; root cause was non-square AABB (e.g., 161×145px) producing directionally inconsistent hitbox depth. Routed to circle pool.
- **a311bdb — AABB cleanup:** wasOutsideX/Y guards, `<=` boundary patch, `COLLISION_SCALE_OVERRIDES`, and wreck/large-tree entries in `SOLID_ASSET_KEYS` all removed. AABB pool now contains only non-rotated near-rectangular assets that never needed the defensive patches.

---

### Architectural decisions made during G3

- **Hybrid pool: AABB for non-rotated rectangular assets, circle for rotated or asymmetric.** Rotation × AABB × axis-separation × shrink overrides has more edge cases than can be economically fixed. Circle collision is rotation-invariant; use it when assets rotate or when the PNG silhouette isn't near-rectangular.
- **CollisionData in its own SharedValue, not GameState.** Static world data built once at mount; worklets read cheaply each frame. Same JSI-serialization rule established in G2 for tileGrid.
- **Fixed-grid spatial partitioning over viewport culling.** Enemies approach from screen edge — viewport-cull would allow clip-through for off-screen buildings until they entered view. Fixed 12×12 grid covers the full world.
- **Passable props excluded via opt-in set.** `SOLID_ASSET_KEYS` is the authoritative AABB set; `CIRCLE_COLLIDER_RADIUS` is the authoritative circle set. Any prop absent from both is passable.
- **Enemy-vs-enemy collision unchanged.** Enemies clip through each other. Genre-typical for Vampire Survivors / Brotato style.
- **Bullets pass through all props.** Genre-typical. Deferred to Phase 6 polish (if added at all).

---

## Phase 5 — Group 4: Sniper class + muzzle flash

**Status:** ✅ Complete
**Date:** 2026-05-15 → 2026-05-16
**Commits:** 81a0cbd (bullet sprite swap) → 832828a (raider visual swap) → 1e94df5 (raider body overlay fix) → ee1e503 (sniper class original impl) → 345c364 (G4 redesign: visual-only fire) → eb0ceec (muzzle flash z-order fix + strip projectiles) → 384566a (tech debt [L] + revert frame freeze) → fb1f99d (scav/raider three-way sprite swap) → 1029ab4 (raider muzzle flash) → 40cb8bb→5937a47→d18dc5a (raider flash offset tuning) → 13b7b48 (close: stage NoGunScav.png)

---

### Goal

Enemy visual upgrades and an initial attempt at a full ranged fire mechanic for sniper variants. Entering G4 the enemy roster had two visual mismatches — Raider used the Soldier02 (bazooka soldier) sprite despite being a melee class, and Scav used the Gunner sprite despite being the basic grunt — and no enemy fired a weapon of any kind. The session's target was to resolve both mismatches, add two sniper variants with genuine ranged fire (travel, hit detection, player damage), and show a muzzle flash to emphasize the event.

---

### Player projectile sprite swap

First commit (81a0cbd) closed a Phase 4c tech debt entry by replacing Skia `<Circle>` player-projectile rendering with sprite-based images:

- **Standard bullets (all non-rocket weapons):** `GunnerBullet` sprite (kit 1b)
- **Rockets (GP-25 / grenade launcher):** `rocket-f1.png` from the kit effects folder

`isRocket: boolean` on `ProjectileState` drives the renderer branch. Circle rendering is fully removed from `GameCanvas.tsx`.

---

### Ranged fire attempt — original design and why it was scrapped

**Original spec (ee1e503):** Two sniper variants spawned via the standard wave pipeline, count capped at `SNIPER_MAX_ACTIVE=5`. Both walked toward the player and dealt melee contact damage. sniperB (Soldier02) was additionally supposed to fire rocket projectiles on cooldown. Enemy-to-player hit detection was wired.

**What went wrong:** On device both variants rendered the same bullet sprite — the `isRocket` flag on enemy-originated projectiles was never set, so intended rockets rendered as bullets. More critically, the enemy-to-player collision path was incorrectly routing through the *enemy-hit* path (the path that detects the player's projectiles hitting enemies). Projectiles traveled and were visually detectable but dealt no player damage and produced no feedback.

**Decision (345c364):** Rather than debug the projectile routing, enemy projectiles were scrapped entirely for v1. The genre precedent is strong — Vampire Survivors and Brotato have minimal enemy ranged mechanics; atmosphere comes from visual density, not enemy bullets tracking the player. Making enemy fire visual-only is the right call for launch. This cleared significant architectural complexity: `isEnemyProjectile` removed from `ProjectileState` and all combat/enemy engine code; all enemy-projectile spawn/travel/hit-detection code removed from `combatEngine.ts`. HP bumped to compensate: sniperA 30→50, sniperB 30→40.

---

### Muzzle flash — two-attempt implementation

**First approach — EffectZones (scrapped):** Flash spawned `EffectZone` objects at the firing enemy's position. Problem: EffectZones render inside the camera Group (JSX first in the tree), while enemy sprites render outside it (JSX after). Flash zones were drawn behind every enemy sprite — complete visual occlusion.

**Second approach — per-slot React state (shipped, eb0ceec):** Added `lastFiredAtMs` to `EnemyState`; the fire trigger sets the timestamp instead of spawning a zone. A 100ms `setInterval` polls each enemy slot's `lastFiredAtMs` and computes a flash frame index (0–2 during the 200ms flash window, -1 otherwise), pushing results into `enemySlotFlashFrames` React state. The flash image renders inside each enemy's own Skia Group — correct z-order, guaranteed above the sprite. `MUZZLE_FLASH_DURATION_MS` bumped 150→200 to ensure the 100ms timer always catches a fresh fire event before it expires.

**Flash position tuning:** Per-variant offset constants in `gameConstants.ts` (`SNIPER_A_FLASH_OFFSET`, `SNIPER_B_FLASH_OFFSET`, `RAIDER_FLASH_OFFSET`) expressed in sprite-local space (auto-rotates with entity facing via parent Group). 1 sprite-pixel = 2 rendered units.

- **Variant B and Raider:** Confirmed at barrel on device. Offsets are stable because both classes render from consistent firing-pose frames.
- **Variant A:** Flash spawns near the rifle area, but position varies across the 7-frame walk cycle. SW_01–07 (Sniper kit walk frames) have the rifle in different lateral positions per frame. A fixed offset cannot align across all 7 frames.

**Frame freeze override — attempted and abandoned:** Two commits tried to freeze sniperA at a stable frame during the flash window: 200ms freeze (0970763) then 600ms (3d45dfe). Both failed. The 100ms timer pathway cannot commit an intermediate frame state before the next tick fires — React reconciliation batches the intermediate update and the override is overwritten before the next paint. Both commits reverted. Accepted as tech debt [L] (see tech debt table). Fundamental fix requires moving frame selection off React state into a worklet-readable SharedValue.

---

### Three-way sprite swap (fb1f99d)

Mid-session the full enemy visual identity was rationalized:

| Class | Before G4 | After G4 | Notes |
|---|---|---|---|
| Scav | Gunner sprite (inappropriate for basic grunt) | NoGunScav body overlay + Soldier kit legs | NoGunScav is a weaponless Gunner body export — reads as basic infantry |
| Raider | Soldier02 (bazooka — wrong for melee class) | Soldier.png body + Soldier kit legs + SD die frames | More armored look, correct for harder melee class |
| Sniper B | — | Soldier02 (bazooka) | Bazooka sprite freed from Raider; now correctly visual for a "ranged-feeling" variant |
| Gunner | Used by Scav | `EnemySprites.gunner` registered, unreferenced | Parked — available for future reuse without removing the asset hooks |

Raider also received a visual-only muzzle flash on a 3.5s cooldown (1029ab4 + offset tuning). No projectile, no range check, no player damage. Gunner flash frames used as fallback — Soldier kit has no standalone flash overlay.

---

### Final state

- **5 mechanical enemy classes:** Scav (mobile melee, basic), Raider (mobile melee, harder), Sniper A (walk + melee + flash), Sniper B (walk + melee + flash), Tank Turret arriving in G5
- **6 visual identities:** NoGunScav-body Scav, Soldier-body Raider, Sniper kit Sniper A, Soldier02 Sniper B, plus 3 Tank visual variants (Humvee/BTR/Panzer) in G5
- **Enemy fire is visual-only in v1.** All enemy "fire" is muzzle flash only — no projectile travel, no player damage from enemy ranged attacks. Tank Turret (G5) is the sole exception and the only enemy with genuine ranged damage.
- **50 enemy cap (`ENEMY_SOFT_CAP = 50`) parked by design.** No perf issue found at current scale; cap retained.
- **Player projectile sprites wired:** GunnerBullet for standard fire, rocket-f1 for GP-25 / grenade launcher.

**Next:** G5 — Tank Turret class (stationary, 3 visual variants, fires actual damaging rocket projectiles on cooldown, spawns after 2 minutes, drops guaranteed crate on kill). Camera zoom lock (`CAMERA_ZOOM=1.0` placeholder) confirmed once Tank + HUD are visible together.

---

## Phase 5 — Group 5: Tank turret

**Status:** ✅ Complete
**Date:** 2026-05-16
**Commits:** 25bdb9f (initial G5 — BTR/Panzer, tower track, rocket fire) → 6b97271 (fix flash + rocket offsets to barrel tip) → 4a0ccec (BTR → ACS swap; rocket 0.85x) → 338f884 (rocket 0.7x) → 5cf5883 (two tanks per map: ACS + Panzer) → 7c05592 (close: strip diagnostics)

---

### Goal

Tank turret as the only genuine ranged-damage enemy in v1. All other enemy fire is visual-only (muzzle flash, no projectile travel, no player damage). The tank breaks this rule deliberately — rockets travel, have hit detection, and deal 30% maxHP on contact. The contrast provides weight to the encounter and rewards positional play.

---

### Initial spec and why it was scrapped

Original G5 design called for a destructible tank: fixed HP pool, death animation, guaranteed crate drop on kill, and a spawn timer (first appearance at 2:00). Each mechanic was straightforward in isolation but together they added up to a full enemy lifecycle (healthbar rendering, death state, crate-drop trigger, wave-gate logic) for a single entity. Against the Vampire Survivors precedent — hazards, not kill targets — the engineering cost was hard to justify for what was effectively visual polish.

**Decision:** make the tank an invincible permanent map fixture. No HP, no death, no drop, no spawn timer. Present at x:00. This cuts the lifecycle to zero and shifts player interaction from "kill the tank" to "manage the threat zone."

---

### Final spec

- **Two tanks per map:** one ACS, one Panzer — placed at map generation, present from minute zero
- **Placement:** ≥1500px from player spawn, ≥1500px from each other; 15 attempts per variant; falls back to 1 or 0 tanks if terrain blocks placement
- **Tower:** always tracks player via `atan2`; rotates every frame
- **Fire:** rocket spawns at barrel tip, constant speed, 30% maxHP damage on hit, 6s cooldown, 450px range
- **Invincible:** no HP pool, not in `enemies[]`, excluded from auto-aim automatically

---

### Two-layer compositing

First rotating-overlay-on-static pattern in this project. The base sprite (`ACS_Base.png` / `PanzerBase.png`) renders in a static Skia Group — no per-frame update needed. The tower sprite (`ACS_Tower.png` / `PanzerTower.png`) renders in a sibling animated Group whose transform includes translate-to-center + rotate.

The flash `<Image>` lives inside the tower Group, not beside it. This gives the flash automatic rotation with the tower and correct z-order above both base and tower sprites — same approach as enemy flash in G4, extended to a two-layer compositing context.

Animated Group wrapping a static Group caused stutter (known quirk from G4). Sibling Groups with independent transforms eliminate it.

---

### BTR → ACS swap

Initial implementation used a BTR variant alongside Panzer. On device the BTR's twin-barrel geometry made the barrel-tip offsets ambiguous — flash and rocket both initiated at tower center before tuning, and once the offset was dialed in it still read as slightly off-center relative to the visual. The ACS (single prominent barrel, clean tip geometry) made the offset derivation unambiguous and the visual result cleaner. BTR assets deleted; ACS wired. ACS reuses Panzer muzzle flash frames — no standalone ACS flash set needed.

---

### Per-variant offset constants

Four constants in `gameConstants.ts`:

| Constant | Value | Notes |
|---|---|---|
| `ACS_FLASH_OFFSET` | `{x:0, y:54}` | Sprite-pixel space; auto-rotates with tower Group |
| `ACS_FIRE_OFFSET` | `{x:0, y:108}` | World-pixel space; applied to world coords at spawn |
| `PANZER_FLASH_OFFSET` | `{x:0, y:57}` | Sprite-pixel space |
| `PANZER_FIRE_OFFSET` | `{x:0, y:114}` | World-pixel space |

`y` is the forward (barrel) axis in sprite-local space — positive y points toward barrel tip when the tower faces up in texture. `TANK_SPRITE_SCALE=2` converts sprite pixels to world pixels for flash render; fire offset is already in world pixels.

---

### Collision + auto-aim

Tank placed in the solid circle collision pool at map-gen time (radius 80 world-px). Player and enemies resolve against it the same as any wreck collider — no special casing. Tank is not in `enemies[]`, so all enemies-indexed logic (auto-aim target selection, combat tick, slot rendering) excludes it automatically. No `isAutoAimTarget` flag needed.

---

### Final state

- **5 mechanical enemy classes:** Scav, Raider, Sniper A, Sniper B, Tank Turret
- **6 distinct visual identities:** NoGunScav-body Scav, Soldier-body Raider, Sniper kit Sniper A, Soldier02 Sniper B, ACS tank, Panzer tank
- Tank is the sole enemy with genuine ranged fire and player damage in v1
- `CAMERA_ZOOM` locked at 1.0; reviewed against tank + HUD visibility and retained

---

---

## Phase 5 — Helicopter Flyover (atmospheric)

**Status:** ✅ Complete
**Date:** 2026-05-17
**Commits:** 7bac617 (implementation) → 1677616 (scale 1.2, duration 6500ms) → e985445 (scale 1.5)

---

### Goal

Ambient helicopter flyover as atmospheric texture — no attacks, no health pool. A helicopter visually crosses the screen on a randomized trajectory every 60–120 seconds, reinforcing the active combat zone feel without adding a gameplay mechanic. Ships as a Phase 5 deliverable per the Scope Cuts decision (2026-05-13) that replaced the full helicopter boss with an ambient flyby.

---

### What shipped

**Assets** (`assets/sprites/boss/helicopter/`):
- `heli_body.png` — 288×288 body sprite (no rotor)
- `rotor_1.png`, `rotor_2.png`, `rotor_3.png` — 288×288 rotor overlay frames (4x Smooth kit)

**Constants** (appended to `gameConstants.ts`):
- `HELI_SPRITE_SCALE = 1.5` — device-tuned: started 0.6, doubled to 1.2, then +25% to 1.5
- `HELI_ROTOR_FRAME_MS = 40`
- `HELI_FLYOVER_DURATION_MS = 6500` — device-tuned: started 4500ms, slowed to 6500ms
- `HELI_SPAWN_MIN_MS = 60000` / `HELI_SPAWN_MAX_MS = 120000`

**Animation system:**
- `heliProgress` SharedValue driven 0→1 by `withTiming({ duration: HELI_FLYOVER_DURATION_MS })`
- `heliFlightSV` SharedValue carries `{ active, startX, startY, endX, endY, angle }` for the current pass
- `heliTransform` useDerivedValue: interpolates world → screen position per frame, emits `translateX/Y + rotate`
- 8 randomized routes (L→R, R→L, T→B, B→T, and 4 diagonals); angle = `atan2(dy, dx) + SPRITE_ROTATION_OFFSET`
- `withTiming` completion callback (`runOnJS(scheduleNext)`) sets the next random delay then fires the next pass

**Rendering (viewport-relative — outside camera Group):**
- Helicopter renders in screen coordinates, not world coordinates — not affected by map scroll
- Two-layer compositing: static body `<Image>` + animated rotor `<Image>` at same center (sibling Groups pattern from G5 tanks)
- `heliActive` / `heliRotorFrame` React state driven by 100ms setInterval (only advances frame counter when `heliActive = true`)
- `FilterMode.Nearest, MipmapMode.None` sampling on both layers

---

### Architectural decisions

- **Viewport-relative rendering.** The helicopter flies across the screen, not the world — screen-space coordinates are correct. Rendering inside the camera Group would make the helicopter appear to orbit the map at a fixed world position.
- **`withTiming` for smooth flight instead of SharedValue per-frame mutation.** Linear interpolation over a fixed duration is exactly what `withTiming` does; no per-frame worklet math needed for position. The completion callback schedules the next pass without a polling loop.
- **Per-frame `runOnJS` prohibition maintained.** Only the `withTiming` completion (fires once per pass) uses `runOnJS`. No `runOnJS` inside `useFrameCallback`.
- **Sibling Groups, not nested animated Groups.** Body in a static Group; rotor in an animated sibling Group — same binding pattern as G5 tank two-layer compositing.

---

### Phase 5 — Complete

**G3** — Static-prop collision: spatial grid (AABB + circle), player + enemy resolution, worklet-safe.
**G4** — Sniper class + muzzle flash: visual enemy upgrades, flash-only ranged fire for all non-tank classes.
**G5** — Tank turret: two-layer compositing, genuine rocket fire, two permanent map fixtures.
**Flyover** — Ambient helicopter flyover: `withTiming`-driven viewport-relative pass, two-layer rotor compositing, 60–120s randomized spawn cadence. Device-tuned scale and flight duration.

**Tech debt logged this phase:** I (per-slot `useDerivedValue` scaling limit), J (JSI SharedValue field restrictions), K (animated-inside-animated stutter), L (walk-frame freeze via React state unreliable — flash position drifts on sniperA across walk cycle).

**Phase 6 brainstorm items carried forward:**
- Bullet sprite color change (`GunnerBullet` reads too dark against map)
- Grenade launcher sprite swap (dedicated grenade asset exists in kit)
- Optional scav muzzle flash (deferred — conceptually a melee class)
- File refactor decision (`GameCanvas.tsx` + `gameEngine.ts` approaching size threshold)
- 50 enemy cap (`ENEMY_SOFT_CAP`) investigation — no perf issue observed, retained as is

---

## Phase 5/6 Brainstorm Decisions — Locked

Design decisions captured 2026-05-14. Apply when the relevant phase work begins.

---

### 1. Bullet sprite swap (Phase 6 polish — one focused commit)

- **Rockets:** use `rocket-f1` asset
  - Source: `_project-docs/kits/tds-modern-pixel-game-kit/tds-modern-hero-weapons-and-props/rocket/rocket-f1`
- **All other weapons:** use `GunnerBullet` asset
  - Source: `_project-docs/kits/tds-modern-pixel-game-kit/tds-modern-soldiers-and-vehicles-sprites-2/Gunner/Effect/GunnerBullet`
- Replace current Skia `<Circle>` projectile rendering with sprite-based `<Image>` or atlas rendering using these two assets

---

### 2. Hero auto-rotation to face shot target (Phase 6 polish)

- Compute angle from player to nearest enemy in firing range
- Apply rotation to player sprite render transform
- Target selection: nearest enemy currently being auto-fired at
- **Pre-implementation check:** confirm hero sprite reads correctly at arbitrary angles (45°, 90°, etc). If sprite looks weird at non-cardinal angles, evaluate whether kit has 8-direction variants. If acceptable diagonal look, proceed with arbitrary-angle rotation. If not, fall back to 8-direction cardinal-only rotation.

---

### 3. Raider class visual fix (Phase 5 G4 work, or as standalone commit before G4)

- **Sprite swap:** Raider class gets spec ops soldier appearance
- Mechanics unchanged: mobile, melee, harder than scav
- Resolves "soldier with rocket launcher meleeing player" visual mismatch identified during device testing
- Pure sprite swap, no behavior changes
- Spawn rates and wave balance unchanged

---

### 4. Sniper class design (Phase 5 G4)

- Implement as two visual variants sharing identical mechanics
- **50% of sniper spawns:** kit sniper sprite firing bullet projectiles
- **50% of sniper spawns:** soldier02 (bazooka soldier — previously the raider visual) firing rocket projectiles
- Both variants: same damage, same fire rate, same hit detection, same telegraph mechanic
- Rocket projectile is visual-only — no AOE damage, just sprite differentiation
- Rocket asset can reuse the `rocket-f1` sprite from item 1

---

### 5. Sniper spawn location decision (Phase 5 G4)

- Both sniper variants spawn via the standard wave-spawning pipeline (ground-level), same as other ranged enemies
- **Rooftop spawn layer originally planned for G4 is DEFERRED to v1.1+ if ever revisited**
- Engineering simplicity prioritized: uses existing spawn pipeline, no new rooftop placement logic
- G4 sniper count cap note still applies (planned 3–5 max active snipers) but no longer constrained by rooftop position availability

---

### 6. Bullet color change (Phase 6 polish — Photopea edit)

- GunnerBullet sprite is currently used for all non-rocket projectiles; color reads too dark against the map
- Replace fill with a higher-contrast color (bright yellow, orange, or white glow) in Photopea before Phase 6 ships
- Source asset: `_project-docs/kits/tds-modern-pixel-game-kit/tds-modern-soldiers-and-vehicles-sprites-2/Gunner/Effect/GunnerBullet`

---

### 7. Grenade launcher rocket sprite swap (Phase 6 polish)

- Current gp25 rocket uses `rocket-f1.png`; kit includes a dedicated grenade sprite at `Effects/Grenade Launcher Shot/1.png`
- Swap gp25 projectile to the grenade asset for visual accuracy; all other non-rocket weapons keep GunnerBullet

---

### 8. Optional scav muzzle flash (deferred)

- Raider now has a visual-only muzzle flash; scav does not
- Could extend the same `lastFiredAtMs` + flash frame pipeline to scav using a separate `SCAV_FIRE_COOLDOWN_MS` constant
- Deferred — scav is a melee class conceptually; flash would be pure cosmetic noise. Mo's call when G4 is closed.

---

### 9. Net Phase 5 enemy roster after these decisions

| Class | Type | Notes |
|---|---|---|
| Scav | Mobile melee, basic | Unchanged |
| Raider | Mobile melee, harder | Now visually spec ops soldier (item 3) |
| Sniper variant A | Ground-spawn ranged, bullet | |
| Sniper variant B | Ground-spawn ranged, rocket visual | Same mechanics as A |
| Tank turret | Stationary, 3 visual variants | Spawns after 2 min, drops guaranteed crate |
| Helicopter | Ambient flyby | No attacks |

**Total:** 5 mechanical enemy classes, 6 distinct visual identities. Raider visual mismatch resolved; sniper expanded to two visual variants.

---

## Scope Cuts — May 13 2026

**Status:** Locked decisions, effective immediately. These are not pending changes — they are formal scope changes. Authoritative documentation lives in:
- `strategy-monetization-v1.md` — Sections 13 (cuts) and 14 (enemy/hazard redesigns)
- `shoot-your-way-out-context-v3.md` — v1 Scope Summary (updated) and Build Phase Plan (updated through Phase 10)

| Feature | Decision | Replacement / Notes |
|---|---|---|
| Daily quest system | CUT from v1 | Daily login bonus: free $50/day, paid $300/day, single timestamp check on launch (strategy §5.2) |
| Lightning flash + thunder SFX | CUT from v1 | Rain ships with particles + drifting clouds only. Deferred to v1.1. |
| Helicopter boss (phased attacks) | CUT from v1 | Ambient flyby — no health, no attacks, straight-line pass every 60–90s (strategy §14) |
| Bomber strafe hazard event | CUT from v1 | Static "crashed bomber" map prop, 0–1 per run, no mechanics (strategy §14) |
| Gas bomb hazard | CUT entirely | No replacement planned for v1 or v1.1 |
| Tank as mobile enemy class | CUT from v1 | Stationary turret — 3 visual variants (Humvee/BTR/Panzer), reuses Sniper turret engine (strategy §14) |

**Confirmed for v1 (not cuts):**
- Skill clones — 5 clones confirmed alongside base 20 skills (strategy §7)
- Weapon rarity tiers — Common/Uncommon/Rare/Legendary confirmed (strategy §11)
- Flea market — unchanged (strategy §4)
- Custom UI — already the established pattern since Phase 4b

---

## Phase 5.5 — Gameplay Completion

**Goal:** Close all gameplay-affecting tech debt and feature work before polish phases begin. No UI/sound/menu work until gameplay is at final state.

**Status:** 🟢 Complete — 2026-05-19

---

### Phase 5.5 — Session 1 (2026-05-17)

**Commits:** f0856d1 | 4d8b093 | 00850f4 | 8972100

---

#### f0856d1 — Crate spawn validity (Bug 1)

Weapon crates (runtime entities from `crateEngine.ts`) were placing outside the player-reachable area and on top of solid props (buildings, wrecks, rocks). Two-part fix.

**Edge bounds — device-dependent wall, not a constant:**
Initial implementation used `PLAYABLE_MARGIN = 200` as the world-edge clamp. On-device testing showed crates still landing past the invisible wall. The wall is device-dependent — defined in `gameEngine.ts` as `canvasWidth / (2 * CAMERA_ZOOM)`, which varies by screen size. `PLAYABLE_MARGIN = 200` happened to be smaller than the wall on the test device. Fix replaced `PLAYABLE_MARGIN` with `viewHalfW`/`viewHalfH` (already computed three lines above for the viewport calculation in the same function). Same expression as the player wall — zero drift, device-aware. `PLAYABLE_MARGIN` removed entirely.

**On-prop check — worklet constraint forced a new data structure:**
`tickCrateSpawn` is a `'worklet'` running on the Reanimated UI thread. It can only read data inside `GameState`. Prop positions live in `initialMapData` (React state) — unreachable. Solution: new `solidPropExclusions: Array<{x, y, r}>` computed at map gen time in `mapGenerator.ts` using the existing `scaledHalfSize()` function. Covers buildings, obstacles (rocks), vehicleWrecks. Vegetation and barrels excluded — they're passable and too small to visually block a crate. `CRATE_EXCLUSION_CLEARANCE = 30` adds gap beyond the scaled edge. Array added to `MapData`, threaded into `GameState` via new `createInitialGameState` parameter, read in `tickCrateSpawn` as worklet-accessible exclusion check. Re-rolls up to 10 times; skips cycle if all attempts fail (timer advances regardless). Array is read-only mid-run — `{ ...state }` spread copies the reference cheaply.

**Files:** `mapTypes.ts`, `mapGenerator.ts`, `gameEngine.ts`, `GameCanvas.tsx` (both `createInitialGameState` call sites), `crateEngine.ts`.

---

#### 4d8b093 — Decorative barrel/crate overlap with buildings (Bug 2)

Not in original Phase 5.5 inventory. Surfaced on device after Bug 1 was verified.

`buildBarrels()` orbited props at fixed distances from building centers: `BARREL_BUILDING_MIN_DIST = 50` to `BARREL_CLUSTER_RADIUS = 150` world pixels. After the Phase 5 G2 sprite scale bump (`STRUCTURE_SPRITE_SCALE = 3`), scaled half-sizes of all three building types exceeded the orbit band — barrels and boxes rendered inside building footprints:
- `env_house01` (132px native) → 198px scaled half-size — entire 50–150px orbit is inside
- `env_house02` (263px native, max dim) → ~395px scaled half-size — entirely engulfed
- `env_watchtower` (72px native) → 108px scaled half-size — partially overlaps at 50–108px

"Crates" Mo saw on device are `env_box_*` entries in the same `BARREL_POOL` — not a separate placement system. One fix covers both.

Fix replaced fixed orbit constants with edge-relative gaps: `BARREL_EDGE_MIN = 10`, `BARREL_EDGE_MAX = 90`. Orbit distance computed as `scaledHalfSize(building) + gap` — starts just outside the rendered edge, regardless of building type or scale. Uniform across all three building types; no per-building overrides. Mo chose `BARREL_EDGE_MIN = 10` deliberately: barrels at 10px clearance read as tucked under awnings (houses) or under watchtower stilts. Visual ambiguity intentional — props feel placed in a world, not diagrammatically separated. Matches the v3 binding rule on scaled footprint dimensions.

---

#### 00850f4 — Within-cluster prop-on-prop overlap (Bug 3)

Not in original inventory. Surfaced after Bug 2 fix exposed clusters previously hidden inside building footprints.

`buildBarrels()` placed each prop independently with no inter-prop spacing check. The `inOtherBuilding` guard only checks against other buildings' footprints — not against sibling props already placed in the same cluster. Each prop was independently placed on an orbit arc with no memory of its siblings.

Fix added `clusterPlaced: PlacedEntity[]` per building. Each candidate checked against all previously placed cluster siblings via `tooCloseScaled(candidate, prev, 5)`. Gap = 5px on Mo's call: gap = 0 allows edges-almost-touching which reads as a visual glitch; 5px breathing room reads intentional. Outer attempt cap stays at 80 — if a cluster exhausts valid positions, remaining props silently don't place (fewer barrels in that cluster, acceptable). `def` moved before the acceptance check so `tooCloseScaled` has a full `PlacedEntity` for scaled footprint math. This changes PRNG consumption on failed attempts, which shifts barrel cluster layouts for all seeds — expected for a bug fix. `buildBarrels` runs last in `generateMap` so no other prop category is affected.

---

#### 8972100 — Vegetation density bump + stale MapData docstrings

**Doc drift caught before writing code:** Task was specified as "bump min from 0 to 15, max from 20 to 40." Diagnosis found the `mapTypes.ts:57` docstring ("0–20 trees/bushes, 0 when rain") was stale relative to actual code, which already had 50–80 trees with rain suppression removed since Phase 5 G3. Mo's expected starting values came from the stale doc. Applying the task as written would have reduced vegetation from 50–80 to 15–40.

Actual change: bumped from `50 + Math.floor(rng() * 31)` (50–80) to `70 + Math.floor(rng() * 31)` (70–100). At higher density, random placement naturally produces Poisson-style clumping without explicit cluster logic — v1 solution to the tree-clustering tech debt. Cluster logic deferred to v1.1+ if visual feel post-launch surfaces it as a real problem.

Five stale `MapData` docstrings corrected in same commit (all had drifted during Phase 5 G3):
- `buildings`: "2–3 structures" → "8–12 structures (1 house02, 3–5 house01, 4–6 watchtowers)"
- `obstacles`: "20–40 rocks" → "30–60"
- `vehicleWrecks`: "0–1 bus + 4–14 scatter" → "1 heli + 1 bomber + 2–3 buses + 12–32 scatter = 16–37 total"
- `vegetation`: "0–20 / 0 when rain" → "70–100, rain has no effect"
- `barrels`: "2–5 per building" → "3–5 per building"

---

### Tech debt note — v3 context doc drift confirmed

Two known drifts confirmed this session: vegetation budget values (v3 says 0–20, code says 70–100) and rain-suppression rule (v3 says active, code says removed since Phase 5 G3). Both flagged as known-stale; being tracked in pending-work-inventory.md under "Doc Hygiene." Do not correct these two v3 statements until the full audit runs — partial fixes while other drifts are unknown can create new inconsistencies.

---

### Phase 5.5 — Session 2 (2026-05-17) — Stutter Investigation + File Refactoring

**Surviving commits:** c36019e | 3aa9e7f | f109561 | 33db759 | a7d9568 | 03f007c → 6c689ff | b736633 | ffc2812 | cb2e165

**Net change to codebase:** slotHooks.ts extraction (3aa9e7f) survived. All four tile atlas fix commits reverted. HEAD at end of session: cb2e165.

---

#### File refactoring — GameCanvas context reduction

Two file extractions from GameCanvas.tsx to reduce CC context token cost:

**3aa9e7f — slotHooks.ts extraction (survived):** Extracted slot hook factory functions to `src/lib/slotHooks.ts`. Committed correctly; file tracked in git history.

**64501c8 — useGameSprites extraction (git hygiene incident — file never committed):** Extracted all `useImage` calls to `src/lib/useGameSprites.ts` (271 lines removed from GameCanvas). Commit only modified `GameCanvas.tsx` — the new file was written to disk but never `git add`-ed before committing. File existed only on local disk through end of session. Discovered lost in Session 3 during `git reset --hard`. Recovered by reverting the commit (see Session 3 below). **This commit is a known bad state in history.**

---

#### Stutter investigation — tile atlas experiments

Camera-snap stutter described as movement-correlated and visible on world tiles/props only (hero and enemies unaffected — perceptual asymmetry). STUTTER-DIAG instrumentation added (c36019e) to log `timeSincePreviousFrame > 20ms` from the Reanimated UI-thread frame callback.

Two approaches tested against the tile atlas `useMemo` rebuild, which fires on every 64px tile boundary crossing:

**Option A — f109561: Coarsen rebuild trigger to every 3 tiles.** Changed `setPlayerTileCol`/`setPlayerTileRow` to only fire when the player crosses a 3-tile boundary. Result: STUTTER-DIAG logs showed ~50% reduction in reported long-frame count. Felt improvement on device: **zero** — Mo reported stutter unchanged. Conclusion: throttling rebuild frequency is not the fix.

**Option B — 33db759 + a7d9568 + 03f007c: Pre-allocate tile atlas objects via mutable pool.** Replaced per-rebuild `Skia.RSXform()` allocation with a pre-allocated pool of mutable `SkRSXform` objects, mutated via `.set()` each rebuild. Eliminated per-rebuild JS object allocation entirely. Felt improvement on device: **zero** — Mo reported stutter unchanged. Conclusion: tile atlas JS object allocation is not the primary stutter driver.

Both approaches reverted (6c689ff through cb2e165). HEAD returned to baseline.

**Session 2 conclusions:**
- Tile rebuild frequency reduction → no felt improvement. Do not re-attempt.
- Tile rebuild object allocation elimination → no felt improvement. Do not re-attempt.
- Half-dist Atlas child count (Phase 5 G2, commit b2e6e88) → already in do-not-retry list from G2; not re-attempted here.
- All three tile atlas vector attacks are ruled out. STUTTER-DIAG log correlation between tile crossings and long frames is likely indirect; tile atlas is not the root cause.

---

### Phase 5.5 — Session 3 (2026-05-18) — Stutter Investigation Continued + Recovery

**Net commits to main history:** f565abe (recovery revert only)

**Commits attempted and reverted/reset (not in current history):**
- 703dc2b: ping-pong viability spike (validated pattern only, not shipped)
- 3617398 | 5e9f522 | 81a37df | af6cb24 | 940af63: five-commit ping-pong refactor (all removed by `git reset --hard cb2e165`)
- 9ce511e: tile atlas full-map pre-computation fix (removed by second `git reset --hard cb2e165`)

---

#### Engine-wide ping-pong refactor (5 commits, fully reverted)

**Background — why this was reasonable:** The Open Issues table in this document (entry added 2026-05-14) documented a Phase 9 tech debt theory: the spread-based update pattern (`{...state, ...}`) in all five tick functions produces ~36k–60k object allocations/sec on the Reanimated UI-thread heap, causing 2–4ms GC pauses. This was a documented theory with supporting allocation math, never experimentally tested. Session 3 tested it.

**What was done:** All five engine files (`gameEngine`, `pickupEngine`, `throwableEngine`, `enemyEngine`, `combatEngine`) converted from immutable spread pattern to in-place mutation. A two-buffer ping-pong was implemented (`copyGameState` field-copy into pre-allocated buf0/buf1) to satisfy Reanimated v4's requirement that `useDerivedValue` fire on reference changes. `applyAOEDamage` signature simplified to void in-place mutator. A pre-existing bug (missing `nextTankProjectileId` in `copyGameState`) caught and fixed during planning.

**Result:** Felt improvement: **zero**. STUTTER-DIAG logs after all five commits showed **more** long frames than the pre-refactor baseline. Traced to element-wise copy loops added to `copyGameState` for enemies/pickups/crates — 1,090 field assignments per tick of unconditional CPU overhead that negated any GC reduction. All five commits removed via `git reset --hard cb2e165`.

**Conclusion:** Engine-wide spread allocation is not the primary cause of felt stutter. The documented Phase 9 tech debt theory (36k–60k objects/sec → GC pauses → camera snap) is **disproved by direct experiment**. Do not re-attempt this refactor as a stutter fix. The two-buffer ping-pong pattern itself was validated and is available if a future fix requires it, but it does not address the stutter root cause.

---

#### Tile atlas full-map pre-computation (attempted, reverted)

After the ping-pong revert, STUTTER-DIAG log analysis showed near-1:1 correlation between `tileAtlas rebuild` log entries and long-frame entries. Proposed as a fix: change the tile atlas `useMemo` to pre-compute all 94×94 tiles at mount (deps `[initialMapData]` only), eliminating per-crossing rebuilds entirely.

This collided with the Session 2 Option B finding: that approach eliminated the per-rebuild JS allocation entirely via mutable pooling, with zero felt improvement. If allocation elimination did not help, then pre-computing at mount (which also eliminates allocation) cannot be the cause either. The STUTTER-DIAG log correlation between tile crossings and long frames is real but not causal — the tile rebuild is a bystander, not the driver.

Reverted via second `git reset --hard cb2e165`.

**Conclusion:** Tile atlas fixes ruled out across Sessions 2 and 3 (allocation, frequency, elimination). Do not re-attempt.

---

#### React DevTools profile — JS thread ruled out

Mo recorded a 24.9-second React DevTools Profiler trace during active gameplay with sustained movement.

**Results:**
- 231 React commits in 24.9s = 9.3 commits/sec, matching the 100ms timer cadence (this is JS-thread React reconciliation, not the 60fps Reanimated worklet)
- GameCanvas render durations: 27% under 8ms, 54% between 8–12ms, 16% between 12–16ms, 5 commits over 16ms
- All 5 slow commits coincide with modal open/close events (crate reveal, level-up) — worst single commit: 94ms during crate reveal modal mount/unmount
- Steady-state renders (no modal events): consistent 8–12ms, well within the 100ms timer budget

**Conclusion:** JS-thread React reconciliation is not the primary cause of camera-snap stutter during sustained movement. Steady-state JS renders are healthy. The stutter occurs between React commits, in the Reanimated worklet on the UI thread, which React DevTools cannot observe.

**Side finding:** Modal mount/unmount produces ~94ms React commits. Visible as a hitch when opening/closing the crate reveal modal. Separate from the sustained-movement stutter. Logged as tech debt for Phase 7 (see pending-work-inventory.md).

---

#### Git hygiene incident — useGameSprites.ts lost and recovered

Session 2's commit 64501c8 had only modified `GameCanvas.tsx` — the new `src/lib/useGameSprites.ts` was written to disk but never `git add`-ed before committing. The file existed only on local disk through all of Session 2 testing. Session 3's `git reset --hard cb2e165` removed it permanently (not recoverable from git history).

**Symptom:** Game failed to launch. `GameCanvas.tsx` imports from `'../lib/useGameSprites'` which no longer exists.

**Recovery:** `git revert 64501c8` → commit f565abe. The 271 lines of `useImage` calls are back inline in `GameCanvas.tsx`. The slotHooks.ts extraction (3aa9e7f) survived correctly.

**Net result:** GameCanvas file refactoring is at partial state — extraction #1 (slotHooks.ts) complete, extraction #2 (useGameSprites) reverted and unrecoverable. Can be re-attempted in a future session.

**Workflow rule established for all future extractions:** Write new file → `git status` (verify it shows as untracked) → `git add` → `git commit`. Committing without the middle two steps ships a broken state silently. This rule applies to all future new-file extractions.

---

#### Ruled out across Sessions 2 and 3

| Vector | Approach | Result | Do not re-attempt |
|---|---|---|---|
| Tile rebuild allocation | Session 2 Option B (mutable pool) | Zero felt improvement | ✅ |
| Tile rebuild frequency | Session 2 Option A (3-tile coarsening) | ~50% log reduction, zero felt improvement | ✅ |
| Tile rebuild elimination | Session 3 full-map pre-computation | Zero felt improvement | ✅ |
| Half-dist Atlas child count | Phase 5 G2 b2e6e88 | Already in do-not-retry list | ✅ |
| Engine-wide spread allocation | Session 3 5-commit ping-pong refactor | Zero felt improvement (worse with element-wise copy overhead) | ✅ |
| JS-thread React reconciliation | Session 3 React DevTools profile | Healthy steady-state; not the cause | ✅ |

---

#### Current state and next steps

- **HEAD:** f565abe
- STUTTER-DIAG instrumentation (c36019e) still present. Strip before production build.
- All stutter-fix work from Sessions 2 and 3 reverted. Game is at the engine-spread + tile-rebuild baseline.
- Two-buffer ping-pong pattern validated but not in use.

**Next session:** Android Studio System Trace (Perfetto). Mo installing Android Studio this evening. All ruled-out vectors attacked the JS thread or JS-allocated objects. The camera-snap stutter is measured on the UI thread; remaining suspects (worklet GC, worklet CPU cost, Skia rendering, JSI bridge overhead) are all UI-thread or native-layer phenomena invisible to JS-side profilers. System Trace sees all threads simultaneously and is the only remaining diagnostic approach that can directly answer "what was executing on the UI thread during a long frame."

**Do not re-attempt** any ruled-out vector. Do not run another diagnose-from-inference fix attempt without profiling data first. Four such attempts (Sessions 2 and 3) have exhausted this approach.

---

### Phase 5.5 — Session 4 (2026-05-18) — System Trace + RSXform approach + Camera smoothing

**Commits in history:** b03dfb6 | fada6b4 | df39766 | f92621b | 2e473c3 | f0f0f05

**Phase A v2/v3 + camera smoothing (removed by `git reset --hard f0f0f05` — not in history):** bedf469 (Phase A v2) | 628a9e4 (Phase A v3) | f6bf271 | c30b89a | 5dc16f5 (camera smoothing)

**Net change to codebase:** HEAD returned to f0f0f05 (baseline with Phase A v1 reverted). Diagnostic instrumentation from c36019e and 92362a8 still present. All session 4 fix attempts reverted.

---

#### ADB + profiling workflow

ADB wireless debugging failed (device not discoverable over network). Fell back to USB. Standalone Android Studio profiler used directly without opening a full Android project:
- Profiler binary: `C:\Program Files\Android\Android Studio\bin\profiler.exe`
- System Trace task selected
- 26.7-second capture at HEAD c6c07b4, sustained joystick movement throughout

---

#### System Trace results — root cause confirmed

**5 janky frames in 26.7 seconds:**

| Frame | Duration | Application | GPU | Composition |
|---|---|---|---|---|
| 166802285 | 26.09 ms | 2.45 ms | 702 µs | 9.63 ms |
| 166802345 | 18.88 ms | 2.55 ms | 565 µs | 9.6 ms |
| 166802890 | 17.35 ms | 1.43 ms | 307 µs | 9.68 ms |
| 166814229 | 21.93 ms | 1.8 ms | — | 9.59 ms |
| 166815735 | 17.98 ms | 1.4 ms | 450 µs | 9.58 ms |

**Android Studio jank classification for frame 166815735 (representative):**
- Jank type: **Buffer stuffing**
- Render thread blocked on `dequeueBuffer` waiting for SurfaceFlinger to free a buffer slot
- Frame rendered in 6.6ms — app code and GPU are fast; delivered late because buffer queue was full

**Hypotheses tested and falsified:**

| Hypothesis | Test | Result |
|---|---|---|
| JS frame callback over-submitting (producing >60fps) | fcb/sec logging (92362a8) | ~60fps confirmed — not the overproducer |
| Buffer stuffing caused by heavy content | MINIMAL_STATE_TEST flag (b03dfb6) — stripped gameplay state from canvas | Still occurred — content is not the driver |
| Buffer stuffing caused by prop rendering | HIDE_PROPS_TEST flag (fada6b4) — stripped static prop rendering | Still occurred — props are not the driver |
| Touch input pressure blocking frames | Pre-janky frame 8793 analysis | Structurally identical to normal; one janky frame had no touch event at all |
| historySize bloat from coalesced touch events | Trace inspection | historySize=0 on all frames — no coalesced events |
| GC causing pauses | GC events in trace | None present |

Both diagnostic flag commits reverted (df39766, f92621b) — flags served their purpose.

**Confirmed root cause:** Animated camera `Group` with Reanimated animated `transform` triggers full Skia re-composition of all children on every SharedValue write (Skia GH#3327). `cameraTransform` updates every frame; all tile `Atlas` children re-compose with it — producing multiple Skia render passes per vsync and filling the SurfaceFlinger buffer queue.

---

#### Phase A — move tiles out of animated camera Group (RSXform approach)

Goal: eliminate animated Group re-composition by computing tile world positions as RSXform values; tiles render outside the camera Group via `Atlas` with world-space transforms.

**Phase A v1 (2e473c3, in history, reverted at f0f0f05 — also attempted in prior session context):**

Used `useRSXformBuffer` from RN Skia's Reanimated integration. Key flaw: `useRSXformBuffer` calls `startMapper` during the React render phase (not `useEffect`) — duplicate mappers accumulate on every re-render. Additionally, `SharedValue` writes inside `useMemo` triggered Reanimated's "writing to value during render" violation. Tiles did not render. FCB rate dropped to 29–41/sec.

**Phase A v2 (bedf469, not in history):**

Fixed render-phase write violation by moving all SharedValue writes to `useEffect`. Eliminated camera-snap stutter on device. **Framerate tanked to ~30fps.** Three cost drivers identified from RN Skia source (`buffers.ts`):
1. `useRSXformBuffer`'s `forEach` iterates all 1000 buffer entries unconditionally per frame (only ~287 visible) — 3.5× wasted work
2. `startMapper` still called during render → duplicate mappers on tile-crossing re-renders → burst of redundant mapper invocations at every boundary
3. `dirtTilePositions.value` read 1000×/invocation (once per modifier call); `gameState.value.player.x/y` read ~287×/invocation — ~180,000+ SharedValue reads/sec total across three buffers

**Phase A v3 (628a9e4, not in history):**

Bypassed `useRSXformBuffer` with a custom `startMapper` registered in `useEffect`. Hoisted SharedValue reads to 2/invocation (not 2000). Replaced per-entry function call with inline for-loop. **Same ~30fps wall.** Driver 1 (`val.set()` × ~3000/frame: ~285 visible tiles × 3 buffer arrays) confirmed as the remaining bottleneck. This workload is structurally too expensive at current tile density on Pixel 6.

**Phase A conclusion:** RSXform worklet approach is structurally limited at 1000+ tile buffer size. All Phase A commits removed via `git reset --hard f0f0f05`. Do not re-attempt.

---

#### Option B — Camera smoothing (masking approach)

Hypothesis: if snaps are imperceptible, root cause becomes lower priority. Implemented exponential lerp: `cameraX.value += (target - cameraX.value) * CAMERA_LERP` inside `useFrameCallback`. Two separate `useSharedValue` for cameraX and cameraY; `cameraTransform` derived from them.

**f6bf271 (not in history):** Initial smoothing at `CAMERA_LERP=0.2`. Bug discovered: `useSharedValue(gameState.value.player.x)` reads `.value` during render (arguments evaluated eagerly on every render) → Reanimated "Reading from value during component render" warnings.

**c30b89a (not in history):** Fixed render-phase read by extracting `createInitialGameState` result to a named variable and using `initialGameState.player.x/y` for `useSharedValue` initialization. No Reanimated warnings. Stutter still perceptible at `CAMERA_LERP=0.2` (~3 frames to absorb a snap).

**5dc16f5 (not in history):** Tightened to `CAMERA_LERP=0.1` (~7 frames to absorb a snap). Stutter still perceptible; camera motion now visibly laggy.

**Option B conclusion:** Camera snaps are too large to mask at any reasonable lerp factor without making camera feel broken. All smoothing commits removed via `git reset --hard f0f0f05`. Do not re-attempt camera smoothing as a stutter mask.

---

#### Cumulative do-not-retry list (Sessions 2–4)

| Vector | Approach | Result |
|---|---|---|
| Tile rebuild allocation | Session 2 Option B (mutable pool) | Zero felt improvement |
| Tile rebuild frequency | Session 2 Option A (3-tile coarsening) | Zero felt improvement |
| Tile rebuild elimination | Session 3 full-map pre-computation | Zero felt improvement |
| Half-dist Atlas child count | Phase 5 G2 b2e6e88 | Zero felt improvement |
| Engine-wide spread allocation | Session 3 5-commit ping-pong refactor | Zero felt improvement (worse) |
| JS-thread React reconciliation | Session 3 React DevTools profile | Healthy; not the cause |
| RSXform worklet tiles (useRSXformBuffer / custom startMapper) | Session 4 Phase A v2/v3 | Eliminated snap, tanked framerate to 30fps |
| Camera smoothing | Session 4 CAMERA_LERP 0.2/0.1 | Snaps too large to mask at any reasonable factor |

---

#### Current state and next steps

- **HEAD:** f0f0f05 (clean, diagnostic instrumentation c36019e + 92362a8 still present — strip before production)
- Root cause confirmed: animated camera `Group` re-composition (GH#3327) forces full Skia re-paint of all tile Atlas children every vsync

**Next session — B1:** Replace Skia tile rendering with a React Native native `<Image>` component for the terrain floor. Animate position via Reanimated `useAnimatedStyle` (translateX/Y derived from player position via `useDerivedValue`). This bypasses Skia composition entirely for tiles — the hypothesis is that a native View animated by `useAnimatedStyle` routes through RN's native animation driver (Reanimated JSI → native view system), not through Skia, eliminating the buffer-stuffing pressure.

Known trade-off: abandons procedural per-tile RSXform rendering. The floor becomes a single positioned image rather than individually-placed tile sprites. The floor asset will need to tile natively via RN's Image `resizeMode` or be a pre-rendered full-map PNG.

Honest uncertainty: if native animated `<Image>` still routes through Skia under the hood (possible on Android with certain RN versions), this approach hits the same wall. Worth one session to test before considering more invasive alternatives.

---

### Phase 5.5 — Session 5 (2026-05-19) — B1 native floor, screen-space props, viewport culling, ImageShader floor

**Commits attempted (all removed by `git reset --hard f0f0f05` — hashes not preserved):**
Multiple commits across 8 phases (B1 floor, screen-space PropImage, React.memo, culling). All session 5 commits were reset; HEAD returned to f0f0f05.

**Net change to codebase:** HEAD at f0f0f05 (same as end of Session 4). Working tree clean.

---

#### Phase 1 — B1 native floor attempt (4 commits, all reverted)

Implemented the B1 plan from Session 4: replaced Skia tile Atlas floor with a React Native `<Image>` component, animated via Reanimated `useAnimatedStyle` with `translateX`/`translateY` derived from player position. Positioned underneath the Skia `<Canvas>` in the JSX tree. Four commits implementing and iterating the approach.

**Risk B materialized:** Android's Fresco-backed `Animated.Image` does not honor `resizeMode="repeat"`. The 512×512 floor texture stretches to fill the container regardless of the `resizeMode` prop value. This is a documented Fresco limitation — tiling repeat is not supported in the Fresco image pipeline.

All B1 commits reverted. B1 native floor approach ruled out.

---

#### Phase 2 — PictureRecorder for props (analytically rejected)

Evaluated using Skia's `PictureRecorder` API to snapshot all prop draw commands into a static `SkPicture`, then replay the picture with a computed offset. Hypothesis: a single Picture draw call produces less Skia composition pressure than multiple Atlas/Image children.

Rejected analytically: the re-composition driver is the animated camera `Group` transform updating every frame (GH#3327). A PictureRecorder replay is still a Skia draw operation inside or alongside that Group — it would still trigger per-frame re-composition. The approach does not address the root cause. Not implemented.

---

#### Phase 3 — Camera Group elimination to screen-space (commit 548152e, not in history)

Eliminated the animated camera `Group` entirely. All 150–250 prop `PropImage` components moved to screen-space: each receives a per-prop `useDerivedValue` computing `width/2 + (ent.x - px) * CAMERA_ZOOM` and `height/2 + (ent.y - py) * CAMERA_ZOOM`. Effect zones and detonating throwables received new screen-space slot hooks (`useZoneSlotTransform`, `useDetonatingThrowableTransform`) added to `slotHooks.ts`. Tile Atlas and floor `Animated.Image` remain inside the `cameraTransform` Group (floor still broken on Android; tiles still present).

**Device test:** Stutter frequency reduced. Character changed: original camera-snap (world jumps forward and snaps) replaced by rubber-band (props snap back over a longer distance after movement). Hero and enemy sprites remain completely stable throughout — same perceptual asymmetry as before, different manifestation.

**Conclusion:** Eliminating the animated camera Group IS the correct structural direction — reduced frequency validates the GH#3327 diagnosis. Rubber-band character is a new pattern requiring separate investigation.

---

#### Phase 4 — React.memo on PropImage (commit cc1d89e, not in history)

Hypothesis: each 100ms React state update causes GameCanvas to re-render, unmounting and re-mounting PropImage components, triggering `useDerivedValue` re-registration, producing a per-100ms subscription throughput burst visible as rubber-band.

**Implementation:** Wrapped `PropImage` in `React.memo`. Added `[PROP-RENDER]` console.log inside `PropImage` body.

**Device test / diagnostic result:** `[PROP-RENDER]` logs fire once at mount (plus a batch at ~1700ms during initial image load). NOT every 100ms. Re-registration hypothesis falsified — React.memo is working correctly; PropImage does not re-render at timer cadence. Stutter unchanged.

**Conclusion:** Rubber-band stutter is not caused by PropImage re-registration. The subscription is stable between mounts.

---

#### Phase 5 — Viewport culling at 400px buffer (commit 63bc21d, not in history)

Hypothesis: props near the viewport edge produce rubber-band because they are partially on-screen, making subscription lag visible at entry/exit. Culling props beyond `PROP_CULL_BUFFER = 400` world-pixels of the viewport would keep only props with stable screen-space positions mounted, eliminating edge-transition noise.

**Implementation:** `VisibleProps` state object with per-category boolean arrays (`visVeg`, `visBarrel`, `visObstacle`, `visStructure`, `visWreck`). `computeVisibleProps()` with axis-aligned world-space check. Initial state pre-computed from spawn position `(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)`. `prevVisPropsRef` gates `setState` to prevent unnecessary re-renders.

**Device test:** Rubber-band character persisted at higher frequency than pre-culling 548152e baseline.

**Conclusion:** Culling made it worse. Mount-race theory: culling concentrates all prop mounts at the viewport boundary by definition. First-frame race on `useDerivedValue` registration (React reconciliation on JS thread → worklet registration on UI thread → first value to Skia) adds noise at every mount event. With culling, all mounts happen near the player — mount noise becomes visible near the player. This explains the increased frequency but does not explain the baseline rubber-band before culling was added.

---

#### Phase 6 — Viewport culling at 800px buffer (commit a17f845, not in history)

Single-line change: `PROP_CULL_BUFFER = 400` → `PROP_CULL_BUFFER = 800`.

**Device test:** Zero change from 400px. Frequency and character identical.

**Conclusion:** Buffer size is not the variable. Mount-race noise is occurring regardless of buffer width.

---

#### Phase 7 — Atomic shared snapshot theory (analytically falsified, no code)

**Theory:** Multiple `useDerivedValue` worklets reading `gameState` in the same vsync do not atomically snapshot the same state. If `gameState.value` is partially updated between worklet executions, different props would render positions from different state versions — producing viewport-edge-specific tearing.

**Falsification:** The Reanimated UI thread is single-threaded. Worklet executions are sequential — no interleaving is possible. Non-atomic reads would produce uniform positional inconsistency across all props on every frame, not viewport-edge-specific rubber-band. The behavioral evidence (rubber-band only at entry/exit, not during continuous visibility) is inconsistent with non-atomic reads. Not implemented.

---

#### Phase 8 — ImageShader floor fix (TypeScript compile failure, changes discarded)

After all stutter fixes reverted, attempted a separate fix for the broken Android floor (`resizeMode="repeat"` broken on Fresco). Plan: replace `Animated.Image` floor with Skia `<Fill><ImageShader tx="repeat" ty="repeat" transform={floorShaderTransform}/>`. Transform formula: `[{ translateX: px - width/2 }, { translateY: py - height/2 }]` to scroll world-UV correctly at `CAMERA_ZOOM=1.0`.

**TypeScript failure:** In `@shopify/react-native-skia` v2.2.12, the `transform` prop on `<ImageShader>` is explicitly excluded from `AnimatedProps<ImageShaderProps, never>`. The prop type is `Omit<AnimatedProps<ImageShaderProps, never>, "transform" | "fit" | "tx" | "ty"> & { ... }`. A `DerivedValue<...>` is rejected at compile time — `<ImageShader>` accepts only a static Skia matrix for `transform`. The floor would render but never scroll.

Per plan discipline, this was surfaced rather than worked around. Changes discarded via `git restore`. ImageShader path ruled out at v2.2.12.

---

#### Reset to f0f0f05

All session 5 commits removed via `git reset --hard f0f0f05`. Working tree clean.

---

#### Mount-race theory — new finding this session

**Why rubber-band appears at viewport entry/exit but not during continuous visibility:**

When a `PropImage` is continuously in view, its `useDerivedValue` subscription is active and receiving every-frame updates — positional lag is imperceptible because the subscription never stales.

When a prop enters the viewport for the first time, there is a first-frame race: React reconciliation on the JS thread schedules the mount; `useDerivedValue` registers its worklet subscription on the UI thread; Skia receives the first computed position value. During this registration gap, the player has moved — the first rendered position is stale. This manifests as a visible snap-then-catch-up: rubber-band.

**Why culling made it worse:** With culling enabled, all prop mounts happen near the viewport boundary by definition — that is where `isVisible` transitions from false to true. Pre-culling (548152e baseline), props are mounted at game start and subscriptions are already registered by the time the player approaches them. Culling converted stable subscriptions to on-demand subscriptions, maximizing mount-race exposure.

**What mount-race theory does not explain:** The baseline rubber-band at 548152e before any culling was added. At 548152e, all 150–250 props are mounted at game start. If mount-race only happens at first mount, and first mount happens before gameplay starts, all subscriptions should be stable by the time the player moves. Yet rubber-band is still present. Mount-race explains why culling made it worse; it does not explain the underlying cause of the baseline rubber-band.

---

#### Cumulative do-not-retry list (Sessions 2–5)

| Vector | Approach | Result |
|---|---|---|
| Tile rebuild allocation | Session 2 Option B (mutable pool) | Zero felt improvement |
| Tile rebuild frequency | Session 2 Option A (3-tile coarsening) | Zero felt improvement |
| Tile rebuild elimination | Session 3 full-map pre-computation | Zero felt improvement |
| Half-dist Atlas child count | Phase 5 G2 b2e6e88 | Zero felt improvement |
| Engine-wide spread allocation | Session 3 5-commit ping-pong refactor | Zero felt improvement (worse) |
| JS-thread React reconciliation | Session 3 React DevTools profile | Healthy; not the cause |
| RSXform worklet tiles (useRSXformBuffer / custom startMapper) | Session 4 Phase A v2/v3 | Eliminated snap, tanked framerate to 30fps |
| Camera smoothing | Session 4 CAMERA_LERP 0.2/0.1 | Snaps too large to mask at any reasonable factor |
| B1 native floor (Animated.Image resizeMode="repeat") | Session 5 Phase 1 | resizeMode="repeat" ignored by Android Fresco — texture stretches to fill |
| PictureRecorder for props | Session 5 Phase 2 | Analytically rejected — still Skia, still subject to GH#3327 |
| Screen-space PropImage / camera Group elimination | Session 5 Phase 3 (548152e) | Reduces frequency; changes character to rubber-band; underlying cause unidentified |
| React.memo on PropImage | Session 5 Phase 4 (cc1d89e) | No improvement; re-registration hypothesis falsified |
| Viewport culling at 400px | Session 5 Phase 5 (63bc21d) | Frequency increased — mount-race amplified at boundary |
| Viewport culling at 800px | Session 5 Phase 6 (a17f845) | Zero change from 400px — buffer size not the variable |
| Atomic shared snapshot approach | Session 5 Phase 7 | Analytically falsified — UI thread is single-threaded |
| ImageShader floor transform | Session 5 Phase 8 | transform excluded from AnimatedProps at v2.2.12 — TypeScript compile failure |

---

#### Current state and next steps

- **HEAD:** f0f0f05 (same as Session 4 end). Animated camera Group present. Floor broken on Android (Fresco + resizeMode). Diagnostic instrumentation c36019e + 92362a8 still present — strip before production.
- **Validated direction:** Eliminating the animated camera Group reduces stutter frequency and changes character — this is the correct structural path. Implementation challenge: how to render tiles + props outside the animated Group without hitting an RSXform cost wall (Session 4) or a rubber-band issue (Session 5).
- **Floor fix:** Both known approaches are blocked (B1 native floor: Fresco limitation; ImageShader: transform not animatable at v2.2.12). Needs a new plan.
- **Underlying rubber-band cause:** Unknown. Mount-race explains why culling regressed frequency; it does not explain the baseline rubber-band at 548152e. Root cause identification deferred — requires new diagnostic approach or an architectural approach that sidesteps the issue entirely.

**Next session approach TBD.** Do not re-attempt any item on the cumulative do-not-retry list.

---

### Phase 5.5 — Session 6 (2026-05-19) — THE STUTTER FIX + Feature Sprint to Gameplay Completion

**Commits:** 67c0bfb | aeb1d8c | 5a342e5 | c3a86d6 | 3d1fc57 | 623f4bd | 745cb70 | 23fe135 | 6fff044 | 4c43cba | 92dab24 | 28ab327 | b1fe4c8

---

#### The stutter fix — session open context

Five days and five sessions of investigation ended Session 5 with `git reset --hard f0f0f05` and no fix landing. Session 6 opened with Mo considering a full engine rebuild to Phaser. Before committing to rebuild, Mo tried one more small fix: cap the game at 30fps.

CC's research found three possible mechanisms (throttle `useFrameCallback`, Skia vsync config, fixed timestep). Source-grounded analysis confirmed:
- Skia vsync config: not viable in v2.2.12 (no API)
- Fixed timestep with 60fps render: doesn't fix root cause (`cameraTransform` still fires 60×/sec)
- Throttle `useFrameCallback` via time accumulator: viable, ~5 lines

**Commit 67c0bfb** shipped the time accumulator: `TICK_INTERVAL_MS = 33.333` constant, `tickAccMs` SharedValue, remainder-carry-forward gate that returns early when not enough time has accumulated. Game logic and rendering both throttled to 30fps. Mo tested on device.

**Mo's exact words after device test: "claude..... my jaw is dropping. its fixed."**

---

#### Why it worked — the mechanism

The bug was never per-frame cost. It was throughput mismatch with SurfaceFlinger's buffer queue.

At 60fps, every vsync produced a buffer submission. GH#3327 (the documented Skia Android bug) made the animated camera Group invalidate its entire subtree on every transform change — a full Skia re-composition every vsync. The composition itself fit in budget (~9ms), but submitting 60 of these per second filled SurfaceFlinger's queue faster than it could drain. When the queue filled, the next submission waited. That wait time was the visible stutter.

Session 4's System Trace data was always pointing at it — all 5 janky frames showed App thread work of only 1.4–2.5ms with 17–26ms total duration. The gap was `dequeueBuffer` wait, not work. We read it as "something is slow" instead of "the queue is full."

At 30fps, half the submissions. Queue drains between them. Buffer stuffing eliminated.

**Lesson logged:** Throughput-mismatch bugs look like cost bugs. Read the time gap as wait, not as work, when the data points there.

---

#### Two latent bugs exposed by 30fps

The 30fps cap changed the visibility of two pre-existing bugs that 60fps timing had masked.

**Phantom enemy leg (commit 5a342e5).** Enemy slot's inactive branch in `slotHooks.ts` returned screen coordinate `(0,0)` — the top-left corner — when every other slot type (projectile/pickup/crate) used `-9999` off-screen. Race condition: `gameState.value.enemies[slot]` goes null at the game tick, `useEnemySlotTransform` worklet returns `(0,0)` immediately, but `enemySlotTypes[slot]` in React state lags up to 100ms behind the 100ms timer. During the race window, the JSX renders the slot at screen `(0,0)` with stale sprite frame for 1–6 frames depending on framerate. Bug was MORE visible at 60fps (~6 frames) than at 30fps (~3 frames), but Mo first noticed during extended testing after helicopter flyby shipped (which gave more sustained playtime to spot it). Race is frame-rate-independent. Fix: change enemy inactive transform to `-9999`, matching the established pattern.

**Pickup orbit (commit c3a86d6).** Phase 3 G4a fixed an earlier "tail-chase / can't catch up" pickup magnet bug by removing acceleration and using direct-pull at `MAGNET_MAX_SPEED`. That speed was bumped to 1200 at some point after G4a. At 60fps with `dtSec=0.01667`, step distance was ~20px per tick — orbit zone math required `d ≤ step-12 = 8px`, but `d > 12px = collected`; no orbit possible. At 30fps with `dtSec=0.03333`, step distance doubled to ~40px — creating a persistent 16px-wide orbit ring (`12px < d ≤ 28px` where pickup overshoots through collection radius and lands on far side, oscillating forever). Fix: structural overshoot clamp `stepDist = Math.min(MAGNET_MAX_SPEED_PX_PER_SEC * dtSec, dist)` — pickup stops at player position when it would overshoot. Geometrically prevents orbit at any framerate or speed setting.

Both bugs were latent. Frame rate timing had masked them. Fixed for free by the 30fps change exposing them.

---

#### Hero auto-rotation to face shot target (commit 3d1fc57)

First major gameplay feature shipped after stutter fix. Hero rotates to face the weapon's auto-targeted enemy when stationary; existing rotation-to-movement-direction preserved when moving. Reuses existing weapon targeting logic + existing angular-step machinery (`PLAYER_MAX_ANGULAR_SPEED_RAD_PER_SEC`). Hero sprite renders smoothly at arbitrary angles.

Implementation highlights:
- Hoisted `weapon`/`effective` out of the if-block (both branches need `effective.rangePx`)
- Extracted angular step to after both branches (runs uniformly)
- New else branch with O(50) enemy scan for nearest alive in weapon range
- Target-scanning loop duplicated with `combatEngine`'s scan — acceptable tradeoff to keep combatEngine.ts untouched per high-risk-file flag

**Mo's reaction:** "holy shit, might have been one of the best things we have added. massive improvement. makes the hero feel like a tactical badass. works perfect too!"

---

#### Player muzzle flash (commits 623f4bd, 745cb70)

Reused raider muzzle flash visual (`muzzle_flash_raider`, 3 frames) + same `RAIDER_FLASH_OFFSET` (verified Group-local at `HERO_SPRITE_SCALE = ENEMY_SPRITE_SCALE = 2`, ports directly). Player fire stamps `lastFiredAtMs` in `combatEngine`; 100ms timer computes flash frame index identical to raider/sniper/tank pattern. Time-based animation, no fire-rate awareness needed.

Skip list: Rocket Launcher (`gp25`) and Flamethrower (`rpo`) don't show muzzle flash. Gate in 100ms timer (presentation layer) for clean semantic separation.

**Bullets-from-gun-barrel — SCRAPPED.** Original Phase 6 plan bundled muzzle flash + bullet origin correction together. Mo's observation after auto-rotation + muzzle flash shipped: with hero facing target and muzzle flash anchored at barrel, the bullet spawn position is visually irrelevant. Direction perception is what matters. Feature removed from inventory.

---

#### PKM removal + doc reconciliation (commit 23fe135)

PKM (Machine Gun) was dormant dead code — defined in `weapons.ts` but excluded from `CRATE_TIER_WEAPONS`, no `weaponHudIcons` entry, no acquisition path. Removed entirely. Reconciled stale references across v3 doc and progress-log (Phase 4a entries about L4/L8/L12 weapon progression that no longer exists in code, Shotgun pose mapping correction). Player-facing weapons confirmed at 7: Pistol, SMG, Assault Rifle, Shotgun, Sniper Rifle, Rocket Launcher, Flamethrower.

---

#### Weapon rarity tiers (commits 6fff044, 4c43cba)

Per strategy doc Section 11, with Mo's design adjustments:
- 4 tiers: Common/Uncommon/Rare/Legendary with damage multipliers 1.0/1.1/1.2/1.3×
- Drop weights: 50/30/15/5
- Two independent rolls per crate: weapon type (uniform 1/6 across 6 non-pistol weapons) + rarity tier
- Visual: tier label text in tier color; color border initially shipped then removed in 4c43cba — label alone reads cleaner on device
- Auto-discard rule (strategy doc Section 11.6) scrapped per Mo's call — rarity is informational, not gatekeeping. Player always sees Equip/Scrap regardless of tier comparison.
- Starter Pistol: always Common, rarity not displayed in modal
- Flamethrower zone DoT scales with rarity multiplier; skills do NOT scale flamethrower (intentional — flamethrower is mechanically distinct from projectile weapons)

---

#### Skill clones (commit 28ab327)

5 stat-modifier skill clones per strategy doc Section 7:
- Heavy Plate (-12% damage taken, maxStacks: 3) — clone of Plate Carrier, intentionally slightly stronger per stack
- Knee Pads (-6% damage taken, maxStacks: 2) — clone of Ceramic Insert
- FMJ Ammo (+18% damage, maxStacks: 3) — clone of AP Rounds
- ACOG (+12% range, maxStacks: 3) — clone of Red Dot
- Energy Bar (+12 max HP, maxStacks: 3) — clone of MRE

No engine changes required — all 5 effect fields already existed. Pool grew from 20 → 25 skills. Clones stack additively with originals (intentional — late-run power fantasy moment for players who happen to roll original + clone together).

---

#### Flame frame duration adventure (commits 92dab24 → b1fe4c8)

`MOLOTOV_FIRE_FRAME_DURATION_MS = 120` was misaligned with the 100ms sprite timer, causing frames 0 and 5 to stall at ~200ms during the 840ms flame zone lifetime. Changed to 100ms in 92dab24. Device test revealed the 700ms cycle within 840ms zone lifetime started a visible partial second loop after the animation completed. Reverted to 120 in b1fe4c8 with comment documenting the intentional choice (7 × 120 = 840ms exactly matches zone lifetime). Net: no change to flame animation, but the constant now has an explanatory comment.

Naming debt noted: `MOLOTOV_FIRE_FRAME_DURATION_MS` is stale (Molotov uses static `explodeImages[2]`, doesn't use this constant). Accurate name would be `FLAME_ZONE_FRAME_DURATION_MS`. Rename deferred as future cosmetic cleanup.

---

### ✅ Phase 5.5 — COMPLETE (2026-05-19)

All Phase 5.5 inventory items shipped or formally scrapped. Game is gameplay-complete. Polish and UI work begins in Phase 6.

---

## Phase 6 — Audio + atmospheric effects

**Goal:** Audio engine fully implemented (music + SFX channels), all 25 SFX wired and playing, 4 music tracks looping correctly, fog-of-war, rain particles + drifting clouds (rain runs only — no lightning, no thunder), vignette, muzzle flashes, bullet origin correction, explosion and smoke effects rendering.

**Status:** Not started

---

## Phase 7 — UI + persistence + analytics

**Goal:** Polished main menu, settings panel with volume sliders, pause menu, game over screen with stats, persistence (high score, total kills, etc.), minimap, PostHog analytics events firing.

**Status:** Not started

---

## Phase 8 — [TBD — original content cut]

**Goal:** ~~Helicopter boss spawning every 2 minutes with both phases (normal + enraged), Gas Bomb hazard randomly spawning, Bomber strafe events between bosses, hero death animation polish.~~ All cut per Scope Cuts 2026-05-13: helicopter boss replaced by ambient flyover (shipped Phase 5); bomber strafe replaced by static prop (shipped Phase 5 G2); Gas Bomb cut entirely with no replacement. Phase 8 scope to be redetermined during Phase 7 planning.

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

