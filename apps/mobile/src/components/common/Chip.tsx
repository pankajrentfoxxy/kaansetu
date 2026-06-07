import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  icon?: string;
}

export const Chip: React.FC<Props> = ({ label, selected, onPress, style, icon }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.selected, style]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.text, selected && styles.selectedText]}>
      {icon ? `${icon} ${label}` : label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    margin: Spacing.xs,
  },
  selected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  text: { ...Typography.caption, color: Colors.textSecondary },
  selectedText: { color: Colors.primaryText, fontWeight: '600' },
});
