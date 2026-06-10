import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getJobMeta, Radius } from '../../theme';

interface Props {
  jobType?: string | null;
  size?: number; // tile size
  style?: ViewStyle;
}

// Rounded colored tile + consistent vector icon for a job type.
// The visual workers learn to recognise instead of reading words.
export const JobIcon: React.FC<Props> = ({ jobType, size = 50, style }) => {
  const meta = getJobMeta(jobType);
  const iconSize = Math.round(size * 0.52);
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: Math.round(size * 0.28), backgroundColor: meta.bg },
        style,
      ]}
    >
      <MaterialCommunityIcons name={meta.icon as any} size={iconSize} color={meta.color} />
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
});
