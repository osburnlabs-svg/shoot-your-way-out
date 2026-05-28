import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';

type Props = {
  onDeploy: () => void;
  onFleaMarket: () => void;
  onUpgrade: () => void;
  onSettings: () => void;
  money: number;
  isOperatorLicensed: boolean;
  bonusMessage: string | null;
  onBonusDismissed: () => void;
  purchaseMessage: string | null;
  onPurchaseDismissed: () => void;
};

export default function MenuScreen({ onDeploy, onFleaMarket, onUpgrade, onSettings, money, isOperatorLicensed, bonusMessage, onBonusDismissed, purchaseMessage, onPurchaseDismissed }: Props) {
  const insets = useSafeAreaInsets();
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Purchase message takes precedence over bonus message when both are set.
  const toastMessage = purchaseMessage ?? bonusMessage;
  const dismissRef = useRef<() => void>(() => {});
  dismissRef.current = purchaseMessage ? onPurchaseDismissed : onBonusDismissed;

  useEffect(() => {
    if (!toastMessage) return;
    toastOpacity.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(4500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]);
    anim.start(() => dismissRef.current());
    return () => anim.stop();
  }, [toastMessage]);

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/ui/screens/MainMenu.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Accumulated flea market currency — persisted across runs. */}
        <View style={styles.moneyRow}>
          <Text style={styles.moneyText}>${money.toLocaleString()}</Text>
        </View>

        <View style={styles.spacer} />

        {/* Button stack — lower half */}
        <View style={styles.buttonStack}>
          <Pressable
            style={({ pressed }) => [styles.deployBtn, pressed && styles.deployBtnPressed]}
            onPress={onDeploy}
          >
            <Text style={styles.deployText}>DEPLOY</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.fleaMarketBtn, pressed && styles.fleaMarketBtnPressed]}
            onPress={onFleaMarket}
          >
            <Text style={styles.fleaMarketBtnText}>FLEA MARKET</Text>
          </Pressable>

          {!isOperatorLicensed && (
            <Pressable
              style={({ pressed }) => [styles.fleaMarketBtn, pressed && styles.fleaMarketBtnPressed]}
              onPress={onUpgrade}
            >
              <Text style={styles.fleaMarketBtnText}>UPGRADE</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.fleaMarketBtn, pressed && styles.fleaMarketBtnPressed]}
            onPress={onSettings}
          >
            <Text style={styles.fleaMarketBtnText}>SETTINGS</Text>
          </Pressable>
        </View>
      </View>

      {toastMessage ? (
        <Animated.View style={[styles.toast, { top: insets.top, opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.backgroundDark,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  moneyRow: {
    alignItems: 'flex-end',
  },
  moneyText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 22,
    color: palette.accentGold,
  },
  spacer: {
    flex: 1,
  },
  buttonStack: {
    gap: 12,
  },
  deployBtn: {
    height: 64,
    backgroundColor: palette.accentGold,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deployBtnPressed: {
    opacity: 0.85,
  },
  deployText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 32,
    color: palette.backgroundDark,
    letterSpacing: 2,
  },
  fleaMarketBtn: {
    height: 52,
    backgroundColor: 'rgba(10, 13, 8, 0.6)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fleaMarketBtnPressed: {
    opacity: 0.75,
  },
  fleaMarketBtnText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 24,
    color: palette.accentGold,
    letterSpacing: 1,
  },
  toast: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: palette.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: palette.accentGold,
  },
  toastText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 26,
    color: palette.accentGold,
    letterSpacing: 2,
  },
});
