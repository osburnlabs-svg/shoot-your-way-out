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
import SettingsScreen from './screens/SettingsScreen';
import UpgradeScreen from './screens/UpgradeScreen';
import { persistence } from './lib/persistence';
import { getTodayKey } from './lib/fleaMarket';
import { audioEngine } from './lib/audioEngine';
import { initializeAdsSdk } from './lib/monetization';
import type { SkillId } from './data/skills';

// Screen state machine — Phase 9 routing.
// Boot → MenuScreen → LoadingScreen (countdown) → GameScreen.
// MenuScreen → FleaMarketScreen → MenuScreen (back, money refreshed).
// MenuScreen → SettingsScreen → MenuScreen (back).
// MenuScreen → UpgradeScreen → MenuScreen (back or purchase).
type Screen = 'menu' | 'loading' | 'game' | 'flea_market' | 'settings' | 'upgrade';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'VT323-Regular': require('../assets/fonts/VT323-Regular.ttf'),
  });
  const [screen, setScreen] = useState<Screen>('menu');
  const [persistedMoney, setPersistedMoney] = useState(0);
  const [isOperatorLicensed, setIsOperatorLicensed] = useState(false);
  const [starterSkills, setStarterSkills] = useState<SkillId[]>([]);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  // Gates music routing until persisted volumes are loaded into the engine.
  // Without this, playMusic fires on mount before init() resolves, so createAsync
  // receives the default _musicVol instead of the persisted value.
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    persistence.getMoney().then(setPersistedMoney);
    persistence.isOperatorLicensed().then(setIsOperatorLicensed);
    persistence.getSettings()
      .then(s => audioEngine.init(s.music_volume, s.sfx_volume))
      .then(() => setAudioReady(true));
    initializeAdsSdk(); // fire-and-forget — no UI gates on SDK init
  }, []);

  // Route music on screen transitions. flea_market, upgrade, settings all share the menu loop.
  // Depends on audioReady so the initial 'menu' routing fires after volumes are set.
  useEffect(() => {
    if (!audioReady) return;
    if (screen === 'menu' || screen === 'flea_market' || screen === 'upgrade') {
      audioEngine.playMusic('menu');
    } else if (screen === 'game') {
      audioEngine.playMusic('combat');
    } else if (screen === 'loading') {
      audioEngine.stopMusic();
    }
  }, [screen, audioReady]);

  // Daily bonus auto-claim: fires on every menu mount, silently exits if already claimed today.
  // Also clears transient toast messages when leaving the menu.
  useEffect(() => {
    if (screen !== 'menu') {
      setBonusMessage(null);
      setPurchaseMessage(null);
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
  const handlePurchaseDismissed = useCallback(() => setPurchaseMessage(null), []);

  const handleOpenFleaMarket = useCallback(() => {
    setScreen('flea_market');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setScreen('settings');
  }, []);

  const handleOpenUpgrade = useCallback(() => {
    setScreen('upgrade');
  }, []);

  const handleReturnFromSettings = useCallback(async () => {
    const licensed = await persistence.isOperatorLicensed();
    setIsOperatorLicensed(licensed);
    setScreen('menu');
  }, []);

  const handleReturnFromFleaMarket = useCallback(async () => {
    const total = await persistence.getMoney();
    setPersistedMoney(total);
    setScreen('menu');
  }, []);

  const handleReturnFromUpgrade = useCallback(() => {
    setScreen('menu');
  }, []);

  const handlePurchasedFromUpgrade = useCallback(() => {
    setIsOperatorLicensed(true);
    setPurchaseMessage('OPERATOR LICENSE ACTIVATED');
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
            onUpgrade={handleOpenUpgrade}
            onSettings={handleOpenSettings}
            money={persistedMoney}
            isOperatorLicensed={isOperatorLicensed}
            bonusMessage={bonusMessage}
            onBonusDismissed={handleBonusDismissed}
            purchaseMessage={purchaseMessage}
            onPurchaseDismissed={handlePurchaseDismissed}
          />
        )}
        {screen === 'loading' && <LoadingScreen onComplete={() => setScreen('game')} />}
        {screen === 'game' && <GameScreen onReturnToMenu={handleReturnToMenu} starterSkills={starterSkills} />}
        {screen === 'flea_market' && <FleaMarketScreen onBack={handleReturnFromFleaMarket} />}
        {screen === 'settings' && <SettingsScreen onBack={handleReturnFromSettings} />}
        {screen === 'upgrade' && (
          <UpgradeScreen onBack={handleReturnFromUpgrade} onPurchased={handlePurchasedFromUpgrade} />
        )}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
