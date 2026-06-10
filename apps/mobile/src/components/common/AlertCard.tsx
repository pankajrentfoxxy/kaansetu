import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Icon } from './Icon';

type AlertType = 'danger' | 'warning' | 'success' | 'info';

const CONFIG: Record<AlertType, { bg: string; border: string; tint: string; icon: string }> = {
  danger: { bg: Colors.dangerLight, border: Colors.danger, tint: Colors.dangerText, icon: 'alert-circle' },
  warning: { bg: Colors.warningLight, border: Colors.warning, tint: Colors.warningText, icon: 'warning' },
  success: { bg: Colors.successLight, border: Colors.success, tint: Colors.successText, icon: 'checkmark-circle' },
  info: { bg: Colors.primaryLight, border: Colors.primary, tint: Colors.primaryText, icon: 'information-circle' },
};

interface Props {
  type?: AlertType;
  title?: string;
  message: string;
  onPress?: () => void;
}

export const AlertCard: React.FC<Props> = ({ type = 'info', title, message, onPress }) => {
  const cfg = CONFIG[type];
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.container, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Icon name={cfg.icon} size={22} color={cfg.tint} style={styles.icon} />
      <View style={styles.content}>
        {title && <Text style={[styles.title, { color: cfg.tint }]}>{title}</Text>}
        <Text style={[styles.message, { color: cfg.tint }]}>{message}</Text>
      </View>
      {onPress && <Icon name="chevron-forward" size={20} color={cfg.tint} />}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  icon: { marginRight: Spacing.md },
  content: { flex: 1 },
  title: { ...Typography.captionStrong, marginBottom: 2 },
  message: { ...Typography.caption, opacity: 0.9 },
});
