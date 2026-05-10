// audioEngine.ts — Phase 1 stub. All methods are no-ops.
// Full implementation in Phase 6 using expo-av.
// Two channels: music (one track, looping, fades) and SFX (many concurrent, no loop).
//
// Call sites in Phases 2-5 will compile and run silently until Phase 6 wires this up.

export const audioEngine = {
  preloadSFX: async (): Promise<void> => {
    // Phase 6: load all ~25 SFX files into memory during loading screen
  },

  playSFX: (_id: string, _options?: { volume?: number; pitch?: number }): void => {
    'worklet';
    // Phase 6: play a sound effect by ID (e.g. 'shoot_pistol', 'pickup_pop')
  },

  playMusic: async (_id: string, _fadeMs?: number): Promise<void> => {
    // Phase 6: start a music track, optionally fading in
  },

  duckMusic: (_toVolume: number): void => {
    // Phase 6: lower music volume for boss spawn
  },

  unduckMusic: (): void => {
    // Phase 6: restore music volume after boss death
  },

  setMusicVolume: (_volume: number): void => {
    // Phase 6: set music channel volume (0–100), persisted to settings
  },

  setSFXVolume: (_volume: number): void => {
    // Phase 6: set SFX channel volume (0–100), persisted to settings
  },

  stopAll: (): void => {
    // Phase 6: silence all audio (used on app background / settings close)
  },
};
