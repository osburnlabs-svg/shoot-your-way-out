/**
 * Map data types — Phase 5 G2.
 *
 * MapData is generated once per run by mapGenerator.ts and stored in GameState.
 * The tileGrid is 32×32 (WORLD_WIDTH / TILE_SIZE = 2000 / 64 = 31.25 → 32 columns,
 * same for rows). Indexed as tileGrid[row][col].
 *
 * Entity arrays (buildings, obstacles, vehicleWrecks, vegetation) are populated
 * by the generator in G2 but not rendered until G3. They store world-space positions
 * and a registered assetKey for use by the G3 renderer and collision system.
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
};

export type MapData = {
  seed: number;
  weather: WeatherType;
  /** [row][col] — 32 rows × 32 cols. */
  tileGrid: TileCell[][];
  /** 2–3 structures (House01, House02, WatchTower). G3 renders; G4 spawns snipers here. */
  buildings: PlacedEntity[];
  /** 20–40 hard collision obstacles (rocks, sandbags). G3 renders + collision. */
  obstacles: PlacedEntity[];
  /** 0–1 bus centerpiece + 4–14 scatter wrecks. G3 renders + collision. */
  vehicleWrecks: PlacedEntity[];
  /** 0–20 trees/bushes (0 when weather === 'rain'). G3 renders; soft cover only. */
  vegetation: PlacedEntity[];
};
