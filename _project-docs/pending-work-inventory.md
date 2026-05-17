# Pending Work Inventory

Canonical source for all forward-looking work on Shoot Your Way Out. Reference this doc before any session to understand what's pending. Items move out of this doc as they're completed (and their completion is logged in progress-log.md).

## Phase 5.5 — Gameplay Completion

Gameplay-affecting tech debt and feature work. Must be complete before polish phases. Principle: no UI/sound/menu work until gameplay is at final state.

### Bugs and tech debt
- **Stuttering investigation.** Persistent since map generation phase. Multiple times deferred. Attempt targeted object pooling first (projectiles, pickups, damage numbers, hit effects). If stutter doesn't resolve, escalate to full UI-thread GC allocation refactor.
- **File refactor decision.** GameCanvas.tsx ~30k tokens drives CC context bloat (~40-50% of per-prompt token cost). Targeted split (extract derived-value hooks and timer logic into separate files) or full code organization pass. Decide approach and execute.

### Gameplay polish
- **Hero auto-rotation to face shot target.** Compute angle to nearest enemy in firing range, apply rotation to player sprite transform. Pre-implementation check: confirm hero sprite reads correctly at arbitrary angles.
- **Bullets emanate from gun barrel.** Paired with auto-rotation. Per-weapon barrel offset constant. Spawn projectiles at hero position + offset (rotates with hero facing).

### Feature work
- **Weapon variant tiers.** Common/Uncommon/Rare/Legendary per weapon. Requires: rarity data definitions, crate roll logic, equip logic (rarity comparison), visual borders on icon cards, stat scaling per tier.
- **Skill clones (5 items).** Heavy Plate, Knee Pads, FMJ Ammo, ACOG, Energy Bar. Each is one PNG drop + one data row in skills.ts + one icon mapping in sprites.ts.

### Closed this session (Session 1, 2026-05-17)

- **Crate spawn validity** (was in original inventory) — commit f0856d1. On-prop exclusion via `solidPropExclusions` in `GameState`; world-edge bounds derived from `viewHalfW`/`viewHalfH` to match player wall exactly.
- **Decorative barrel/crate overlap with buildings** (discovered mid-session) — commit 4d8b093. Fixed orbit from native-space center distance to scaled-edge-relative gap (`BARREL_EDGE_MIN = 10`, `BARREL_EDGE_MAX = 90`).
- **Within-cluster prop-on-prop overlap** (discovered mid-session) — commit 00850f4. Added `clusterPlaced` tracking per building; `tooCloseScaled` check with gap = 5 against already-placed cluster siblings.
- **Vegetation density bump** (design change, not a bug) — commit 8972100. 50–80 → 70–100. Also corrected five stale `MapData` docstrings in `mapTypes.ts`.

### Triaged tech debt items from progress-log.md (reference original entries)
- **[F] CC context bloat** — covered by file refactor decision above
- **[L] Variant A muzzle flash position varies across walk frames** — fundamental fix requires moving sprite frame selection off React state into SharedValue. Deferred indefinitely; current visual is acceptable.
- **Player world-bounds clamping** — RESOLVED via existing invisible wall. Close the original entry.
- **theme.ts per-map tint keys stale** — should become weather-variant tints in Phase 6. Move out of 5.5.
- **Auto-weapon-upgrade alternative design** — design review only if Phase 5.5 playtesting shows unlucky-crate-runs feel punishing.

## Phase 6 — Visual Polish & Atmosphere

After gameplay completion. Visual-only items.

### Color and asset polish
- **Bullet sprite color change.** GunnerBullet sand-colored, blends into desert map. Edit PNG in Photopea to high-contrast color (yellow or white recommended). Five-minute task.
- **Grenade sprite swap and color edit.** Swap from custom-made to kit asset at `_project-docs/kits/tds-modern-pixel-game-kit/tds-modern-hero-weapons-and-props/Effects/Grenade Launcher Shot/1.png` (single brown grenade frame). Then Photopea color edit for desert visibility.
- **Rocket exhaust trail frames.** Kit ships rocket-f1/f2/f3.png exhaust frames; only 2-frame body loop wired currently. Wire the exhaust trail.
- **Bullets render as oriented Rect, not Circle.** Current 4px Circle reads less convincingly than a ~2×8px oriented Rect would. Visual polish.

### Atmospheric (from original Phase 6 scope)
- **Fog of war.** Visibility falloff at distance.
- **Rain particles + drifting clouds.** Weather effects. NOTE: lightning flash + thunder SFX cut to v1.1.
- **Vignette.** Screen edge darkening.
- **Muzzle flashes + bullet origin correction.** Note from original Phase 6 scope; partially shipped in G4/G5 muzzle flash work. Verify what remains.
- **Explosion + smoke rendering.** For rocket impacts, tank fire, etc.

### Environmental polish (deferred from G2/G3/G4)
- **Transition tiles.** GrassToRoad, SandToRoad, DirtToRoad + road decals (_0005_RoadDecals.png).
- **Sandbags.** Oriented placement near building doors (not random scatter). Collision.
- **Pristine parked civilian cars along roads.** Visual-only.
- **Cluster tree spawning.** Resolved via v1 density bump (commit 8972100) — at 70–100 trees, random placement produces natural Poisson clumping without explicit cluster logic. Intentional cluster logic deferred to v1.1+ only if post-launch visual feel surfaces it as a real problem.
- **Water as centerpiece prop.** Map variety.
- **Water border at map edge.** Visual map boundary.

### Theme polish
- **theme.ts per-map tint keys.** Currently has stale compound/outskirts/treeline keys. Convert to weather-variant tints.

## Phase 7 — UI Rebuild + Run Management

All UI work. Persistence decisions made here.

### UI rebuild (from original Phase 7 scope)
- **Custom UI rebuild — all screens, HUD, menus.** Replace current debug overlay and modal default fonts with custom kit-asset UI.
- **SafeAreaProvider RNCSafeAreaProvider registration.** HUD hardcoded offsets need to use SafeAreaProvider properly.
- **Debug overlay replacement.** Current plain <Text> with hardcoded insets → kit HUD assets.
- **Level-up modal typography.** RN default font → pixel font pass.
- **Pistol and SMG weapon icons at 64×64 vs others at 80×80** — slight modal size mismatch. Fix sizing or accept.

### Run management
- **Pause menu.** New UI screen. Game state freeze (enemies, projectiles, timers). Buttons: resume, end run.
- **End-run flow.** Stop timers, clean up state, transition to main menu.
- **Death screen polish.** Add "return to main menu" alongside existing redeploy button.
- **Loading screen.** Blank frame (~1-3s) on mount reads as crash to new players.

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

- **v3 context doc audit.** Compare key v3 statements against current code; identify and correct drifts. Known drifts already confirmed this session: vegetation budget values (v3 says 0–20, code says 70–100) and rain-suppression rule (v3 says active, code removed it in Phase 5 G3). These two are explicitly known-stale until the audit happens. Other drifts likely exist; that's what the audit is for. Do not partially fix just the known items before running the full audit — partial fixes while unknown drifts exist can create new inconsistencies.
- **Close-out doc process improvement.** Codify a tighter end-of-session/end-of-phase doc update protocol so v3 doesn't drift from code again. Probably a new section in v3 or a working rule in the collaboration model. Draft in strategy chat before committing to docs.

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
