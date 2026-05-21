import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { xpForLevel } from '../data/balance';
import { GuiSprites } from '../lib/sprites';
import { palette, PIXEL_FONT_FAMILY, FONT_WEIGHT_BOLD } from '../data/theme';

type Props = {
  money: number;
  hp: number;
  level: number;
  xp: number;
  elapsed: number;  // seconds
  kills: number;
  equippedWeaponId: string;
};

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function HUD({ money, hp, level, xp, elapsed, kills, equippedWeaponId }: Props) {
  const insets = useSafeAreaInsets();

  const xpFloor = xpForLevel(level);
  const xpCeil  = xpForLevel(level + 1);
  const xpFill  = xpCeil > xpFloor
    ? Math.min(1, Math.max(0, (xp - xpFloor) / (xpCeil - xpFloor)))
    : 0;

  const weaponIcon = (GuiSprites.weaponHudIcons as Record<string, number>)[equippedWeaponId];
  const topEdge = insets.top + 4;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* XP progress bar — spans full width just below safe-area top inset. */}
      <View style={[styles.xpRow, { top: topEdge, left: insets.left + 10, right: insets.right + 10 }]}>
        <View style={styles.xpBarOuter}>
          <View style={[styles.xpBarFill, { width: `${Math.round(xpFill * 100)}%` as any }]} />
        </View>
        <Text style={styles.xpLevelLabel}> Lvl {level}</Text>
      </View>

      {/* Weapon icon — top-left, below XP bar. */}
      {weaponIcon != null && (
        <View style={[styles.weaponBox, { top: topEdge + 18, left: insets.left + 10 }]}>
          <Image source={weaponIcon} style={styles.weaponIcon} resizeMode="contain" />
        </View>
      )}

      {/* Stats panel — top-right, below XP bar. */}
      <View style={[styles.statsPanel, { top: topEdge + 18, right: insets.right + 10 }]}>
        <Text style={styles.statLine}>Money: {money}</Text>
        <Text style={styles.statLine}>HP: {hp}</Text>
        <Text style={styles.statLine}>Time: {formatTime(elapsed)}</Text>
        <Text style={styles.statLine}>Kills: {kills}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  xpRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
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
    fontSize: 11,
    fontFamily: PIXEL_FONT_FAMILY,
    fontWeight: FONT_WEIGHT_BOLD,
    fontVariant: ['tabular-nums'],
  },
  weaponBox: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weaponIcon: {
    width: 32,
    height: 32,
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
    fontSize: 13,
    fontFamily: PIXEL_FONT_FAMILY,
    fontWeight: FONT_WEIGHT_BOLD,
    fontVariant: ['tabular-nums'],
  },
});
