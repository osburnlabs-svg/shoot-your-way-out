/**
 * Map loader — Phase 5 G2.
 *
 * Thin wrapper around mapGenerator. Generates a new map from a timestamp seed.
 * Called once at component mount (JS thread); result stored in GameState.
 *
 * In a future phase this could cache maps, load pre-authored JSON layouts,
 * or apply difficulty scaling — but for Phase 5 it is intentionally minimal.
 */

import type { MapData } from '../data/mapTypes';
import { generateMap } from './mapGenerator';

export function loadMap(seed?: number): MapData {
  return generateMap(seed ?? Date.now());
}
