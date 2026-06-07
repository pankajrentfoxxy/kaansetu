import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme';

interface Props {
  score: number;
  size?: number;
}

export const ProfileScoreRing: React.FC<Props> = ({ score, size = 80 }) => {
  const color = score >= 80 ? Colors.success : score >= 50 ? Colors.warning : Colors.danger;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.score, { color }]}>{score}</Text>
      <Text style={styles.label}>/ 100</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  score: { fontSize: 22, fontWeight: '700' },
  label: { ...Typography.tiny, color: Colors.textTertiary },
});
