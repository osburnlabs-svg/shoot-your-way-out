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
import type { MapData, TileCell, TileType, WeatherType, PlacedEntity, TankPlacement } from '../data/mapTypes';
import {
  TILE_SIZE, TILE_COLS, TILE_ROWS, WORLD_WIDTH, WORLD_HEIGHT,
  PROP_SPRITE_SCALE, STRUCTURE_SPRITE_SCALE,
  TANK_MIN_DISTANCE_FROM_PLAYER, TANK_COLLISION_RADIUS,
} from '../data/gameConstants';

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

const HOUSE01_DEF = { assetKey: 'env_house01', width: 132, height: 132 };
const HOUSE02_DEF = { assetKey: 'env_house02', width: 263, height: 139 };
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

// env_truck_wreck_1 and env_truck_wreck_2 excluded from pool (sprites/PNGs kept on disk).
const WRECK_SCATTER_POOL = [
  { assetKey: 'env_car_wreck_1',       width: 128, height: 128 },
  { assetKey: 'env_car_wreck_2',       width: 128, height: 128 },
  { assetKey: 'env_car_wreck_3',       width: 128, height: 128 },
  { assetKey: 'env_small_truck_wreck', width: 128, height: 128 },
  { assetKey: 'env_ambulance_wreck',   width: 128, height: 128 },
  { assetKey: 'env_police_wreck',      width: 128, height: 128 },
  { assetKey: 'env_humvee_wreck_1',    width: 128, height: 128 },
  { assetKey: 'env_humvee_wreck_2',    width: 128, height: 128 },
  { assetKey: 'env_humvee_wreck_3',    width: 128, height: 128 },
  { assetKey: 'env_humvee_wreck_4',    width: 128, height: 128 },
  { assetKey: 'env_humvee_wreck_5',    width: 128, height: 128 },
  { assetKey: 'env_humvee_wreck_6',    width: 128, height: 128 },
  { assetKey: 'env_acs_wreck',         width: 192, height: 192 },
  { assetKey: 'env_bomber_wreck_2',    width: 288, height: 192 },
  { assetKey: 'env_bomber_wreck_3',    width: 288, height: 192 },
];

const WRECK_BUS        = { assetKey: 'env_bus_wreck',        width: 256, height: 256 };
const WRECK_HELICOPTER = { assetKey: 'env_helicopter_wreck', width: 288, height: 288 };
// Both variants are 288×192; variant is picked once per run (50/50).
const WRECK_BOMBER_POOL = [
  { assetKey: 'env_bomber_wreck_2', width: 288, height: 192 },
  { assetKey: 'env_bomber_wreck_3', width: 288, height: 192 },
];

const BARREL_POOL = [
  { assetKey: 'env_box_wood',           width: 30, height: 31 },
  { assetKey: 'env_box_military',       width: 30, height: 31 },
  { assetKey: 'env_barrel_oil',         width: 20, height: 20 },
  { assetKey: 'env_barrel',             width: 20, height: 20 },
  { assetKey: 'env_box_wood_small',     width: 19, height: 19 },
  { assetKey: 'env_box_military_small', width: 19, height: 19 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Margin from world edge where buildings won't spawn.
const BUILDING_EDGE_MARGIN = 200;

// Extra gap added to scaledHalfSize when computing crate exclusion circles.
// Keeps crates visually clear of prop edges.
const CRATE_EXCLUSION_CLEARANCE = 30;

function randomWorldPos(rng: () => number, margin: number): { x: number; y: number } {
  return {
    x: margin + Math.floor(rng() * (WORLD_WIDTH - margin * 2)),
    y: margin + Math.floor(rng() * (WORLD_HEIGHT - margin * 2)),
  };
}

// Asset keys that use STRUCTURE_SPRITE_SCALE — mirrors the STRUCTURE_ASSETS set in
// propAtlasData. Must stay in sync if new structures are added.
const STRUCTURE_ASSET_KEYS = new Set(['env_house01', 'env_house02', 'env_watchtower']);

function scaledHalfSize(ent: PlacedEntity): number {
  const scale = STRUCTURE_ASSET_KEYS.has(ent.assetKey) ? STRUCTURE_SPRITE_SCALE : PROP_SPRITE_SCALE;
  return Math.max(ent.width, ent.height) * scale / 2;
}

// Exclusion check using rendered (scaled) footprint. Two entities are "too close" when
// their scaled half-sizes plus a gap would overlap on screen. Gap defaults to 20 world px.
function tooCloseScaled(a: PlacedEntity, b: PlacedEntity, gap: number = 20): boolean {
  const minDist = scaledHalfSize(a) + scaledHalfSize(b) + gap;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy < minDist * minDist;
}

// ─── Entity builders ──────────────────────────────────────────────────────────

// House02: exactly 1, placed first. House01: 3–5, placed second.
// Watchtowers: 4–6, placed last. All building-to-building spacing via tooCloseScaled
// so each pair's exclusion distance reflects rendered footprints (replaces the old
// flat BUILDING_MIN_SPACING=300 constant that allowed scaled-footprint overlaps).
function buildStructures(rng: () => number): PlacedEntity[] {
  const house01Count = 3 + Math.floor(rng() * 3);  // 3–5
  const towerCount   = 4 + Math.floor(rng() * 3);  // 4–6
  const allPlaced: PlacedEntity[] = [];

  // House02 — exactly 1. Placed first so it gets first pick of available space.
  const house02: PlacedEntity[] = [];
  let house02Attempts = 0;
  while (house02.length < 1 && house02Attempts < 100) {
    house02Attempts++;
    const pos = randomWorldPos(rng, BUILDING_EDGE_MARGIN);
    const candidate: PlacedEntity = { ...pos, ...HOUSE02_DEF };
    if (
      !isNearSpawn(candidate.x, candidate.y) &&
      allPlaced.every(p => !tooCloseScaled(p, candidate))
    ) {
      house02.push(candidate);
      allPlaced.push(candidate);
    }
  }

  // House01 — 3–5. Checks against placed house02 and other house01s.
  const house01: PlacedEntity[] = [];
  let house01Attempts = 0;
  while (house01.length < house01Count && house01Attempts < 200) {
    house01Attempts++;
    const pos = randomWorldPos(rng, BUILDING_EDGE_MARGIN);
    const candidate: PlacedEntity = { ...pos, ...HOUSE01_DEF };
    if (
      !isNearSpawn(candidate.x, candidate.y) &&
      allPlaced.every(p => !tooCloseScaled(p, candidate))
    ) {
      house01.push(candidate);
      allPlaced.push(candidate);
    }
  }

  // Watchtowers — 4–6. Checks against all previously placed structures.
  const towers: PlacedEntity[] = [];
  let towerAttempts = 0;
  while (towers.length < towerCount && towerAttempts < 200) {
    towerAttempts++;
    const pos = randomWorldPos(rng, BUILDING_EDGE_MARGIN);
    const candidate: PlacedEntity = { ...pos, ...WATCHTOWER_POOL[0]! };
    if (
      !isNearSpawn(candidate.x, candidate.y) &&
      allPlaced.every(p => !tooCloseScaled(p, candidate))
    ) {
      towers.push(candidate);
      allPlaced.push(candidate);
    }
  }

  return allPlaced;
}

// 30–60 rocks (no sandbags — those need G4 orientation logic; deferred to G4).
// Placed after wrecks so rocks can exclude wreck footprints.
function buildObstacles(
  rng: () => number,
  buildings: PlacedEntity[],
  allWrecks: PlacedEntity[],
): PlacedEntity[] {
  const count = 30 + Math.floor(rng() * 31); // 30–60
  const placed: PlacedEntity[] = [];
  let attempts = 0;

  while (placed.length < count && attempts < 600) {
    attempts++;
    const pos = randomWorldPos(rng, 100);
    const def = ROCK_POOL[Math.floor(rng() * ROCK_POOL.length)]!;
    const candidate: PlacedEntity = { ...pos, ...def };
    if (
      !isNearSpawn(pos.x, pos.y) &&
      buildings.every(b => !tooCloseScaled(b, candidate)) &&
      allWrecks.every(w => !tooCloseScaled(w, candidate)) &&
      placed.every(r => !tooCloseScaled(r, candidate))
    ) {
      placed.push(candidate);
    }
  }

  return placed;
}

// 1 helicopter centerpiece + 1 bomber centerpiece + 2–3 buses + 12–32 scatter wrecks.
// Returns { helicopter, bomber, buses, scatter } so callers can thread into later builders.
function buildVehicleWrecks(
  rng: () => number,
  buildings: PlacedEntity[],
): { helicopter: PlacedEntity[]; bomber: PlacedEntity[]; buses: PlacedEntity[]; scatter: PlacedEntity[] } {
  const busCount = 2 + Math.floor(rng() * 2);       // 2 or 3
  const scatterCount = 12 + Math.floor(rng() * 21); // 12–32

  // Helicopter — exactly 1. Checks buildings only (no buses placed yet).
  const helicopter: PlacedEntity[] = [];
  let heliAttempts = 0;
  while (helicopter.length < 1 && heliAttempts < 100) {
    heliAttempts++;
    const pos = randomWorldPos(rng, 150);
    const rotation = 0.1 + rng() * (Math.PI * 2 - 0.2);
    const candidate: PlacedEntity = { ...pos, ...WRECK_HELICOPTER, rotation };
    if (
      !isNearSpawn(pos.x, pos.y) &&
      buildings.every(b => !tooCloseScaled(b, candidate))
    ) {
      helicopter.push(candidate);
    }
  }

  // Bomber — exactly 1. Variant picked once per run (50/50). Checks buildings + helicopter.
  const bomberDef = WRECK_BOMBER_POOL[Math.floor(rng() * WRECK_BOMBER_POOL.length)]!;
  const bomber: PlacedEntity[] = [];
  let bomberAttempts = 0;
  while (bomber.length < 1 && bomberAttempts < 100) {
    bomberAttempts++;
    const pos = randomWorldPos(rng, 150);
    const rotation = 0.1 + rng() * (Math.PI * 2 - 0.2);
    const candidate: PlacedEntity = { ...pos, ...bomberDef, rotation };
    if (
      !isNearSpawn(pos.x, pos.y) &&
      buildings.every(b => !tooCloseScaled(b, candidate)) &&
      helicopter.every(h => !tooCloseScaled(h, candidate))
    ) {
      bomber.push(candidate);
    }
  }
  const buses: PlacedEntity[] = [];
  let busAttempts = 0;
  while (buses.length < busCount && busAttempts < 100) {
    busAttempts++;
    const pos = randomWorldPos(rng, 150);
    const rotation = 0.1 + rng() * (Math.PI * 2 - 0.2);
    const candidate: PlacedEntity = { ...pos, ...WRECK_BUS, rotation };
    if (
      !isNearSpawn(pos.x, pos.y) &&
      helicopter.every(h => !tooCloseScaled(h, candidate)) &&
      bomber.every(bm => !tooCloseScaled(bm, candidate)) &&
      buses.every(b => !tooCloseScaled(b, candidate)) &&
      buildings.every(b => !tooCloseScaled(b, candidate))
    ) {
      buses.push(candidate);
    }
  }

  const scatter: PlacedEntity[] = [];
  let scatterAttempts = 0;
  while (scatter.length < scatterCount && scatterAttempts < 400) {
    scatterAttempts++;
    const pos = randomWorldPos(rng, 100);
    const def = WRECK_SCATTER_POOL[Math.floor(rng() * WRECK_SCATTER_POOL.length)]!;
    const rotation = 0.1 + rng() * (Math.PI * 2 - 0.2);
    const candidate: PlacedEntity = { ...pos, ...def, rotation };
    if (
      !isNearSpawn(pos.x, pos.y) &&
      buildings.every(b => !tooCloseScaled(b, candidate)) &&
      helicopter.every(h => !tooCloseScaled(h, candidate)) &&
      bomber.every(bm => !tooCloseScaled(bm, candidate)) &&
      buses.every(b => !tooCloseScaled(b, candidate)) &&
      scatter.every(w => !tooCloseScaled(w, candidate))
    ) {
      scatter.push(candidate);
    }
  }

  return { helicopter, bomber, buses, scatter };
}

// 70–100 trees/bushes on every run (rain no longer suppresses vegetation).
// Placed last among scatter props so it can exclude structures, wrecks, and rocks.
function buildVegetation(
  rng: () => number,
  buildings: PlacedEntity[],
  allWrecks: PlacedEntity[],
  obstacles: PlacedEntity[],
): PlacedEntity[] {
  const count = 70 + Math.floor(rng() * 31); // 70–100
  const placed: PlacedEntity[] = [];
  let attempts = 0;

  while (placed.length < count && attempts < 400) {
    attempts++;
    const pos = randomWorldPos(rng, 80);
    const def = VEGETATION_POOL[Math.floor(rng() * VEGETATION_POOL.length)]!;
    const candidate: PlacedEntity = { ...pos, ...def };
    if (
      !isNearSpawn(pos.x, pos.y) &&
      buildings.every(b => !tooCloseScaled(b, candidate)) &&
      allWrecks.every(w => !tooCloseScaled(w, candidate)) &&
      obstacles.every(r => !tooCloseScaled(r, candidate)) &&
      placed.every(v => !tooCloseScaled(v, candidate))
    ) {
      placed.push(candidate);
    }
  }

  return placed;
}

// 3–5 barrels/boxes per building, orbiting just outside the building's scaled footprint.
// If no buildings were placed (rare, <1% of seeds), returns empty — no isolated
// barrels without a logical reason to be there.
// Gap is from the scaled edge, not the center, so it stays correct across building sizes/scales.
// Min of 10px lets barrels read as tucked under awnings/stilts — desirable visual ambiguity.
const BARREL_EDGE_MIN = 10;
const BARREL_EDGE_MAX = 90;

function buildBarrels(rng: () => number, buildings: PlacedEntity[]): PlacedEntity[] {
  if (buildings.length === 0) return [];

  const placed: PlacedEntity[] = [];
  for (const building of buildings) {
    const clusterCount = 1 + Math.floor(rng() * 2); // 1–2 per building (~15 total at median map size)
    const scaledHalf = scaledHalfSize(building);
    const clusterPlaced: PlacedEntity[] = [];
    let barrelPlaced = 0;
    let attempts = 0;
    while (barrelPlaced < clusterCount && attempts < 80) {
      attempts++;
      const angle = rng() * Math.PI * 2;
      const dist = scaledHalf + BARREL_EDGE_MIN + rng() * (BARREL_EDGE_MAX - BARREL_EDGE_MIN);
      const x = Math.round(building.x + Math.cos(angle) * dist);
      const y = Math.round(building.y + Math.sin(angle) * dist);
      const def = BARREL_POOL[Math.floor(rng() * BARREL_POOL.length)]!;
      const candidate: PlacedEntity = { x, y, ...def };
      const inOtherBuilding = buildings.some(other => {
        if (other.x === building.x && other.y === building.y) return false;
        const halfSize = scaledHalfSize(other);
        const dx = x - other.x;
        const dy = y - other.y;
        return dx * dx + dy * dy < halfSize * halfSize;
      });
      if (
        !isNearSpawn(x, y) &&
        !inOtherBuilding &&
        clusterPlaced.every(prev => !tooCloseScaled(candidate, prev, 5))
      ) {
        placed.push(candidate);
        clusterPlaced.push(candidate);
        barrelPlaced++;
      }
    }
  }
  return placed;
}

// ─── Tank placement ───────────────────────────────────────────────────────────

const PLAYER_SPAWN_X = WORLD_WIDTH / 2;
const PLAYER_SPAWN_Y = WORLD_HEIGHT / 2;

function placeTankAt(
  variant: TankPlacement['variant'],
  rng: () => number,
  allProps: PlacedEntity[],
  exclusionPoints: Array<{ x: number; y: number }>,
): TankPlacement | null {
  const margin = 400;
  const minDistSq = TANK_MIN_DISTANCE_FROM_PLAYER * TANK_MIN_DISTANCE_FROM_PLAYER;

  for (let attempt = 0; attempt < 15; attempt++) {
    const x = margin + Math.floor(rng() * (WORLD_WIDTH - margin * 2));
    const y = margin + Math.floor(rng() * (WORLD_HEIGHT - margin * 2));

    const dxSpawn = x - PLAYER_SPAWN_X;
    const dySpawn = y - PLAYER_SPAWN_Y;
    if (dxSpawn * dxSpawn + dySpawn * dySpawn < minDistSq) continue;

    let tooClose = false;
    for (const pt of exclusionPoints) {
      const dx = x - pt.x;
      const dy = y - pt.y;
      if (dx * dx + dy * dy < minDistSq) { tooClose = true; break; }
    }
    if (tooClose) continue;

    const overlaps = allProps.some(prop => {
      const halfSize = scaledHalfSize(prop);
      const minDist = halfSize + TANK_COLLISION_RADIUS + 20;
      const dx = x - prop.x;
      const dy = y - prop.y;
      return dx * dx + dy * dy < minDist * minDist;
    });
    if (overlaps) continue;

    return { x, y, variant };
  }

  return null;
}

function buildTanks(
  rng: () => number,
  buildings: PlacedEntity[],
  obstacles: PlacedEntity[],
  vehicleWrecks: PlacedEntity[],
): TankPlacement[] {
  const allProps = [...buildings, ...obstacles, ...vehicleWrecks];

  const acs = placeTankAt('acs', rng, allProps, []);
  if (!acs) return [];

  const panzer = placeTankAt('panzer', rng, allProps, [{ x: acs.x, y: acs.y }]);
  if (!panzer) return [acs];

  return [acs, panzer];
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function generateMap(seed: number): MapData {
  const rng = mulberry32(seed);

  const weather: WeatherType = rng() > 0.35 ? 'clear' : 'rain';
  const isDesert = rng() > 0.5; // true → desert (sand only); false → vegetation (grass + dirt)
  const tileGrid = buildTileGrid(rng, isDesert);
  const buildings = buildStructures(rng);
  // Wrecks placed before rocks/vegetation so smaller props can exclude wreck footprints.
  const { helicopter, bomber, buses, scatter } = buildVehicleWrecks(rng, buildings);
  const vehicleWrecks = [...helicopter, ...bomber, ...buses, ...scatter];
  const obstacles = buildObstacles(rng, buildings, vehicleWrecks);
  const vegetation = buildVegetation(rng, buildings, vehicleWrecks, obstacles);
  const barrels = buildBarrels(rng, buildings);
  const tanks = buildTanks(rng, buildings, obstacles, vehicleWrecks);

  const solidPropExclusions = [...buildings, ...obstacles, ...vehicleWrecks].map(prop => ({
    x: prop.x,
    y: prop.y,
    r: scaledHalfSize(prop) + CRATE_EXCLUSION_CLEARANCE,
  }));

  return { seed, weather, tileGrid, buildings, obstacles, vehicleWrecks, vegetation, barrels, tanks, solidPropExclusions };
}
