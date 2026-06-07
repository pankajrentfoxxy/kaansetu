import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/StatusBadge';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  name: string;
  skillType: string;
  experience: number;
  city?: string;
  distanceKm?: number;
  isLiveInOk: boolean;
  isVerified: boolean;
  onPress: () => void;
}

export const WorkerCard: React.FC<Props> = ({
  name, skillType, experience, city, distanceKm, isLiveInOk, isVerified, onPress,
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.row}>
      <Avatar name={name} size={48} />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.skill}>{skillType} · {experience} yr{experience !== 1 ? 's' : ''}</Text>
        {city && <Text style={styles.city}>📍 {city}</Text>}
      </View>
      <View style={styles.badges}>
        {isVerified && <StatusBadge status="verified" customLabel="Verified ✓" />}
        {distanceKm != null && (
          <View style={styles.distBadge}>
            <Text style={styles.distText}>{distanceKm < 1 ? '<1 km' : `${distanceKm} km`}</Text>
          </View>
        )}
        {isLiveInOk && (
          <View style={[styles.distBadge, styles.liveIn]}>
            <Text style={[styles.distText, { color: '#6B3FA0' }]}>Live-in</Text>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginHorizontal: Spacing.md },
  name: { ...Typography.h3, color: Colors.textPrimary },
  skill: { ...Typography.body, color: Colors.textSecondary },
  city: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  badges: { alignItems: 'flex-end', gap: 4 },
  distBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  distText: { ...Typography.tiny, color: Colors.primaryText },
  liveIn: { backgroundColor: '#F0EAF9' },
});
