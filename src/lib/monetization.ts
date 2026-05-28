// monetization.ts — AdMob rewarded ads + Operator License IAP (expo-iap 4.3.1).
// Note: expo-in-app-purchases removed in Phase 2 hotfix — incompatible with expo-modules-core 3.x (SDK 54).
//
// If rewarded ads crash on first load, the dev client binary may predate the RNGMA
// native module. Fix: eas build --profile development, reinstall APK, retry.
//
// IAP receipt validation: client-side only (expo-iap built-in finishTransaction).
// Server-side validation is a deliberate v1 non-goal — one non-consumable at $4.99
// at indie scale does not justify backend infrastructure.

import { Platform } from 'react-native';
import MobileAds, {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  restorePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  ErrorCode,
  type Purchase,
} from 'expo-iap';

// ─── IAP product ──────────────────────────────────────────────────────────────
// Stage 7: configure both App Store Connect and Google Play Console with this
// exact product ID as a non-consumable (one-time purchase) at $4.99 USD.
const OPERATOR_LICENSE_PRODUCT_ID = 'operator_license';

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
    .catch((e: unknown) => {
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
 */
export function showRewardedAd(): Promise<{ rewarded: boolean }> {
  return new Promise((resolve) => {
    let settled = false;
    function settle(result: { rewarded: boolean }): void {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const adUnitId = Platform.OS === 'ios'
        ? ADMOB_UNIT_IDS.rewardedIOS
        : ADMOB_UNIT_IDS.rewardedAndroid;

      const ad = RewardedAd.createForAdRequest(adUnitId);

      timeoutId = setTimeout(() => settle({ rewarded: false }), 10_000);

      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        clearTimeout(timeoutId);
        ad.show().catch((e: unknown) => {
          console.error('[RNGMA] ad.show() rejected:', e);
          settle({ rewarded: false });
        });
      });

      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        settle({ rewarded: true });
      });

      ad.addAdEventListener(AdEventType.CLOSED, () => {
        settle({ rewarded: false });
      });

      ad.addAdEventListener(AdEventType.ERROR, (error: unknown) => {
        console.error('[RNGMA] Ad load ERROR:', error);
        clearTimeout(timeoutId);
        settle({ rewarded: false });
      });

      ad.load();
    } catch (e) {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      console.error('[RNGMA] showRewardedAd synchronous throw:', e);
      settle({ rewarded: false });
    }
  });
}

// ─── Operator License IAP ─────────────────────────────────────────────────────
/**
 * Initiate the Operator License purchase flow. Resolves:
 *   'success'       — purchase completed; caller must call setOperatorLicensed(true)
 *   'cancelled'     — user dismissed the store dialog (silent, no error toast needed)
 *   'not_available' — product not found in store (expected until stage 7 configures products)
 *   'error'         — store error, network failure, or 60-second timeout
 *
 * Never rejects. Manages connection lifecycle internally.
 * Receipt validation: client-side via finishTransaction (v1 — see file header).
 */
export function purchaseOperatorLicense(): Promise<'success' | 'cancelled' | 'not_available' | 'error'> {
  return new Promise((resolve) => {
    let settled = false;
    let updateSub: { remove: () => void } | undefined;
    let errorSub: { remove: () => void } | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function cleanup(): void {
      updateSub?.remove();
      errorSub?.remove();
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      endConnection().catch(() => {});
    }

    function settle(result: 'success' | 'cancelled' | 'not_available' | 'error'): void {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    }

    async function run(): Promise<void> {
      try {
        await initConnection();

        const products = await fetchProducts({
          skus: [OPERATOR_LICENSE_PRODUCT_ID],
          type: 'in-app',
        });

        if (!products || products.length === 0) {
          // Expected at stage 4 — store product not yet configured.
          settle('not_available');
          return;
        }

        // 60-second timeout — store dialogs can stay open longer than ad requests.
        timeoutId = setTimeout(() => settle('error'), 60_000);

        updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
          try {
            await finishTransaction({ purchase, isConsumable: false });
          } catch (e) {
            console.error('[IAP] finishTransaction failed:', e);
          }
          settle('success');
        });

        errorSub = purchaseErrorListener((error) => {
          if (error.code === ErrorCode.UserCancelled) {
            settle('cancelled');
          } else {
            console.error('[IAP] purchase error:', error);
            settle('error');
          }
        });

        // requestPurchase is event-based — result arrives via listeners above.
        // The return value is not reliable; do not await its resolution for outcome.
        await requestPurchase({
          request: {
            apple: { sku: OPERATOR_LICENSE_PRODUCT_ID },
            google: { skus: [OPERATOR_LICENSE_PRODUCT_ID] },
          },
          type: 'in-app',
        });
      } catch (e) {
        console.error('[IAP] purchaseOperatorLicense error:', e);
        settle('error');
      }
    }

    run();
  });
}

/**
 * Restore a previously purchased Operator License. Resolves:
 *   'restored' — prior purchase found; caller must call setOperatorLicensed(true)
 *   'none'     — no prior purchase found (user never bought, or wrong account)
 *   'error'    — store query failed
 *
 * Apple requires a Restore Purchases affordance for non-consumable IAPs.
 * Manages connection lifecycle internally.
 */
export function restoreOperatorLicense(): Promise<'restored' | 'none' | 'error'> {
  return new Promise((resolve) => {
    async function run(): Promise<void> {
      try {
        await initConnection();
        // restorePurchases() triggers the native restore flow on iOS (required by
        // Apple for re-surfacing completed transactions after reinstall / device switch).
        // On Android, it performs a purchase query — same effect.
        await restorePurchases();
        const purchases = await getAvailablePurchases();
        await endConnection();
        const owned = purchases.some(
          (p) => p.productId === OPERATOR_LICENSE_PRODUCT_ID,
        );
        resolve(owned ? 'restored' : 'none');
      } catch (e) {
        console.error('[IAP] restoreOperatorLicense error:', e);
        endConnection().catch(() => {});
        resolve('error');
      }
    }
    run();
  });
}

// ─── Stubs — Phase 9+ ─────────────────────────────────────────────────────────
export const monetization = {
  showBanner: (): void => {
    // Phase 9: display AdMob banner at bottom of main menu
  },

  hideBanner: (): void => {
    // Phase 9: hide banner on screen transitions
  },
};
