// monetization.ts — Phase 9: AdMob rewarded ad integration.
// Note: expo-in-app-purchases removed in Phase 2 hotfix — incompatible with expo-modules-core 3.x (SDK 54).
// Phase 9 stage 4 will wire react-native-iap for Operator License IAP.
//
// If rewarded ads crash on first load, the dev client binary may predate the RNGMA
// native module. Fix: eas build --profile development, reinstall APK, retry.

import { Platform } from 'react-native';
import MobileAds, {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';

// ─── Ad unit IDs ──────────────────────────────────────────────────────────────
// Phase 9 dev — Google's official test IDs. Always serve test ads; safe to commit.
// Ship prep: replace rewardedAndroid + rewardedIOS with real unit IDs from
// Mo's AdMob console. Single file, two lines; no component code to touch.
// Banner IDs are out-of-scope for v1 (rewarded only) — leave as placeholder.
export const ADMOB_UNIT_IDS = {
  rewardedAndroid: 'ca-app-pub-3940256099942544/5224354917',
  rewardedIOS:     'ca-app-pub-3940256099942544/1712485313',
  bannerAndroid:   'ca-app-pub-PLACEHOLDER/PLACEHOLDER',
  bannerIOS:       'ca-app-pub-PLACEHOLDER/PLACEHOLDER',
};

// ─── SDK bootstrap ────────────────────────────────────────────────────────────
/**
 * Call once on app startup before any ad is loaded.
 * Wired in App.tsx startup useEffect alongside audioEngine.init().
 * Fire-and-forget — no UI gates on this promise.
 */
export function initializeAdsSdk(): void {
  MobileAds()
    .initialize()
    .then(() => {
      // [DIAG] Remove after Mo confirms init resolves successfully in Metro logs.
      console.log('[RNGMA] SDK initialized successfully');
    })
    .catch((e: unknown) => {
      // Permanent — init failure is worth knowing about (will cause silent ad load failures).
      console.error('[RNGMA] SDK init FAILED:', e);
    });
}

// ─── Rewarded ad ──────────────────────────────────────────────────────────────
/**
 * Load and show a rewarded video ad. Resolves:
 *   { rewarded: true }  — user watched to completion (EARNED_REWARD fired)
 *   { rewarded: false } — early dismiss, load error, or 10-second timeout
 *
 * Never rejects. All failure paths (including synchronous throws from RNGMA)
 * are caught and resolve false so callers can always safely await this.
 *
 * Non-personalized ads: no ATT prompt is requested (IDFA unavailable on iOS →
 * Google defaults to non-personalized). No UMP consent flow. Phase 9 stage 2 only.
 */
export function showRewardedAd(): Promise<{ rewarded: boolean }> {
  return new Promise((resolve) => {
    // Declared before try-catch so settle is reachable from the catch block.
    let settled = false;
    function settle(result: { rewarded: boolean }): void {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    // Declared outside try so the catch block can clear it if setup throws before load().
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const adUnitId = Platform.OS === 'ios'
        ? ADMOB_UNIT_IDS.rewardedIOS
        : ADMOB_UNIT_IDS.rewardedAndroid;

      const ad = RewardedAd.createForAdRequest(adUnitId);

      // 10-second load timeout — covers slow networks, no-fill, and silent SDK failures.
      timeoutId = setTimeout(() => {
        // [DIAG] Remove after verifying timeout path vs event-driven path in Metro.
        console.warn('[RNGMA] Ad load timed out after 10s — settling false');
        settle({ rewarded: false });
      }, 10_000);

      // RewardedAd uses RewardedAdEventType.LOADED, not the generic AdEventType.LOADED.
      // RNGMA v16 throws synchronously if the wrong namespace is used.
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        // [DIAG] Remove after confirming LOADED fires correctly.
        console.log('[RNGMA] Ad LOADED — calling show()');
        clearTimeout(timeoutId);
        ad.show().catch((e: unknown) => {
          console.error('[RNGMA] ad.show() rejected:', e);
          settle({ rewarded: false });
        });
      });

      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        // [DIAG] Remove after confirming EARNED_REWARD fires on completion.
        console.log('[RNGMA] EARNED_REWARD — settling true');
        settle({ rewarded: true });
      });

      ad.addAdEventListener(AdEventType.CLOSED, () => {
        // Normal completion: fires after EARNED_REWARD → no-op (already settled true).
        // Early dismiss: fires alone → settles false.
        settle({ rewarded: false });
      });

      ad.addAdEventListener(AdEventType.ERROR, (error: unknown) => {
        // Permanent — ad load errors are worth logging (network, no-fill, bad unit ID, etc.).
        console.error('[RNGMA] Ad load ERROR:', error);
        clearTimeout(timeoutId);
        settle({ rewarded: false });
      });

      // [DIAG] Remove after confirming load() is called without throwing.
      console.log('[RNGMA] Calling ad.load() with unit:', adUnitId);
      ad.load();
    } catch (e) {
      // Catches synchronous throws from createForAdRequest / addAdEventListener / load().
      // Clear the timeout if it was set before the throw — prevents a dangling no-op
      // settle() call 10 seconds later and the associated log noise.
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      console.error('[RNGMA] showRewardedAd synchronous throw:', e);
      settle({ rewarded: false });
    }
  });
}

// ─── Stubs — Phase 9 stage 4+ ─────────────────────────────────────────────────
export const monetization = {
  showBanner: (): void => {
    // Phase 9: display AdMob banner at bottom of main menu
  },

  hideBanner: (): void => {
    // Phase 9: hide banner on screen transitions
  },

  purchaseSupport: async (): Promise<{ success: boolean }> => {
    // Phase 9 stage 4: trigger Operator License IAP via react-native-iap
    return { success: false };
  },

  isSupportUnlocked: (): boolean => {
    // Phase 9 stage 4: returns true if Operator License purchased
    return false;
  },
};
