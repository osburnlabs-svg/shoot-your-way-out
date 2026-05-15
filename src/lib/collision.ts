import type { MapData, PlacedEntity } from '../data/mapTypes';
import {
  PROP_SPRITE_SCALE,
  STRUCTURE_SPRITE_SCALE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  COLLISION_GRID_CELL_SIZE,
} from '../data/gameConstants';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColliderRect = {
  /** World-space center X. */
  x: number;
  /** World-space center Y. */
  y: number;
  /** Half-width of the axis-aligned bounding box (scaled). */
  halfW: number;
  /** Half-height of the axis-aligned bounding box (scaled). */
  halfH: number;
};

export type CollisionData = {
  rects: ColliderRect[];
  /**
   * Flat spatial grid — access cell at (row, col) via grid[row * cols + col].
   * Each element is an array of indices into `rects`.
   */
  grid: number[][];
  cellSize: number;
  cols: number;
  rows: number;
};

// ─── Solid asset set ──────────────────────────────────────────────────────────

/**
 * Asset keys that block passage for both player and enemies.
 * Anything not in this set is passable (bushes, barrels/crates, small rocks).
 */
export const SOLID_ASSET_KEYS = new Set<string>([
  // Structures
  'env_house01',
  'env_house02',
  'env_watchtower',
  // Vehicle wrecks (all variants)
  'env_bus_wreck',
  'env_helicopter_wreck',
  'env_bomber_wreck_2',
  'env_bomber_wreck_3',
  'env_car_wreck_1',
  'env_car_wreck_2',
  'env_car_wreck_3',
  'env_ambulance_wreck',
  'env_police_wreck',
  'env_small_truck_wreck',
  'env_acs_wreck',
  'env_humvee_wreck_1',
  'env_humvee_wreck_2',
  'env_humvee_wreck_3',
  'env_humvee_wreck_4',
  'env_humvee_wreck_5',
  'env_humvee_wreck_6',
  // Rocks (medium + large only — small is passable)
  'env_rock_medium',
  'env_rock_large',
  // Trees (all sizes — bushes are passable)
  'env_tree_large_1',
  'env_tree_large_2',
  'env_tree_large_3',
  'env_tree_large_4',
  'env_tree_small_1',
  'env_tree_small_2',
  'env_tree_small_3',
]);

// ─── Per-asset collision scale overrides ─────────────────────────────────────
//
// Many vehicle wreck PNGs have transparent padding that inflates the full-sprite
// AABB beyond the visible silhouette. Multipliers here shrink halfW/halfH before
// the collider is stored — 1.0 = use full sprite dimensions (default).
// Tune values with Mo on device; one round of adjustments is expected.
const COLLISION_SCALE_OVERRIDES: Record<string, number> = {
  // Car wrecks — significant transparent border around silhouette
  env_car_wreck_1: 0.65,
  env_car_wreck_2: 0.65,
  env_car_wreck_3: 0.65,
  // Trucks, ambulance, police — moderate padding
  env_small_truck_wreck: 0.70,
  env_ambulance_wreck:   0.70,
  env_police_wreck:      0.70,
  // Humvee wrecks — moderate padding across all six variants
  env_humvee_wreck_1: 0.70,
  env_humvee_wreck_2: 0.70,
  env_humvee_wreck_3: 0.70,
  env_humvee_wreck_4: 0.70,
  env_humvee_wreck_5: 0.70,
  env_humvee_wreck_6: 0.70,
  // ACS wreck + bus — large sprites with visible padding
  env_acs_wreck: 0.75,
  env_bus_wreck: 0.65,
  // Aircraft — heavy padding + rotation AABB approximation compounds the oversize
  env_helicopter_wreck: 0.60,
  env_bomber_wreck_2:   0.55,
  env_bomber_wreck_3:   0.55,
  // Large trees — sprite canvas has padding outside the trunk/canopy silhouette
  env_tree_large_1: 0.70,
  env_tree_large_2: 0.70,
  env_tree_large_3: 0.70,
  env_tree_large_4: 0.70,
};

// ─── Helpers (JS-thread only) ─────────────────────────────────────────────────

const STRUCTURE_KEYS = new Set(['env_house01', 'env_house02', 'env_watchtower']);

function scaleFor(assetKey: string): number {
  return STRUCTURE_KEYS.has(assetKey) ? STRUCTURE_SPRITE_SCALE : PROP_SPRITE_SCALE;
}

// ─── Builder (JS-thread, called once at map load) ─────────────────────────────

/**
 * Convert MapData into a CollisionData structure suitable for per-frame worklet queries.
 * Filters to solid props only, computes scaled half-extents, and bins each collider
 * into a flat spatial grid for O(1) neighbourhood lookup.
 *
 * Rotated wrecks use an unrotated AABB (axis-aligned approximation). Square sprites
 * (most wrecks) are exact; non-square sprites (bomber_wreck_2/3) are slightly
 * under-sized at oblique angles. Accepted for G3 — upgrade to OBB in Phase 6+
 * if device testing reveals visible clip-through on bomber wrecks.
 */
export function buildCollisionData(mapData: MapData): CollisionData {
  const cellSize = COLLISION_GRID_CELL_SIZE;
  const cols = Math.ceil(WORLD_WIDTH / cellSize);
  const rows = Math.ceil(WORLD_HEIGHT / cellSize);

  const rects: ColliderRect[] = [];
  const grid: number[][] = [];
  for (let i = 0; i < cols * rows; i++) grid.push([]);

  function addEntity(ent: PlacedEntity): void {
    if (!SOLID_ASSET_KEYS.has(ent.assetKey)) return;
    const scale = scaleFor(ent.assetKey);
    const collisionScale = COLLISION_SCALE_OVERRIDES[ent.assetKey] ?? 1.0;
    const halfW = (ent.width * scale * collisionScale) / 2;
    const halfH = (ent.height * scale * collisionScale) / 2;
    const idx = rects.length;
    rects.push({ x: ent.x, y: ent.y, halfW, halfH });

    // Bin into all grid cells the collider's AABB overlaps
    const minCX = Math.max(0, Math.floor((ent.x - halfW) / cellSize));
    const maxCX = Math.min(cols - 1, Math.floor((ent.x + halfW) / cellSize));
    const minCY = Math.max(0, Math.floor((ent.y - halfH) / cellSize));
    const maxCY = Math.min(rows - 1, Math.floor((ent.y + halfH) / cellSize));
    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        grid[cy * cols + cx].push(idx);
      }
    }
  }

  for (const ent of mapData.buildings) addEntity(ent);
  for (const ent of mapData.obstacles) addEntity(ent);
  for (const ent of mapData.vehicleWrecks) addEntity(ent);
  for (const ent of mapData.vegetation) addEntity(ent);
  // mapData.barrels intentionally skipped — all passable

  return { rects, grid, cellSize, cols, rows };
}

// ─── Resolution (worklet-safe) ────────────────────────────────────────────────

/**
 * Resolve entity-vs-static-prop collision using axis-separated AABB response.
 * Called from Reanimated UI-thread worklets each frame for player and enemies.
 *
 * Algorithm:
 *   1. Query the spatial grid for candidate colliders near the proposed position.
 *   2. X pass: test (proposedX, currentY) against each expanded rect; push X out.
 *   3. Y pass: test (resolvedX, proposedY) against each expanded rect; push Y out.
 *
 * Minkowski expansion: each rect is grown by entityRadius on all sides so the
 * entity center can be treated as a point for collision tests.
 *
 * @returns Resolved world-space {x, y} — may equal {proposedX, proposedY} if no hit.
 */
export function resolveAABB(
  currentX: number,
  currentY: number,
  proposedX: number,
  proposedY: number,
  entityRadius: number,
  collData: CollisionData,
): { x: number; y: number } {
  'worklet';

  const { rects, grid, cellSize, cols, rows } = collData;
  if (rects.length === 0) return { x: proposedX, y: proposedY };

  // Collect candidate rect indices from cells that overlap the entity's footprint
  // at the proposed position. Max movement per frame at 50ms cap is ~13px, so
  // querying around proposedX/Y covers the full swept region.
  const r = entityRadius;
  const minCX = Math.max(0, Math.floor((proposedX - r) / cellSize));
  const maxCX = Math.min(cols - 1, Math.floor((proposedX + r) / cellSize));
  const minCY = Math.max(0, Math.floor((proposedY - r) / cellSize));
  const maxCY = Math.min(rows - 1, Math.floor((proposedY + r) / cellSize));

  const candidates: number[] = [];
  for (let cy = minCY; cy <= maxCY; cy++) {
    for (let cx = minCX; cx <= maxCX; cx++) {
      const cell = grid[cy * cols + cx];
      if (cell) {
        for (let i = 0; i < cell.length; i++) candidates.push(cell[i]);
      }
    }
  }

  if (candidates.length === 0) return { x: proposedX, y: proposedY };

  // X axis: keep Y at current position to allow sliding along horizontal walls.
  // Push direction uses currentX (pre-movement) so a large step that crosses the
  // rect's centre doesn't flip the sign and launch the entity to the far wall.
  let resolvedX = proposedX;
  for (let i = 0; i < candidates.length; i++) {
    const rect = rects[candidates[i]];
    const exHalfW = rect.halfW + r;
    const exHalfH = rect.halfH + r;
    const dx = resolvedX - rect.x;
    const dy = currentY - rect.y;
    if (Math.abs(dx) < exHalfW && Math.abs(dy) < exHalfH) {
      const dxDir = currentX - rect.x;
      resolvedX = dxDir >= 0 ? rect.x + exHalfW : rect.x - exHalfW;
    }
  }

  // Y axis: use resolvedX (post X-pass) to allow sliding along vertical walls.
  // Push direction uses currentY for the same reason as X-pass above.
  let resolvedY = proposedY;
  for (let i = 0; i < candidates.length; i++) {
    const rect = rects[candidates[i]];
    const exHalfW = rect.halfW + r;
    const exHalfH = rect.halfH + r;
    const dx = resolvedX - rect.x;
    const dy = resolvedY - rect.y;
    if (Math.abs(dx) < exHalfW && Math.abs(dy) < exHalfH) {
      const dyDir = currentY - rect.y;
      resolvedY = dyDir >= 0 ? rect.y + exHalfH : rect.y - exHalfH;
    }
  }

  return { x: resolvedX, y: resolvedY };
}
