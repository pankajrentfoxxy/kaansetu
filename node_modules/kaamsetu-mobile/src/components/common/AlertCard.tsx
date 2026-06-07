import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

type AlertType = 'danger' | 'warning' | 'success' | 'info';

const CONFIG: Record<AlertType, { bg: string; border: string; icon: string }> = {
  danger: { bg: Colors.dangerLight, border: Colors.danger, icon: '⚠️' },
  warning: { bg: Colors.warningLight, border: Colors.warning, icon: '⚡' },
  success: { bg: Colors.successLight, border: Colors.success, icon: '✅' },
  info: { bg: Colors.primaryLight, border: Colors.primary, icon: 'ℹ️' },
};

interface Props {
  type?: AlertType;
  title?: string;
  message: string;
}

export const AlertCard: React.FC<Props> = ({ type = 'info', title, message }) => {
  const cfg = CONFIG[type];
  return (
    <View style={[styles.container, { backgroundColor: cfg.bg, borderLeftColor: cfg.border }]}>
      <Text style={styles.icon}>{cfg.icon}</Text>
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
  },
  icon: { fontSize: 18, marginRight: Spacing.sm },
  content: { flex: 1 },
  title: { ...Typography.caption, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  message: { ...Typography.caption, color: Colors.textSecondary },
});
