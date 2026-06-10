import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Icon } from './Icon';
import { Button } from './Button';

interface Props {
  icon?: string; // Ionicons name
  message: string;
  subMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({ icon = 'file-tray-outline', message, subMessage, actionLabel, onAction }) => (
  <View style={styles.container}>
    <View style={styles.iconWrap}>
      <Icon name={icon} size={36} color={Colors.textTertiary} />
    </View>
    <Text style={styles.message}>{message}</Text>
    {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
    {actionLabel && onAction && (
      <Button title={actionLabel} onPress={onAction} variant="primary" size="md" style={styles.action} />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: Spacing.huge, paddingHorizontal: Spacing.xl },
  iconWrap: {
    width: 76, height: 76, borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  message: { ...Typography.h3, color: Colors.textPrimary, textAlign: 'center' },
  subMessage: { ...Typography.body, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.sm },
  action: { marginTop: Spacing.xl, alignSelf: 'stretch' },
});
