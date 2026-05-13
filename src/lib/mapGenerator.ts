/**
 * Procedural map generator — Phase 5 G2 (noise biome update).
 *
 * generateMap(seed) returns a complete MapData for one run. Called once at game
 * start from mapLoader.ts; the result is stored in GameState.mapData.
 *
 * Tile layout strategy (noise-based, replaces per-cell PRNG):
 *   - createNoise2D is seeded by passing mulberry32(seed) as the random source.
 *     simplex-noise consumes 256 PRNG calls during permutation table init, then
 *     the returned function is deterministic (no further PRNG consumption).
 *   - Each tile cell samples noise2D(col * NOISE_SCALE, row * NOISE_SCALE).
 *     NOISE_SCALE = 0.05 produces 2–3 biome transitions across 32 tiles.
 *   - Noise output mapped to 3 terrain types (road excluded — helipad sheet is
 *     not a terrain texture; real road tiles exist in kit but are Step 3):
 *       n < -0.3  → sand
 *       -0.3–0.2  → grass
 *       > 0.2     → dirt
 *   - Variant (0–24) sampled from the remaining mulberry32 stream.
 *
 * Entity arrays (buildings, obstacles, vehicleWrecks, vegetation) are generated
 * with correct world-space positions but empty assetKeys — G3 fills those in
 * when the rendering layer and sprite registry are ready. The arrays are present
 * in MapData now so GameState has the full shape from day one.
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

// Noise frequency: smaller = larger biome regions. 0.05 → ~2–3 transitions per 32-tile axis.
const NOISE_SCALE = 0.05;

function buildTileGrid(rng: () => number): TileCell[][] {
  // Seed the noise function from the run PRNG. createNoise2D consumes 256 calls
  // from rng to build a permutation table, then the function itself is deterministic.
  const noise2D = createNoise2D(rng);

  const grid: TileCell[][] = [];
  for (let row = 0; row < TILE_ROWS; row++) {
    const rowArr: TileCell[] = [];
    for (let col = 0; col < TILE_COLS; col++) {
      const n = noise2D(col * NOISE_SCALE, row * NOISE_SCALE);
      let type: TileType;
      if      (n < -0.3) type = 'sand';
      else if (n <  0.2) type = 'grass';
      else               type = 'dirt';
      rowArr.push({ type, variantIndex: Math.floor(rng() * 25) });
    }
    grid.push(rowArr);
  }
  return grid;
}

// ─── Entity stubs ─────────────────────────────────────────────────────────────

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

// Building pool — assetKeys populated in G3 when sprites are registered.
const BUILDING_POOL = [
  { assetKey: 'env_house01',     width: 132, height: 132 },
  { assetKey: 'env_house02',     width: 263, height: 139 },
  { assetKey: 'env_watchtower',  width: 72,  height: 72  },
];

function buildBuildings(rng: () => number): PlacedEntity[] {
  const count = 2 + Math.floor(rng() * 2); // 2 or 3
  const placed: PlacedEntity[] = [];
  let attempts = 0;

  while (placed.length < count && attempts < 200) {
    attempts++;
    const pos = randomWorldPos(rng, BUILDING_EDGE_MARGIN);
    const def = BUILDING_POOL[Math.floor(rng() * BUILDING_POOL.length)];
    const candidate: PlacedEntity = { ...pos, ...def };
    if (placed.every(p => !tooClose(p, candidate, BUILDING_MIN_SPACING))) {
      placed.push(candidate);
    }
  }

  return placed;
}

// Obstacle stubs — rocks + sandbags in G3. Positions only here.
function buildObstacles(rng: () => number, buildings: PlacedEntity[]): PlacedEntity[] {
  const count = 20 + Math.floor(rng() * 21); // 20–40
  const placed: PlacedEntity[] = [];
  let attempts = 0;

  while (placed.length < count && attempts < 600) {
    attempts++;
    const pos = randomWorldPos(rng, 100);
    // Keep clear of buildings
    const nearBuilding = buildings.some(b => {
      const dx = b.x - pos.x;
      const dy = b.y - pos.y;
      return dx * dx + dy * dy < 150 * 150;
    });
    if (!nearBuilding) {
      placed.push({ ...pos, assetKey: '', width: 48, height: 48 });
    }
  }

  return placed;
}

// Vehicle wreck stubs — civilian broken vehicles in G3.
function buildVehicleWrecks(rng: () => number, buildings: PlacedEntity[]): PlacedEntity[] {
  const hasBus = rng() > 0.5;
  const scatterCount = 4 + Math.floor(rng() * 11); // 4–14
  const placed: PlacedEntity[] = [];

  if (hasBus) {
    const pos = randomWorldPos(rng, 150);
    placed.push({ ...pos, assetKey: '', width: 256, height: 256 });
  }

  let attempts = 0;
  while (placed.length < scatterCount + (hasBus ? 1 : 0) && attempts < 400) {
    attempts++;
    const pos = randomWorldPos(rng, 100);
    const nearBuilding = buildings.some(b => {
      const dx = b.x - pos.x;
      const dy = b.y - pos.y;
      return dx * dx + dy * dy < 120 * 120;
    });
    if (!nearBuilding) {
      placed.push({ ...pos, assetKey: '', width: 128, height: 128 });
    }
  }

  return placed;
}

// Vegetation stubs — trees + bushes in G3.
function buildVegetation(rng: () => number, weather: WeatherType, buildings: PlacedEntity[]): PlacedEntity[] {
  if (weather === 'rain') return [];

  const count = Math.floor(rng() * 21); // 0–20
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
    if (!nearBuilding) {
      placed.push({ ...pos, assetKey: '', width: 130, height: 130 });
    }
  }

  return placed;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function generateMap(seed: number): MapData {
  const rng = mulberry32(seed);

  const weather: WeatherType = rng() > 0.35 ? 'clear' : 'rain';
  const tileGrid = buildTileGrid(rng);
  const buildings = buildBuildings(rng);
  const obstacles = buildObstacles(rng, buildings);
  const vehicleWrecks = buildVehicleWrecks(rng, buildings);
  const vegetation = buildVegetation(rng, weather, buildings);

  return { seed, weather, tileGrid, buildings, obstacles, vehicleWrecks, vegetation };
}
