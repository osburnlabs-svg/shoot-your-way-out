/**
 * Map data types — Phase 5 G3.
 *
 * MapData is generated once per run by mapGenerator.ts and stored as initialMapData
 * in React state in GameCanvas. It does NOT go into the Reanimated SharedValue (GameState).
 * The tileGrid is 94×94 (WORLD_WIDTH / TILE_SIZE = 6000 / 64 = 93.75 → 94 columns,
 * same for rows). Indexed as tileGrid[row][col].
 *
 * Entity arrays store world-space positions and registered assetKeys (from sprites.ts
 * EnvSprites) for use by the G3 renderer and the G4+ collision system.
 */

export type TileType = 'dirt' | 'sand' | 'grass' | 'road';

export type WeatherType = 'clear' | 'rain';

export type TileCell = {
  type: TileType;
  /** 0–24. Maps to sheet position: col = index % 5, row = floor(index / 5). */
  variantIndex: number;
};

export type PlacedEntity = {
  /** World-space center X. */
  x: number;
  /** World-space center Y. */
  y: number;
  /** Key into the sprite registry (sprites.ts). Consumed by G3 renderer. */
  assetKey: string;
  /** Native source width in px (before scale). Used by G3 for collision AABB. */
  width: number;
  /** Native source height in px (before scale). Used by G3 for collision AABB. */
  height: number;
  /** Rotation in radians. Undefined (treated as 0) for props without rotation. */
  rotation?: number;
};

export type TankVariant = 'acs' | 'panzer';

export type TankPlacement = {
  x: number;
  y: number;
  variant: TankVariant;
};

export type MapData = {
  seed: number;
  weather: WeatherType;
  /** [row][col] — 94 rows × 94 cols. */
  tileGrid: TileCell[][];
  /** 8–12 structures (1 house02, 3–5 house01, 4–6 watchtowers). G3 renders; G4 spawns snipers here. */
  buildings: PlacedEntity[];
  /** 30–60 rocks (large/medium/small). G3 renders; G4 adds hard collision. */
  obstacles: PlacedEntity[];
  /** 1 helicopter + 1 bomber + 2–3 buses + 12–32 scatter wrecks = 16–37 total. G3 renders; G4 adds hard collision. */
  vehicleWrecks: PlacedEntity[];
  /** 70–100 trees/bushes. Rain has no effect on vegetation count. G3 renders; soft cover only. */
  vegetation: PlacedEntity[];
  /** 3–5 barrels/boxes per building, clustered just outside the building's scaled footprint. G3 renders. */
  barrels: PlacedEntity[];
  /** One ACS + one Panzer per map, each ≥1500px from player spawn and from each other. */
  tanks: TankPlacement[];
  /**
   * Exclusion circles for solid props (buildings, obstacles, vehicleWrecks).
   * Pre-computed in mapGenerator; threaded into GameState so tickCrateSpawn
   * (a worklet) can reject candidate positions that land on top of a prop.
   * r = scaledHalfSize(prop) + clearance.
   */
  solidPropExclusions: Array<{ x: number; y: number; r: number }>;
};
