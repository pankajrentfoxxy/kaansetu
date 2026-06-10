import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type Status = 'verified' | 'pending' | 'blocked' | 'flagged' | 'in_progress' | 'active' | 'rejected';

const CONFIG: Record<Status, { bg: string; text: string; dot: string; label: string }> = {
  verified: { bg: Colors.successLight, text: Colors.successText, dot: Colors.success, label: 'Verified' },
  active: { bg: Colors.successLight, text: Colors.successText, dot: Colors.success, label: 'Active' },
  pending: { bg: Colors.warningLight, text: Colors.warningText, dot: Colors.warning, label: 'Pending' },
  in_progress: { bg: Colors.primaryLight, text: Colors.primaryText, dot: Colors.primary, label: 'In Progress' },
  blocked: { bg: Colors.dangerLight, text: Colors.dangerText, dot: Colors.danger, label: 'Blocked' },
  flagged: { bg: Colors.dangerLight, text: Colors.dangerText, dot: Colors.danger, label: 'Flagged' },
  rejected: { bg: Colors.dangerLight, text: Colors.dangerText, dot: Colors.danger, label: 'Rejected' },
};

interface Props {
  status: Status;
  customLabel?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, customLabel }) => {
  const cfg = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.text, { color: cfg.text }]}>{customLabel ?? cfg.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  text: { ...Typography.tiny, fontWeight: '700' },
});
