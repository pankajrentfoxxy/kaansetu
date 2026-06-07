import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useGetRequirementMatchesQuery } from '../../store/api/employerApi';
import { WorkerCard } from '../../components/employer/WorkerCard';
import { ChipGroup } from '../../components/common/ChipGroup';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Spacing, Typography } from '../../theme';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'pan_india', label: 'Pan India' },
  { value: 'live_in', label: 'Live-in ok' },
];

export function MatchedProfilesScreen({ navigation, route }: any) {
  const { requirementId } = route.params ?? {};
  const { data: matches = [], isLoading } = useGetRequirementMatchesQuery(requirementId);
  const [filter, setFilter] = useState<string[]>(['all']);

  const filtered = matches.filter((m: any) => {
    if (filter[0] === 'nearby') return m.distance_km != null && Number(m.distance_km) <= 20;
    if (filter[0] === 'pan_india') return m.worker?.is_pan_india;
    if (filter[0] === 'live_in') return m.worker?.is_live_in_ok;
    return true;
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matched Profiles</Text>
        <Text style={styles.count}>{matches.length} profiles found</Text>
      </View>
      <ChipGroup options={FILTER_OPTIONS} selected={filter} onToggle={(v) => setFilter([v])} multiSelect={false} />
      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="👥" message="No profiles match this filter" />}
        renderItem={({ item }: any) => (
          <WorkerCard
            name={item.worker?.full_name ?? 'Worker'}
            skillType={item.worker?.skills?.[0]?.skill_type ?? ''}
            experience={item.worker?.skills?.[0]?.experience_years ?? 0}
            city={item.worker?.location?.city}
            distanceKm={item.distance_km ? Number(item.distance_km) : undefined}
            isLiveInOk={item.worker?.is_live_in_ok ?? false}
            isVerified={item.worker?.kyc_status === 'FULLY_VERIFIED'}
            onPress={() => navigation.navigate('WorkerDetail', { workerId: item.worker?.id, requirementId })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, paddingBottom: 0 },
  title: { ...Typography.h2, color: Colors.textPrimary },
  count: { ...Typography.caption, color: Colors.textSecondary },
  list: { padding: Spacing.lg },
});
