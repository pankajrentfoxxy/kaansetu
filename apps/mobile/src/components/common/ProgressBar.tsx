import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';

interface Props {
  current: number;
  total: number;
  label?: string;
  color?: string;
  trackColor?: string;
  height?: number;
}

export const ProgressBar: React.FC<Props> = ({
  current, total, label, color = Colors.accent, trackColor = Colors.border, height = 8,
}) => {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <View style={styles.container}>
      <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color, borderRadius: height / 2 }]} />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.sm },
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
  label: { ...Typography.tiny, color: Colors.textTertiary, marginTop: 4, textAlign: 'right' },
});
