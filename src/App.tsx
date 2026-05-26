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
import { getTodayKey } from './lib/fleaMarket';
import type { SkillId } from './data/skills';

// [P8-DIAG] Debugger-console testing helpers — strip after Phase 8 verification (grep: P8-DIAG)
// In Metro Hermes debugger console:
//   global.__p8DiagResetBonus()           — clears lastClaimDate so next menu mount re-fires the bonus
//   global.__p8DiagSetOperator(true/false) — toggles Operator License ($5K vs $1K daily bonus)
if (__DEV__) {
  (global as any).__p8DiagResetBonus = () => persistence.clearLastClaimDate();
  (global as any).__p8DiagSetOperator = (v: boolean) => persistence.setOperatorLicensed(v);
}

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
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);

  useEffect(() => {
    persistence.getMoney().then(setPersistedMoney);
  }, []);

  // Daily bonus auto-claim: fires on every menu mount, silently exits if already claimed today.
  useEffect(() => {
    if (screen !== 'menu') {
      setBonusMessage(null);
      return;
    }
    let active = true;
    (async () => {
      const today = getTodayKey();
      const lastClaim = await persistence.getLastClaimDate();
      if (!active || lastClaim === today) return;

      const isOperator = await persistence.isOperatorLicensed();
      const amount = isOperator ? 5_000 : 1_000;
      const label = isOperator ? '+$5,000 OPERATOR BONUS' : '+$1,000 DAILY BONUS';

      await persistence.addMoney(amount);
      await persistence.setLastClaimDate(today);

      if (!active) return;
      const total = await persistence.getMoney();
      if (!active) return;
      setPersistedMoney(total);
      setBonusMessage(label);
    })();
    return () => { active = false; };
  }, [screen]);

  const handleBonusDismissed = useCallback(() => setBonusMessage(null), []);

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
    await Promise.all([
      persistence.clearPendingAdSkill(),
      persistence.clearPendingPurchasedSkill(),
    ]);
    setStarterSkills(skills);
    setScreen('loading');
  }, []);

  // Render nothing until fonts are ready — Expo splash covers this gap.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        {screen === 'menu' && (
          <MenuScreen
            onDeploy={handleDeploy}
            onFleaMarket={handleOpenFleaMarket}
            money={persistedMoney}
            bonusMessage={bonusMessage}
            onBonusDismissed={handleBonusDismissed}
          />
        )}
        {screen === 'loading' && <LoadingScreen onComplete={() => setScreen('game')} />}
        {screen === 'game' && <GameScreen onReturnToMenu={handleReturnToMenu} starterSkills={starterSkills} />}
        {screen === 'flea_market' && <FleaMarketScreen onBack={handleReturnFromFleaMarket} />}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
