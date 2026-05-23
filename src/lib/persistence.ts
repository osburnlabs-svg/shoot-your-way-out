// persistence.ts — typed AsyncStorage wrapper.
// All keys use the syo_ namespace prefix.
// Implemented now (Phase 1) — AsyncStorage is a simple async key/value store,
// no native configuration needed beyond the package install.

import AsyncStorage from '@react-native-async-storage/async-storage';

// Full schema — all keys used across the app
export type SettingsData = {
  music_volume: number;
  sfx_volume: number;
  vibration: boolean;
  weather: boolean;
};

const KEYS = {
  highScore: 'syo_high_score',
  bestTime: 'syo_best_time',
  totalKills: 'syo_total_kills',
  totalRuns: 'syo_total_runs',
  settings: 'syo_settings',
  supportUnlocked: 'syo_support_unlocked',
  revivesRemainingSession: 'syo_revives_remaining_session',
  seenTutorial: 'syo_seen_tutorial',
  installDate: 'syo_install_date',
} as const;

async function get<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function set(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail — persistence loss is non-fatal
  }
}

export const persistence = {
  getHighScore: () => get<number>(KEYS.highScore, 0),
  setHighScore: (v: number) => set(KEYS.highScore, v),

  getBestTime: () => get<number>(KEYS.bestTime, 0),
  setBestTime: (v: number) => set(KEYS.bestTime, v),

  getTotalKills: () => get<number>(KEYS.totalKills, 0),
  setTotalKills: (v: number) => set(KEYS.totalKills, v),

  getTotalRuns: () => get<number>(KEYS.totalRuns, 0),
  setTotalRuns: (v: number) => set(KEYS.totalRuns, v),

  getSettings: () =>
    get<SettingsData>(KEYS.settings, {
      music_volume: 70,
      sfx_volume: 100,
      vibration: true,
      weather: true,
    }),
  setSettings: (v: SettingsData) => set(KEYS.settings, v),

  isSupportUnlocked: () => get<boolean>(KEYS.supportUnlocked, false),
  setSupportUnlocked: (v: boolean) => set(KEYS.supportUnlocked, v),

  getRevivesRemainingSession: () => get<number>(KEYS.revivesRemainingSession, 0),
  setRevivesRemainingSession: (v: number) => set(KEYS.revivesRemainingSession, v),

  hasSeenTutorial: () => get<boolean>(KEYS.seenTutorial, false),
  setSeenTutorial: (v: boolean) => set(KEYS.seenTutorial, v),

  getInstallDate: () => get<string | null>(KEYS.installDate, null),
  setInstallDate: (v: string) => set(KEYS.installDate, v),
};
