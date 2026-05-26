import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SKILLS } from '../data/skills';
import type { SkillId } from '../data/skills';
import { GuiSprites } from '../lib/sprites';
import { getDailyInventory, getTodayKey } from '../lib/fleaMarket';
import { FLEA_MARKET_PRICES } from '../data/fleaMarketPricing';
import { persistence } from '../lib/persistence';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';

type Props = {
  onBack: () => void;
};

export default function FleaMarketScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  // Recomputed on mount — handles midnight rollover during play.
  const [inventory] = useState<SkillId[]>(() => getDailyInventory(getTodayKey()));
  const [money, setMoney] = useState(0);

  useEffect(() => {
    persistence.getMoney().then(setMoney);
  }, []);

  return (
    <View style={styles.root}>
      {/* Sticky header — always visible above scroll */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>
        <Text style={styles.title}>FLEA MARKET</Text>
        <Text style={styles.moneyText}>${money.toLocaleString()}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 5 × 3 skill grid */}
        <View style={styles.grid}>
          {inventory.map((id) => {
            const skill = SKILLS[id];
            const price = FLEA_MARKET_PRICES[id];
            const icon = (GuiSprites.skillIcons as Record<SkillId, number>)[id];

            return (
              <View key={id} style={styles.card}>
                <View style={styles.cardInner}>
                  <Image
                    source={icon}
                    style={styles.cardIcon}
                    resizeMode="contain"
                    filterQuality="none"
                  />
                  <Text style={styles.cardName} numberOfLines={2}>
                    {skill.displayName}
                  </Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {skill.description}
                  </Text>
                  <Text style={styles.cardPrice}>${price.toLocaleString()}</Text>
                  <View style={styles.buyBtnBase}>
                    <Text style={styles.buyBtnText}>BUY</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* WATCH AD section — non-interactive in C1, wired in C2 */}
        <View style={styles.adSection}>
          <View style={styles.adDivider} />
          <Text style={styles.adSectionLabel}>PRE-RUN BUFF</Text>
          <View style={[styles.adBtn, styles.adBtnDisabled]}>
            <Text style={styles.adBtnText}>WATCH AD</Text>
            <Text style={styles.adSubtext}>Start with 1 random skill</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.backgroundDark,
  },

  // ─── Sticky header ─────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d28',
    backgroundColor: palette.backgroundDark,
  },
  backBtn: {
    minWidth: 80,
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  backText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 20,
    color: palette.accentGold,
  },
  title: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 22,
    color: palette.accentGold,
    letterSpacing: 2,
    textShadowColor: '#000000',
    textShadowRadius: 3,
    textShadowOffset: { width: 1, height: 1 },
  },
  moneyText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 20,
    color: palette.accentGold,
    minWidth: 80,
    textAlign: 'right',
  },

  // ─── Scroll + grid ─────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    width: '33.33%',
    padding: 4,
  },
  cardInner: {
    backgroundColor: 'rgba(10, 13, 8, 0.90)',
    borderWidth: 1,
    borderColor: '#2a2d28',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 4,
  },
  cardIcon: {
    width: 44,
    height: 44,
  },
  cardName: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 14,
    lineHeight: 15,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 1,
    textShadowOffset: { width: 1, height: 1 },
  },
  cardDesc: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 11,
    lineHeight: 12,
    color: '#aaaaaa',
    textAlign: 'center',
  },
  cardPrice: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 15,
    color: palette.accentGold,
    textShadowColor: '#000000',
    textShadowRadius: 1,
    textShadowOffset: { width: 1, height: 1 },
  },
  buyBtnBase: {
    width: '100%',
    height: 28,
    borderWidth: 1,
    borderColor: palette.accentGold,
    backgroundColor: 'rgba(201, 163, 86, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  buyBtnText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 15,
    color: palette.accentGold,
    letterSpacing: 1,
  },

  // ─── Watch Ad section ──────────────────────────────────────────────────────
  adSection: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  adDivider: {
    height: 1,
    backgroundColor: '#2a2d28',
  },
  adSectionLabel: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 18,
    color: '#888888',
    letterSpacing: 2,
  },
  adBtn: {
    height: 64,
    backgroundColor: 'rgba(10, 13, 8, 0.6)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3a3d38',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  adBtnDisabled: {
    opacity: 0.5,
  },
  adBtnText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 22,
    color: '#888888',
    letterSpacing: 1,
  },
  adSubtext: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 14,
    color: '#888888',
  },
});
