import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  icon?: string;
  message: string;
  subMessage?: string;
}

export const EmptyState: React.FC<Props> = ({ icon = '📭', message, subMessage }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.message}>{message}</Text>
    {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: Spacing.xxxl },
  icon: { fontSize: 48, marginBottom: Spacing.md },
  message: { ...Typography.h3, color: Colors.textSecondary, textAlign: 'center' },
  subMessage: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.sm },
});
