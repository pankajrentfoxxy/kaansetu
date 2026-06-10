import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Icon, IconSet } from './Icon';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  icon?: string;
  iconSet?: IconSet;
}

// Selectable pill. Big touch target, clear selected state.
export const Chip: React.FC<Props> = ({ label, selected, onPress, style, icon, iconSet }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.selected, style]}
    onPress={onPress}
    activeOpacity={0.8}
    disabled={!onPress}
  >
    <View style={styles.row}>
      {icon && (
        <Icon
          name={icon}
          set={iconSet}
          size={16}
          color={selected ? Colors.primary : Colors.textSecondary}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    margin: Spacing.xs,
  },
  selected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 6 },
  text: { ...Typography.captionStrong, color: Colors.textSecondary },
  selectedText: { color: Colors.primaryText },
});
