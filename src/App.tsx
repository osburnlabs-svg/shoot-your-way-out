// Side-effect imports — must come BEFORE any Skia imports.
// Reanimated registers itself with the RN bridge here; Skia's worklet integration depends on it.
// Gesture handler must be imported at the root for drag/pan handlers to work (Phase 2 G3).
import 'react-native-reanimated';
import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Canvas, Image, useImage } from '@shopify/react-native-skia';

import { HeroSprites } from './lib/sprites';

// Phase 2 G1 — sprite pipeline verification render.
// Draws a single hero idle frame (pistol pose) via Skia to prove the full
// pipeline works: asset → require → registry → useImage → Skia → device.
//
// This will become the screen state machine in Phase 7:
// [Loading] → [MainMenu] → [MapSelect] → [Game] ⇄ [Pause] → [GameOver]

export default function App() {
  const { width, height } = useWindowDimensions();
  const heroImage = useImage(HeroSprites.pistol.idle);

  // Center the sprite. Hero sprites are small pixel-art PNGs — scale up 4× so
  // they're visible on a high-DPI phone screen.
  const scale = 4;
  const spriteW = heroImage ? heroImage.width() * scale : 0;
  const spriteH = heroImage ? heroImage.height() * scale : 0;
  const x = (width - spriteW) / 2;
  const y = (height - spriteH) / 2;

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height: height - 48 }}>
        {heroImage && (
          <Image
            image={heroImage}
            x={x}
            y={y}
            width={spriteW}
            height={spriteH}
            fit="fill"
          />
        )}
      </Canvas>
      <Text style={styles.subtitle}>Phase 2 G1: sprite pipeline working</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d08',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  subtitle: {
    color: '#c9a356',
    fontSize: 13,
    letterSpacing: 1,
    paddingVertical: 12,
  },
});
