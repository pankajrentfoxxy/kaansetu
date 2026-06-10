import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Icon, IconSet } from './Icon';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
  iconSet?: IconSet;
  hint?: string;
}

export const Input: React.FC<Props> = ({ label, error, icon, iconSet, hint, style, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}>
        {icon && <Icon name={icon} set={iconSet} size={20} color={Colors.textTertiary} style={styles.icon} />}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textTertiary}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  label: { ...Typography.captionStrong, color: Colors.textSecondary, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  fieldFocused: { borderColor: Colors.primary, backgroundColor: Colors.white },
  fieldError: { borderColor: Colors.danger },
  icon: { marginRight: Spacing.sm },
  input: { flex: 1, ...Typography.bodyLg, color: Colors.textPrimary, paddingVertical: 12 },
  error: { ...Typography.caption, color: Colors.dangerText, marginTop: 5 },
  hint: { ...Typography.caption, color: Colors.textTertiary, marginTop: 5 },
});
