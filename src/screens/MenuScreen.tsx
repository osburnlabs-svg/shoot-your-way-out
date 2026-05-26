import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';

type Props = {
  onDeploy: () => void;
  onFleaMarket: () => void;
  money: number;
  bonusMessage: string | null;
  onBonusDismissed: () => void;
};

export default function MenuScreen({ onDeploy, onFleaMarket, money, bonusMessage, onBonusDismissed }: Props) {
  const insets = useSafeAreaInsets();
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!bonusMessage) return;
    toastOpacity.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(4500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]);
    anim.start(() => onBonusDismissed());
    return () => anim.stop();
  }, [bonusMessage, onBonusDismissed]);

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/ui/screens/MainMenu.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {bonusMessage ? (
        <Animated.View style={[styles.toast, { top: insets.top, opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{bonusMessage}</Text>
        </Animated.View>
      ) : null}

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

          <View style={[styles.stubBtn, styles.disabled]}>
            <Text style={styles.stubText}>UPGRADE</Text>
          </View>

          <View style={[styles.stubBtn, styles.disabled]}>
            <Text style={styles.stubText}>SETTINGS</Text>
          </View>
        </View>
      </View>
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
  stubBtn: {
    height: 52,
    backgroundColor: 'rgba(10, 13, 8, 0.6)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3a3d38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  stubText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 24,
    color: '#888888',
    letterSpacing: 1,
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
    backgroundColor: 'rgba(10, 13, 8, 0.90)',
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
