/**
 * LevelUpModal — Phase 4a G3
 *
 * Renders a full-screen dimmed overlay with the kit's Upgrade/BG.png panel centered.
 * BG.png is a 308×243 empty 3×3 slot grid with a gold "UPGRADE" header.
 * Three skill cards are absolutely positioned over the top row's three slot frames.
 *
 * Props:
 *   visible          — mirrors GameState.pendingLevelUp (JS thread copy)
 *   choices          — up to 3 SkillIds drawn by the 100ms timer in GameCanvas
 *   playerSkillStacks — JS-thread copy of player.skillStacks for "Lv X/Y" display
 *   onSelect         — called when the player taps a card; GameCanvas handles engine mutation
 *
 * Rendering notes:
 *   - Runs entirely on the React/JS thread. No Skia, no Reanimated worklets.
 *   - pointerEvents="box-none" on the outer wrapper so the Skia canvas below keeps
 *     receiving touches when the modal is hidden.
 *   - Icon images are sourced from GuiSprites.skillIcons — no import into skills.ts
 *     (avoids pulling sprites into the worklet module closure).
 */

import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { SkillId } from '../data/skills';
import { SKILLS } from '../data/skills';
import { GuiSprites } from '../lib/sprites';

// ─── Layout constants (derived from BG.png pixel analysis: 308×243) ───────────

/**
 * Display size of the modal background panel.
 * BG.png was cropped to 308×105 (banner + top slot row) in Phase 4a G3 polish
 * to remove the 6 unused slot cells visible in the original 308×243 image.
 */
const MODAL_W = 308;
const MODAL_H = 105;

/**
 * Pixel row where the top-row slot grid starts (below the "UPGRADE" header bar).
 * Header occupies roughly the top 32px of the image.
 */
const GRID_TOP = 32;

/**
 * Height of each slot row in BG.png.
 * Grid area ≈ 211px split across 3 rows → ~70px each.
 */
const SLOT_H = 70;

/**
 * Width of each slot column in BG.png.
 * 308px / 3 cols ≈ 102px; 2px gutter on left → each usable slot ≈ 100px.
 */
const SLOT_W = 100;

/**
 * X-axis origins (left edge) of the three top-row slots within the panel.
 * Measured from BG.png pixel layout with ~2px left border and ~2px inter-slot gap.
 */
const SLOT_X: [number, number, number] = [4, 104, 204];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  choices: SkillId[];
  playerSkillStacks: Record<string, number>;
  onSelect: (id: SkillId) => void;
};

export default function LevelUpModal({
  visible,
  choices,
  playerSkillStacks,
  onSelect,
}: Props) {
  if (!visible || choices.length === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dim layer — covers full screen, blocks touches to game below */}
      <View style={styles.dim} />

      {/* Modal panel — BG.png with cards overlaid */}
      <View style={styles.panel}>
        <Image
          source={GuiSprites.upgrade.bg}
          style={styles.bg}
          resizeMode="stretch"
        />

        {choices.map((id, i) => {
          const skill = SKILLS[id];
          const stacks = playerSkillStacks[id] ?? 0;
          const icon = (GuiSprites.skillIcons as Record<SkillId, number>)[id];

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.card,
                { left: SLOT_X[i] ?? 4, top: GRID_TOP, width: SLOT_W, height: SLOT_H },
              ]}
              onPress={() => onSelect(id)}
              activeOpacity={0.7}
            >
              <Image source={icon} style={styles.icon} resizeMode="contain" />
              <Text style={styles.name} numberOfLines={2}>
                {skill.displayName}
              </Text>
              <Text style={styles.level}>
                {`Lv ${stacks}/${skill.maxStacks}`}
              </Text>
              <Text style={styles.desc} numberOfLines={2}>
                {skill.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: {
    width: MODAL_W,
    height: MODAL_H,
  },
  bg: {
    position: 'absolute',
    width: MODAL_W,
    height: MODAL_H,
  },
  card: {
    position: 'absolute',
    paddingHorizontal: 4,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 30,
    height: 30,
  },
  name: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
    marginTop: 2,
  },
  level: {
    color: '#ffd700',
    fontSize: 6,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },
  desc: {
    color: '#d0d0d0',
    fontSize: 5,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 1,
    textShadowOffset: { width: 1, height: 1 },
    marginTop: 1,
  },
});
