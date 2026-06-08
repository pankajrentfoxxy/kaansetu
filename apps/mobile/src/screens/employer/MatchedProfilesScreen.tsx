import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
} from 'react-native';
import { useGetRequirementMatchesQuery } from '../../store/api/employerApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors } from '../../theme';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'verified', label: 'Verified' },
  { value: 'live_in', label: 'Live-in OK' },
];

const JOB_ICONS: Record<string, string> = {
  driver: '🚗', security_guard: '🛡️', cook: '🍳', housekeeper: '🏠',
  delivery: '📦', electrician: '🔧', plumber: '🔩', peon: '📋', sweeper: '🧹', helper: '👤',
};

function getInitials(name: string) {
  return (name || 'W').split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
}

export function MatchedProfilesScreen({ navigation, route }: any) {
  const { requirementId } = route.params ?? {};
  const { data: matches = [], isLoading } = useGetRequirementMatchesQuery(requirementId);
  const [filter, setFilter] = useState('all');

  const filtered = matches.filter((m: any) => {
    if (filter === 'nearby') return m.distance_km != null && Number(m.distance_km) <= 20;
    if (filter === 'verified') return m.worker?.kyc_status === 'FULLY_VERIFIED';
    if (filter === 'live_in') return m.worker?.is_live_in_ok;
    return true;
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Text style={st.backText}>←</Text>
        </TouchableOpacity>
        <View style={st.headerInfo}>
          <Text style={st.title}>Matched Workers</Text>
          <Text style={st.subtitle}>{matches.length} profiles found</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={st.filterRow}>
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[st.filterChip, filter === f.value && st.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[st.filterChipText, filter === f.value && st.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={st.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={st.emptyCard}>
            <Text style={st.emptyIcon}>👥</Text>
            <Text style={st.emptyTitle}>No profiles match</Text>
            <Text style={st.emptySub}>Try a different filter</Text>
          </View>
        }
        renderItem={({ item }: any) => {
          const w = item.worker ?? {};
          const skill = w.skills?.[0];
          const isVerified = w.kyc_status === 'FULLY_VERIFIED';
          return (
            <TouchableOpacity
              style={st.card}
              onPress={() => navigation.navigate('WorkerDetail', { worker: w, requirementId })}
              activeOpacity={0.85}
            >
              <View style={st.cardLeft}>
                <View style={st.avatar}>
                  <Text style={st.avatarText}>{getInitials(w.full_name)}</Text>
                </View>
              </View>
              <View style={st.cardInfo}>
                <View style={st.cardNameRow}>
                  <Text style={st.workerName}>{w.full_name ?? 'Worker'}</Text>
                  {isVerified && <Text style={st.verifiedTag}>✅ Verified</Text>}
                </View>
                <Text style={st.workerSkill}>
                  {JOB_ICONS[skill?.skill_type] ?? '💼'} {skill?.skill_type?.replace(/_/g, ' ') ?? 'General'} · {skill?.experience_years ?? 0} yrs
                </Text>
                <View style={st.tagRow}>
                  {w.location?.city && <View style={st.tag}><Text style={st.tagText}>📍 {w.location.city}</Text></View>}
                  {item.distance_km && <View style={st.tag}><Text style={st.tagText}>{Number(item.distance_km).toFixed(1)} km</Text></View>}
                  {w.is_live_in_ok && <View style={st.tagAccent}><Text style={st.tagText}>🏠 Live-in OK</Text></View>}
                </View>
              </View>
              <Text style={st.arrow}>→</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  backText: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
  headerInfo: {},
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 4 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', marginTop: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardLeft: { marginRight: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  workerName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  verifiedTag: { fontSize: 11, fontWeight: '700', color: '#166534', backgroundColor: '#DCFCE7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  workerSkill: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, textTransform: 'capitalize' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagAccent: { backgroundColor: '#EDE9FE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  arrow: { fontSize: 18, color: Colors.primary, fontWeight: '700', marginLeft: 8 },
});
