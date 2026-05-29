// audioEngine.ts — Phase 8 audio system via expo-av.
// playSFX carries 'worklet' directive; bridges to JS thread via runOnJS.
// playSFXJS is for JS-thread callers (GameCanvas) — no worklet overhead.

import { Audio } from 'expo-av';
import { runOnJS } from 'react-native-reanimated';

// 0.0–1.0 normalized; Settings UI sends 0–100 integers via setMusicVolume/setSFXVolume.
let _musicVol = 0.7;
let _sfxVol = 1.0;
let _currentMusic: Audio.Sound | null = null;
let _currentMusicMode: 'menu' | 'combat' | null = null;
let _lastCombatIdx = -1;
// Tracks all in-flight SFX sounds so stopAllSFX() can cut them immediately.
const _activeSFX = new Set<Audio.Sound>();

const MUSIC = {
  menu: require('../../assets/audio/music/menu_loop.mp3') as number,
  combat_0: require('../../assets/audio/music/combat_1.mp3') as number,
  combat_1: require('../../assets/audio/music/combat_2.mp3') as number,
  combat_2: require('../../assets/audio/music/combat_3.mp3') as number,
  combat_3: require('../../assets/audio/music/combat_4.mp3') as number,
} as const;

const SFX: Record<string, number> = {
  shoot: require('../../assets/audio/sfx/shoot.mp3') as number,
  shoot_flamethrower: require('../../assets/audio/sfx/shoot_flamethrower.mp3') as number,
  explosion: require('../../assets/audio/sfx/explosion.mp3') as number,
  footstep: require('../../assets/audio/sfx/footstep.mp3') as number,
  hit_grunt: require('../../assets/audio/sfx/hit_grunt.mp3') as number,
  heli_ambient: require('../../assets/audio/sfx/heli_ambient.mp3') as number,
};

// Fire-and-forget: new Sound per play, self-unloads on finish. Unknown IDs are silent no-ops.
// Registers each sound in _activeSFX so stopAllSFX() can cut them mid-play.
function _playSFXImpl(id: string): void {
  const src = SFX[id];
  if (src === undefined) return;
  Audio.Sound.createAsync(src, { volume: _sfxVol })
    .then(({ sound }) => {
      _activeSFX.add(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          _activeSFX.delete(sound);
          sound.unloadAsync().catch(() => {});
        }
      });
      sound.playAsync().catch(() => {});
    })
    .catch(() => {});
}

// Linear fade-out over 300ms (10 steps × 30ms), then stop + unload.
function _fadeAndStop(sound: Audio.Sound): void {
  const startVol = _musicVol;
  let step = 0;
  const id = setInterval(() => {
    step++;
    sound.setVolumeAsync(Math.max(0, startVol * (1 - step / 10))).catch(() => {});
    if (step >= 10) {
      clearInterval(id);
      sound.stopAsync().then(() => sound.unloadAsync()).catch(() => {});
    }
  }, 30);
}

// Picks a combat track at random, excluding the previously played index.
async function _playNextCombatTrack(): Promise<void> {
  const total = 4;
  let idx: number;
  do {
    idx = Math.floor(Math.random() * total);
  } while (idx === _lastCombatIdx && total > 1);
  _lastCombatIdx = idx;

  const src = MUSIC[`combat_${idx}` as keyof typeof MUSIC];

  try {
    const { sound } = await Audio.Sound.createAsync(src, { volume: _musicVol, isLooping: false });

    // Guard: mode may have changed while the async load was in flight.
    if (_currentMusicMode !== 'combat') {
      await sound.unloadAsync();
      return;
    }

    _currentMusic = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish && _currentMusic === sound) {
        _currentMusic = null;
        _playNextCombatTrack();
      }
    });

    await sound.playAsync();
  } catch {}
}

export const audioEngine = {
  // Call once on app mount with persisted volumes (0–100 integers).
  init: async (musicVol = 70, sfxVol = 100): Promise<void> => {
    _musicVol = musicVol / 100;
    _sfxVol = sfxVol / 100;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    } catch {}
  },

  // Worklet-safe: bridges id to JS thread via runOnJS. Call from combatEngine, throwableEngine, etc.
  playSFX: (id: string): void => {
    'worklet';
    runOnJS(_playSFXImpl)(id);
  },

  // JS-thread SFX caller (GameCanvas footsteps, helicopter). No worklet overhead.
  playSFXJS: (id: string): void => {
    _playSFXImpl(id);
  },

  // 'menu' plays menu_loop looping. 'combat' rotates through 4 tracks with last-played exclusion.
  // No-ops if already in the requested mode with an active sound.
  playMusic: async (mode: 'menu' | 'combat'): Promise<void> => {
    if (_currentMusicMode === mode && _currentMusic) return;

    const old = _currentMusic;
    _currentMusic = null;
    _currentMusicMode = mode;
    if (old) _fadeAndStop(old);

    if (mode === 'menu') {
      try {
        const { sound } = await Audio.Sound.createAsync(MUSIC.menu, {
          volume: _musicVol,
          isLooping: true,
        });
        if (_currentMusicMode !== 'menu') {
          await sound.unloadAsync();
          return;
        }
        _currentMusic = sound;
        await sound.playAsync();
      } catch {}
    } else {
      await _playNextCombatTrack();
    }
  },

  stopMusic: (): void => {
    _currentMusicMode = null;
    const sound = _currentMusic;
    _currentMusic = null;
    if (sound) _fadeAndStop(sound);
  },

  // Called by SettingsScreen sliders (0–100 integer input).
  setMusicVolume: (v: number): void => {
    _musicVol = v / 100;
    _currentMusic?.setVolumeAsync(_musicVol).catch(() => {});
  },

  setSFXVolume: (v: number): void => {
    _sfxVol = v / 100;
  },

  // Cuts all in-flight SFX immediately — called on LevelUpModal / ReviveModal open.
  // Music is intentionally excluded (atmosphere preserved through modals).
  stopAllSFX: (): void => {
    _activeSFX.forEach((sound) => {
      sound.stopAsync().then(() => sound.unloadAsync()).catch(() => {});
    });
    _activeSFX.clear();
  },

  // Hard stop with no fade — used when app goes to background.
  stopAll: (): void => {
    _currentMusicMode = null;
    const sound = _currentMusic;
    _currentMusic = null;
    if (sound) {
      sound.stopAsync().then(() => sound.unloadAsync()).catch(() => {});
    }
  },
};
