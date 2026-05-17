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

export type ColliderCircle = {
  x: number;
  y: number;
  radius: number;
};

export type CollisionData = {
  rects: ColliderRect[];
  /**
   * Flat spatial grid — access cell at (row, col) via grid[row * cols + col].
   * Each element is an array of indices into `rects`.
   */
  grid: number[][];
  circles: ColliderCircle[];
  /** Separate spatial grid for the circle pool — same layout as `grid`. */
  circleGrid: number[][];
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
  // Rocks (medium + large only — small is passable)
  'env_rock_medium',
  'env_rock_large',
  // Small trees — large trees use circle collision
  'env_tree_small_1',
  'env_tree_small_2',
  'env_tree_small_3',
]);

// ─── Circle collider radii ────────────────────────────────────────────────────
//
// Props in this map use circle collision instead of AABB — rotation-invariant,
// no axis-separation edge cases. Radii are world-px values tuned on device.
const CIRCLE_COLLIDER_RADIUS: Record<string, number> = {
  // Vehicle wrecks
  env_helicopter_wreck:  120,
  env_bomber_wreck_2:    144,
  env_bomber_wreck_3:    144,
  env_bus_wreck:         100,
  env_acs_wreck:         110,
  env_humvee_wreck_1:     80,
  env_humvee_wreck_2:     80,
  env_humvee_wreck_3:     80,
  env_humvee_wreck_4:     80,
  env_humvee_wreck_5:     80,
  env_humvee_wreck_6:     80,
  env_car_wreck_1:        70,
  env_car_wreck_2:        70,
  env_car_wreck_3:        70,
  env_police_wreck:       75,
  env_ambulance_wreck:    75,
  env_small_truck_wreck:  75,
  // Large trees — non-square AABB produces asymmetric hitbox; circle is uniform
  env_tree_large_1:       50,
  env_tree_large_2:       50,
  env_tree_large_3:       50,
  env_tree_large_4:       50,
  // Tank turrets (Phase 5 G5)
  tank_btr:               80,
  tank_panzer:            80,
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

  const circles: ColliderCircle[] = [];
  const circleGrid: number[][] = [];
  for (let i = 0; i < cols * rows; i++) circleGrid.push([]);

  function addCircle(ent: PlacedEntity): void {
    const radius = CIRCLE_COLLIDER_RADIUS[ent.assetKey];
    if (radius === undefined) return;
    const idx = circles.length;
    circles.push({ x: ent.x, y: ent.y, radius });

    const minCX = Math.max(0, Math.floor((ent.x - radius) / cellSize));
    const maxCX = Math.min(cols - 1, Math.floor((ent.x + radius) / cellSize));
    const minCY = Math.max(0, Math.floor((ent.y - radius) / cellSize));
    const maxCY = Math.min(rows - 1, Math.floor((ent.y + radius) / cellSize));
    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        circleGrid[cy * cols + cx].push(idx);
      }
    }
  }

  function addEntity(ent: PlacedEntity): void {
    if (!SOLID_ASSET_KEYS.has(ent.assetKey)) return;
    const scale = scaleFor(ent.assetKey);
    const halfW = (ent.width * scale) / 2;
    const halfH = (ent.height * scale) / 2;
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
  for (const ent of mapData.vehicleWrecks) addCircle(ent);
  for (const ent of mapData.vegetation) {
    if (CIRCLE_COLLIDER_RADIUS[ent.assetKey] !== undefined) addCircle(ent);
    else addEntity(ent);
  }
  // mapData.barrels intentionally skipped — all passable

  if (mapData.tank) {
    addCircle({ x: mapData.tank.x, y: mapData.tank.y, assetKey: `tank_${mapData.tank.variant}`, width: 128, height: 128 });
  }

  return { rects, grid, circles, circleGrid, cellSize, cols, rows };
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

// ─── Circle resolution (worklet-safe) ────────────────────────────────────────

/**
 * Resolve entity-vs-wreck collision using circle-vs-point tests.
 * Called after resolveAABB so AABB (structures/rocks/trees) and circle
 * (wrecks) passes both run each frame.
 *
 * For each nearby wreck circle whose combined radius (circle.radius +
 * entityRadius) exceeds the distance to the entity center, push the entity
 * outward along the connecting vector to the boundary. Rotation-invariant —
 * no axis-separation, no boundary edge cases.
 */
export function resolveCircle(
  proposedX: number,
  proposedY: number,
  entityRadius: number,
  collData: CollisionData,
): { x: number; y: number } {
  'worklet';

  const { circles, circleGrid, cellSize, cols, rows } = collData;
  if (circles.length === 0) return { x: proposedX, y: proposedY };

  const r = entityRadius;
  const minCX = Math.max(0, Math.floor((proposedX - r) / cellSize));
  const maxCX = Math.min(cols - 1, Math.floor((proposedX + r) / cellSize));
  const minCY = Math.max(0, Math.floor((proposedY - r) / cellSize));
  const maxCY = Math.min(rows - 1, Math.floor((proposedY + r) / cellSize));

  const candidates: number[] = [];
  for (let cy = minCY; cy <= maxCY; cy++) {
    for (let cx = minCX; cx <= maxCX; cx++) {
      const cell = circleGrid[cy * cols + cx];
      if (cell) {
        for (let i = 0; i < cell.length; i++) candidates.push(cell[i]);
      }
    }
  }

  if (candidates.length === 0) return { x: proposedX, y: proposedY };

  let resolvedX = proposedX;
  let resolvedY = proposedY;

  for (let i = 0; i < candidates.length; i++) {
    const circle = circles[candidates[i]];
    const combined = entityRadius + circle.radius;
    const dx = resolvedX - circle.x;
    const dy = resolvedY - circle.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < combined * combined) {
      const dist = Math.sqrt(distSq);
      if (dist > 0) {
        const s = combined / dist;
        resolvedX = circle.x + dx * s;
        resolvedY = circle.y + dy * s;
      } else {
        // Exact center overlap — push right (degenerate, shouldn't occur in practice)
        resolvedX = circle.x + combined;
      }
    }
  }

  return { x: resolvedX, y: resolvedY };
}
