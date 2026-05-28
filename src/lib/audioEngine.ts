// audioEngine.ts — Phase 8 audio system, migrated expo-av → expo-audio (Phase 9).
// playSFX carries 'worklet' directive; bridges to JS thread via runOnJS.
// playSFXJS is for JS-thread callers (GameCanvas) — no worklet overhead.

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { runOnJS } from 'react-native-reanimated';

// 0.0–1.0 normalized; Settings UI sends 0–100 integers via setMusicVolume/setSFXVolume.
let _musicVol = 0.7;
let _sfxVol = 1.0;
let _currentMusic: AudioPlayer | null = null;
let _currentMusicMode: 'menu' | 'combat' | null = null;
let _lastCombatIdx = -1;
// Tracks all in-flight SFX players so stopAllSFX() can cut them immediately.
const _activeSFX = new Set<AudioPlayer>();

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

// Fire-and-forget: new player per play, removed on finish. Unknown IDs are silent no-ops.
// Registers each player in _activeSFX so stopAllSFX() can cut them mid-play.
function _playSFXImpl(id: string): void {
  const src = SFX[id];
  if (src === undefined) return;
  try {
    const player = createAudioPlayer(src);
    player.volume = _sfxVol;
    _activeSFX.add(player);
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.didJustFinish) {
        sub.remove();
        _activeSFX.delete(player);
        player.remove();
      }
    });
    player.play();
  } catch {}
}

// Linear fade-out over 300ms (10 steps × 30ms), then remove.
function _fadeAndStop(player: AudioPlayer): void {
  const startVol = _musicVol;
  let step = 0;
  const id = setInterval(() => {
    step++;
    player.volume = Math.max(0, startVol * (1 - step / 10));
    if (step >= 10) {
      clearInterval(id);
      player.remove();
    }
  }, 30);
}

// Picks a combat track at random, excluding the previously played index.
function _playNextCombatTrack(): void {
  const total = 4;
  let idx: number;
  do {
    idx = Math.floor(Math.random() * total);
  } while (idx === _lastCombatIdx && total > 1);
  _lastCombatIdx = idx;

  const src = MUSIC[`combat_${idx}` as keyof typeof MUSIC];

  try {
    const player = createAudioPlayer(src);
    player.volume = _musicVol;

    // Guard: mode may have changed since this call was queued.
    if (_currentMusicMode !== 'combat') {
      player.remove();
      return;
    }

    _currentMusic = player;

    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.didJustFinish && _currentMusic === player) {
        sub.remove();
        _currentMusic = null;
        _playNextCombatTrack();
      }
    });

    player.play();
  } catch {}
}

export const audioEngine = {
  // Call once on app mount with persisted volumes (0–100 integers).
  init: async (musicVol = 70, sfxVol = 100): Promise<void> => {
    _musicVol = musicVol / 100;
    _sfxVol = sfxVol / 100;
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
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
        const player = createAudioPlayer(MUSIC.menu);
        player.volume = _musicVol;
        player.loop = true;
        if (_currentMusicMode !== 'menu') {
          player.remove();
          return;
        }
        _currentMusic = player;
        player.play();
      } catch {}
    } else {
      _playNextCombatTrack();
    }
  },

  stopMusic: (): void => {
    _currentMusicMode = null;
    const player = _currentMusic;
    _currentMusic = null;
    if (player) _fadeAndStop(player);
  },

  // Called by SettingsScreen sliders (0–100 integer input).
  setMusicVolume: (v: number): void => {
    _musicVol = v / 100;
    if (_currentMusic) _currentMusic.volume = _musicVol;
  },

  setSFXVolume: (v: number): void => {
    _sfxVol = v / 100;
  },

  // Cuts all in-flight SFX immediately — called on LevelUpModal / ReviveModal open.
  // Music is intentionally excluded (atmosphere preserved through modals).
  stopAllSFX: (): void => {
    _activeSFX.forEach((player) => player.remove());
    _activeSFX.clear();
  },

  // Hard stop with no fade — used when app goes to background.
  stopAll: (): void => {
    _currentMusicMode = null;
    const player = _currentMusic;
    _currentMusic = null;
    if (player) player.remove();
  },
};
