import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  jobType: string;
  companyName: string;
  salaryMin: number;
  salaryMax: number;
  city?: string;
  distanceKm?: number;
  isLiveIn?: boolean;
  onPress: () => void;
}

export const JobCard: React.FC<Props> = ({
  jobType, companyName, salaryMin, salaryMax, city, distanceKm, isLiveIn, onPress,
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title}>{jobType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</Text>
        <Text style={styles.company}>{companyName}</Text>
        {city && <Text style={styles.city}>📍 {city}</Text>}
      </View>
      <View style={styles.right}>
        <Text style={styles.salary}>₹{salaryMin.toLocaleString('en-IN')}–{salaryMax.toLocaleString('en-IN')}</Text>
        {distanceKm != null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{distanceKm < 1 ? '<1 km' : `${distanceKm} km`}</Text>
          </View>
        )}
        {isLiveIn && (
          <View style={[styles.badge, styles.liveInBadge]}>
            <Text style={[styles.badgeText, styles.liveInText]}>Live-in</Text>
          </View>
        )}
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
  left: { flex: 1, marginRight: Spacing.sm },
  right: { alignItems: 'flex-end' },
  title: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 2 },
  company: { ...Typography.body, color: Colors.textSecondary },
  city: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  salary: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
  badge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  badgeText: { ...Typography.tiny, color: Colors.primaryText },
  liveInBadge: { backgroundColor: '#F0EAF9' },
  liveInText: { color: '#6B3FA0' },
});
