import React from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

export type IconSet = 'mci' | 'ion';

interface Props {
  name: string;
  size?: number;
  color?: string;
  set?: IconSet;
  style?: any;
}

// Single icon wrapper used across the app. Defaults to Ionicons for UI chrome
// (clean, rounded). Use set="mci" for the richer MaterialCommunityIcons set
// (job types, tools, etc.).
export const Icon: React.FC<Props> = ({
  name,
  size = 22,
  color = Colors.textSecondary,
  set = 'ion',
  style,
}) => {
  if (set === 'mci') {
    return <MaterialCommunityIcons name={name as any} size={size} color={color} style={style} />;
  }
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
};
