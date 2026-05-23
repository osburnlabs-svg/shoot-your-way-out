import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';

type Props = {
  onComplete: () => void;
};

export default function LoadingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [count, setCount] = useState(3);

  useEffect(() => {
    const t1 = setTimeout(() => setCount(2), 1000);
    const t2 = setTimeout(() => setCount(1), 2000);
    const t3 = setTimeout(onComplete, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/ui/screens/LoadingScreen.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.label}>DEPLOYING IN</Text>
        <Text style={styles.countdown}>{count}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 40,
    color: palette.accentGold,
    letterSpacing: 4,
  },
  countdown: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 128,
    lineHeight: 140,
    color: palette.accentGold,
  },
});
