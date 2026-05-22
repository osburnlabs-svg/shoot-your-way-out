import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';

type Props = {
  onDeploy: () => void;
};

export default function MenuScreen({ onDeploy }: Props) {
  const insets = useSafeAreaInsets();

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
        {/* Money display — top right, placeholder until Phase 9 persistence */}
        <View style={styles.moneyRow}>
          <Text style={styles.moneyText}>$0</Text>
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

          <View style={[styles.stubBtn, styles.disabled]}>
            <Text style={styles.stubText}>FLEA MARKET</Text>
          </View>

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
});
