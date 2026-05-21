// Side-effect imports — must come BEFORE any Skia imports.
// Reanimated registers itself with the RN bridge here; Skia's worklet integration depends on it.
// Gesture handler must be imported at the root for drag/pan handlers to work (Phase 2 G3).
import 'react-native-reanimated';
import 'react-native-gesture-handler';

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import GameScreen from './screens/GameScreen';

// Screen state machine.
// G2: boots directly into GameScreen.
// Phase 7 adds full routing: Loading → MainMenu → PreRunModal → Game ⇄ Pause → GameOver
type Screen = 'game'; // expand to union when Phase 7 adds other screens

export default function App() {
  // Destructure only the value — setScreen unused until Phase 7 wires navigation callbacks
  const [screen] = useState<Screen>('game');

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        {screen === 'game' && <GameScreen />}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
