import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme';

const COLORS = [
  Colors.primary, Colors.teal, Colors.purple, Colors.coral,
  Colors.warningDark, Colors.pink, Colors.green, Colors.successDark,
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
}

interface Props {
  name: string;
  size?: number;
  fontSize?: number;
  color?: string;
}

export const Avatar: React.FC<Props> = ({ name, size = 48, fontSize, color }) => (
  <View style={[
    styles.circle,
    { width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? getColor(name) },
  ]}>
    <Text style={[styles.text, { fontSize: fontSize ?? size * 0.38 }]}>{getInitials(name)}</Text>
  </View>
);

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});
