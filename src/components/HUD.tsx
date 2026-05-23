import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { xpForLevel } from '../data/balance';
import { GuiSprites } from '../lib/sprites';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';
import { WEAPON_PROFILES } from '../data/weapons';
import { TIER_COLORS } from '../data/gameConstants';
import type { CrateTier } from '../data/gameConstants';

type Props = {
  money: number;
  hp: number;
  level: number;
  xp: number;
  elapsed: number;  // seconds
  kills: number;
  equippedWeaponId: string;
  equippedWeaponRarity: CrateTier;
  onLeaveRaid: () => void;
};

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function HUD({ money, hp, level, xp, elapsed, kills, equippedWeaponId, equippedWeaponRarity, onLeaveRaid }: Props) {
  const insets = useSafeAreaInsets();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const xpFloor = xpForLevel(level);
  const xpCeil  = xpForLevel(level + 1);
  const xpFill  = xpCeil > xpFloor
    ? Math.min(1, Math.max(0, (xp - xpFloor) / (xpCeil - xpFloor)))
    : 0;

  const weaponIcon = (GuiSprites.weaponHudIcons as Record<string, number>)[equippedWeaponId];
  const topEdge = insets.top + 4;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* XP progress bar — top-right, above stats panel. */}
      <View style={[styles.xpRow, { top: topEdge, right: insets.right + 10 }]}>
        <View style={styles.xpBarOuter}>
          <View style={[styles.xpBarFill, { width: `${Math.round(xpFill * 100)}%` as any }]} />
        </View>
        <Text style={styles.xpLevelLabel}> Lvl {level}</Text>
      </View>

      {/* Weapon section — top-left. Column: LEAVE RAID button → rectangle weapon box → name/rarity. */}
      {weaponIcon != null && (
        <View style={[styles.weaponSection, { top: topEdge, left: insets.left + 10 }]}>
          <TouchableOpacity
            style={styles.leaveRaidBtn}
            onPress={() => setConfirmVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.leaveRaidText}>LEAVE RAID</Text>
          </TouchableOpacity>

          <View style={styles.weaponBox}>
            <Image source={weaponIcon} style={styles.weaponIcon} resizeMode="cover" />
          </View>
          <Text style={styles.weaponNameLabel}>
            {WEAPON_PROFILES[equippedWeaponId]?.displayName ?? equippedWeaponId}
          </Text>
          {equippedWeaponId !== 'pistol' && (
            <Text style={[styles.rarityLabel, { color: TIER_COLORS[equippedWeaponRarity] }]}>
              {equippedWeaponRarity.charAt(0).toUpperCase() + equippedWeaponRarity.slice(1)}
            </Text>
          )}
        </View>
      )}

      {/* Stats panel — top-right, below XP bar. */}
      <View style={[styles.statsPanel, { top: topEdge + 18, right: insets.right + 10 }]}>
        <Text style={styles.statLine}>Money: {money}</Text>
        <Text style={styles.statLine}>HP: {hp}</Text>
        <Text style={styles.statLine}>Time: {formatTime(elapsed)}</Text>
        <Text style={styles.statLine}>Kills: {kills}</Text>
      </View>

      {/* Leave raid confirmation — full-screen overlay, game continues behind it. */}
      {confirmVisible && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmDim} />
          <View style={styles.confirmPanel}>
            <Text style={styles.confirmHeader}>LEAVE THIS RAID?</Text>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={onLeaveRaid}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmBtnText}>LEAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmCancelLink}
              onPress={() => setConfirmVisible(false)}
              activeOpacity={0.6}
            >
              <Text style={styles.confirmCancelText}>STAY IN RAID</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  xpRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
    width: 110,
  },
  xpBarOuter: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%' as any,
    backgroundColor: palette.accentGold,
  },
  xpLevelLabel: {
    color: palette.accentGold,
    fontSize: 14,
    lineHeight: 14,
    fontFamily: PIXEL_FONT_FAMILY,
    fontVariant: ['tabular-nums'],
  },
  weaponSection: {
    position: 'absolute',
    alignItems: 'center',
  },
  leaveRaidBtn: {
    width: 96,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveRaidText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 17,
    color: palette.accentGold,
    letterSpacing: 1,
    textShadowColor: '#000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },
  weaponBox: {
    width: 96,
    height: 72,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  weaponIcon: {
    width: 88,
    height: 66,
  },
  weaponNameLabel: {
    color: palette.accentGold,
    fontSize: 23,
    lineHeight: 25,
    fontFamily: PIXEL_FONT_FAMILY,
    textShadowColor: '#000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
    marginTop: 3,
  },
  rarityLabel: {
    fontSize: 17,
    fontFamily: PIXEL_FONT_FAMILY,
    letterSpacing: 1,
    textShadowColor: '#000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },
  statsPanel: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    alignItems: 'flex-end',
  },
  statLine: {
    color: palette.accentGold,
    fontSize: 17,
    lineHeight: 19,
    fontFamily: PIXEL_FONT_FAMILY,
    fontVariant: ['tabular-nums'],
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  confirmPanel: {
    backgroundColor: 'rgba(10, 13, 8, 0.92)',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 16,
  },
  confirmHeader: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 32,
    color: palette.accentGold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  confirmBtn: {
    width: 180,
    height: 52,
    backgroundColor: 'rgba(10, 13, 8, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 18,
    lineHeight: 18,
    color: '#ffffff',
    letterSpacing: 1,
  },
  confirmCancelLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  confirmCancelText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 15,
    lineHeight: 15,
    color: '#888888',
    letterSpacing: 1,
  },
});
