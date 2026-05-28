# Pending Work Inventory

Canonical source for all forward-looking work on Shoot Your Way Out. Reference this doc before any session to understand what's pending. Items move out of this doc as they're completed (and their completion is logged in progress-log.md).

## Phase 5.5 — Gameplay Completion

**Goal:** Close all gameplay-affecting tech debt and feature work before polish phases begin. No UI/sound/menu work until gameplay is at final state.

**Status: 🟢 COMPLETE (2026-05-19).** Game is gameplay-complete. Polish and UI work begins in Phase 6.

### Shipped / resolved in Phase 5.5

- **Stutter fix** — RESOLVED via 30fps cap (commit 67c0bfb). Root cause: SurfaceFlinger buffer queue saturation at 60fps submission rate during GH#3327 full-Skia-recomposition per vsync. Full investigation history in progress-log Sessions 1–6.
- **Diagnostic instrumentation stripped** — DONE (commit aeb1d8c). Commits c36019e + 92362a8 removed.
- **Phantom enemy leg bug** — FIXED (commit 5a342e5). Inactive enemy slots now return `(-9999, -9999)` matching all other slot types. Root cause: 100ms React state lag behind worklet null-transition.
- **Pickup orbit at 30fps** — FIXED (commit c3a86d6). Overshoot clamp `stepDist = Math.min(speed * dt, dist)` prevents oscillation at any framerate.
- **Hero auto-rotation to face shot target** — SHIPPED (commit 3d1fc57). Hero faces nearest enemy in weapon range when stationary; faces movement direction when moving.
- **Player muzzle flash** — SHIPPED (commits 623f4bd, 745cb70). Raider visual + offset reused; skipped for Rocket Launcher and Flamethrower.
- **Bullets emanate from gun barrel** — SCRAPPED (Mo's call, Session 6). Auto-rotation + muzzle flash made bullet spawn origin visually irrelevant; direction perception is what matters.
- **PKM removal + doc reconciliation** — DONE (commit 23fe135). 7 player-facing weapons confirmed.
- **Weapon rarity tiers** — SHIPPED (commits 6fff044, 4c43cba). Common/Uncommon/Rare/Legendary; 50/30/15/5 weights; 1.0/1.1/1.2/1.3× damage multipliers; tier label text color; auto-discard rule scrapped (rarity informational only).
- **Skill clones (5 items)** — SHIPPED (commit 28ab327). Heavy Plate, Knee Pads, FMJ Ammo, ACOG, Energy Bar. Pool: 20 → 25 skills.
- **Crate spawn validity** — SHIPPED (commit f0856d1, Session 1).
- **Decorative prop placement fixes** — SHIPPED (commits 4d8b093, 00850f4, 8972100, Session 1).

### Carried into Phase 6 backlog from Phase 5.5

- **Code review and optimization pass.** Mo flagged in Session 6 — general code health review before Phase 6 visual work begins.
- **Rarity v2 visual treatment.** Glow effect or background shade as Phase 6 polish candidate. Colored border removed in 4c43cba (label alone ships for v1); more visual differentiation is optional polish for Phase 6.
- **100ms timer structural coupling.** `setInterval` in `GameCanvas` handles too many concerns (hero sprite, vitals, level-up, crate reveal, enemy slots, throwable slots, zone slots, rocket flags). Phase 6+ refactor candidate.
- **tileGrid storage relocation (Phase 5 G2) — NOT dead code.** Phase 5 G2 moved tileGrid out of the GameState SharedValue into React state in GameCanvas.tsx (commit d91b4ce) per the JSI serialization rule. It is still actively read by the viewport culling useMemo in GameCanvas.tsx that builds the visible tile Atlas arrays each frame. The data is load-bearing — the field name "moved" was previously misread in scope triage as "removed." No action needed. Investigated and confirmed live during Phase 6 Item 1 (commit 0c042ae).
- **GameCanvas.tsx file refactor decision.** ~30k tokens — targeted split vs full code-organization pass. Deferred indefinitely per project memory; do not resume without Mo reopening it.
- **`MOLOTOV_FIRE_FRAME_DURATION_MS` rename.** Stale constant name — Molotov uses static `explodeImages[2]`, not this constant; it drives flame zone animation only. Accurate name: `FLAME_ZONE_FRAME_DURATION_MS`. Cosmetic cleanup, deferred.
- **`SCAV_WALK_FRAME_DURATION_MS` sampling misalignment.** Technically not a multiple of the 100ms sprite timer interval (same class of issue as the flame frame fix), but visually masked by the continuous walk loop (no start/end stall pattern where misalignment is visible). Low priority; document and defer.

### Triaged items (closed or moved)
- **[F] CC context bloat** — covered by GameCanvas.tsx file refactor decision above.
- **[L] Variant A muzzle flash position varies across walk frames** — fundamental fix requires moving sprite frame selection off React state into SharedValue. Deferred indefinitely; current visual is acceptable.
- **Player world-bounds clamping** — RESOLVED via existing invisible wall.
- **theme.ts per-map tint keys stale** — moved to Phase 6 Theme polish section.
- **Auto-weapon-upgrade alternative design** — no longer relevant; crate-plus-rarity system provides sufficient weapon progression variety.

## Phase 6 — Visual Polish & Cleanup

Post-Phase-5.5 triage locked Phase 6 as a lean polish + cleanup phase. Most original items deferred to v1.1 or scrapped. Phase 7 (UI Rebuild) starts after Phase 6 closes.

### Active Phase 6 deliverables (in implementation order)

1. **Dead code removal.** ✅ Shipped (commit 0c042ae). Removed stale mapTints per-map keys (compound, outskirts, treeline) from theme.ts. Original scope also included tileGrid field removal, but pre-review investigation confirmed tileGrid is load-bearing (read by GameCanvas viewport culling); that part of the scope was correctly dropped. See Phase 5.5 carry-over note for full explanation.

2. **Bullet rendering verification.** ✅ Closed (no commit needed). Confirmed by Mo at Phase 6 start: bullet sprite swap from Skia `<Circle>` primitive to kit asset was already shipped in an earlier phase. Original inventory entry was scope-triage drift. No verification or swap needed.

3. **Throwable in-flight sprite swap.** ✅ Shipped (commit cbd122d). Replaced placeholder `<Circle>` rendering for all three throwable types (frag, molotov, smoke) with dedicated kit sprites from `assets/ui/icons/`. Sprites render at 64×64 world units (native pixel size, no scale multiplier). Detonation rendering unchanged. Original inventory entry described the gp25 / Rocket Launcher projectile as the swap target — that was scope-triage drift; the actual target was the thrown frag grenade skill (and was expanded to all three throwables during planning). First attempt (4433ce5) reverted due to JSX comment block edit error; second attempt (cbd122d) succeeded.

4. **Pond as static prop.** ⏸️ Deferred to v1.1 (decision made session 2). Sprite source: `_project-docs/kits/tds-modern-pixel-game-kit/tds-modern-tilesets-environment/PNG/Tiles/_0000_WTiles.png` (320×320 native, single PNG not a tilesheet). Investigation summary: original WATER_POOL plan conflicted with Mo's constraints (no asset budget increase, no spawn-count reduction on existing categories, no new custom spawn logic). Session 2 verification of building spawn system (verification report only, no code commit) revealed: (a) house02 is not a fixed landmark — it's randomly placed with guaranteed count 1, but visually anchors the map and Mo wants it untouched; (b) pond rendered at STRUCTURE_SPRITE_SCALE=3 would be 960×960 world units, larger than any existing structure including house02 (789×417); (c) at PROP_SPRITE_SCALE=2 still 640×640, requires its own scale override; (d) circle collision radius ~300+ would be the largest in the pool by far (current max env_helicopter_wreck at 120); (e) all structure placement shares one PRNG stream in buildStructures (mapGenerator.ts lines 204–258), so insertion order affects seed reproducibility. Variant-substitution path required multiple new constants/configs — not the minimum-diff change initially imagined. Disposition: water features are a v1.1 feature, not Phase 6 polish. Revisit during v1.1 planning with full investigation context preserved here.

5. **Vignette.** ✅ Shipped (commit 4ccc40e). Subtle-to-moderate screen-edge darkening overlay. Static `<Rect>` + `<RadialGradient>` in screen-space, inserted between helicopter flyover block and `</Canvas>` close. Values: edge alpha 0.95, radius multiplier 0.85 × diagonal, center transparent. HUD elements (debug overlay, ReviveModal, LevelUpModal, CrateRevealModal, weapon cycle button) all render above the Canvas via the RN native compositor — vignette does not affect them. Performance: zero animated props, single static gradient blend per frame, no impact on 30fps cap. Initial values (alpha 0.35, radius 0.7×) read as invisible on device; required diagnostic pass at aggressive values to confirm render path works, then three tuning passes to reach final. Tuning history: 80b5f93 (initial 0.35/0.7×, invisible) → 96fc1fa (diagnostic 0.8/0.5×, confirmed render works) → 8a7d271 (0.6/0.6×, too light) → 0b9e488 (0.8/0.85×, right radius wrong darkness) → 4ccc40e (0.95/0.85×, shipped). First Skia shader in the codebase; all prior screen overlays were RN View backgroundColor patterns.

6. **Code review and optimization pass.** ❌ Scrapped from Phase 6 (decision made session 2). Original scope assumed Phase 6 would be substantial enough to justify its own review pass. Actual Phase 6 was a small polish phase (~45 lines of code change total across items 1, 3, 5, plus bonus dead-code removal). A full code review on a codebase that will substantially change in Phase 7 (UI rebuild) and Phase 9 (planned engine cleanup) is premature — findings would go stale. Item folded into Phase 9 scope: full codebase review + optimization pass to execute after Phase 8 closes, when codebase is stable enough for findings to remain valid.

---
*✅ Phase 6 COMPLETE — closed session 2 (2026-05-21). Final state: items 1, 2, 3, 5 shipped. Item 4 (pond) deferred to v1.1 with full investigation notes. Item 6 (code review) scrapped from Phase 6, folded into Phase 9 scope. Known-safe HEAD at close: 4ccc40e (final vignette tuning). Total Phase 6 code change: ~45 lines across 4 commits + bonus dead-code removal + 1 doc-drift correction commit. Net session count: 2.*

### Scrapped from original Phase 6 scope (do not implement)

Triaged out in strategy session post-Phase-5.5:

- **Rarity v2 visual treatment (glow/shade).** Label-only ships for v1; deferred to v1.1 if post-launch feedback warrants.
- **100ms timer structural coupling refactor.** Deferred indefinitely — no measurable problem; cost outweighs benefit at current scale.
- **MOLOTOV_FIRE_FRAME_DURATION_MS rename to FLAME_ZONE_FRAME_DURATION_MS.** Cosmetic only; not worth a commit cycle for v1.
- **SCAV_WALK_FRAME_DURATION_MS misalignment.** Visually masked by continuous walk loop; documented and deferred.
- **Bullet sprite color change (sand-vs-desert blend).** Mo accepts current color.
- **Rocket exhaust trail frames.** Skipped.
- **Fog of war.** Deferred to v1.1.
- **Rain particles + drifting clouds.** Deferred to v1.1.
- **Explosion + smoke rendering polish.** Open-ended item with no specific concern; skipped unless surfaced in Phase 6 code review.
- **Transition tiles (grass-to-road, sand-to-road, etc.).** Skipped.
- **Sandbags with collision orientation.** Skipped.
- **Pristine parked civilian cars.** Skipped.
- **Cluster tree spawning logic.** Already resolved via v1 density bump (commit 8972100); confirm closed.
- **Water as tile / biome integration.** Replaced by single pond prop above (much smaller scope).
- **Water border at map edge.** Skipped.

### Closed

- **Muzzle flashes + bullet origin correction.** Shipped in Phase 5.5 (commits 623f4bd, 745cb70). Confirmed closed.

## Phase 7 — UI Rebuild + Run Management

All UI work. Persistence decisions made here.

### UI rebuild (from original Phase 7 scope)
- **Custom UI rebuild — all screens, HUD, menus.** Replace current debug overlay and modal default fonts with custom UI using kit color palette (`#0a0d08`, `#c9a356`, `#cc3333`) and pixel font. NOT kit layout PNGs. Per locked decision May 12 2026 (progress log line 53).

  Main menu shipped 2026-05-22. Commits abd9b91 + 6a50c2f. Boots to menu instead of game. Background image `assets/ui/screens/MainMenu.png` rendering full-screen (cover mode). Money display top-right ($0 placeholder until Phase 9 persistence). Buttons: DEPLOY (functional → game), FLEA MARKET / UPGRADE / SETTINGS (disabled stubs). Routing via `useState<'menu' | 'game'>` in App.tsx per v3 tech stack ("Plain React state, no expo-router"). Background scaling required explicit `width`/`height` alongside `absoluteFillObject` — RN Image sizes from `width`/`height`, not edge constraints.

- **SafeAreaProvider RNCSafeAreaProvider registration.** ✅ Shipped (commit 3c39cdf, verified 2026-05-21). `<SafeAreaProvider>` wraps `<GestureHandlerRootView>` in App.tsx. Hardcoded inset values in GameCanvas.tsx remain — in scope for the HUD rebuild commit that follows. See progress log v3 Errata item 7 for resolution history.
- **Debug overlay replacement.** Current plain `<Text>` with hardcoded insets → custom UI using kit color palette (`#0a0d08`, `#c9a356`, `#cc3333`) and pixel font, NOT kit HUD layout PNGs. Per locked decision (May 12 2026, progress log line 53): all Phase 7 UI is custom built. Kit-first principle still applies to in-world sprites (weapons, throwables, enemies, props, environment) — it does NOT apply to UI elements.

  **HUD display scope (locked 2026-05-21).** Top-left: equipped weapon icon (single icon, not inventory strip — keeps current single-weapon gameplay unchanged). Top-right: Money, HP, Level, Time, Kills as numbers, plus XP-as-bar (visual fill only, no number). Dropped from HUD: Score number, raw XP number, FPS, Enemies, Frame. No underlying mechanic changes — pickups continue to award both XP and score internally. Money persistence wiring is Phase 9 per strategy doc Section 5.3; Phase 7 HUD displays money as per-run counter until persistence lands.

  ✅ Shipped 2026-05-21 across commits acdd453 (HUD scaffold + debug overlay removal), bb0beba (icon size tuning), 5c29ecb (weapon name + rarity labels matching CrateRevealModal), 43c96c7 (legendary rarity color changed from gold to orange #ff8c00 for visual distinction from accent gold). HUD consumes useSafeAreaInsets() — SafeAreaProvider integration goal from inventory line 95 is now fulfilled.

  Pistol consistency fix (commit d7d7e98): weapon name renders for all equipped weapons including Pistol. Rarity label remains hidden only for Pistol (no tier worth showing). Original Pistol exception was both-name-and-rarity hidden, which read as inconsistent on device.

- **Pixel font app-wide swap.** ✅ Shipped 2026-05-21. VT323 (royalty-free pixel font) loaded via expo-font + useFonts in App.tsx. PIXEL_FONT_FAMILY = 'VT323-Regular' in theme.ts. Two-stage rollout: initial swap (db2e6c2) didn't apply on Android due to fontWeight conflict with single-weight font (RN falls back silently); diagnostic + fix in 89ae599 removed fontWeight: 'bold' from VT323 styles and added missing fontFamily to all three modals. Universal 1.3× size pass (d2e5407) restored visual hierarchy after pixel-font character heights rendered visually smaller than system equivalents. lineHeight fix + LevelUpModal CARD_H 140→168 bump (e2d9959) resolved post-bump overflow on long skill names. Two 10pt body styles (LevelUpModal.desc, CrateRevealModal.scrapSubtext) initially excluded, then included at 12pt during the size pass. Final state: VT323 throughout HUD + all three modals.

- **Level-up modal typography.** ✅ Shipped — covered by pixel font app-wide swap (commit chain db2e6c2 → 89ae599 → d2e5407 → e2d9959, described in Pixel font entry above).

### Run management
- **Pause menu.** ✅ Replaced by LEAVE RAID direct exit mechanism (brainstorm decision: no in-game pause, Tarkov-style "you're committed when you deploy"). Shipped 2026-05-23. Commits e5670f8 (build) + 5d64778 (tuning). HUD top-left LEAVE RAID button above weapon icon, gold VT323 text matching stats size. On tap, inline confirmation modal in HUD.tsx ("LEAVE THIS RAID?" with LEAVE / STAY IN RAID buttons). Game state continues running during modal display — no tick suspension. Routes to main menu via existing onReturnToMenu callback (commit 86b42c0), with fresh map on next Deploy via GameScreen unmount/remount. Weapon icon container reshaped from 96×96 square to 96×72 rectangle, weapon icon 76×60 → 88×66 with cover. Visual misalignment between LEAVE RAID text top and XP bar top accepted — LEAVE RAID positioned at maximum safe-area-respecting height; 44pt touch target preservation takes priority over visual symmetry.
- **End-run flow.** ✅ Shipped — LEAVE RAID confirmation flow (commits e5670f8 + 5d64778) covers mid-run exit; ReviveModal RETURN TO MENU (commit 86b42c0) covers death-screen exit. Both routes call onReturnToMenu → menu transition + fresh map on next Deploy.
- **Death screen polish.** Add "return to main menu" alongside existing redeploy button. ✅ Shipped 2026-05-23. Commit 86b42c0. Added "RETURN TO MENU" text-link button to ReviveModal below the existing card-style buttons (Free Revive, Watch Ad, Redeploy). Muted grey, fontSize 15, 44pt+ touch target. Callback threaded ReviveModal → GameCanvas → GameScreen → App.tsx → setScreen('menu'). Fresh map on next Deploy via GameScreen unmount/remount triggering loadMap(Date.now()) — no seed logic changes needed. Redeploy unchanged (still same-map restart with fresh player state).
- **Loading screen.** Blank frame (~1-3s) on mount reads as crash to new players. ✅ Shipped 2026-05-23. Commit d9d4e62. Tarkov-style "DEPLOYING IN" label with centered countdown number (3 → 2 → 1), fixed ~1 second per number, fires onComplete after 3s total. Background image at assets/ui/screens/LoadingScreen.png (swappable in-place — replacing the file overwrites without code change). Inserted into App.tsx routing between menu and game. Visual: "DEPLOYING IN" label at 40px VT323 letterSpacing 4, countdown number at 128px VT323 lineHeight 140 (prevents top-clip), both centered as a grouped block. Three setTimeout calls in useEffect with cleanup on unmount.

### Balance tuning
- **Money drop + enemy HP (commit b9cc3b2).** ✅ Shipped 2026-05-25. Two value tweaks from Phase 7 playtesting: (1) `MONEY_SMALL_SCORE` 10 → 5 in `combatEngine.ts` — earn rate was ~$430/min pre-tune, target ~$215/min post-tune; (2) enemy base HP ×1.2 across all four types (scav 20→24, raider 40→48, sniperA 50→60, sniperB 40→48) — AFK survival with rare Assault Rifle was indefinite pre-tune, all weapon tiers now fail AFK post-tune. Crate scrap reward (+50) deliberately left unchanged: scrapping forfeits an upgrade and the reward should feel worth it.

### Phase 7 investigations & reference

- **Gameplay speed-up after skill pickup** — ✅ Fully resolved 2026-05-25 (five sessions). Bug: all gameplay (player, enemies, timer) accelerated ~2× after first skill pickup; persisted for rest of run; ~50% reproduction rate across Phase 7 testing.

  **Sessions 1-2 (2026-05-23):** Sub-8ms frame guard (commit 1bf4476) — wrong theory (Reanimated vsync clustering). Second diagnostic identified apparent root cause: `useFrameCallback` registration race. Inline arrow function caused re-registration on every React render, leaving duplicate active IDs in `activeFrameCallbacks`; RAF iterated both → 2 ticks/vsync → 2× speed. Fix shipped (commit 133ce6a): `useCallback(fn, [])` with `'worklet'` directive.

  **Session 3 (2026-05-25):** Bug reproduced at ~50% rate despite session 2 fix. Sub-8ms guard re-attempted (commit 9f47bd2) — same wrong theory, reverted. Do not re-attempt: harmful at 120Hz (8.33ms real frame intervals). State of code: ae61bd6.

  **Sessions 4-5 (2026-05-25):** Full instrumentation ruled out dual-registration. JS-thread prototype patch confirmed only one `registerFrameCallback` call per run. UI-thread `activeFrameCallbacks.size` never exceeded 1 during bug reproduction — dual-registration is not the mechanism. dtMs distribution sampling revealed actual cause: the worklets RAF polyfill fires extra `__flushAnimationFrame` calls with stale timestamps during touch events, resetting `previousFrameTimestamp` backward and inflating subsequent vsync deltas to 30-40ms (normal: ~16.67ms at 60Hz). Session 5 data confirmed: baseline count≈300 avg≈16.64ms zero >33ms; bug window count=522 max=39.29ms 216 invocations >33ms.

  **Fix (commit 016b1ad):** `Math.min(dtMs, 20)` in `tickAccMs` accumulator in `gameLoopCallback` (GameCanvas.tsx). Clamps inflated polyfill values to one-frame-worth without affecting 60Hz (16.67ms) or 120Hz (8.33ms) frames. Old 50ms cap allowed 30-40ms values through, producing ~2× tick accumulation rate.

  **Verification:** Mo confirmed clean across 10+ consecutive runs (zero reproductions against historical ~50% rate).

  **Upstream note:** Stale-timestamp behavior is a bug in the worklets/Reanimated RAF polyfill, not in game code. Worth filing an upstream GitHub issue at some point.

- **Reanimated callback registration audit** — ✅ Completed 2026-05-23. After the `useFrameCallback` fix, audited codebase for similar patterns. Findings: zero other instances of the bug class. Only `useFrameCallback` combines all three properties required for the race: (1) mutable imperative registry, (2) async `runOnUI` bridge for register and deregister, (3) dep array reactive to function reference identity. `useDerivedValue` has similar shape but is reactive/idempotent (no compounding side effect). All other hooks (`useAnimatedStyle`, `useAnimatedReaction`, `useWorkletCallback`) have zero usages. All `setInterval`/`setTimeout` registrations have correct cleanup. All `runOnJS` callsites use stable references (named functions, `useCallback`, React `setState` setters). Audit confirms the fix was complete for this bug class.

### Phase 7 design direction (brainstormed post-Phase-5.5; not yet locked)

Design intent captured from strategy chat. Final decisions deferred to Phase 7 kickoff brainstorm.

**Main menu screen.**
- Background art direction: atmospheric scene OR hero silhouette with ambient elements (Mo to source via AI generation — Midjourney/Runway/Pika).
- Background format: MP4 video for subtle looping ambient (smoke drifts, flame flicker). NOT GIF (color palette and React Native support issues on Android).
- Resolution target: 2560×1440 (ideal for high-DPI devices), 1920×1080 minimum.
- Implementation library: expo-av Video component (already supported in stack).
- UI elements layer on top with darkening overlay for text readability.
- Sourcing happens outside the dev loop on Mo's pace; implementation is a small commit when asset arrives.

**Loading screen.**
- Triggered after Deploy button (not on app cold start — that's covered by Expo splash).
- Single random tip per load on mount (not rotating during single load — Project Zomboid style rotation overkill for sub-3-second loads).
- "Loading..." text with cycling dots animation (`.`, `..`, `...` cycling every ~400ms via setState).
- Background image: placeholder dark color until art sourced; eventually a static image (could be visual variant of menu background).
- Tip content: starts with 15-20 tips. Mix of mechanical depth (rarity stacking, skill synergies), strategic, gameplay hints, lore/atmosphere. Tips array easily appended post-launch.

**Splash / logo (covered by Phase 9 ship prep — flagged here for cross-reference).**
- Implementation path: Option A — replace Expo splash image via app.json config. Simplest path; no custom transition logic.
- Logo asset: 1024×1024 minimum, transparent background, dark background color in splash config matching game aesthetic.
- Logo sourcing: Fiverr/99designs ($50-300), commissioned freelancer ($300-1000), or AI generation + manual cleanup. Mo's call.
- Blocked on: game name and studio name decisions (see parking lot in v3 doc).

**Pause menu.**
- Match existing modal dark style (consistent with crate reveal, level-up modals).
- Buttons: Resume, End Run (return to main menu).
- Game state freeze: enemies, projectiles, timers all paused.

### Persistence and analytics
- **Persistence layer.** ✅ Shipped (commits a452ab8 + eecf912). Money-only per locked Phase 7 scope. AsyncStorage via existing `persistence.ts` pattern — `getMoney()` and `addMoney(amount)` writing to `syo_flea_currency` key. `addMoney` called at raid-end via `handleReturnToMenu` wrapper in GameCanvas (covers both LEAVE RAID and RETURN TO MENU paths), awaited in App.tsx before menu transition to prevent read-before-write race. Accumulated total displays on main menu with locale-aware thousands separators (`toLocaleString()`). Crate scrap reward (+50) unchanged — deliberate player-choice mechanic.
- **Minimap.**
- **PostHog analytics.**

### Inventory and weapons
- **Weapon selector / inventory.** Player has one active weapon; EQUIP just swaps; no inventory strip. Build alongside HUD rewrite.

---
*✅ Phase 7 COMPLETE — closed 2026-05-25. All UI rebuild items shipped. Persistence layer (money-only) shipped. Balance tuned (commit b9cc3b2). Phase 7 investigations resolved. Minimap and PostHog analytics deferred to Phase 9. Known-safe HEAD at close: b9cc3b2.*

## Phase 8 — Gameplay Mechanics: Flea Market + Audio

✅ **Phase 8 fully complete (2026-05-27).** Flea market shipped 2026-05-26; daily bonus, IAP stub, audio, and Settings shipped 2026-05-27.

### Flea market (scope locked 2026-05-25; pricing locked 2026-05-26)
✅ **Shipped 2026-05-26** across 11 commits (f0983ea, 993b3f6, 5954440, dee9b13, 0cf7a64, 60cfaf4, f02c6e4, a4f5321, 8c81c05, 35bd7b4, 08a3a7b). 5×3 grid with 15-of-25 daily rotation seeded by device-local date; per-skill pricing ($5K/$3K/$2K tiers); per-raid purchase gate via `pendingPurchasedSkill` slot; WATCH AD stub with per-raid gate via `pendingAdSkill` slot; max 2 starter skills per raid (1 ad + 1 purchase) consumed on Deploy; Field Medic Kit excluded from starter pool (no-op at full HP); HP initialization bug fixed for passive maxHpAdd starters.
- Skills only — no weapons, cosmetics, or consumables in v1. Defer to post-launch content updates.
- Price-gated only. No Operator License content gating.
- 15 of 25 skills available per day, daily rotation.
- Layout: 5 rows × 3 columns grid.
- Purchased skills apply to NEXT RAID ONLY. Not permanent meta-progression.
- Daily inventory seed: device-local date (YYYY-MM-DD). Pure deterministic function. Same skills for all players on the same date.
- Live recompute on flea market open to handle midnight rollover during play.
- **Per-skill pricing (locked 2026-05-26):**

  | Tier | Price | Skills |
  |---|---|---|
  | Premium | $5,000 | Plate Carrier, Heavy Plate, Helmet, Backpack, Field Medic Kit, Frag Grenade, Hollow Points |
  | Standard | $3,000 | Armor-Piercing Rounds, Holographic, Ceramic Insert, MRE, Energy Bar, Tactical Boots, Painkillers, Smoke Grenade, Molotov |
  | Cheap | $2,000 | Red Dot, ACOG, Suppressor, FMJ Ammo, Subsonic Rounds, Tracer Rounds, Knee Pads, Stims, Comms Headset |

- **Per-raid purchase gate:** 1 purchase per raid. `pendingPurchasedSkill: skillId | null` on persistent player data. Non-null → all BUY buttons disabled, purchased card shows "PURCHASED" overlay. Survives app sessions; consumed and cleared on Deploy.
- **Max 2 starter skills per raid:** 1 from ad (random) + 1 from flea market (chosen). On Deploy: apply both pending slots if non-null, clear both, raid starts.

### Daily bonus + time handling (scope locked 2026-05-25)
✅ **Shipped 2026-05-27** (commits 30d9333, 13f82b0, 40e9b3f, b86ef84). Auto-claim on menu mount with toast; $1K free / $5K Operator License; once-per-day gate via `lastClaimDate`; Operator License hardcoded as `[P8-STUB]` toggle, Phase 9 replaces with real IAP.
- Device-local date, not UTC, not server time.
- No anti-cheese mechanics — accept that some players will time-cheese.
- Shared helper: getTodayKey() returns "YYYY-MM-DD". Consumed by both flea market and daily bonus.
- Daily bonus claim: auto-claim on main menu mount with brief notification ("+$1,000 daily bonus claimed").
- Values per Phase 7 closure: $1K free / $5K Operator License.

### IAP stub for Phase 8 testing
✅ **Shipped 2026-05-27** (see daily bonus commits). AsyncStorage boolean `syo_operator_licensed`, tagged `[P8-STUB]`.
- Operator License unlock is stubbed (hardcoded toggle).
- Real IAP integration moved to Phase 9.

### Pre-run ad (stubbed for Phase 8)
✅ **Shipped 2026-05-26** (included in flea market commits). WATCH AD grants random skill from 24-skill pool immediately; per-raid gate via `pendingAdSkill`.
- WATCH AD button lives inside the flea market screen, sibling to the purchased skill slot.
- Phase 8 stub behavior: tap immediately grants a random skill from the 24-skill pool (Field Medic Kit excluded — no-op at full HP; no actual ad video).
- Per-raid gate: `pendingAdSkill: skillId | null` on persistent player data. Non-null → button disabled, label reads "AD WATCHED." Survives app sessions; consumed and cleared on Deploy.
- No app-imposed daily ad cap for v1 — only the per-raid gate. Real AdMob integration and daily-limit research is Phase 9.
- If ad-granted skill matches purchased skill, they stack normally (existing skill stacking mechanic, no special handling).

### State model — persistent player data fields (Phase 8)
✅ **All fields shipped** (across Phase 8 commits).
- `money: number` — already shipped Phase 7 (key `syo_flea_currency`)
- `pendingPurchasedSkill: skillId | null` — new Phase 8; flea market purchase slot
- `pendingAdSkill: skillId | null` — new Phase 8; pre-run ad slot
- `lastClaimDate: 'YYYY-MM-DD' | null` — new Phase 8; daily bonus claim tracking

### Audio (shipped Phase 8 Session 5)
✅ **Shipped 2026-05-27** (commits 832240b, e8fa684, 64390d6, 10b1bc4, 3430fdc, e5a62b7, cefd002). expo-av, iOS silent switch override, 1 menu loop + 4 combat track rotation (Pixabay), 6 SFX categories (Kronbits CC0), Settings volume sliders persisted. See Audio System section in v3 doc for full details.

## Phase 9 — Ship Prep, Monetization, Engine Cleanup

**Phase 9 scope direction (locked 2026-05-27): hookup + investigate, not refactor + optimize.** The game is functionally complete after Phase 8. Phase 9 is: monetization wiring (real IAP, real AdMob, upgrade modal), ship prep (icons, splash, store assets, EAS production build, TestFlight/Play Store submission), and investigative work (late-game stutter diagnosis, camera tracking diagnosis, expo-av migration). Investigation results drive disposition — refactor work only lands if investigation surfaces a clear player-felt problem AND the fix is low-risk and localized. Speculative refactoring for code-health reasons is out of scope. Per the "lean toward easiest implementation" working norm.

### Engine cleanup
- **UI-thread worklet GC allocation churn.** 36k-60k objects/sec → 2-4ms GC pauses. Engine-wide mutable-state refactor. SKIP if targeted object pooling in Phase 5.5 already resolved stuttering.
- **Projectile compact array pattern.** Projectiles still use compact array pattern (unlike pickups which were fixed). Post-launch template cleanup.
- **Asset loading consolidation (texture atlases).** Replace individual useImage calls with TexturePacker atlas. Do NOT do earlier — final asset list isn't locked until end of Phase 8/9.
- **Full codebase code review + optimization pass.** Folded from Phase 6 item 6 (scrapped session 2). Scope: entire codebase. Output format: findings-only report with disposition per finding (ship in Phase 9 / defer to v1.1 / scrap). Disposition rule for findings: ship only if risk-free + localized + (trivial-mechanical OR measurable perf win). All other findings defer or scrap. Hard constraints: no proposed changes to the 30fps cap, hybrid collision pools, or anything settled in Phase 5 stutter work.
✅ **Late-game sustained-movement stutter — RESOLVED (Phase 9 Stage 5, 2026-05-28).** Root cause: `@shopify/react-native-skia` 2.2.12 missing cluster of native reconciler concurrency fixes shipped in v2.3.7 (race condition in RuntimeAwareCache/scene graph destructor), v2.3.11 (severe concurrency issue in reconciler — invisible to JS instrumentation, fires during sustained scene graph updates), v2.3.13 (Android main thread dispatcher deadlock), and v2.4.7 (renderer race condition). Fix: Skia 2.2.12 → 2.6.4 bump (778626a + lockfile 4443d2a). Device-verified: stutter gone including helicopter flyby worst case. 7 JS-side hypotheses eliminated before architecture + Skia changelog audit identified the cause. Full diagnostic chain in progress-log.md Phase 9 Session 4.
- **Camera tracking smoothness — investigate during code review.** Late Phase 7 observation: fast left-right movement reveals black edges at viewport boundaries. Note: `cameraTransform` in `GameCanvas` is direct/zero-lag (`useDerivedValue` reads `player.x`/`player.y` every frame — no lerp exists). More likely culprit: the 100ms tile viewport culling timer drives React tile state, which lags up to 100ms behind actual player position during fast movement. Investigation should start at tile culling update cadence, not camera lerp parameters.

### Monetization
✅ **Real IAP integration — IAP skeleton shipped (Stage 4, 2026-05-28).** expo-iap 4.3.1 + expo-build-properties (Kotlin 2.1.0) + iOS deploymentTarget 15.0. `purchaseOperatorLicense()` and `restoreOperatorLicense()` in `monetization.ts`; UpgradeScreen.tsx `[P9-STUB]` replaced with real purchase + restore flows. Product ID: `operator_license` — configure as $4.99 non-consumable in both App Store Connect and Google Play Console at Stage 7. Stage 7 remaining: (1) configure `operator_license` product in both stores; (2) remove `[P9-DIAG]` RESET OPERATOR LICENSE button from `SettingsScreen.tsx` after sandbox testing (grep: P9-DIAG). Note: `[P9-STUB]` is gone — `[P9-DIAG]` is the only active grep target.
✅ **AdMob integration.** Rewarded ad SDK. Wire revive ad and pre-run buff ad touchpoints. Shipped 2026-05-27 (6fd9e8c, e5deebe, 6bb8d4b, 7774642, c255a66, 3aca04b). Test ad unit IDs in place — swap to real IDs at ship prep (see Ship prep section below).
- **Entitlement caching.**
- **Ad network daily-limit and no-fill UX research.** Verify whether any app-imposed cap is needed; design the no-fill button state for when the ad network returns no fill. Phase 9 research item, not a blocker.
✅ **Operator License upgrade screen — shipped 2026-05-27** (d594b3b, 11cc170, e9b2216, 44d228d; full session history in progress-log.md Phase 9 Session 2). UPGRADE button on main menu routes to full-screen UpgradeScreen. IAP price locked at $4.99 USD. **Stage 4 complete (2026-05-28):** `[P9-STUB]` replaced — real `purchaseOperatorLicense()` + `restoreOperatorLicense()` wired (6b0019d, 45aab66, 70c735c; session history in progress-log.md Phase 9 Session 3). `[P9-DIAG]` RESET OPERATOR LICENSE button persists in SettingsScreen for stage 7 sandbox testing — remove at stage 7 closeout (grep: P9-DIAG).

### Ship prep
- **Real AdMob ID swap (ship prep gate — do before EAS production build).** Two locations, one commit: (1) `src/lib/monetization.ts` — `ADMOB_UNIT_IDS.rewardedAndroid` + `ADMOB_UNIT_IDS.rewardedIOS`; (2) `app.json` AdMob plugin config — `androidAppId` + `iosAppId` (marked `_phase9_todo`). Do not ship with test IDs.
- **AdMob account.** $0, ready before Phase 9 work.
- **Apple Developer account.** $99/yr, before Phase 9 ship prep.
- **Google Play account.** $25 one-time, before Phase 9 ship prep.
- **EAS Build setup.** Production build pipeline.
- **App icon + splash screen.** Final icon asset (1024×1024, transparent background) and Expo splash config update. Blocked on game name/studio name decisions (see v3 doc parking lot).
- **Store assets.** Screenshots, description copy, metadata for both stores.
- **TestFlight submission (iOS).**
- **Play Store submission (Android).**
- **Reanimated polyfill upstream GitHub issue.** Stale-timestamp behavior in worklets RAF polyfill (root cause of Phase 7 speed-up bug, commit 016b1ad). Low priority — file post-launch or during Phase 9 if time allows. Not a blocker.
- **expo-av → expo-audio migration.** expo-av is deprecated in SDK 54 (functional in current SDK — no breakage yet; expo-audio is the forward path). Migrate during Phase 9 ship prep when the environment is changing anyway.
- **Custom PanResponder slider → `@react-native-community/slider`.** Settings volume sliders have minor drag-jank (touch tracking gaps). Migrate during Phase 9 APK rebuild — the native module rebuild is required for the package and happens anyway for ship prep.

### Post-launch monitoring

- **`react-native-worklets@0.8.3` wildcard peer dep drift risk.** The package declares `@react-native/metro-config: "*"` as a peer dep. npm resolves `"*"` to the current npm latest on every clean install — 0.85.3 at time of Phase 9 Stage 5 build. The 6 resulting nested `@react-native/0.85.3` packages are isolated from the RN 0.81.5 runtime and do not affect app behavior. However, every future `npm install` re-resolves the wildcard against then-current "latest," meaning lockfile contents drift across rebuilds invisibly. Surfaced as an EAS `npm ci` failure during Phase 9 Stage 5 Skia bump (lockfile from `--legacy-peer-deps` was stale). **Mitigation now:** always regenerate lockfile with clean `npm install` (not `--legacy-peer-deps`) after any `package.json` change. **Resolved permanently** during a future RN/Expo SDK migration — upgraded `react-native-worklets` will likely pin the dep rather than wildcard it. Not a current blocker.

## Phase 10 — Post-Launch Balance Pass

Balance pass once live player data exists: flea market item pricing, daily login bonus amounts, currency drop rate. Final tuning of the values rough-set in Phase 7 and Phase 8 against actual player earn rates and purchase behavior.

## Doc Hygiene

Items needed to keep project docs accurate and trustworthy. Not gameplay work; not blocked on any phase.

- **v3 context doc audit.** Compare key v3 statements against current code; identify and correct drifts. Known drifts confirmed during prior sessions: vegetation budget values and rain-suppression rule were corrected in the Phase 6 doc cleanup commit — see v3 doc line 481. Other drifts likely exist; that's what the audit is for.
- **Close-out doc process improvement.** Codify a tighter end-of-session/end-of-phase doc update protocol so v3 doesn't drift from code again. Probably a new section in v3 or a working rule in the collaboration model. Draft in strategy chat before committing to docs.
- **Sniper rooftop spawning (v3 stale).** Sniper rooftop spawning was removed as a Phase 5 G3 scope reduction; v3 context doc still describes it as active behavior. Confirmed stale during session 3 testing. Catch during v3 audit.
- **v3 Skill icons subsection — stale "Upgrade Preset" reference.** The phrase "kit's Upgrade Preset" remains in the Skill icons subsection, stale from the pre-Phase-7 kit-UI era. Caught during 37cdbb8 audit; deliberately not folded in (single-focused-commit discipline). Catch in next v3 audit or doc cleanup pass.
- **v3 Loading Screen paragraph drift.** Paragraph claims "Loading..." cycling dots animation + 15-20 tip array. Actual `LoadingScreen.tsx` (shipped Phase 7) is the Tarkov-style "DEPLOYING IN" 3-2-1 countdown. Caught during 37cdbb8 audit; deliberately not folded in. Catch in next v3 audit or doc cleanup pass.

## Open Brainstorm Items (Need Decision Before Relevant Phase)

- **Persistence between runs.** ✅ Decided and implemented in Phase 7 — money-only (flea market currency). No high scores, no kill counts, no meta-progression. See persistence layer entry in Phase 7 section.
- **Audio aesthetic.** 8-bit chiptune vs realistic SFX. Decide before Phase 9.
- **Specific monetization values (partial).** ~~IAP price ($4.99 vs $9.99)~~ — locked at $4.99 USD (Phase 9 Session 2). One item remains open: in-run currency drop rate ($1/Scav placeholder, re-tune Phase 10). Flea market pricing, daily login amounts, and server-time choice are all locked.
- **What happens to flea-market starter items if player dies before run starts.** ✅ Resolved 2026-05-26 — consumed on Deploy, no refund. See §4.5 in strategy-monetization-v1.md.
- **Free player retention strategy.** Per strategy doc Section 9.

## Parked / Deferred (Not Active Work)

- **Pistol and SMG weapon icons at 64×64 vs others at 80×80.** Accepted for v1 — resizeMode="contain" handles the size variance acceptably. Revisit in v1.1 if icon visual consistency becomes a felt issue.
- **Modal mount/unmount render hitch (~94ms).** 94ms React commit on crate reveal modal mount/unmount, observed in session 3 DevTools profile. Not perceptible in normal play — Mo doesn't notice it in-game. Investigate post-launch only if player reports surface.
- **50 enemy cap.** Investigated during G4 — feels balanced at 50. Do not change without deliberate balance reasoning. If revisited, requires performance check + wave intensity retune.
- **Urban DLC theme.** v1.1+ post-launch. Mo sourcing 4-5 war-torn buildings, concrete barriers, rubble piles, street lamps. Reuses existing modern vehicle pack.
- **OBB collision for rotated wrecks.** AABB approximation accepted. ~1.4× phantom collision zone via the math. Real OBB deferred indefinitely.
- **Enemies vs enemies collision (item I in progress-log).** Genre-typical to not collide. v1.1+ if stacking creates gameplay problems.
- **Bullets vs props collision (item J in progress-log).** Genre-typical. Add only if playtesting surfaces felt problem.
- **Small trees AABB collision (item K in progress-log).** No reported issue. Move to circle pool if specific variant shows inconsistency.
- **Camera Group child count threshold.** 28 Atlas children confirmed fine. Re-evaluate if count grows post-launch.
- **useFrameCallback spurious zero-dt invocations.** Real cause identified and resolved: worklets RAF polyfill fires stale-timestamp frames during touch events, inflating dtMs to 30-40ms (see Phase 7 speed-up bug investigation, commit 016b1ad). The existing `<= 0` guard is intentional defensive coverage for zero/null dtMs edge cases — not a workaround for that bug. No further investigation needed unless a Reanimated major version bump changes polyfill behavior.
- **Hit flash visual tuning.** HIT_FLASH_RADIUS_PX=7 unvalidated starting point. Tune when Mo signs off.
- **Lightning flash + thunder SFX.** Cut to v1.1.
- **Helicopter boss (phased attacks).** Replaced by ambient flyby (shipped). Do not re-implement without documented scope reversal.
- **Bomber strafe hazard.** Replaced by static crashed bomber map prop. Do not re-implement.
- **Gas bomb hazard.** Cut entirely.
- **Tank as mobile enemy.** Replaced by stationary turret (shipped). Do not re-implement.
- **Daily quest system.** Replaced by daily login bonus. Do not re-implement.

---

End of inventory.

This is the canonical source. progress-log.md continues historical record. context-v3.md continues architectural reference. kit-asset-audit.md and strategy-monetization-v1.md continue specialized references.
