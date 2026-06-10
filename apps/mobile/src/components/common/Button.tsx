import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';
import { Colors, Radius, Shadows, Typography } from '../../theme';
import { Icon, IconSet } from './Icon';

type Variant = 'accent' | 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type Size = 'lg' | 'md' | 'sm';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconSet?: IconSet;
  style?: ViewStyle;
}

// `accent` (amber) = the ONE primary action on a screen.
// `primary` (blue) = brand actions / secondary CTAs.
export const Button: React.FC<Props> = ({
  title, onPress, variant = 'accent', size = 'lg', loading, disabled, icon, iconSet, style,
}) => {
  const isDisabled = disabled || loading;
  const solid = variant === 'accent' || variant === 'primary' || variant === 'success';
  const fg = solid ? Colors.white
    : variant === 'danger' ? Colors.dangerText
    : Colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[variant],
        variant === 'accent' && !isDisabled && Shadows.accent,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Icon name={icon} set={iconSet} size={size === 'sm' ? 18 : 20} color={fg} style={styles.icon} />}
          <Text style={[styles.text, size === 'sm' && styles.textSm, { color: fg }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: { borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: 8 },
  size_lg: { minHeight: 54, paddingVertical: 15, paddingHorizontal: 24 },
  size_md: { minHeight: 46, paddingVertical: 11, paddingHorizontal: 20 },
  size_sm: { minHeight: 38, paddingVertical: 8, paddingHorizontal: 16 },
  accent: { backgroundColor: Colors.accent },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.primaryLight, borderWidth: 1.5, borderColor: Colors.primary },
  success: { backgroundColor: Colors.success },
  danger: { backgroundColor: Colors.dangerLight, borderWidth: 1.5, borderColor: Colors.danger },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  text: { ...Typography.button },
  textSm: { fontSize: 14 },
});
