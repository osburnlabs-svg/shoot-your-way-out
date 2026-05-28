import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, PIXEL_FONT_FAMILY } from '../data/theme';
import { persistence } from '../lib/persistence';
import { audioEngine } from '../lib/audioEngine';
import type { SettingsData } from '../lib/persistence';

type Props = {
  onBack: () => void;
};

const PIXABAY_ATTRIBUTION = [
  'MUSIC',
  '',
  'Provided by Pixabay',
  '  Emmraan',
  '  OpenMindAudio',
  '  Tunetank',
  '  Alex_Kizenkov',
  '  AlexGrohl',
  '',
  '',
  'SOUND EFFECTS',
  '',
  'Kronbits — kronbits.itch.io/freesfx',
].join('\n');

// ─── Volume slider ─────────────────────────────────────────────────────────────

type SliderProps = {
  label: string;
  value: number; // 0–100 integer
  onChange: (v: number) => void;
};

function VolumeSlider({ label, value, onChange }: SliderProps) {
  return (
    <View style={sliderStyles.row}>
      <Text style={sliderStyles.label}>{label}</Text>
      <Slider
        style={sliderStyles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={palette.accentGold}
        maximumTrackTintColor="#2a2d28"
        thumbTintColor={palette.accentGold}
      />
      <Text style={sliderStyles.valueText}>{value}</Text>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  label: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 20,
    color: palette.accentGold,
    width: 72,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  valueText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 20,
    color: '#888',
    width: 36,
    textAlign: 'right',
  },
});

// ─── Settings screen ───────────────────────────────────────────────────────────

export default function SettingsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [musicVol, setMusicVol] = useState(70);
  const [sfxVol, setSfxVol] = useState(100);

  // Full settings kept in a ref so slider writes don't clobber vibration/weather
  // fields that this screen doesn't expose yet.
  const settingsRef = useRef<SettingsData>({
    music_volume: 70,
    sfx_volume: 100,
    vibration: true,
    weather: true,
  });

  useEffect(() => {
    persistence.getSettings().then((s) => {
      settingsRef.current = s;
      setMusicVol(s.music_volume);
      setSfxVol(s.sfx_volume);
    });
  }, []);

  const handleMusicChange = useCallback((v: number) => {
    setMusicVol(v);
    audioEngine.setMusicVolume(v);
    settingsRef.current = { ...settingsRef.current, music_volume: v };
    persistence.setSettings(settingsRef.current);
  }, []);

  const handleSfxChange = useCallback((v: number) => {
    setSfxVol(v);
    audioEngine.setSFXVolume(v);
    settingsRef.current = { ...settingsRef.current, sfx_volume: v };
    persistence.setSettings(settingsRef.current);
  }, []);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>

        <Text style={styles.title}>SETTINGS</Text>

        <View style={styles.section}>
          <VolumeSlider label="MUSIC" value={musicVol} onChange={handleMusicChange} />
          <VolumeSlider label="SFX" value={sfxVol} onChange={handleSfxChange} />
        </View>

        <View style={styles.credits}>
          <Text style={styles.creditsTitle}>CREDITS</Text>
          <Text style={styles.creditsBody}>{PIXABAY_ATTRIBUTION}</Text>
        </View>

        {/* [P9-DIAG] Remove at Stage 4 closeout after IAP sandbox testing is done. grep: P9-DIAG */}
        <Pressable
          style={styles.diagBtn}
          onPress={async () => {
            await persistence.setOperatorLicensed(false);
            onBack();
          }}
        >
          <Text style={styles.diagText}>[DIAG] RESET OPERATOR LICENSE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.backgroundDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 16,
    marginBottom: 8,
  },
  backText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 22,
    color: palette.accentGold,
    letterSpacing: 1,
  },
  title: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 36,
    color: palette.accentGold,
    letterSpacing: 3,
    marginBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  credits: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#2a2d28',
    paddingTop: 20,
  },
  creditsTitle: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 18,
    color: '#555',
    letterSpacing: 2,
    marginBottom: 8,
  },
  creditsBody: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  // [P9-DIAG] Remove at Stage 4 closeout. grep: P9-DIAG
  diagBtn: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  diagText: {
    fontFamily: PIXEL_FONT_FAMILY,
    fontSize: 14,
    color: '#333',
  },
});
