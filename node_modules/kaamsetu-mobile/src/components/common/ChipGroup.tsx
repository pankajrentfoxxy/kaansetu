import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from './Chip';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface Props {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  multiSelect?: boolean;
}

export const ChipGroup: React.FC<Props> = ({ options, selected, onToggle, multiSelect = true }) => (
  <View style={styles.container}>
    {options.map((opt) => (
      <Chip
        key={opt.value}
        label={opt.label}
        icon={opt.icon}
        selected={selected.includes(opt.value)}
        onPress={() => {
          if (!multiSelect && !selected.includes(opt.value)) {
            // Single select: clear others
            onToggle(opt.value);
          } else {
            onToggle(opt.value);
          }
        }}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap' },
});
