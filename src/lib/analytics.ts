// analytics.ts — Phase 1 stub. All methods are no-ops.
// Full implementation in Phase 7 using posthog-react-native (free tier, 1M events/month).
//
// Call sites added in Phases 2-6 will compile and run silently until Phase 7 wires this up.

// Events tracked (from v3 context doc):
// app_opened, run_started, run_ended, level_up, crate_opened,
// boss_spawned, boss_defeated, boss_killed_player, iap_purchased,
// rewarded_ad_shown, rewarded_ad_completed

export const analytics = {
  track: (_event: string, _properties?: Record<string, unknown>): void => {
    // Phase 7: send event to PostHog
  },
};
