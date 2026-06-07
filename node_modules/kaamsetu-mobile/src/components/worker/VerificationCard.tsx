import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  title: string;
  icon: string;
  status: 'verified' | 'pending' | 'in_progress' | 'blocked';
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

export const VerificationCard: React.FC<Props> = ({
  title, icon, status, description, actionLabel, onAction, loading,
}) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.desc}>{description}</Text>}
      </View>
      <StatusBadge status={status} />
    </View>
    {status === 'pending' && actionLabel && onAction && (
      <Button title={actionLabel} onPress={onAction} loading={loading} style={styles.btn} />
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { fontSize: 24, marginRight: Spacing.sm },
  info: { flex: 1 },
  title: { ...Typography.h3, color: Colors.textPrimary },
  desc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  btn: { marginTop: Spacing.md },
});
