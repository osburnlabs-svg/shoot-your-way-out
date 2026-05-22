// Side-effect imports — must come BEFORE any Skia imports.
// Reanimated registers itself with the RN bridge here; Skia's worklet integration depends on it.
// Gesture handler must be imported at the root for drag/pan handlers to work (Phase 2 G3).
import 'react-native-reanimated';
import 'react-native-gesture-handler';

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MenuScreen from './screens/MenuScreen';
import GameScreen from './screens/GameScreen';

// Screen state machine — Phase 7 routing.
// Boot → MenuScreen. Deploy → GameScreen. Loading screen sits between them in the next Phase 7 commit.
type Screen = 'menu' | 'game';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'VT323-Regular': require('../assets/fonts/VT323-Regular.ttf'),
  });
  const [screen, setScreen] = useState<Screen>('menu');

  // Render nothing until fonts are ready. Loading screen replaces this null return in a later Phase 7 commit.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        {screen === 'menu' && <MenuScreen onDeploy={() => setScreen('game')} />}
        {screen === 'game' && <GameScreen />}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
