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
| 2 — Player + drag-to-move | ⚪ | | | | |
| 3 — Enemies + auto-fire | ⚪ | | | | |
| 4a — Stat skills + level-up | ⚪ | | | | |
| 4b — Ability skills + crates | ⚪ | | | | |
| 5 — Maps + obstacles + vehicle enemies | ⚪ | | | | |
| 6 — Audio + atmospheric effects | ⚪ | | | | |
| 7 — UI + persistence + analytics | ⚪ | | | | |
| 8 — Helicopter boss + hazards | ⚪ | | | | |
| 9 — Monetization + store submission | ⚪ | | | | |

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

**Status:** Not started

---

## Phase 3 — Enemies + auto-fire

**Goal:** Scav and Raider enemies spawn in waves, scale with time, basic AI walks toward player, player auto-fires at nearest enemy, projectiles damage enemies, enemies drop XP gems.

**Status:** Not started

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
| | | | |

---

## v3 Errata

> **Important for any AI session reading this document:** when v3 context doc and this progress log conflict on technical details, this progress log wins. The v3 doc reflects pre-build planning; this log reflects what actually shipped.

### 1. Skia plugin in app.json

- **v3 says:** `@shopify/react-native-skia` should be added to the `plugins` array in `app.json` (implied by the Phase 1 Setup Commands and file structure sections).
- **Reality:** In Expo SDK 54 with Skia v2.2.x, this is no longer required. Skia auto-configures via Expo's autolinking. Adding it manually to `plugins` causes a fatal error (`eas build:configure` fails with "Unable to resolve a valid config plugin for @shopify/react-native-skia").
- **Why:** Skia v2.2.x does not ship an `app.plugin.js` file. The config plugin mechanism was used in older versions.
- **Action for future sessions:** Do NOT add `@shopify/react-native-skia` to `app.json` plugins. The only plugin entry in `app.json` should be the AdMob plugin. Verified: Phase 1's working `app.json` has only the AdMob plugin.

### 2. Reanimated babel plugin

- **v3 says:** A `babel.config.js` containing `react-native-reanimated/plugin` should be created (implied by the tech stack section).
- **Reality:** In Reanimated v4 (which installs automatically with Expo SDK 54), this babel plugin is no longer required. `babel-preset-expo` handles it automatically. Creating a `babel.config.js` manually risks overriding Expo's internal defaults unnecessarily.
- **Why:** Reanimated v4 dropped the babel plugin requirement as part of its major refactor.
- **Action for future sessions:** Do NOT create a `babel.config.js` unless a specific future feature explicitly requires one. The Phase 1 project intentionally has no `babel.config.js`.

### 3. AdMob placeholder format

- **v3 says:** Use `'ca-app-pub-PLACEHOLDER/PLACEHOLDER'` for AdMob unit IDs (unit IDs and app IDs treated the same).
- **Reality:** Two separate placeholder patterns are in use:
  - **App IDs** (in `app.json` plugins, used by the SDK at initialization): Google's official test IDs — `ca-app-pub-3940256099942544~3347511713` (Android) and `ca-app-pub-3940256099942544~1458002511` (iOS). All-zeros placeholders risk failing SDK initialization since the AdMob SDK initializes at app startup before any stub code runs.
  - **Unit IDs** (in `lib/monetization.ts`, only called when ads are shown): `'ca-app-pub-PLACEHOLDER/PLACEHOLDER'` with `// TODO: Replace in Phase 9` comments.
  - A `_phase9_todo` field is also present in the `app.json` AdMob plugin config as a JSON-compatible search marker.
- **Why:** App IDs and unit IDs serve different purposes. App IDs must be valid at the native layer; unit IDs are only passed when ads are actually requested (Phase 9).
- **Action for future sessions:** In Phase 9, search for both `_phase9_todo` AND `// TODO: Replace in Phase 9` to find every spot needing real AdMob credentials. Replace app IDs in `app.json` and unit IDs in `lib/monetization.ts`.

---

## Asset Inventory Status

Per-asset tracking of what's been imported and where it lives in the project.

| Asset Category | Status | Location in Project | Notes |
|---|---|---|---|
| Hero sprites | ⚪ Not imported | | Phase 2 |
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

