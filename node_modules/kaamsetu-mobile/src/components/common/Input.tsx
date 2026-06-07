import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<Props> = ({ label, error, style, ...props }) => (
  <View style={styles.container}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      style={[styles.input, error ? styles.inputError : null, style]}
      placeholderTextColor={Colors.textTertiary}
      {...props}
    />
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 44,
  },
  inputError: { borderColor: Colors.danger },
  error: { ...Typography.caption, color: Colors.danger, marginTop: 2 },
});
