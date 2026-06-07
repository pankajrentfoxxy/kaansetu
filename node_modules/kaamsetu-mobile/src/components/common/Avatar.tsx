import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme';

const COLORS = [
  '#1A56A0', '#2E7D32', '#C62828', '#6A1B9A',
  '#F57F17', '#00695C', '#283593', '#4E342E',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

interface Props {
  name: string;
  size?: number;
  fontSize?: number;
}

export const Avatar: React.FC<Props> = ({ name, size = 48, fontSize = 18 }) => (
  <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: getColor(name) }]}>
    <Text style={[styles.text, { fontSize }]}>{getInitials(name)}</Text>
  </View>
);

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});
