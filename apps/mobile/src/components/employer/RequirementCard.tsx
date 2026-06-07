import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  jobType: string;
  city?: string;
  salaryMin: number;
  salaryMax: number;
  matchCount: number;
  status: string;
  onPress: () => void;
}

export const RequirementCard: React.FC<Props> = ({
  jobType, city, salaryMin, salaryMax, matchCount, status, onPress,
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.jobType}>{jobType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</Text>
        {city && <Text style={styles.city}>📍 {city}</Text>}
        <Text style={styles.salary}>₹{salaryMin.toLocaleString('en-IN')}–{salaryMax.toLocaleString('en-IN')}/mo</Text>
      </View>
      <View style={styles.right}>
        <View style={styles.matchBadge}>
          <Text style={styles.matchNum}>{matchCount}</Text>
          <Text style={styles.matchLabel}>matches</Text>
        </View>
        <Text style={[styles.status, status === 'ACTIVE' ? styles.active : styles.inactive]}>{status}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  left: { flex: 1 },
  right: { alignItems: 'flex-end' },
  jobType: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 2 },
  city: { ...Typography.caption, color: Colors.textTertiary },
  salary: { ...Typography.caption, color: Colors.success, fontWeight: '600', marginTop: 2 },
  matchBadge: { alignItems: 'center', backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  matchNum: { ...Typography.h2, color: Colors.primary, fontWeight: '700' },
  matchLabel: { ...Typography.tiny, color: Colors.primaryText },
  status: { ...Typography.tiny, marginTop: 4, fontWeight: '600' },
  active: { color: Colors.success },
  inactive: { color: Colors.textTertiary },
});
