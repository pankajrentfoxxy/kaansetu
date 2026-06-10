import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  label?: string;
  inline?: boolean;
}

export const LoadingSpinner: React.FC<Props> = ({ label, inline }) => (
  <View style={[styles.base, inline ? styles.inline : styles.full]}>
    <ActivityIndicator size="large" color={Colors.primary} />
    {label && <Text style={styles.label}>{label}</Text>}
  </View>
);

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  full: { flex: 1, backgroundColor: Colors.background, paddingVertical: Spacing.huge },
  inline: { paddingVertical: Spacing.xxxl },
  label: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
});
