import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  current: number;
  total: number;
  label?: string;
}

export const ProgressBar: React.FC<Props> = ({ current, total, label }) => {
  const pct = (current / total) * 100;
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.label}>{label ?? `${current}/${total}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  track: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  label: { ...Typography.tiny, color: Colors.textTertiary, marginTop: 4, textAlign: 'right' },
});
