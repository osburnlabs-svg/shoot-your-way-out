/**
 * LevelUpModal — Phase 4a G3 (fallback layout, Phase 4a G3 polish followup)
 *
 * Fallback layout: "LEVEL UP" gold header above 3 skill cards, floating on the
 * dimmed background. The kit's BG.png was removed because each slot has a baked-in
 * weapon placeholder icon that is part of the panel art and cannot be cropped out.
 * BG.png remains registered in GuiSprites for Phase 7's kit UI evaluation.
 *
 * Props:
 *   visible           — mirrors GameState.pendingLevelUp (JS thread copy)
 *   choices           — up to 3 SkillIds drawn by the 100ms timer in GameCanvas
 *   playerSkillStacks — JS-thread copy of player.skillStacks for "Lv X/Y" display
 *   onSelect          — called when the player taps a card; GameCanvas handles engine mutation
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
import { PIXEL_FONT_FAMILY } from '../data/theme';

// ─── Layout constants ─────────────────────────────────────────────────────────

/** Card dimensions. Sized for readability at arm's length on a mobile screen. */
const CARD_W = 105;
const CARD_H = 140;

/** Gap between the header text and the card row. */
const HEADER_CARD_GAP = 20;

/** Gap between cards in the row. 3×105 + 2×10 = 335dp — safe on 360dp+ phones. */
const CARD_GAP = 10;

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

      {/* Content column: header + card row */}
      <View style={styles.content}>
        <Text style={styles.header}>LEVEL UP</Text>

        <View style={styles.cardRow}>
          {choices.map((id) => {
            const skill = SKILLS[id];
            const stacks = playerSkillStacks[id] ?? 0;
            const icon = (GuiSprites.skillIcons as Record<SkillId, number>)[id];

            return (
              <TouchableOpacity
                key={id}
                style={styles.card}
                onPress={() => onSelect(id)}
                activeOpacity={0.7}
              >
                <Image source={icon} style={styles.icon} resizeMode="contain" filterQuality="none" />
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
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  content: {
    alignItems: 'center',
  },
  header: {
    color: '#c9a356',
    fontSize: 42,
    fontFamily: PIXEL_FONT_FAMILY,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 4,
    textShadowOffset: { width: 1, height: 2 },
    marginBottom: HEADER_CARD_GAP,
    letterSpacing: 2,
  },
  cardRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: 'rgba(10, 13, 8, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 64,
    height: 64,
  },
  name: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: PIXEL_FONT_FAMILY,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
    marginTop: 6,
  },
  level: {
    color: '#ffd700',
    fontSize: 14,
    fontFamily: PIXEL_FONT_FAMILY,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },
  desc: {
    color: '#d0d0d0',
    fontSize: 12,
    fontFamily: PIXEL_FONT_FAMILY,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 1,
    textShadowOffset: { width: 1, height: 1 },
    marginTop: 4,
  },
});
