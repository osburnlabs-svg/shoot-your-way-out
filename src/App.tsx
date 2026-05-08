import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Phase 1 — placeholder screen.
// This will become the screen state machine in Phase 7:
// [Loading] → [MainMenu] → [MapSelect] → [Game] ⇄ [Pause] → [GameOver]

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SHOOT YOUR WAY OUT</Text>
      <Text style={styles.subtitle}>Phase 1 Scaffold</Text>
      <Text style={styles.note}>If you can read this on your phone, the build works.</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d08',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#c9a356',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#a8501f',
    fontSize: 16,
    letterSpacing: 2,
    marginBottom: 32,
  },
  note: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
  },
});
