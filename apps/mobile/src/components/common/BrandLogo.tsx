import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Shadows } from '../../theme';

interface Props {
  size?: number;
  showWordmark?: boolean;
  light?: boolean; // for use on dark/blue backgrounds
}

// The Kaamdhaam mark: `कद` monogram on Trust Blue, with the amber "bridge"
// underline that connects worker to work.
export const BrandLogo: React.FC<Props> = ({ size = 64, showWordmark = true, light = false }) => {
  const radius = Math.round(size * 0.28);
  return (
    <View style={styles.wrap}>
      <View style={[styles.mark, { width: size, height: size, borderRadius: radius }, !light && Shadows.primary]}>
        <Text style={[styles.monogram, { fontSize: size * 0.4 }]}>कद</Text>
        <View style={[styles.bridge, { left: size * 0.18, right: size * 0.18, bottom: size * 0.16, height: Math.max(3, size * 0.06) }]} />
      </View>
      {showWordmark && (
        <>
          <Text style={[styles.wordmark, light && styles.wordmarkLight]}>Kaamdhaam</Text>
          <Text style={[styles.tagline, light && styles.taglineLight]}>काम मिले, भरोसे के साथ</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  mark: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  monogram: { color: '#fff', fontWeight: '700', letterSpacing: -1 },
  bridge: { position: 'absolute', backgroundColor: Colors.accent, borderRadius: 2 },
  wordmark: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginTop: 14, letterSpacing: -0.5 },
  wordmarkLight: { color: '#fff' },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  taglineLight: { color: 'rgba(255,255,255,0.85)' },
});
