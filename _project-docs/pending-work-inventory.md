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

5. **Vignette.** Screen-edge darkening overlay for atmospheric framing. Static image or Skia radial gradient; rendered above gameplay, below HUD.

6. **Code review and optimization pass.** Open-ended health pass. Performed last so it covers all Phase 6 changes plus existing code. Surface findings for Mo to triage; do not auto-fix everything.

---
*Phase 6 session 1 close — known-safe HEAD: aacdafe. Items 1, 2, 3 closed; THROWABLE_COLORS dead-code bonus shipped; vegetation/rain doc drift corrected. Items 4 (pond) and 5 (vignette) still open; item 6 (code review pass) still pending. Resume in fresh CC session with this doc + progress log as the only context handoff.*

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
- **Custom UI rebuild — all screens, HUD, menus.** Replace current debug overlay and modal default fonts with custom kit-asset UI.
- **SafeAreaProvider RNCSafeAreaProvider registration.** HUD hardcoded offsets need to use SafeAreaProvider properly.
- **Debug overlay replacement.** Current plain <Text> with hardcoded insets → kit HUD assets.
- **Level-up modal typography.** RN default font → pixel font pass.
- **Pistol and SMG weapon icons at 64×64 vs others at 80×80** — slight modal size mismatch. Fix sizing or accept.

### Run management
- **Modal mount/unmount render hitch (~94ms).** Crate reveal modal mount/unmount produces 94ms React commit, observed in session 3 DevTools profile. Visible but separate from sustained-movement camera-snap stutter. Investigate during Phase 7 UI rebuild.
- **Pause menu.** New UI screen. Game state freeze (enemies, projectiles, timers). Buttons: resume, end run.
- **End-run flow.** Stop timers, clean up state, transition to main menu.
- **Death screen polish.** Add "return to main menu" alongside existing redeploy button.
- **Loading screen.** Blank frame (~1-3s) on mount reads as crash to new players.

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
- **Persistence layer.** Save system. Open question: none vs light persistence (high scores, kill counts) vs meta-progression (unlocks). Decide before phase starts.
- **persistence.ts stale highScorePerMap.** Type and getter exist (compound/outskirts/treeline keys) but never written or read. Clean up.
- **Minimap.**
- **PostHog analytics.**

### Inventory and weapons
- **Weapon selector / inventory.** Player has one active weapon; EQUIP just swaps; no inventory strip. Build alongside HUD rewrite.

## Phase 8 — Folded into Phase 9

Phase 8 originally scoped helicopter ambient flyby (now shipped in Phase 5) plus late-discovery polish items. Buffer space — fold into Phase 9 unless playtesting surfaces work that doesn't fit elsewhere.

## Phase 9 — Audio, Ship Prep, Monetization

Final phase before launch. All audio integration here.

### Audio
- **Music integration.** Mo has sourced royalty-free metal/aggressive instrumental tracks. Wire 4 tracks into menu and gameplay.
- **SFX sourcing.** Find coherent ~25 SFX set (weapon fire, hits, level-up, death, UI clicks, ambient). Aesthetic decision: 8-bit vs realistic — Mo deferred until visual polish in place.
- **SFX integration.** Wire playback to existing gameplay events.
- **Volume controls + mute.**

### Engine cleanup
- **UI-thread worklet GC allocation churn.** 36k-60k objects/sec → 2-4ms GC pauses. Engine-wide mutable-state refactor. SKIP if targeted object pooling in Phase 5.5 already resolved stuttering.
- **Projectile compact array pattern.** Projectiles still use compact array pattern (unlike pickups which were fixed). Post-launch template cleanup.
- **Asset loading consolidation (texture atlases).** Replace individual useImage calls with TexturePacker atlas. Do NOT do earlier — final asset list isn't locked until end of Phase 8/9.

### Monetization (per strategy-monetization-v1.md)
- **IAP SDK integration** (react-native-iap).
- **Rewarded ad SDK** (AdMob).
- **Entitlement caching.**
- **flea_currency + last_claim_date persistent data.**

### Ship prep
- **AdMob account.** $0, ready before Phase 9 work.
- **Apple Developer account.** $99/yr, before Phase 9 ship prep.
- **Google Play account.** $25 one-time, before Phase 9 ship prep.
- **EAS Build setup.** Production build pipeline.
- **TestFlight submission (iOS).**
- **Play Store submission (Android).**

## Phase 10 — Flea Market + Daily Login Bonus

Per strategy-monetization-v1.md.
- Currency drop logic
- Flea market UI
- Login bonus logic (free $50/day, paid $300/day — placeholders)
- Paywall gate
- Balance pass

## Doc Hygiene

Items needed to keep project docs accurate and trustworthy. Not gameplay work; not blocked on any phase.

- **v3 context doc audit.** Compare key v3 statements against current code; identify and correct drifts. Known drifts confirmed during prior sessions: vegetation budget values and rain-suppression rule were corrected in the Phase 6 doc cleanup commit — see v3 doc line 481. Other drifts likely exist; that's what the audit is for.
- **Close-out doc process improvement.** Codify a tighter end-of-session/end-of-phase doc update protocol so v3 doesn't drift from code again. Probably a new section in v3 or a working rule in the collaboration model. Draft in strategy chat before committing to docs.
- **Sniper rooftop spawning (v3 stale).** Sniper rooftop spawning was removed as a Phase 5 G3 scope reduction; v3 context doc still describes it as active behavior. Confirmed stale during session 3 testing. Catch during v3 audit.

## Open Brainstorm Items (Need Decision Before Relevant Phase)

- **Persistence between runs.** None / light / meta-progression. Decide before Phase 7.
- **Audio aesthetic.** 8-bit chiptune vs realistic SFX. Decide before Phase 9.
- **Specific monetization values.** IAP price ($4.99 vs $9.99), in-run currency drop rate, flea market item prices, daily login bonus amounts, server-time vs device-time, etc. Per strategy doc Section 9. Decide during Phase 9 planning.
- **What happens to flea-market starter items if player dies before run starts.** Per strategy doc Section 9.
- **Free player retention strategy.** Per strategy doc Section 9.

## Parked / Deferred (Not Active Work)

- **50 enemy cap.** Investigated during G4 — feels balanced at 50. Do not change without deliberate balance reasoning. If revisited, requires performance check + wave intensity retune.
- **Urban DLC theme.** v1.1+ post-launch. Mo sourcing 4-5 war-torn buildings, concrete barriers, rubble piles, street lamps. Reuses existing modern vehicle pack.
- **OBB collision for rotated wrecks.** AABB approximation accepted. ~1.4× phantom collision zone via the math. Real OBB deferred indefinitely.
- **Enemies vs enemies collision (item I in progress-log).** Genre-typical to not collide. v1.1+ if stacking creates gameplay problems.
- **Bullets vs props collision (item J in progress-log).** Genre-typical. Add only if playtesting surfaces felt problem.
- **Small trees AABB collision (item K in progress-log).** No reported issue. Move to circle pool if specific variant shows inconsistency.
- **Camera Group child count threshold.** 28 Atlas children confirmed fine. Re-evaluate if count grows post-launch.
- **useFrameCallback spurious zero-dt invocations.** Known quirk with guard in place. Investigate only if Reanimated major version bump.
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
