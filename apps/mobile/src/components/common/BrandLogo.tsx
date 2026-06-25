import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme';

interface Props {
  size?: number;
  showWordmark?: boolean;
  light?: boolean; // for use on dark/blue backgrounds
}

// KaamDhaam mark: a Trust-Blue rounded badge with a white briefcase and the
// amber "bridge" accent (work connecting people). No Devanagari monogram.
export const BrandLogo: React.FC<Props> = ({ size = 64, showWordmark = true, light = false }) => {
  const radius = Math.round(size * 0.28);
  return (
    <View style={styles.wrap}>
      <View style={[
        styles.mark,
        { width: size, height: size, borderRadius: radius, backgroundColor: light ? 'rgba(255,255,255,0.16)' : Colors.primary },
        !light && Shadows.primary,
      ]}>
        <Ionicons name="briefcase" size={size * 0.46} color="#fff" />
        <View style={[styles.bridge, { left: size * 0.22, right: size * 0.22, bottom: size * 0.14, height: Math.max(3, size * 0.055) }]} />
      </View>
      {showWordmark && (
        <>
          <Text style={[styles.wordmark, light && styles.wordmarkLight]}>
            Kaam<Text style={styles.wordmarkAccent}>Dhaam</Text>
          </Text>
          <Text style={[styles.tagline, light && styles.taglineLight]}>Verified work, real trust</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  mark: { alignItems: 'center', justifyContent: 'center' },
  bridge: { position: 'absolute', backgroundColor: Colors.accent, borderRadius: 2 },
  wordmark: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginTop: 14, letterSpacing: -0.5 },
  wordmarkAccent: { color: Colors.accent },
  wordmarkLight: { color: '#fff' },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  taglineLight: { color: 'rgba(255,255,255,0.85)' },
});
