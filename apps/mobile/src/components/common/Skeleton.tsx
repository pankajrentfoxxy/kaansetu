import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme';

// ponytail: opacity pulse instead of a gradient-shimmer lib — no dep, reads as "loading" fine.
// Upgrade to a moving gradient (expo-linear-gradient) only if the pulse looks cheap in review.
export function Skeleton({
  width = '100%',
  height = 14,
  radius = Radius.sm,
  style,
}: {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  radius?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: Colors.borderStrong, opacity }, style]}
    />
  );
}

function JobCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={52} height={52} radius={Radius.md} />
        <View style={styles.lines}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
        <View style={styles.salary}>
          <Skeleton width={60} height={16} />
          <Skeleton width={36} height={10} />
        </View>
      </View>
      <View style={styles.tags}>
        <Skeleton width={80} height={26} />
        <Skeleton width={64} height={26} />
      </View>
    </View>
  );
}

export function JobFeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  lines: { flex: 1, marginLeft: Spacing.md, gap: 8 },
  salary: { alignItems: 'flex-end', gap: 8 },
  tags: { flexDirection: 'row', gap: 8 },
});
