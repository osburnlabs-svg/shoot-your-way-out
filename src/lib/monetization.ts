// monetization.ts — Phase 1 stub. All methods are no-ops.
// Full implementation in Phase 9 using react-native-google-mobile-ads + react-native-iap.
// Note: expo-in-app-purchases was removed in Phase 2 hotfix — incompatible with expo-modules-core 3.x (SDK 54).
// Phase 9 will install react-native-iap and wire it through purchaseSupport() / isSupportUnlocked().
//
// AdMob unit IDs are placeholders — replace all before Phase 9 build.
// Search for "_phase9_todo" to find every spot that needs updating.

// TODO: Replace in Phase 9 — get real unit IDs from AdMob console after creating account
const _phase9_todo = 'Replace all ca-app-pub-PLACEHOLDER values with real AdMob unit IDs';

export const ADMOB_UNIT_IDS = {
  // TODO: Replace in Phase 9
  rewardedAndroid: 'ca-app-pub-PLACEHOLDER/PLACEHOLDER',
  // TODO: Replace in Phase 9
  rewardedIOS: 'ca-app-pub-PLACEHOLDER/PLACEHOLDER',
  // TODO: Replace in Phase 9
  bannerAndroid: 'ca-app-pub-PLACEHOLDER/PLACEHOLDER',
  // TODO: Replace in Phase 9
  bannerIOS: 'ca-app-pub-PLACEHOLDER/PLACEHOLDER',
};

export const monetization = {
  showRewardedAd: async (_callback?: () => void): Promise<{ rewarded: boolean }> => {
    // Phase 9: show rewarded ad; resolve { rewarded: true } on completion
    return { rewarded: false };
  },

  showBanner: (): void => {
    // Phase 9: display AdMob banner at bottom of main menu
  },

  hideBanner: (): void => {
    // Phase 9: hide banner (on screen transitions away from main menu)
  },

  purchaseSupport: async (): Promise<{ success: boolean }> => {
    // Phase 9: trigger $2.99 Support the Dev IAP (product: support_dev_v1)
    return { success: false };
  },

  isSupportUnlocked: (): boolean => {
    // Phase 9: returns true if support IAP purchased (reads syo_support_unlocked from AsyncStorage)
    return false;
  },
};
