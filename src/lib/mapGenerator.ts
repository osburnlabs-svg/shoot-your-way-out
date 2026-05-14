/**
 * Procedural map generator — Phase 5 G3 (scatter props update).
 *
 * generateMap(seed) returns a complete MapData for one run. Called once at game
 * start from mapLoader.ts; the result is stored as initialMapData in React state
 * in GameCanvas. It does NOT go into the Reanimated SharedValue (GameState).
 *
 * Tile layout strategy (noise-based, replaces per-cell PRNG):
 *   - createNoise2D is seeded by passing mulberry32(seed) as the random source.
 *     simplex-noise consumes 256 PRNG calls during permutation table init, then
 *     the returned function is deterministic (no further PRNG consumption).
 *   - Each tile cell samples noise2D(col * NOISE_SCALE, row * NOISE_SCALE).
 *     NOISE_SCALE = 0.05 produces 2–3 biome transitions across 94 tiles.
 *   - Theme roll (50/50 after weather): picks one of two terrain mappings:
 *       Desert  (isDesert=true):  all tiles → sand
 *       Vegetation (isDesert=false): n < 0.1 → grass, n ≥ 0.1 → dirt
 *   - Variant (0–24) sampled from the remaining mulberry32 stream.
 *
 * Scatter props (G3):
 *   - All entity arrays (buildings, obstacles, vehicleWrecks, vegetation, barrels)
 *     have real assetKeys from sprites.ts EnvSprites and native pixel dimensions.
 *   - Player spawn point (WORLD_WIDTH/2, WORLD_HEIGHT/2) = (3000, 3000) is
 *     excluded via PLAYER_SPAWN_CLEAR_RADIUS (200px) for all prop placement.
 *   - Barrels cluster near buildings (3–5 per structure). If no buildings were
 *     placed, barrels array is empty.
 *
 * PRNG: mulberry32 — fast, seedable, reproducible across platforms.
 * Two runs with the same seed produce identical maps.
 */

import { createNoise2D } from 'simplex-noise';
import type { MapData, TileCell, TileType, WeatherType, PlacedEntity } from '../data/mapTypes';
import { TILE_SIZE, TILE_COLS, TILE_ROWS, WORLD_WIDTH, WORLD_HEIGHT } from '../data/gameConstants';

// ─── PRNG ─────────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function (): number {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Tile grid ────────────────────────────────────────────────────────────────

// Noise frequency: smaller = larger biome regions. 0.05 → ~2–3 transitions per 94-tile axis.
const NOISE_SCALE = 0.05;

// Each 320×320 tilesheet is a 5×5 grid of 64×64 variants.
// The outer ring (16 tiles) are edge/transition tiles with feathered transparent edges —
// intended for biome boundaries, not scatter fill. The inner 3×3 (9 tiles) are solid
// fill tiles safe to use anywhere. Picking from only these keeps the map gap-free.
// Outer ring reserved for future transition-tile logic (Step 3).
const FILL_VARIANTS = [6, 7, 8, 11, 12, 13, 16, 17, 18] as const;

function buildTileGrid(rng: () => number, isDesert: boolean): TileCell[][] {
  // Seed the noise function from the run PRNG. createNoise2D consumes 256 calls
  // from rng to build a permutation table, then the function itself is deterministic.
  const noise2D = createNoise2D(rng);

  const grid: TileCell[][] = [];
  for (let row = 0; row < TILE_ROWS; row++) {
    const rowArr: TileCell[] = [];
    for (let col = 0; col < TILE_COLS; col++) {
      const n = noise2D(col * NOISE_SCALE, row * NOISE_SCALE);
      let type: TileType;
      if (isDesert) {
        type = 'sand';
      } else {
        type = n < 0.1 ? 'grass' : 'dirt';
      }
      const variantIndex = FILL_VARIANTS[Math.floor(rng() * FILL_VARIANTS.length)];
      rowArr.push({ type, variantIndex });
    }
    grid.push(rowArr);
  }
  return grid;
}

// ─── Spawn clearance ──────────────────────────────────────────────────────────

// All props and buildings are rejected within this radius of the player spawn.
const PLAYER_SPAWN_CLEAR_RADIUS = 200;
const SPAWN_X = WORLD_WIDTH / 2;
const SPAWN_Y = WORLD_HEIGHT / 2;

function isNearSpawn(x: number, y: number): boolean {
  const dx = x - SPAWN_X;
  const dy = y - SPAWN_Y;
  return dx * dx + dy * dy < PLAYER_SPAWN_CLEAR_RADIUS * PLAYER_SPAWN_CLEAR_RADIUS;
}

// ─── Entity pools ─────────────────────────────────────────────────────────────

const HOUSE_POOL = [
  { assetKey: 'env_house01', width: 132, height: 132 },
  { assetKey: 'env_house02', width: 263, height: 139 },
];
const WATCHTOWER_POOL = [
  { assetKey: 'env_watchtower', width: 72, height: 72 },
];

const ROCK_POOL = [
  { assetKey: 'env_rock_large',  width: 56, height: 64 },
  { assetKey: 'env_rock_medium', width: 48, height: 62 },
  { assetKey: 'env_rock_small',  width: 31, height: 38 },
];

const VEGETATION_POOL = [
  { assetKey: 'env_tree_large_1', width: 152, height: 136 },
  { assetKey: 'env_tree_large_2', width: 104, height: 106 },
  { assetKey: 'env_tree_large_3', width: 161, height: 145 },
  { assetKey: 'env_tree_large_4', width: 140, height: 131 },
  { assetKey: 'env_tree_small_1', width: 45,  height: 45  },
  { assetKey: 'env_tree_small_2', width: 29,  height: 28  },
  { assetKey: 'env_tree_small_3', width: 25,  height: 26  },
  { assetKey: 'env_bush_1',       width: 31,  height: 30  },
  { assetKey: 'env_bush_2',       width: 66,  height: 28  },
  { assetKey: 'env_bush_3',       width: 44,  height: 34  },
];

const WRECK_SCATTER_POOL = [
  { assetKey: 'env_car_wreck_1',       width: 128, height: 128 },
  { assetKey: 'env_car_wreck_2',       width: 128, height: 128 },
  { assetKey: 'env_car_wreck_3',       width: 128, height: 128 },
  { assetKey: 'env_truck_wreck_1',     width: 128, height: 128 },
  { assetKey: 'env_truck_wreck_2',     width: 128, height: 128 },
  { assetKey: 'env_small_truck_wreck', width: 128, height: 128 },
  { assetKey: 'env_ambulance_wreck',   width: 128, height: 128 },
  { assetKey: 'env_police_wreck',      width: 128, height: 128 },
];

const WRECK_BUS = { assetKey: 'env_bus_wreck', width: 256, height: 256 };

const BARREL_POOL = [
  { assetKey: 'env_box_wood',           width: 30, height: 31 },
  { assetKey: 'env_box_military',       width: 30, height: 31 },
  { assetKey: 'env_barrel_oil',         width: 20, height: 20 },
  { assetKey: 'env_barrel',             width: 20, height: 20 },
  { assetKey: 'env_box_wood_small',     width: 19, height: 19 },
  { assetKey: 'env_box_military_small', width: 19, height: 19 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Minimum spacing between building centers (world units).
const BUILDING_MIN_SPACING = 300;
// Margin from world edge where buildings won't spawn.
const BUILDING_EDGE_MARGIN = 200;

function randomWorldPos(rng: () => number, margin: number): { x: number; y: number } {
  return {
    x: margin + Math.floor(rng() * (WORLD_WIDTH - margin * 2)),
    y: margin + Math.floor(rng() * (WORLD_HEIGHT - margin * 2)),
  };
}

function tooClose(a: PlacedEntity, b: PlacedEntity, minDist: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy < minDist * minDist;
}

// ─── Entity builders ──────────────────────────────────────────────────────────

// Houses min 4/max 6, cycle pool for first 2 slots to guarantee both variants.
// Watchtowers min 4/max 6, spacing checked cross-category against all placed structures.
function buildStructures(rng: () => number): PlacedEntity[] {
  const houseCount = 4 + Math.floor(rng() * 3);  // 4–6
  const towerCount = 4 + Math.floor(rng() * 3);  // 4–6
  const allPlaced: PlacedEntity[] = [];

  const houses: PlacedEntity[] = [];
  let houseAttempts = 0;
  while (houses.length < houseCount && houseAttempts < 200) {
    houseAttempts++;
    const pos = randomWorldPos(rng, BUILDING_EDGE_MARGIN);
    const slotIndex = houses.length;
    const def = slotIndex < HOUSE_POOL.length
      ? HOUSE_POOL[slotIndex]!
      : HOUSE_POOL[Math.floor(rng() * HOUSE_POOL.length)]!;
    const candidate: PlacedEntity = { ...pos, ...def };
    if (
      allPlaced.every(p => !tooClose(p, candidate, BUILDING_MIN_SPACING)) &&
      !isNearSpawn(candidate.x, candidate.y)
    ) {
      houses.push(candidate);
      allPlaced.push(candidate);
    }
  }

  const towers: PlacedEntity[] = [];
  let towerAttempts = 0;
  while (towers.length < towerCount && towerAttempts < 200) {
    towerAttempts++;
    const pos = randomWorldPos(rng, BUILDING_EDGE_MARGIN);
    const candidate: PlacedEntity = { ...pos, ...WATCHTOWER_POOL[0]! };
    if (
      allPlaced.every(p => !tooClose(p, candidate, BUILDING_MIN_SPACING)) &&
      !isNearSpawn(candidate.x, candidate.y)
    ) {
      towers.push(candidate);
      allPlaced.push(candidate);
    }
  }

  // [DIAG-B2] budget vs placed — remove after blocker 2 resolved
  console.log('[DIAG-B2] houses: budget', houseCount, '/ placed', houses.length);
  console.log('[DIAG-B2] watchtowers: budget', towerCount, '/ placed', towers.length);
  return allPlaced;
}

// 50–100 rocks (no sandbags — those need G4 orientation logic; deferred to G4).
function buildObstacles(rng: () => number, buildings: PlacedEntity[]): PlacedEntity[] {
  const count = 50 + Math.floor(rng() * 51); // 50–100
  const placed: PlacedEntity[] = [];
  let attempts = 0;

  while (placed.length < count && attempts < 600) {
    attempts++;
    const pos = randomWorldPos(rng, 100);
    const nearBuilding = buildings.some(b => {
      const dx = b.x - pos.x;
      const dy = b.y - pos.y;
      return dx * dx + dy * dy < 150 * 150;
    });
    if (!nearBuilding && !isNearSpawn(pos.x, pos.y)) {
      const def = ROCK_POOL[Math.floor(rng() * ROCK_POOL.length)]!;
      placed.push({ ...pos, ...def });
    }
  }

  // [DIAG-B2] budget vs placed — remove after blocker 2 resolved
  console.log('[DIAG-B2] obstacles: budget', count, '/ placed', placed.length);
  return placed;
}

// 2–3 buses (400px bus-to-bus spacing) + 12–32 scatter wrecks (150px bus exclusion).
function buildVehicleWrecks(rng: () => number, buildings: PlacedEntity[]): PlacedEntity[] {
  const busCount = 2 + Math.floor(rng() * 2);    // 2 or 3
  const scatterCount = 12 + Math.floor(rng() * 21); // 12–32
  const BUS_MIN_SPACING = 400;
  const placed: PlacedEntity[] = [];

  const buses: PlacedEntity[] = [];
  let busAttempts = 0;
  while (buses.length < busCount && busAttempts < 100) {
    busAttempts++;
    const pos = randomWorldPos(rng, 150);
    const candidate: PlacedEntity = { ...pos, ...WRECK_BUS };
    if (
      !isNearSpawn(pos.x, pos.y) &&
      buses.every(b => !tooClose(b, candidate, BUS_MIN_SPACING))
    ) {
      buses.push(candidate);
      placed.push(candidate);
    }
  }

  let scatterPlaced = 0;
  let scatterAttempts = 0;
  while (scatterPlaced < scatterCount && scatterAttempts < 400) {
    scatterAttempts++;
    const pos = randomWorldPos(rng, 100);
    const nearBuilding = buildings.some(b => {
      const dx = b.x - pos.x;
      const dy = b.y - pos.y;
      return dx * dx + dy * dy < 120 * 120;
    });
    const nearBus = buses.some(b => {
      const dx = b.x - pos.x;
      const dy = b.y - pos.y;
      return dx * dx + dy * dy < 150 * 150;
    });
    if (!nearBuilding && !nearBus && !isNearSpawn(pos.x, pos.y)) {
      const def = WRECK_SCATTER_POOL[Math.floor(rng() * WRECK_SCATTER_POOL.length)]!;
      placed.push({ ...pos, ...def });
      scatterPlaced++;
    }
  }

  // [DIAG-B2] budget vs placed — remove after blocker 2 resolved
  console.log('[DIAG-B2] wrecks: bus-budget', busCount, '/ scatter-budget', scatterCount, '/ placed', placed.length);
  return placed;
}

// 50–80 trees/bushes on every run (rain no longer suppresses vegetation).
function buildVegetation(rng: () => number, buildings: PlacedEntity[]): PlacedEntity[] {
  const count = 50 + Math.floor(rng() * 31); // 50–80
  const placed: PlacedEntity[] = [];
  let attempts = 0;

  while (placed.length < count && attempts < 400) {
    attempts++;
    const pos = randomWorldPos(rng, 80);
    const nearBuilding = buildings.some(b => {
      const dx = b.x - pos.x;
      const dy = b.y - pos.y;
      return dx * dx + dy * dy < 100 * 100;
    });
    if (!nearBuilding && !isNearSpawn(pos.x, pos.y)) {
      const def = VEGETATION_POOL[Math.floor(rng() * VEGETATION_POOL.length)]!;
      placed.push({ ...pos, ...def });
    }
  }

  // [DIAG-B2] budget vs placed — remove after blocker 2 resolved
  console.log('[DIAG-B2] vegetation: budget', count, '/ placed', placed.length);
  return placed;
}

// 3–5 barrels/boxes per building, clustered within 50–150px of each structure.
// If no buildings were placed (rare, <1% of seeds), returns empty — no isolated
// barrels without a logical reason to be there.
const BARREL_CLUSTER_RADIUS = 150;
const BARREL_BUILDING_MIN_DIST = 50;

function buildBarrels(rng: () => number, buildings: PlacedEntity[]): PlacedEntity[] {
  if (buildings.length === 0) return [];

  const placed: PlacedEntity[] = [];
  let barrelBudget = 0;
  for (const building of buildings) {
    const clusterCount = 3 + Math.floor(rng() * 3); // 3–5 per building
    barrelBudget += clusterCount;
    let barrelPlaced = 0;
    let attempts = 0;
    while (barrelPlaced < clusterCount && attempts < 80) {
      attempts++;
      const angle = rng() * Math.PI * 2;
      const dist = BARREL_BUILDING_MIN_DIST + rng() * (BARREL_CLUSTER_RADIUS - BARREL_BUILDING_MIN_DIST);
      const x = Math.round(building.x + Math.cos(angle) * dist);
      const y = Math.round(building.y + Math.sin(angle) * dist);
      if (!isNearSpawn(x, y)) {
        const def = BARREL_POOL[Math.floor(rng() * BARREL_POOL.length)]!;
        placed.push({ x, y, ...def });
        barrelPlaced++;
      }
    }
  }
  // [DIAG-B2] budget vs placed — remove after blocker 2 resolved
  console.log('[DIAG-B2] barrels: budget', barrelBudget, '/ placed', placed.length);
  return placed;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function generateMap(seed: number): MapData {
  const rng = mulberry32(seed);

  const weather: WeatherType = rng() > 0.35 ? 'clear' : 'rain';
  const isDesert = rng() > 0.5; // true → desert (sand only); false → vegetation (grass + dirt)
  const tileGrid = buildTileGrid(rng, isDesert);
  const buildings = buildStructures(rng);
  const obstacles = buildObstacles(rng, buildings);
  const vehicleWrecks = buildVehicleWrecks(rng, buildings);
  const vegetation = buildVegetation(rng, buildings);
  const barrels = buildBarrels(rng, buildings);

  // [DIAG-B2] assetKeys written to MapData — remove after blocker 2 resolved
  console.log('[DIAG-B2] assetKeys in MapData:', {
    buildings:  buildings.map(e => e.assetKey),
    wrecks:     vehicleWrecks.map(e => e.assetKey),
    vegetation: vegetation.map(e => e.assetKey),
    obstacles:  [...new Set(obstacles.map(e => e.assetKey))],  // unique — 20-40 total
    barrels:    [...new Set(barrels.map(e => e.assetKey))],    // unique — varies
  });

  return { seed, weather, tileGrid, buildings, obstacles, vehicleWrecks, vegetation, barrels };
}
