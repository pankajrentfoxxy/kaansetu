import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetRequirementMatchesQuery } from '../../store/api/employerApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { Avatar } from '../../components/common/Avatar';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Shadows, Spacing, Typography, jobLabel } from '../../theme';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'verified', label: 'Verified' },
  { value: 'live_in', label: 'Live-in OK' },
];

export function MatchedProfilesScreen({ navigation, route }: any) {
  const { requirementId } = route.params ?? {};
  const { data: matches = [], isLoading } = useGetRequirementMatchesQuery(requirementId);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = matches.filter((m: any) => {
    if (filter === 'nearby' && !(m.distance_km != null && Number(m.distance_km) <= 20)) return false;
    if (filter === 'verified' && m.worker?.kyc_status !== 'FULLY_VERIFIED') return false;
    if (filter === 'live_in' && !m.worker?.is_live_in_ok) return false;
    if (q) {
      const w = m.worker ?? {};
      const hay = `${w.full_name ?? ''} ${w.skills?.map((s: any) => s.skill_type).join(' ') ?? ''} ${w.location?.city ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Matched Workers" subtitle={`${filtered.length} of ${matches.length} profiles`} onBack={() => navigation.goBack()} />

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, skill or city" />
      </View>

      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((f) => {
          const active = filter === f.value;
          return (
            <TouchableOpacity key={f.value} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setFilter(f.value)} activeOpacity={0.85}>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="people-outline" message="No profiles match" subMessage="Try a different filter" />}
        renderItem={({ item }: any) => {
          const w = item.worker ?? {};
          const skill = w.skills?.[0];
          const isVerified = w.kyc_status === 'FULLY_VERIFIED';
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WorkerDetail', { worker: w, requirementId })} activeOpacity={0.85}>
              <Avatar name={w.full_name ?? 'W'} size={52} />
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.workerName} numberOfLines={1}>{w.full_name ?? 'Worker'}</Text>
                  {isVerified && (
                    <View style={styles.verifiedTag}>
                      <Icon name="checkmark-circle" size={12} color={Colors.successText} />
                      <Text style={styles.verifiedTagText}>Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.workerSkill}>
                  {jobLabel(skill?.skill_type, 'en')} · {skill?.experience_years ?? 0} yrs
                </Text>
                <View style={styles.tagRow}>
                  {w.location?.city && (
                    <View style={styles.tag}>
                      <Icon name="location-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.tagText}>{w.location.city}</Text>
                    </View>
                  )}
                  {item.distance_km != null && (
                    <View style={styles.tag}>
                      <Icon name="walk-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.tagText}>{Number(item.distance_km).toFixed(1)} km</Text>
                    </View>
                  )}
                  {w.is_live_in_ok && (
                    <View style={styles.tagAccent}>
                      <Text style={styles.tagAccentText}>Live-in OK</Text>
                    </View>
                  )}
                </View>
              </View>
              <Icon name="chevron-forward" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  filterChip: { borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { ...Typography.captionStrong, color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  list: { padding: Spacing.lg, paddingTop: 0 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardInfo: { flex: 1, marginLeft: Spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  workerName: { ...Typography.bodyStrong, color: Colors.textPrimary, flexShrink: 1 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.successLight, borderRadius: Radius.sm, paddingHorizontal: 7, paddingVertical: 2 },
  verifiedTagText: { ...Typography.tiny, fontWeight: '700', color: Colors.successText },
  workerSkill: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 6, textTransform: 'capitalize' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { ...Typography.tiny, color: Colors.textSecondary, fontWeight: '600' },
  tagAccent: { backgroundColor: Colors.purpleLight, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  tagAccentText: { ...Typography.tiny, color: Colors.purple, fontWeight: '700' },
});
