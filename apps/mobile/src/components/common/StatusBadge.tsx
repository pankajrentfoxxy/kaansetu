import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

type Status = 'verified' | 'pending' | 'blocked' | 'flagged' | 'in_progress';

const CONFIG: Record<Status, { bg: string; text: string; label: string }> = {
  verified: { bg: Colors.successLight, text: Colors.success, label: 'Verified ✓' },
  pending: { bg: Colors.warningLight, text: Colors.warning, label: 'Pending' },
  blocked: { bg: Colors.dangerLight, text: Colors.danger, label: 'Blocked' },
  flagged: { bg: Colors.dangerLight, text: Colors.danger, label: 'Flagged !' },
  in_progress: { bg: Colors.primaryLight, text: Colors.primary, label: 'In Progress' },
};

interface Props {
  status: Status;
  customLabel?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, customLabel }) => {
  const cfg = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{customLabel ?? cfg.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  text: { ...Typography.tiny, fontWeight: '600' },
});
