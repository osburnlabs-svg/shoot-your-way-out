// Stub — full implementation ships in Commit C1.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';

type Props = { onBack: () => void };

export default function FleaMarketScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
      >
        <Text style={styles.backText}>← BACK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.backgroundDark,
    paddingHorizontal: 12,
  },
  backBtn: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  backText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 20,
    color: palette.accentGold,
  },
});
