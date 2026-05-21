/**
 * ReviveModal — Phase 4b G3
 *
 * Replaces the old YOU DIED <View> overlay. Shown while isDead === true.
 * Three buttons (top to bottom):
 *   FREE REVIVE  — active if gear_backpack stacks > 0; consumes one stack on tap.
 *   WATCH AD     — active if adRevivesUsed === 0; Phase 9 stub (no-ops for now).
 *   REDEPLOY     — always active; resets to a fresh run.
 *
 * Greyed state: opacity 0.4 + disabled={true} (prevents onPress firing).
 * Follows LevelUpModal visual conventions: gold header, dim background,
 * rgba card buttons, kit color palette, default RN font.
 *
 * No kit panel/background images — inline UI consistency with LevelUpModal.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { PIXEL_FONT_FAMILY } from '../data/theme';

type Props = {
  visible: boolean;
  /** Current gear_backpack stack count (0 = no free revive available). */
  backpackStacks: number;
  /** Ad revives used this run (0 = ad revive available, 1 = used). */
  adRevivesUsed: number;
  onFreeRevive: () => void;
  onAdRevive: () => void;
  onRedeploy: () => void;
};

export default function ReviveModal({
  visible,
  backpackStacks,
  adRevivesUsed,
  onFreeRevive,
  onAdRevive,
  onRedeploy,
}: Props) {
  if (!visible) return null;

  const canFreeRevive = backpackStacks > 0;
  const canAdRevive = adRevivesUsed === 0;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dim layer — covers full screen, blocks touches to game below */}
      <View style={styles.dim} />

      <View style={styles.content}>
        <Text style={styles.header}>YOU DIED</Text>

        <TouchableOpacity
          style={[styles.button, !canFreeRevive && styles.buttonDisabled]}
          onPress={onFreeRevive}
          disabled={!canFreeRevive}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>FREE REVIVE</Text>
        </TouchableOpacity>

        {/* Phase 9 TODO: replace onPress body with rewarded ad flow.
            On ad completion: apply revive effects (full HP, invuln, center respawn)
            and increment adRevivesUsed. Currently stubs to adRevivesUsed = 1 on tap
            with no revive effect, so the button greys immediately. */}
        <TouchableOpacity
          style={[styles.button, !canAdRevive && styles.buttonDisabled]}
          onPress={onAdRevive}
          disabled={!canAdRevive}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>WATCH AD TO REVIVE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={onRedeploy}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>REDEPLOY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  header: {
    color: '#c9a356',
    fontSize: 42,
    lineHeight: 42,
    fontFamily: PIXEL_FONT_FAMILY,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 4,
    textShadowOffset: { width: 1, height: 2 },
    letterSpacing: 2,
    marginBottom: 8,
  },
  button: {
    width: 220,
    height: 52,
    backgroundColor: 'rgba(10, 13, 8, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 18,
    fontFamily: PIXEL_FONT_FAMILY,
    textShadowColor: '#000000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
    letterSpacing: 1,
  },
});
