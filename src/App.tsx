// Side-effect imports — must come BEFORE any Skia imports.
// Reanimated registers itself with the RN bridge here; Skia's worklet integration depends on it.
// Gesture handler must be imported at the root for drag/pan handlers to work (Phase 2 G3).
import 'react-native-reanimated';
import 'react-native-gesture-handler';

import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MenuScreen from './screens/MenuScreen';
import LoadingScreen from './screens/LoadingScreen';
import GameScreen from './screens/GameScreen';
import FleaMarketScreen from './screens/FleaMarketScreen';
import { persistence } from './lib/persistence';
import type { SkillId } from './data/skills';
import { getTodayKey, getDailyInventory } from './lib/fleaMarket';

// Screen state machine — Phase 8 routing.
// Boot → MenuScreen → LoadingScreen (countdown) → GameScreen.
// MenuScreen → FleaMarketScreen → MenuScreen (back, money refreshed).
type Screen = 'menu' | 'loading' | 'game' | 'flea_market';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'VT323-Regular': require('../assets/fonts/VT323-Regular.ttf'),
  });
  const [screen, setScreen] = useState<Screen>('menu');
  const [persistedMoney, setPersistedMoney] = useState(0);
  const [starterSkills, setStarterSkills] = useState<SkillId[]>([]);

  useEffect(() => {
    persistence.getMoney().then(setPersistedMoney);
  }, []);

  // [P8-DIAG] Verify date helper and deterministic shuffle on mount. Remove in Part 2 cleanup.
  useEffect(() => {
    const todayKey = getTodayKey();
    const inv1 = getDailyInventory(todayKey);
    const inv2 = getDailyInventory(todayKey);
    console.log('[P8-DIAG] today key:', todayKey);
    console.log('[P8-DIAG] daily inventory (call 1):', inv1);
    console.log('[P8-DIAG] daily inventory (call 2 — must match call 1):', inv2);
  }, []);

  const handleOpenFleaMarket = useCallback(() => {
    setScreen('flea_market');
  }, []);

  const handleReturnFromFleaMarket = useCallback(async () => {
    const total = await persistence.getMoney();
    setPersistedMoney(total);
    setScreen('menu');
  }, []);

  const handleReturnToMenu = useCallback(async (earnedMoney: number) => {
    await persistence.addMoney(earnedMoney);
    const total = await persistence.getMoney();
    setPersistedMoney(total);
    setScreen('menu');
  }, []);

  // Read, consume, and clear pending starter-skill slots before the game loop starts.
  // Mirrors the await discipline of handleReturnToMenu — clears commit before game mounts.
  const handleDeploy = useCallback(async () => {
    const [adSkill, purchasedSkill] = await Promise.all([
      persistence.getPendingAdSkill(),
      persistence.getPendingPurchasedSkill(),
    ]);
    const skills = ([adSkill, purchasedSkill] as Array<SkillId | null>).filter(
      (s): s is SkillId => s !== null,
    );
    // [P8-DIAG] Log consumed slots. Remove in Part 2 cleanup.
    console.log('[P8-DIAG] deploy: pendingAdSkill=', adSkill, 'pendingPurchasedSkill=', purchasedSkill, '→ starterSkills=', skills);
    await Promise.all([
      persistence.clearPendingAdSkill(),
      persistence.clearPendingPurchasedSkill(),
    ]);
    // [P8-DIAG] Confirm clears committed before game starts.
    console.log('[P8-DIAG] deploy: pending slots cleared, starting game with', skills.length, 'starter skill(s)');
    setStarterSkills(skills);
    setScreen('loading');
  }, []);

  // Render nothing until fonts are ready — Expo splash covers this gap.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        {screen === 'menu' && <MenuScreen onDeploy={handleDeploy} onFleaMarket={handleOpenFleaMarket} money={persistedMoney} />}
        {screen === 'loading' && <LoadingScreen onComplete={() => setScreen('game')} />}
        {screen === 'game' && <GameScreen onReturnToMenu={handleReturnToMenu} starterSkills={starterSkills} />}
        {screen === 'flea_market' && <FleaMarketScreen onBack={handleReturnFromFleaMarket} />}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
