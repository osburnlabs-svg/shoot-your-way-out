# Environmental Asset Audit — Phase 5 World-Building Sprites

**Date:** 2026-05-13
**Scope:** All environmental, vehicle, structure, vegetation, and tile assets across all kits at `_project-docs/kits/`. Physically inspected; dimensions confirmed by reading PNG file headers directly.
**Purpose:** Inform Phase 5 G2 (map generator + tile rendering) and G3 (obstacles + collision) scope decisions with real asset data. No files moved — audit only.

---

## Methodology

Every PNG in the relevant kit folders was enumerated and a representative sample of each type was measured (width × height) by reading the IHDR chunk of the PNG binary. Color mode noted where relevant (indexed = palette-based, RGBA = true-color with transparency, RGB = no alpha channel). Sizes quoted are native pixel art source sizes before any game-scale upscaling.

Eligibility criteria for this audit:
- **Ground tiles:** Must be repeatable, flat background — no tall structures, no sprites embedded
- **Structure:** Must be a complete building or landmark as a single composite image
- **Obstacle:** Must be a solid prop suitable for collision blocking or visual cover
- **Vegetation:** Trees, bushes — collision or soft cover
- **Vehicles (static):** Suitable as non-moving world obstacles (wrecked or parked)
- **Vehicles (active):** Enemy tank-class variants — separate from static obstacles

---

## Section 1 — Ground Tiles

**Source:** `tds-modern-tilesets-environment/PNG/Tiles/`

### Critical finding: all five main sheets are sprite sheets, not single tiles

Each of the five ground-texture files is a **320×320px sprite sheet** containing a **5×5 grid of 25 individual 64×64px tile variants**. There is no single-tile-per-file structure. To render a specific tile variant, you must clip a 64×64 region from the correct (col, row) position within the sheet.

The master reference strip `Tiles.png` (64×320) appears to be a 1-column × 5-row reference showing one tile from each terrain type — a visual overview file, not a game asset.

| File | Dimensions | Color mode | Contents | Phase 5 eligible |
|---|---|---|---|---|
| `_0000_WTiles.png` | 320×320 | RGBA | Water — 25 water tile variants | Deferred (no water areas planned for v1 arena; reserve for bridge map v1.1) |
| `_0001_DirtTiles.png` | 320×320 | indexed | Dirt — 25 dirt/earth tile variants | ✅ Yes |
| `_0002_SandTiles.png` | 320×320 | indexed | Sand — 25 sand/desert tile variants | ✅ Yes |
| `_0003_GrassTiles.png` | 320×320 | indexed | Grass — 25 grass tile variants | ✅ Yes |
| `_0004_RoadTiles.png` | 320×320 | indexed | Road/asphalt — 25 road tile variants | ✅ Yes |
| `_0005_RoadDecals.png` | 320×320 | indexed | Road surface markings (lane lines, intersections) | ✅ Overlay layer only — renders on top of road tiles for detail |
| `_0006_GrassToRoad.png` | 320×320 | indexed | Grass-to-road transition edges | ✅ Yes — blend zone between biomes |
| `_0007_SandToRoad.png` | 320×320 | indexed | Sand-to-road transition edges | ✅ Yes |
| `_0008_DirtToRoad.png` | 320×320 | indexed | Dirt-to-road transition edges | ✅ Yes |
| `TDS04_0001_RoadSand.png` | 171×173 | indexed | Road-on-sand composite — irregular shape | ⚠️ Unclear use; not a standard grid tile, may be a special prop |
| `BridgeTiles.png` | 64×192 | RGB | Wood bridge — 3-tile strip (1×3 at 64×64 each) | ❌ Deferred to v1.1 |
| `Tiles.png` | 64×320 | RGB | Reference strip — 1 tile per terrain type stacked | ❌ Reference only, not a game asset |

**Tile grid implication for the map generator:** At 64×64 game units per tile, a WORLD_WIDTH × WORLD_HEIGHT of 2000×2000 requires a 32×32 grid (1024 tiles). At CAMERA_ZOOM=1.0, a 390-px-wide device screen shows approximately 6 tiles across. Viewport culling will draw ~8×18 = 144 tiles per frame maximum — well within budget.

**On the indexed color mode:** Four of the five main terrain sheets use an indexed palette (8-bit). Most image decoders and Skia handle indexed PNGs transparently — they read as RGBA at runtime. No special handling required.

**Transition tiles usage note:** The three transition sheets (GrassToRoad, SandToRoad, DirtToRoad) add significant visual polish at biome boundaries but require knowing which tile neighbors which. For Phase 5 G2, the simplest valid approach is to skip transitions initially (solid biome zones only) and add transition tile selection in a later pass. This is a scope decision, not an asset problem — the tiles exist and are ready.

---

## Section 2 — Structures (Buildings and Landmarks)

**Source:** `tds-modern-tilesets-environment/PNG/House/`, `PNG/WatchTower/`

| File | Dimensions | Subject | Phase 5 eligible | Notes |
|---|---|---|---|---|
| `TDS04_0000_House01.png` | 132×132 | Square urban building with flat roof | ✅ Yes | Symmetrical footprint — good for rooftop sniper spawning |
| `TDS04_House02.png` | 263×139 | Wide rectangular compound/building | ✅ Yes — with caveat | Very wide (nearly 2× the height). Works for a large compound or warehouse. Rooftop sniper position calculation is more complex: the rooftop is not a square, so sniper spawn point needs a manual offset rather than center. |
| `TDS04_0009_WatchTower.png` | 72×72 | Wooden watchtower platform | ✅ Yes | Compact landmark. Ideal for desert/open-area maps. The sniper kit has a dedicated `Base.png` (Sniper/Base.png, 96×96) designed to accompany the sniper sprite on an elevated position — the two pair well. |

**Recommendation for G2/G3 scope:** House01 and WatchTower are the primary structures for the generator's `buildingBudget`. House02 is optional variety — flag it as a distinct building type so the generator can control their frequency separately. The asymmetric dimensions of House02 mean its rooftop sniper position must be hardcoded as an offset from the building origin rather than computed as the center.

---

## Section 3 — Cover Obstacles

**Source:** `tds-modern-tilesets-environment/PNG/SandBag/`, `PNG/Rocks/`

| File | Dimensions | Subject | Phase 5 eligible | Collision profile |
|---|---|---|---|---|
| `TDS04_0002_Sandbags.png` | 85×23 | Stacked sandbag wall segment | ✅ Yes | Wide, shallow — ideal for chokepoint/door position cover. Collision box: full 85×23 rectangle |
| `TDS04_0003_Rock03.png` | 56×64 | Large boulder | ✅ Yes | Near-square footprint — good full collision |
| `TDS04_0004_Rock02.png` | 48×62 | Medium rock cluster | ✅ Yes | Slightly smaller than Rock03 |
| `TDS04_0005_Rock01.png` | 31×38 | Small rock | ✅ Yes | Smallest collision box; good for sparse scatter |

**Sandbag note:** The 85×23 dimensions are extremely wide relative to height — a landscape-oriented barricade, not a point obstacle. In the generator, sandbags should be placed in deliberate chokepoint positions (e.g., near building doors, at road intersections), not scattered randomly like rocks. Randomly placed 85×23 objects will look odd and block paths in unexpected ways.

---

## Section 4 — World Props (Crates and Barrels)

**Source:** `tds-modern-tilesets-environment/PNG/Crates Barrels/`

Six prop sprites, three object types. All are small decorative/obstacle items.

| File | Dimensions | Subject | Phase 5 eligible | Notes |
|---|---|---|---|---|
| `TDS04_0013_Box-02.png` | 30×31 | Military crate (green, type 2) | ✅ Yes | Near-identical to Box1 in dimensions |
| `TDS04_0014_Box-02-mini.png` | 19×19 | Small version of above | ✅ Yes | Too small for meaningful collision; use as decoration |
| `TDS04_0015_Barrel-oil.png` | 20×20 | Oil/fuel drum, top-down view | ✅ Yes | Tiny — decoration only, no collision |
| `TDS04_0016_Barrel.png` | 20×20 | Standard barrel, top-down view | ✅ Yes | Same as above — use as scatter decoration |
| `TDS04_0017_Box1-mini.png` | 19×19 | Small wooden crate | ✅ Yes | Decoration only |
| `TDS04_0018_Box1.png` | 30×31 | Wooden crate | ✅ Yes | Can have light collision (not significant enough to block infantry) |

**Collision recommendation:** These props are significantly smaller than the player sprite. Treating barrels (20×20) or mini-boxes (19×19) as hard collision objects would create frustrating invisible walls. Recommendation: render all six as visual decoration with no collision. Reserve hard collision for sandbags (85×23), rocks (31–56px), and vehicle wrecks. This matches standard game feel for this genre.

**Naming conflict:** The game already uses `Army Box.png` (from `tds-modern-hero-weapons-and-props/Props/Ammo/`) as the weapon crate pickup sprite, registered as `PickupSprites.crate`. The environmental Box-02 and Box1 props are visually distinct and will not conflict, but make sure to use different registered names in sprites.ts to avoid collision.

---

## Section 5 — Vegetation (Trees and Bushes)

**Source:** `tds-modern-tilesets-environment/PNG/Trees Bushes/`

Ten sprites total: 4 large trees, 3 small trees, 3 bushes.

### Large trees

| File | Dimensions | Phase 5 eligible | Notes |
|---|---|---|---|
| `TDS04_0022_Tree1.png` | 152×136 | ✅ Yes | Broadest tree — dominant landmark |
| `TDS04_0020_Tree3.png` | 161×145 | ✅ Yes | Tallest tree (in source dimensions) |
| `TDS04_0021_Tree2.png` | 104×106 | ✅ Yes | Compact large tree |
| `TDS04_0019_Tree4.png` | 140×131 | ✅ Yes | Good midsize variety |

### Small trees

| File | Dimensions | Phase 5 eligible | Notes |
|---|---|---|---|
| `TDS04_0008_Tree05.png` | 45×45 | ✅ Yes | Smallest "tree" — almost reads as large bush at game scale |
| `TDS04_0007_Tree06.png` | 25×26 | ✅ Yes | Very small sapling/shrub |
| `TDS04_0006_Tree07.png` | 29×28 | ✅ Yes | Similar to Tree06 |

### Bushes

| File | Dimensions | Phase 5 eligible | Notes |
|---|---|---|---|
| `TDS04_0012_Bush-01.png` | 31×30 | ✅ Yes | Small round bush |
| `TDS04_0011_Bush-02.png` | 66×28 | ✅ Yes | Low wide shrub — landscape shape |
| `TDS04_0010_Bush-03.png` | 44×34 | ✅ Yes | Medium bush |

**Collision recommendation:** Large trees (Tree1–Tree4, 104–161px) should have full collision — they're significant obstacles. Small trees (Tree05–07, 25–45px) are borderline; light collision or none (they're visual scatter). Bushes (31–66px) are soft cover — no hard collision, but the game can use their position as soft visual cover markers for AI.

**Vegetation context note:** The context doc specifies vegetation excluded on `rain` weather rolls (aesthetic consistency). All 10 sprites are eligible for the `vegetationBudget` slot in the map generator. The generator should draw from the full pool of 10 for woodland-biased runs.

---

## Section 6 — Military Vehicle Wrecks (Kit 1a/1b — Enemy Death States)

**Source:** `tds-pixel-art-modern-soldiers-and-vehicles-sprites/` and `tds-modern-soldiers-and-vehicles-sprites-2/`

These are the "killed" states of the four active enemy vehicle types. They are not designed as static world props — they're designed to replace the live vehicle sprite when the enemy is destroyed during a run. Listed here for completeness and for the overlap analysis in Section 9.

### Humvee Broken (Kit 1a)

⚠️ **Critical naming issue:** All 6 broken Humvee files contain garbled non-ASCII characters in their filenames (`Humvee_Broken_0000_æ½«⌐-6.png` through `Humvee_Broken_0005_æ½«⌐-1.png`). This is likely a character encoding corruption from the zip extraction (original Chinese filename characters from the publisher's source). React Native's Metro bundler uses the filesystem path in `require()` calls — non-ASCII characters in paths can cause bundler failures or silent require errors on some platforms. **These files must be renamed (e.g., to `Humvee_Broken_1.png` through `Humvee_Broken_6.png`) when imported into `assets/`.** Note: looking at the numbering pattern (suffixes -6 through -1), these appear to be the 6 layer-export variants of the same wreck image (different damage states).

| Files | Dimensions | Count | Eligible for active use | Notes |
|---|---|---|---|---|
| `Humvee_Broken_0000_*` through `_0005_*` | 128×128 | 6 | ✅ (rename required) | 6 variants = multiple visual states of the same wreck |

### BTR Broken (Kit 1a)

| File | Dimensions | Eligible | Notes |
|---|---|---|---|
| `BTR_Broken/BTR_BrokenBase.png` | 128×128 | ✅ | Hull destroyed state |
| `BTR_Broken/BTR_BrokenTower.png` | 128×128 | ✅ | Turret destroyed state |

BTR is a 2-part composite (base + tower separately animated during live state). The broken version has two separate pieces. When rendering the BTR death state, composite both at the same position.

### Panzer Broken (Kit 1a)

| File | Dimensions | Eligible | Notes |
|---|---|---|---|
| `Panzer_Broken/Panzer_Broken.png` | 128×128 | ✅ | Primary wreck |
| `Panzer_Broken/Panzer_Broken2.png` | 128×128 | ✅ | Alternate burn state |
| `Panzer_Broken/Panzer_BrokenTower.png` | 128×128 | ✅ | Destroyed turret |

### ACS Broken (Kit 1b)

| File | Dimensions | Eligible | Notes |
|---|---|---|---|
| `ACS/Broken/ACS_Broken_Base_01.png` | 192×192 | ✅ | Base wreck state 1 |
| `ACS/Broken/ACS_Broken_Base_02psd.png` | 192×192 | ✅ | Base wreck state 2 |
| `ACS/Broken/ACS_Broken_Tower_01.png` | 192×192 | ✅ | Tower wreck state 1 |
| `ACS/Broken/ACS_Broken_Tower_02.png` | 192×192 | ✅ | Tower wreck state 2 |

**Use case for military wrecks:** These are for Phase 5 G4/G5 when enemy tanks are killed — the sprite transitions to the broken version. They are NOT recommended for use as static world-spawn obstacles (see Section 9 — Overlap Analysis for why).

---

## Section 7 — Civilian Vehicles Kit — Pristine (Static World Props / Parked Cars)

**Source:** `top-down-trucks-and-cars-pixel-art-asset-pack/PNG/` — color folders `car1_bright_blue` through `car10_yellow`, `cargo1_beige` through `cargo9_white`, and `ambulance_police_technical_fire/`

**Structure:** The kit has 10 sedan/hatchback color variants and 9 cargo/truck color variants. Each color folder contains the same vehicle silhouettes recolored. The vehicle types within each car folder are:

### Vehicle types per car color folder (24 files per folder × 10 colors = 240 files)

| Type | Files per folder | Dimensions | Notes |
|---|---|---|---|
| Sedan/hatchback (`car_*`) | 11 files | 128×128 | Multiple viewing angle variants of the same car model |
| Bus (`bus_*`) | 3 files | 256×256 | Very large — nearly 4× the area of a car |
| Large truck (`truck_*`) | 7 files | 128×128 | Multiple variants |
| Small truck (`small_truck_*`) | 3 files | 128×128 | Pickup-sized |

### Cargo/technical folder (5 files per folder × 9 colors = 45 files)

| Type | Files per folder | Dimensions | Notes |
|---|---|---|---|
| Technical element (`technical_element_*`) | 5 files | 256×256 (variants 1,2) or 128×128 (variants 3,4,5) | Appears to be overlay parts for a flatbed/technical truck — not standalone vehicles |

### Special vehicles (6 files, fixed — no color variants)

| File | Dimensions | Eligible | Notes |
|---|---|---|---|
| `ambulance.png` | 128×128 | ✅ | Distinctive markings — adds civilian authenticity |
| `police_car.png` | 128×128 | ✅ | Adds abandoned police vehicle atmosphere |
| `taxi.png` | 128×128 | ✅ | Urban flavor |
| `fire engine.png` | 128×128 | ✅ | Large emergency vehicle |
| `flatten_technical_part_long.png` | 256×256 | ⚠️ See note | Appears to be a flatbed truck bed component, not a standalone vehicle |
| `flatten_technical_part_small.png` | 128×128 | ⚠️ See note | Same — component part |

**Bus size warning:** At 256×256 source pixels, a bus rendered at the same scale as a 128×128 car would appear twice as large in each dimension (4× the area). At game scale, a bus obstacle will be very prominent. This is either a feature (large immovable bus = significant terrain) or a problem (too imposing). Recommended: use sparingly (1–2 per map maximum) and in urban-heavy runs only.

**Technical elements / flatten parts:** The 5 `technical_element_*` files within each cargo folder do not appear to be standalone vehicles at the correct angles. They read more as component overlays (e.g., truck bed accessories). Recommend treating them as decorative overlays only, not primary obstacle shapes. The `flatten_technical_part_*` files in the specials folder have the same quality.

**Practical recommendation for Phase 5:** From 291 total pristine vehicle files, the map generator only needs a small curated pool. Recommended selection for the `vehiclePool` (parked pristine cars):
- 4–6 sedan variants across 4–5 colors (e.g., black, blue, gray, white, red)
- 2–3 truck variants in neutral colors
- 1 ambulance, 1 police car (urban-biased runs only)
- Skip buses (too large), skip technical elements (ambiguous art)

---

## Section 8 — Civilian Vehicles Kit — Wrecked (Vehicle Wreck Obstacles)

**Source:** `top-down-trucks-and-cars-pixel-art-asset-pack/PNG/Broken_assets/`

**35 total files. 28 standalone usable. 7 component/ambiguous (do not register as obstacles).**

All 35 are valid PNG files with no corruption. Categorized below:

### Standalone — usable as world obstacles (28 files)

| Type | Files | Dimensions | Notes |
|---|---|---|---|
| Wrecked sedan/car | 11 files (`car_bright_blue1–11`) | 128×128 | Best core obstacle. 11 variants = angle/damage variety |
| Wrecked bus | 3 files (`bus_bright_blue1–3`) | 256×256 | Usable — very large, reserve as centerpiece (0–1 per run) |
| Wrecked large truck | 7 files (`truck_bright_blue1–7`) | 128×128 | Good scatter obstacle |
| Wrecked small truck | 3 files (`small_truck_bright_blue1–3`) | 128×128 | Compact scatter |
| Wrecked ambulance | 1 file | 128×128 | Urban flavor |
| Wrecked police car | 1 file | 128×128 | Urban flavor |
| Wrecked taxi | 1 file | 128×128 | Urban flavor — only pristine in main folders, wrecked in Broken_assets |
| Wrecked fire engine | 1 file | 128×128 | Large special vehicle |

**Note — taxi/fire engine in pristine folders:** The pristine `ambulance_police_technical_fire/` folder includes taxi and fire engine. The `Broken_assets/` folder includes wrecked versions of both. Confirmed by direct file inspection: `fire engine.png` (128×128) and `taxi.png` (128×128) are both present in `Broken_assets/`. All 4 specials (ambulance, police, taxi, fire engine) have both pristine and wrecked variants. ✅

### Component parts / ambiguous — NOT standalone obstacles (7 files)

These exist in Broken_assets but are not complete vehicle silhouettes and should not be registered in the generator's obstacle pool.

| Type | Files | Dimensions | Reason excluded |
|---|---|---|---|
| Technical elements | 5 files (`technical_element_beige_1–5`) | 4×256×256, 1×128×128 | Naming ("technical element") + multi-variant structure (5 size variants) indicates truck bed accessories/overlays, not standalone vehicles. Without visual inspection of the actual art, do not import. |
| Flatten long | 1 file (`flatten_technical_part_long`) | 256×256 | Name explicitly says "part" — this is a component |
| Flatten small | 1 file (`flatten_technical_part_small`) | 128×128 | Same |

**Bottom line for the generator:** Obstacle pool = 28 standalone usable files. Budget split: 0–1 bus (centerpiece) + 4–14 from the remaining 25 non-bus standalones (scatter). The 7 component files are excluded from all obstacle registration.

**Curated G3 import target (~11 files, covers all needed variety):**
- 5 car wrecks: `car_bright_blue{1,4,7,9,11}` — spread across the 11 variants for visual diversity
- 3 truck wrecks: `truck_bright_blue{1,4,7}`
- 1 bus wreck: `bus_bright_blue1` (single color sufficient for centerpiece role)
- 1 ambulance + 1 police car (urban-biased run flavor)

---

## Section 9 — Overlap Analysis

### Military wrecks (Kit 1a/1b) vs. civilian wrecks (Kit 2) as world obstacles

Both kits contain "broken" vehicle sprites, but they serve fundamentally different roles and should not be mixed for the same purpose.

| | Military wrecks (Kit 1a/1b) | Civilian wrecks (Kit 2) |
|---|---|---|
| **Source** | Humvee/BTR/Panzer/ACS Broken folders | `Broken_assets/` folder |
| **Design intent** | Enemy vehicle death state — replaces live sprite when killed | Static civilian vehicles — burned-out world props |
| **Art style** | Military green/tan camouflage, weapon mounts visible | Civilian colors (blue, black, white), no weapons |
| **Compositing** | Some are multi-part (BTR: base + tower separately) | Single sprite, no compositing |
| **Filename issue** | Humvee files have garbled non-ASCII filenames | No filename issues |
| **Recommended use** | Phase 5 G4/G5: display when enemy tank is destroyed | Phase 5 G3: static world obstacles spawned by the generator |

**Decision:** Use civilian Kit 2 wrecks for static map obstacles. Reserve military Kit 1a/1b wrecks exclusively for the enemy-killed state. Do not cross-purpose them. A wrecked Humvee sitting on the map as a pre-spawned obstacle would look identical to a player-killed Humvee, creating gameplay confusion about whether that enemy was already killed or never spawned.

### Civilian car variants — how many to import

The 10-color × 24-file structure means 240 pristine frames exist, but the game doesn't need them all. The visual goal is: "several different civilian car models in several realistic car colors." The coloring is identical across types within each folder — only the hue changes. A curated import of 5–7 sedan wrecks (different colors from `Broken_assets/`) gives the full visual variety without importing 240 files.

### ACS fire effects (already partially staged)

`assets/effects/acs_fire/` currently contains 3 PNGs (untracked in git as of this audit). These are copies of `tds-modern-soldiers-and-vehicles-sprites-2/Effects/ACS Fire/ACSF_01–03.png` (48×96px each). They are already in the project — just need a `sprites.ts` registration and a commit when ACS is implemented (Phase 5 G5 scope).

No overlap with any other kit. The ACS fire frames are unique to kit 1b.

---

## Section 10 — Specialist Enemies (Phase 5 G4 Assets, listed for completeness)

These are NOT environment assets, but are included because they came up during the directory walk and will be needed for G4 planning.

### Spec Ops / Gunner (Kit 1b — `tds-modern-soldiers-and-vehicles-sprites-2/Gunner/`)

| Asset | Dimensions | Notes |
|---|---|---|
| `Gunner.png` (idle) | 96×96 | Source reference |
| `GunnerWalk_01–07.png` | 96×96 each | 7-frame walk cycle |
| `GunnerShot.png` | 96×96 | Fire frame |
| `GDS_01–05.png` | 96×96 each | 5-frame death animation |
| `GunnerBullet.png` | 1×3 | Bullet projectile sprite (very small) |
| `Effect/1–3.png` | 24×24 | 3-frame muzzle flash animation |

All 96×96 — matches hero and Scav/Raider art scale exactly. Walk cycle matches hero (7 frames).

### Sniper (Kit 1b — `tds-modern-soldiers-and-vehicles-sprites-2/Sniper/`)

| Asset | Dimensions | Notes |
|---|---|---|
| `Shot.png` (firing pose) | 96×96 | Prone/shooting position |
| `SW_01–07.png` | 96×96 each | 7-frame walk cycle |
| `SniperDIe_00–04.png` | 96×96 each | 5-frame death animation (note: frame 00 = standing, used as idle) |
| `SniperBullet.png` | 1×4 | Bullet projectile sprite |
| `Effects/1–3.png` | 24×24 | 3-frame muzzle flash |
| `Base.png` | 96×96 | **Turret/sandbag base the sniper sits on** — render behind the sniper sprite |

`Base.png` is the designed companion to the sniper — a sandbag/turret mount that the ghillie-suit sniper sits behind. Pair them: render Base.png at the rooftop position, render the sniper sprite centered on it.

### Active enemy vehicle classes (Kit 1a/1b — for Phase 5 G4/G5)

| Enemy | Sprite files | Source dim | Notes |
|---|---|---|---|
| Humvee (Tank-Light) | Humvee.png, Humvee2.png, Humvee3.png | 128×128 | 3 paint variants — use as visual variety, same stats |
| BTR (Tank-Medium) | BTR_Base.png + BTR_Tower.png, BTR_Move01–02.png | 128×128 / 96×96 | 2-part composite for live state; 2-frame move animation |
| Panzer (Tank-Heavy) | PanzerBase.png + PanzerTower.png, PanzerMove(1–4).png | 128×128 / 96×96 | 2-part composite; 4-frame move animation |
| ACS (Tank-Heavy alt) | ACS_move._01–05.png | 192×192 | 5-frame move cycle; single composite (no separate tower) |

**Fire effects for active tanks:**

| Effect | Files | Dimensions | Notes |
|---|---|---|---|
| BTR muzzle flash | `BTR Fire/BTR_Fire_01–03.png` | 96×96 | 3-frame fire flash |
| Panzer muzzle flash | `Panzer Fire/Panzer_fire1–3.png` | 96×96 | 3-frame fire flash |
| ACS fire | `ACS Fire/ACSF_01–03.png` | 48×96 | 3-frame — narrow horizontal (48px) for a top-mounted cannon |

---

## Section 11 — Phase 5 Import Recommendations by Group

### G2 — Map generator + tile rendering

Import only what the tile renderer needs. No obstacles, no vehicles yet.

**Import to `assets/sprites/environment/tilesets/`:**
- `_0001_DirtTiles.png` → `dirt.png`
- `_0002_SandTiles.png` → `sand.png`
- `_0003_GrassTiles.png` → `grass.png`
- `_0004_RoadTiles.png` → `road.png`

**Defer to G3:**
- Water tiles (`_0000_WTiles.png`) — no water in v1 arena
- Transition tiles (`_0006–_0008`) — add in polish pass after biome placement works
- Road decals (`_0005_RoadDecals.png`) — overlay layer, add in G3 alongside road tile placement

**Tile cell size decision:** The generator should use 64-unit tile cells (matching the 64×64px source tile dimensions). A 2000×2000 world = 32×32 = 1024 tile cells. With viewport culling, ~8–10 tiles are drawn per dimension at CAMERA_ZOOM=1.0.

### G3 — Obstacles + collision

Import in the following priority order:

**Tier 1 — Hard collision objects (most impactful for gameplay):**
- Rocks: `TDS04_0003_Rock03.png`, `TDS04_0004_Rock02.png`, `TDS04_0005_Rock01.png`
- Sandbags: `TDS04_0002_Sandbags.png`
- Vehicle wrecks (curated pool of ~7 from `Broken_assets/`): recommend `car_bright_blue{1,4,7}`, `truck_bright_blue{1,4}`, `bus_bright_blue1`, `police_car`, `ambulance`

**Tier 2 — Structures (hard collision, sniper spawn points):**
- `TDS04_0000_House01.png`
- `TDS04_House02.png`
- `TDS04_0009_WatchTower.png`

**Tier 3 — Soft/visual-only props (no collision):**
- All 6 crates/barrels: `TDS04_0013–0018_*.png`
- Large trees (4 files): `TDS04_0019–0022_Tree*.png`
- Small trees + bushes (6 files): `TDS04_0006–0012_*.png`

**Pristine parked cars (optional, visual-only, low priority):**
- If the generator places pristine parked cars along roads, import a curated set of 4–6 car variants from the car kit (e.g., `car_bright_blue1.png`, `car4_black/car_black1.png`, `car9_white/car_white1.png`)
- These are visual-only (no collision) — they're set-dressing to make roads feel inhabited

### G4 — Spec Ops + Sniper enemies

**Import to `assets/sprites/enemies/spec_ops/`:**
- `GunnerWalk_01–07.png` (7 frames)
- `GunnerShot.png`
- `GDS_01–05.png` (5 frames)
- `GunnerBullet.png`
- `Effect/1–3.png`

**Import to `assets/sprites/enemies/sniper/`:**
- `SW_01–07.png` (walk, 7 frames — may not be used if sniper is stationary)
- `Shot.png`
- `SniperDIe_00–04.png` (5 frames)
- `SniperBullet.png`
- `Effects/1–3.png`
- `Base.png`

### G5 — Tank class + camera zoom lock

**Import to `assets/sprites/enemies/tank/`:**
- Humvee: `Humvee.png`, `Humvee2.png`, `Humvee3.png` + rename broken files
- BTR: `BTR_Base.png`, `BTR_Tower.png`, `BTR_Move01–02.png`, `BTR_BrokenBase.png`, `BTR_BrokenTower.png`, `BTR_Shot01–02.png`
- Panzer: `PanzerBase.png`, `PanzerTower.png`, `PanzerMove(1–4).png`, `Panzer_Broken.png`, `Panzer_BrokenTower.png`, `Panzer_Broken2.png`, `Panzer Shot 01–03.png`
- ACS: `ACS_move._01–05.png`, `ACS_Broken_Base_01.png`, `ACS_Broken_Tower_01.png`

**Import to `assets/effects/`:**
- `BTR Fire/BTR_Fire_01–03.png` → `assets/effects/btr_fire/`
- `Panzer Fire/Panzer_fire1–3.png` → `assets/effects/panzer_fire/`
- ACS fire already staged in `assets/effects/acs_fire/` — just commit and register

---

## Section 12 — Summary and Key Decisions for Strategic Planning

**1. Tile sheets require UV-clip rendering, not stamp rendering.**
Each terrain type is a 320×320 sprite sheet of 25 variants (5×5 grid of 64×64px tiles). To render a specific tile variant, the renderer must clip a 64×64 sub-region from the sheet. Skia supports this via `<Image src={sheet} sampling={...} fit="none" x={-col*64} y={-row*64} width={sheetWidth} height={sheetHeight}` clipped by a parent `<Group clip={...}>`. Alternatively, the generator can pick a single variant per tile cell and compute the source rect once at generation time, storing it in the tile data. This is a key technical decision for G2 implementation.

**2. Alternative to UV-clip: pre-extract individual tile variants.**
If UV-clipping adds implementation complexity in G2, an alternative is to pre-extract individual 64×64 tile PNG files from the sheets (tool: ImageMagick `convert`, or a one-time Node script). This trades import count for runtime simplicity — instead of 5 sprite sheets, you'd have up to 125 individual tile files (5 sheets × 25 tiles). With viewport culling this is manageable, but hits the tech-debt rule about per-frame `useImage` calls scaling linearly. This is a deliberate engineering tradeoff to surface before G2 CC prompt is drafted.

**3. Civilian Kit 2 wrecks are the correct source for world obstacles.**
Military vehicle wrecks are for enemy-killed states only. Civilian Kit 2 `Broken_assets/` (35 files, 128–256px) are for static map obstacle use. The two should never be mixed for the same purpose.

**4. Humvee broken files must be renamed before import.**
Filenames contain garbled non-ASCII characters from zip extraction. Must rename to simple ASCII before any `require()` call in the JS bundler.

**5. Sandbags are chokepoint assets, not scatter assets.**
The 85×23 shape is a barricade, not a point obstacle. The map generator should place sandbags in deliberate positions (near building entrances, at road intersections), not in the general obstacle scatter pool.

**6. Bus (256×256) and technical elements should be used sparingly.**
The bus is 4× the area of a car. One bus used as a road-blocking centrepiece is atmospheric; three buses make the map feel congested. Technical element sprites are ambiguous (appear to be component parts, not standalone vehicles) — use only if inspected visually and confirmed standalone-usable.

**7. ACS fire effects are already staged.**
`assets/effects/acs_fire/1–3.png` are untracked in git. They just need a commit and `sprites.ts` registration when ACS enemy is implemented (G5).

**8. Transition tiles and road decals are a polish pass, not a G2 requirement.**
The three transition sheets and road decals sheet exist and are eligible. Adding transition logic (neighbor-aware tile selection) to the generator in G2 would significantly increase scope. Recommended approach: solid terrain blocks in G2, transition tiles in a later polish pass.

---

## Section 13 — Locked Decisions (Post-Audit Review, 2026-05-13)

These decisions were confirmed and locked by Mo (co-founder / product lead) after reviewing the audit. They are binding for all Phase 5 groups and should not be re-litigated without a documented scope change.

### Rendering architecture

**LOCKED — Atlas over Image for all tile rendering.**
Skia `<Atlas>` is the only viable API for 64×64 sub-rectangle clipping from a 320×320 sprite sheet. `<Image>` has no `srcRect` prop. `<Atlas>` accepts `sprites: SkRect[]` (source rects) and `transforms: SkRSXform[]` (destination transforms), and both accept `SharedValue<T>` via `SkiaProps<AtlasProps>` — confirming that tile rendering can be fully worklet-driven at 60fps.

**LOCKED — Tile extraction over pre-split files.**
Do not pre-split tilesheets into individual 64×64 PNGs. Use Atlas clipping at runtime. This avoids 125 individual file imports and is the correct Skia pattern.

### Asset sourcing

**LOCKED — Civilian Kit 2 wrecks only for static world obstacles.**
Military vehicle wrecks (Humvee/BTR/Panzer/ACS Broken) are reserved exclusively for enemy-killed states and must never be pre-spawned as map obstacles. Civilian `Broken_assets/` only.

**LOCKED — 28 standalone usable wrecks (verified count).**
Of the 35 files in `Broken_assets/`, 28 are complete standalone vehicle silhouettes usable as obstacles. 7 are component parts (5× `technical_element_beige_*`, 1× `flatten_technical_part_long`, 1× `flatten_technical_part_small`) and are permanently excluded from the generator's obstacle pool.

**LOCKED — Bus budget: 0–1 as centerpiece. Scatter pool: 4–14 from the 25 non-bus standalones.**
The 256×256 bus (3 variants) is reserved as an optional single-run centerpiece. Never place more than 1. The scatter budget draws from the remaining 25 standalones (11 cars + 7 trucks + 3 small trucks + 1 ambulance + 1 police car + 1 taxi + 1 fire engine).

**LOCKED — Humvee broken files must be renamed to ASCII on import.**
All 6 `Humvee_Broken_*` files contain garbled non-ASCII characters (`æ½«⌐`). Metro bundler `require()` calls will fail on non-ASCII paths on some platforms. Rename to `Humvee_Broken_1.png` through `Humvee_Broken_6.png` in the same commit as import. This is a hard blocker for G5.

### Generator scope

**LOCKED — No transition tiles in G2.**
The generator places solid biome zones in G2. Neighbor-aware transition tile selection is a polish pass deferred to after G3 is stable.

**LOCKED — Sandbags are chokepoint assets, not random scatter.**
The 85×23 barricade shape must be placed by deliberate logic (near building doors, road intersections), not included in the general `obstacleBudget` scatter pool. Sandbag placement logic is deferred to G3 when collision objects are registered.

**LOCKED — ACS fire effects are staged for G5.**
`assets/effects/acs_fire/` contains 3 untracked PNGs (ACSF_01–03, 48×96px). They require no import work — only a `sprites.ts` registration and git commit when ACS enemy is implemented in G5.

### Budget parameters (real numbers, binding for generator implementation)

| Parameter | Min | Max | Notes |
|---|---|---|---|
| `buildingBudget` | 1 | 3 | House01 + House02 + WatchTower pool |
| `obstacleBudget` | 20 | 40 | G3 scope — rocks + sandbags (chokepoint-placed separately) |
| `vehicleWreckBudget.bus` | 0 | 1 | Centerpiece — 256×256, 3 variants |
| `vehicleWreckBudget.scatter` | 4 | 14 | 25 non-bus standalones from Broken_assets |
| `vegetationBudget` | 0 | 20 | Rain weather → 0; all 10 tree/bush sprites eligible |
| `TILE_SIZE` | — | 64 | px per tile cell, confirmed from sprite sheet dimensions |
| Tile grid | — | 94×94 | 6000÷64 = 8836 total cells (updated Phase 5 Step 2: world expanded to 6000×6000) |
| Visible tiles (max) | — | ~187 | ~11 cols × 17 rows at CAMERA_ZOOM=1.0, 390×844px device; viewport culling active |

---

## Section 14 — Step 3 Scatter Prop Survey (Phase 5 G2, 2026-05-13)

**Scope:** All single-sprite static props suitable for world placement in Step 3. Dimensions confirmed by reading PNG file headers (System.Drawing). No implementation yet — this survey informs the Step 3 asset list lock.

**Criteria applied:**
- Single PNG (not a sprite sheet, not animation frames)
- Static prop (not enemy sprite, not weapon, not effect, not UI)
- Dimensions 19px–263px (both axes within range)
- Not already categorized as enemy asset, pickup sprite, or tile sheet

---

### Category A — Large Trees (scatter freely)

All four are large canopy trees seen from directly overhead. The shape is a dense circular mass with soft shadow. Suitable for grouped grove placement or isolated specimens. No orientation needed.

| File | Kit path | Dimensions | Oversize? | Placement rule |
|---|---|---|---|---|
| `TDS04_0022_Tree1.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 152×136 | No | Scatter freely |
| `TDS04_0020_Tree3.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 161×145 | No | Scatter freely |
| `TDS04_0019_Tree4.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 140×131 | No | Scatter freely |
| `TDS04_0021_Tree2.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 104×106 | No | Scatter freely |

**Min spacing recommendation:** 120px center-to-center (roughly one tree-width). Groups of 2–4 touching trees read as groves; isolated trees read as landmarks.

---

### Category B — Small Trees / Saplings (scatter freely)

Very small — at game scale (no upscaling, or 2× at most) these read as saplings, scrub, or low ground-cover plants rather than mature trees. Good for filling sparse areas without visual weight.

| File | Kit path | Dimensions | Notes |
|---|---|---|---|
| `TDS04_0008_Tree05.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 45×45 | Readable as small tree; usable at 1× or 2× |
| `TDS04_0006_Tree07.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 29×28 | Near-minimum readable size at 1×; 2× recommended |
| `TDS04_0007_Tree06.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 25×26 | Same as above |

**Step 3 recommendation:** Include all three. If rendered at native 1×, Tree06/07 are very small (25–29px) — they read as sparse grass tufts rather than trees, which is fine for variety. Flag for scale decision at Step 3 execution time.

---

### Category C — Bushes (scatter freely)

Low, wide ground-cover plants. Different silhouette from trees — the landscape shape of Bush-02 (66×28) reads as a low hedge or shrub bank; the others are rounder.

| File | Kit path | Dimensions | Notes |
|---|---|---|---|
| `TDS04_0011_Bush-02.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 66×28 | Wide, low — shrub bank shape |
| `TDS04_0010_Bush-03.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 44×34 | Medium round bush |
| `TDS04_0012_Bush-01.png` | `tds-modern-tilesets-environment/PNG/Trees Bushes/` | 31×30 | Small round bush |

---

### Category D — Rocks (scatter freely)

Three sizes of boulder/rock cluster. Good for terrain texture — look natural scattered across open ground, especially on dirt and sand biomes.

| File | Kit path | Dimensions | Notes |
|---|---|---|---|
| `TDS04_0003_Rock03.png` | `tds-modern-tilesets-environment/PNG/Rocks/` | 56×64 | Large boulder — near-square footprint |
| `TDS04_0004_Rock02.png` | `tds-modern-tilesets-environment/PNG/Rocks/` | 48×62 | Medium rock cluster |
| `TDS04_0005_Rock01.png` | `tds-modern-tilesets-environment/PNG/Rocks/` | 31×38 | Small rock — good low-density scatter |

---

### Category E — Structures (existing stubs — add assetKey + render)

These already exist as `PlacedEntity` stubs in `mapData.buildings` with world-space positions. Step 3 populates the `assetKey` field and renders them via `<Image>` inside the camera Group. Generator counts and spacing are already enforced (see Section 13 budget). No new placement logic needed for Step 3.

| File | Kit path | Dimensions | Oversize? | Notes |
|---|---|---|---|---|
| `TDS04_0000_House01.png` | `tds-modern-tilesets-environment/PNG/House/` | 132×132 | No (centerpiece-scale) | Square compound — symmetrical, good for 2–3 per map |
| `TDS04_House02.png` | `tds-modern-tilesets-environment/PNG/House/` | 263×139 | **YES** | Very wide (263px). 0–1 per map max. Placement already at building pool 1-in-3 probability |
| `TDS04_0009_WatchTower.png` | `tds-modern-tilesets-environment/PNG/WatchTower/` | 72×72 | No | Compact — looks good isolated or near a building |

**House02 oversize note:** At 263×139, House02 is the largest single prop in the kit. It occupies 4× the area of WatchTower and 2× House01. The generator already limits buildings to 2–3 per map with 300px min spacing — this constraint handles House02's footprint. Step 3 just needs to render it at native dimensions.

---

### Category F — Barrels and Crates (near-structure placement)

Six small props (19–31px). Too small for hard collision at game scale. Best use: cluster 2–5 near buildings to read as a supply depot or storage area. Scattered randomly across the open map they're too small to notice or provide visual interest.

| File | Kit path | Dimensions | Notes |
|---|---|---|---|
| `TDS04_0018_Box1.png` | `tds-modern-tilesets-environment/PNG/Crates Barrels/` | 30×31 | Wooden crate — largest in set |
| `TDS04_0013_Box-02.png` | `tds-modern-tilesets-environment/PNG/Crates Barrels/` | 30×31 | Military crate — near-identical to Box1 |
| `TDS04_0015_Barrel-oil.png` | `tds-modern-tilesets-environment/PNG/Crates Barrels/` | 20×20 | Oil drum, top-down view |
| `TDS04_0016_Barrel.png` | `tds-modern-tilesets-environment/PNG/Crates Barrels/` | 20×20 | Standard barrel |
| `TDS04_0014_Box-02-mini.png` | `tds-modern-tilesets-environment/PNG/Crates Barrels/` | 19×19 | Small military crate |
| `TDS04_0017_Box1-mini.png` | `tds-modern-tilesets-environment/PNG/Crates Barrels/` | 19×19 | Small wooden crate |

**Placement rule:** Spawn 3–6 randomly selected from this pool within 120px of each building center. This gives every building a "supply cluster" without needing explicit placement logic beyond a proximity query.

**Naming conflict reminder:** `Army Box.png` from `Props/Ammo/` is already registered as `PickupSprites.crate` in sprites.ts. These environmental Box props need distinct sprite keys (e.g., `env_crate_wood`, `env_barrel_oil`).

---

### Category G — Vehicle Wrecks (scatter freely / centerpiece)

Already exist as `PlacedEntity` stubs in `mapData.vehicleWrecks`. Step 3 populates assetKey and renders.

**Scatter pool (128×128) — scatter freely:**

| File | Kit path | Dimensions | Count in Broken_assets |
|---|---|---|---|
| `car_bright_blue{1–11}.png` | `TOP-DOWN-TRUCKS-AND-CARS.../PNG/Broken_assets/` | 128×128 | 11 variants |
| `truck_bright_blue{1–7}.png` | Same | 128×128 | 7 variants |
| `small_truck_bright_blue{1–3}.png` | Same | 128×128 | 3 variants |
| `ambulance.png` | Same | 128×128 | 1 |
| `police_car.png` | Same | 128×128 | 1 |
| `taxi.png` | Same | 128×128 | 1 |
| `fire engine.png` | Same | 128×128 | 1 |

**Centerpiece (256×256) — 0–1 per map, already gated in generator:**

| File | Kit path | Dimensions | Notes |
|---|---|---|---|
| `bus_bright_blue1.png` | Same | 256×256 | Oversize — single per map, already in vehicleWrecks stub |

**Recommended curated Step 3 import (~11 files — full variety without all 25):**
`car_bright_blue1`, `car_bright_blue4`, `car_bright_blue7`, `truck_bright_blue1`, `truck_bright_blue4`, `small_truck_bright_blue1`, `ambulance`, `police_car`, `bus_bright_blue1` (centerpiece). That covers all 4 wreck types with enough visual diversity.

---

### Category H — Excluded from Step 3

| Asset | Reason |
|---|---|
| `TDS04_0002_Sandbags.png` (85×23) | See sandbag decision below |
| `TDS04_0001_RoadSand.png` (171×173) | Road transition composite — not a scatter prop |
| Tile sheets (`_0001_*` through `_0008_*`) | Ground tiles, not props |
| `Tileset.png`, `BridgeTiles.png` | Source/reference sheets |
| All enemy sprites, effect sprites, weapon sprites | Non-prop |
| Pristine civilian cars (non-broken, 240 files) | Not wrecks — deferred to road-traffic polish pass |
| Technical elements (5 files) | Component parts, not standalone props (Section 13 locked) |
| Military vehicle wrecks (Humvee/BTR/Panzer/ACS) | Enemy killed-state only (Section 13 locked) |

---

### Sandbag Decision — Step 3 vs G3

**Recommendation: (b) — Skip sandbags from Step 3. Add in G3 with collision and orientation.**

**Reasoning:**

The sandbag sprite (85×23) is a directional barricade, not a point obstacle. Its readability as intentional cover depends on two things Step 3 doesn't have:

1. **Orientation.** Placed at a random rotation, an 85×23 rectangle looks like debris. Oriented perpendicular to a building entrance or toward open ground, it reads as prepared cover. Step 3's scatter logic has no concept of rotation or orientation — props are placed at a fixed angle (0°). Adding per-prop rotation logic just for sandbags expands Step 3's scope.

2. **Collision.** Sandbags positioned without any collision feedback feel decorative, not tactical. The physics payoff (ducking behind a bag to break line-of-sight, using it to funnel enemies into a chokepoint) doesn't exist until G3. Rendering a non-functional sandbag wall before G3 sets false expectations and produces nothing that Step 3 device-testing validates.

All other Step 3 categories (trees, bushes, rocks, barrels, wrecks) scatter correctly without orientation. Sandbags are the only asset whose placement semantics require information (building door direction, open-ground angle) that the scatter system doesn't carry. They're worth adding right, not adding now.

**G3 target:** Place sandbags as deliberate chokepoint props — find each building's nearest open-ground facing using its position on the map, spawn 2–4 sandbags in a line perpendicular to that direction within 80px of the building. Register collision box (85×23). This is a standalone system, not a general scatter pass.

---

### Step 3 Asset List Summary

**Categories approved for Step 3 scatter pool (pending Mo's review):**

| Category | Asset count | Placement |
|---|---|---|
| A — Large trees | 4 | Scatter freely, 120px min spacing |
| B — Small trees | 3 | Scatter freely (fill) |
| C — Bushes | 3 | Scatter freely |
| D — Rocks | 3 | Scatter freely |
| E — Structures | 3 | Existing stubs — add assetKey and render |
| F — Barrels/crates | 6 | Within 120px of buildings (2–5 per building) |
| G — Vehicle wrecks | ~9 curated + bus | Scatter freely (bus: centerpiece) |
| **Total unique sprites** | **~31** | |

**Excluded pending G3:** Sandbags (1 sprite, see above).
