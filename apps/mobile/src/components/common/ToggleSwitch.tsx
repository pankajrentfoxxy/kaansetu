import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme';

interface Props {
  value: boolean;
  onToggle: () => void;
  label?: string;
  onColor?: string;
}

export const ToggleSwitch: React.FC<Props> = ({ value, onToggle, label, onColor = Colors.success }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 25] });
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.borderStrong, onColor] });

  return (
    <View style={styles.row}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
        <Animated.View style={[styles.track, { backgroundColor: bg }]}>
          <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  track: { width: 52, height: 30, borderRadius: 15, justifyContent: 'center' },
  thumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
});
