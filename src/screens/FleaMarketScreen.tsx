import React, { useCallback, useEffect, useState } from 'react';
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
import { getDailyInventory, getTodayKey, FLEA_MARKET_POOL } from '../lib/fleaMarket';
import { FLEA_MARKET_PRICES } from '../data/fleaMarketPricing';
import { persistence } from '../lib/persistence';
import { showRewardedAd } from '../lib/monetization';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';

type BuyState = 'active' | 'no_funds' | 'gated' | 'purchased';

function getBuyState(
  id: SkillId,
  money: number,
  pendingPurchasedSkill: SkillId | null,
): BuyState {
  if (pendingPurchasedSkill === id) return 'purchased';
  if (pendingPurchasedSkill !== null) return 'gated';
  if (money < FLEA_MARKET_PRICES[id]) return 'no_funds';
  return 'active';
}

type Props = {
  onBack: () => void;
};

export default function FleaMarketScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  // Recomputed on mount — handles midnight rollover during play.
  const [inventory] = useState<SkillId[]>(() => getDailyInventory(getTodayKey()));
  const [money, setMoney] = useState(0);
  const [pendingPurchasedSkill, setPendingPurchasedSkill] = useState<SkillId | null>(null);
  const [pendingAdSkill, setPendingAdSkill] = useState<SkillId | null>(null);
  const [adLoading, setAdLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      persistence.getMoney(),
      persistence.getPendingPurchasedSkill(),
      persistence.getPendingAdSkill(),
    ]).then(([m, purchased, ad]) => {
      setMoney(m);
      setPendingPurchasedSkill(purchased);
      setPendingAdSkill(ad);
    });
  }, []);

  const handleBuy = useCallback(async (id: SkillId) => {
    if (pendingPurchasedSkill !== null) return;
    const price = FLEA_MARKET_PRICES[id];
    if (money < price) return;
    setMoney(m => m - price);
    setPendingPurchasedSkill(id);
    await persistence.addMoney(-price);
    await persistence.setPendingPurchasedSkill(id);
  }, [money, pendingPurchasedSkill]);

  const handleWatchAd = useCallback(async () => {
    if (pendingAdSkill !== null || adLoading) return;
    setAdLoading(true);
    const { rewarded } = await showRewardedAd();
    if (!rewarded) {
      // User dismissed early or ad failed to load — no skill granted, re-enable button.
      setAdLoading(false);
      return;
    }
    const grantedId = FLEA_MARKET_POOL[Math.floor(Math.random() * FLEA_MARKET_POOL.length)];
    setPendingAdSkill(grantedId);
    await persistence.setPendingAdSkill(grantedId);
    setAdLoading(false);
  }, [pendingAdSkill, adLoading]);

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
            const buyState = getBuyState(id, money, pendingPurchasedSkill);

            return (
              <View key={id} style={[styles.card, buyState === 'gated' && styles.cardGated]}>
                <View style={[
                  styles.cardInner,
                  buyState === 'purchased' && styles.cardInnerPurchased,
                ]}>
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
                  {buyState === 'purchased' ? (
                    <View style={[styles.buyBtnBase, styles.buyBtnPurchased]}>
                      <Text style={[styles.buyBtnText, styles.buyBtnPurchasedText]}>PURCHASED</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.buyBtnBase,
                        buyState === 'no_funds' && styles.buyBtnNoFunds,
                        buyState === 'gated' && styles.buyBtnGated,
                        pressed && styles.buyBtnPressed,
                      ]}
                      onPress={() => handleBuy(id)}
                      disabled={buyState !== 'active'}
                    >
                      <Text style={[
                        styles.buyBtnText,
                        (buyState === 'no_funds' || buyState === 'gated') && styles.buyBtnDimText,
                      ]}>
                        BUY
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* WATCH AD section */}
        <View style={styles.adSection}>
          <View style={styles.adDivider} />
          <Text style={styles.adSectionLabel}>PRE-RUN BUFF</Text>
          {pendingAdSkill !== null ? (
            <View style={styles.adWatchedRow}>
              <Image
                source={(GuiSprites.skillIcons as Record<SkillId, number>)[pendingAdSkill]}
                style={styles.adSkillIcon}
                resizeMode="contain"
                filterQuality="none"
              />
              <View style={styles.adSkillInfo}>
                <Text style={styles.adSkillName}>{SKILLS[pendingAdSkill].displayName}</Text>
                <Text style={styles.adSkillDesc}>{SKILLS[pendingAdSkill].description}</Text>
              </View>
              <View style={styles.adWatchedBadge}>
                <Text style={styles.adWatchedBadgeText}>{'AD\nWATCHED'}</Text>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.adBtn,
                styles.adBtnActive,
                pressed && !adLoading && styles.adBtnPressed,
              ]}
              onPress={handleWatchAd}
              disabled={adLoading}
            >
              <Text style={[styles.adBtnText, styles.adBtnActiveText]}>
                {adLoading ? 'LOADING...' : 'WATCH AD'}
              </Text>
              {!adLoading && <Text style={styles.adSubtext}>Start with 1 random skill</Text>}
            </Pressable>
          )}
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

  // ─── Card gate states ──────────────────────────────────────────────────────
  cardGated: {
    opacity: 0.42,
  },
  cardInnerPurchased: {
    borderColor: palette.accentGold,
  },
  buyBtnPurchased: {
    borderColor: palette.accentGold,
    backgroundColor: 'rgba(201, 163, 86, 0.08)',
  },
  buyBtnPurchasedText: {
    fontSize: 13,
    color: palette.accentGold,
    letterSpacing: 1,
  },
  buyBtnNoFunds: {
    borderColor: palette.warningRed,
    backgroundColor: 'rgba(204, 51, 51, 0.08)',
  },
  buyBtnGated: {
    borderColor: '#2a2d28',
    backgroundColor: 'transparent',
  },
  buyBtnPressed: {
    opacity: 0.70,
  },
  buyBtnDimText: {
    color: '#555555',
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
  adBtnActive: {
    borderColor: palette.accentGold,
    opacity: 1,
  },
  adBtnActiveText: {
    color: palette.accentGold,
  },
  adBtnPressed: {
    opacity: 0.70,
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
  adWatchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 13, 8, 0.6)',
    borderWidth: 1,
    borderColor: palette.accentGold,
    borderRadius: 4,
    padding: 10,
    gap: 10,
  },
  adSkillIcon: {
    width: 44,
    height: 44,
  },
  adSkillInfo: {
    flex: 1,
    gap: 2,
  },
  adSkillName: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 16,
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowRadius: 1,
    textShadowOffset: { width: 1, height: 1 },
  },
  adSkillDesc: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 13,
    color: '#aaaaaa',
  },
  adWatchedBadge: {
    backgroundColor: 'rgba(201, 163, 86, 0.08)',
    borderWidth: 1,
    borderColor: palette.accentGold,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adWatchedBadgeText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 13,
    color: palette.accentGold,
    textAlign: 'center',
    lineHeight: 14,
  },
});
