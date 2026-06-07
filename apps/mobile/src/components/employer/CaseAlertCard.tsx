import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  caseType: string;
  district: string;
  workerName?: string;
  detectedAt: string;
  onPress: () => void;
}

export const CaseAlertCard: React.FC<Props> = ({ caseType, district, workerName, detectedAt, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.header}>
      <Text style={styles.icon}>⚠️</Text>
      <View style={styles.content}>
        <Text style={styles.title}>Security Alert</Text>
        {workerName && <Text style={styles.worker}>{workerName}</Text>}
        <Text style={styles.detail}>{caseType} · {district}</Text>
        <Text style={styles.date}>Detected: {new Date(detectedAt).toLocaleDateString('en-IN')}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  header: { flexDirection: 'row' },
  icon: { fontSize: 24, marginRight: Spacing.sm },
  content: { flex: 1 },
  title: { ...Typography.h3, color: Colors.danger, fontWeight: '700' },
  worker: { ...Typography.body, color: Colors.textPrimary, marginTop: 2 },
  detail: { ...Typography.caption, color: Colors.textSecondary },
  date: { ...Typography.tiny, color: Colors.textTertiary, marginTop: 2 },
});
