/**
 * GameScreen — active gameplay screen.
 *
 * Hosts GameCanvas and (from Phase 3+) the HUD overlay.
 * Passes canvas dimensions so GameCanvas can initialize game state
 * with the correct center position.
 *
 * Phase 3:  adds drag gesture handler, passes input state to GameCanvas
 * Phase 4a: adds LevelUpModal overlay
 * Phase 4b: adds CrateRevealOverlay
 * Phase 5:  passes active map config to GameCanvas
 * Phase 7:  adds HUD overlay, pause button
 */

import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import GameCanvas from '../components/GameCanvas';

type Props = {
  onReturnToMenu: () => void;
};

export default function GameScreen({ onReturnToMenu }: Props) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <GameCanvas width={width} height={height} onReturnToMenu={onReturnToMenu} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d08',
  },
});
