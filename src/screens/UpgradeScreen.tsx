import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';
import { persistence } from '../lib/persistence';

type Props = {
  onBack: () => void;
  onPurchased: () => void;
};

export default function UpgradeScreen({ onBack, onPurchased }: Props) {
  const insets = useSafeAreaInsets();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (purchasing) return;
    setPurchasing(true);
    // [P9-STUB] Stage 4 replaces this direct toggle with real IAP receipt validation. grep: P9-STUB
    await persistence.setOperatorLicensed(true);
    onPurchased();
  };

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>

        <Text style={styles.headline}>BECOME AN OPERATOR</Text>
        <Text style={styles.subhead}>One-time purchase — $4.99</Text>

        <View style={styles.cards}>
          <View style={[styles.card, styles.cardFree]}>
            <Text style={styles.cardLabel}>FREE</Text>
            <Text style={styles.cardAmount}>
              {'$1,000'}<Text style={styles.cardAmountUnit}>{' / day'}</Text>
            </Text>
            <Text style={styles.cardDesc}>Daily login bonus</Text>
          </View>

          <View style={[styles.card, styles.cardOperator]}>
            <Text style={[styles.cardLabel, styles.cardLabelGold]}>OPERATOR</Text>
            <Text style={[styles.cardAmount, styles.cardAmountGold]}>
              {'$5,000'}<Text style={styles.cardAmountUnit}>{' / day'}</Text>
            </Text>
            <Text style={styles.cardDesc}>Daily login bonus</Text>
          </View>
        </View>

        <Text style={styles.supportCopy}>
          {'No ads, no subscriptions, no recurring charges.\nYour purchase supports an indie developer and\nkeeps this game ad-free forever.'}
        </Text>

        <View style={styles.spacer} />

        <Pressable
          style={({ pressed }) => [styles.purchaseBtn, pressed && styles.purchaseBtnPressed]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          <Text style={styles.purchaseBtnText}>PURCHASE $4.99</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.backgroundDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 16,
    marginBottom: 16,
  },
  backText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 22,
    color: palette.accentGold,
    letterSpacing: 1,
  },
  headline: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 44,
    color: palette.accentGold,
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 4,
    textShadowOffset: { width: 1, height: 2 },
    marginBottom: 6,
  },
  subhead: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 22,
    color: palette.accentGold,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 28,
  },
  cards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  cardFree: {
    backgroundColor: 'rgba(10, 13, 8, 0.60)',
    borderColor: '#2a2d28',
  },
  cardOperator: {
    backgroundColor: 'rgba(201, 163, 86, 0.08)',
    borderColor: palette.accentGold,
  },
  cardLabel: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 18,
    color: '#888888',
    letterSpacing: 2,
  },
  cardLabelGold: {
    color: palette.accentGold,
  },
  cardAmount: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 28,
    color: '#888888',
    letterSpacing: 1,
  },
  cardAmountGold: {
    color: palette.accentGold,
  },
  cardAmountUnit: {
    fontSize: 18,
  },
  cardDesc: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
  },
  supportCopy: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 17,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 22,
  },
  spacer: {
    flex: 1,
  },
  purchaseBtn: {
    height: 64,
    backgroundColor: palette.accentGold,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseBtnPressed: {
    opacity: 0.85,
  },
  purchaseBtnText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 32,
    color: palette.backgroundDark,
    letterSpacing: 2,
  },
});
