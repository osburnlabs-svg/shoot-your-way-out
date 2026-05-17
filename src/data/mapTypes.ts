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
  /** 2–3 structures (house_01, house_02, watchtower). G3 renders; G4 spawns snipers here. */
  buildings: PlacedEntity[];
  /** 20–40 rocks (large/medium/small). G3 renders; G4 adds hard collision. */
  obstacles: PlacedEntity[];
  /** 0–1 bus centerpiece + 4–14 scatter car/truck wrecks. G3 renders; G4 adds hard collision. */
  vehicleWrecks: PlacedEntity[];
  /** 0–20 trees/bushes (0 when weather === 'rain'). G3 renders; soft cover only. */
  vegetation: PlacedEntity[];
  /** 2–5 barrels/boxes per building, clustered near structures. G3 renders; G4 adds hard collision. */
  barrels: PlacedEntity[];
  /** Single tank per map, placed ≥1500px from player spawn. Null if placement failed. */
  tank: TankPlacement | null;
};
