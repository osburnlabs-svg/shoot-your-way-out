/**
 * CrateRevealModal — Phase 4c G2
 *
 * Shown while GameState.pendingCrateReveal is true. Displays the randomly rolled
 * weapon (icon, name, tier color) with EQUIP and SCRAP options.
 *
 * EQUIP: sets player.equippedWeaponId + weaponPose, clears pendingCrateReveal.
 * SCRAP: grants +50 score +25 XP (may trigger level-up on next tick),
 *        clears pendingCrateReveal.
 *
 * No kit panel images — inline custom styling, matches LevelUpModal / ReviveModal.
 * Tech debt: weapon icons use kit HUD silhouettes as placeholders (SMG_HUD, MG_HUD,
 *   Pistol_HUD — 3 icons shared across 6 weapons). Replace with custom weapon sprites.
 */

import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { TIER_COLORS } from '../data/gameConstants';
import type { CrateTier } from '../data/gameConstants';
import { WEAPON_PROFILES } from '../data/weapons';
import { GuiSprites } from '../lib/sprites';

type Props = {
  visible: boolean;
  weaponId: string | null;
  tier: CrateTier | null;
  onEquip: () => void;
  onScrap: () => void;
};

export default function CrateRevealModal({
  visible,
  weaponId,
  tier,
  onEquip,
  onScrap,
}: Props) {
  if (!visible || !weaponId || !tier) return null;

  const weapon = WEAPON_PROFILES[weaponId];
  if (!weapon) return null;

  const icon = (GuiSprites.weaponHudIcons as Record<string, number>)[weaponId];
  const tierColor = TIER_COLORS[tier];
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dim layer — covers full screen, blocks touches to game below */}
      <View style={styles.dim} />

      <View style={styles.panel}>
        <Text style={styles.header}>WEAPON CRATE</Text>

        {icon !== undefined && (
          <Image source={icon} style={styles.weaponIcon} resizeMode="contain" filterQuality="none" />
        )}

        <Text style={styles.weaponName}>{weapon.displayName}</Text>
        <Text style={[styles.tierLabel, { color: tierColor }]}>{tierLabel}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.equipButton]}
            onPress={onEquip}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>EQUIP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.scrapButton]}
            onPress={onScrap}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>SCRAP</Text>
            <Text style={styles.scrapSubtext}>+50 pts  +25 XP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  panel: {
    width: 260,
    backgroundColor: 'rgba(10, 13, 8, 0.92)',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  header: {
    color: '#c9a356',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 4,
    textShadowOffset: { width: 1, height: 2 },
    marginBottom: 4,
  },
  weaponIcon: {
    width: 120,
    height: 120,
    marginBottom: 4,
  },
  weaponName: {
    color: '#c9a356',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    width: 95,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipButton: {
    backgroundColor: 'rgba(40, 60, 30, 0.90)',
  },
  scrapButton: {
    backgroundColor: 'rgba(10, 13, 8, 0.90)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
    letterSpacing: 1,
  },
  scrapSubtext: {
    color: '#aaaaaa',
    fontSize: 10,
    textAlign: 'center',
  },
});
