import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSearchWorkersQuery } from '../../store/api/employerApi';
import { SearchBar } from '../../components/common/SearchBar';
import { Avatar } from '../../components/common/Avatar';
import { Icon } from '../../components/common/Icon';
import { EmptyState } from '../../components/common/EmptyState';
import { JobFeedSkeleton } from '../../components/common/Skeleton';
import { Colors, Radius, Shadows, Spacing, Typography, jobLabel, JOB_TYPES, getJobMeta } from '../../theme';

const EXP = [{ v: 0, l: 'Any exp' }, { v: 1, l: '1+ yr' }, { v: 3, l: '3+ yr' }, { v: 5, l: '5+ yr' }];

export function FindWorkersScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [skill, setSkill] = useState<string | null>(null);
  const [minExp, setMinExp] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(t); }, [search]);

  const { data: workers = [], isLoading, isFetching } = useSearchWorkersQuery({
    q: debounced || undefined,
    skill_type: skill ?? undefined,
    min_experience: minExp || undefined,
    verified: verifiedOnly,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.h1}>Find Workers</Text>
        <Text style={styles.sub}>{workers.length} verified workers</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.lg }}>
        <TouchableOpacity style={[styles.chip, verifiedOnly && styles.chipActive]} onPress={() => setVerifiedOnly(!verifiedOnly)} activeOpacity={0.8}>
          <Icon name="shield-checkmark" size={13} color={verifiedOnly ? '#fff' : Colors.textSecondary} />
          <Text style={[styles.chipText, verifiedOnly && styles.chipTextActive]}>Verified</Text>
        </TouchableOpacity>
        {EXP.map((e) => (
          <TouchableOpacity key={e.v} style={[styles.chip, minExp === e.v && styles.chipActive]} onPress={() => setMinExp(e.v)} activeOpacity={0.8}>
            <Text style={[styles.chipText, minExp === e.v && styles.chipTextActive]}>{e.l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow2} contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.lg }}>
        <TouchableOpacity style={[styles.skillChip, !skill && styles.chipActive]} onPress={() => setSkill(null)} activeOpacity={0.8}>
          <Text style={[styles.chipText, !skill && styles.chipTextActive]}>All skills</Text>
        </TouchableOpacity>
        {JOB_TYPES.map((type) => (
          <TouchableOpacity key={type} style={[styles.skillChip, skill === type && styles.chipActive]} onPress={() => setSkill(skill === type ? null : type)} activeOpacity={0.8}>
            <Text style={[styles.chipText, skill === type && styles.chipTextActive]}>{getJobMeta(type).labelEn}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.list}><JobFeedSkeleton /></View>
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(w: any) => w.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching}
          onRefresh={() => {}}
          ListEmptyComponent={<EmptyState icon="people-outline" message="No workers found" subMessage="Try a different skill or filter." />}
          renderItem={({ item: w }: any) => {
            const skillObj = w.skills?.[0];
            const isVerified = w.kyc_status === 'FULLY_VERIFIED';
            return (
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WorkerDetail', { worker: w })} activeOpacity={0.85}>
                <Avatar name={w.full_name ?? 'W'} size={52} />
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{w.full_name ?? 'Worker'}</Text>
                    {isVerified && (
                      <View style={styles.vTag}><Icon name="checkmark-circle" size={12} color={Colors.successText} /><Text style={styles.vTagText}>Verified</Text></View>
                    )}
                  </View>
                  <Text style={styles.skill}>{jobLabel(skillObj?.skill_type, 'en')} · {skillObj?.experience_years ?? 0} yrs</Text>
                  {w.location?.city && (
                    <View style={styles.tag}><Icon name="location-outline" size={12} color={Colors.textSecondary} /><Text style={styles.tagText}>{w.location.city}</Text></View>
                  )}
                </View>
                <Icon name="chevron-forward" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  h1: { ...Typography.h1, color: Colors.textPrimary },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  searchWrap: { paddingHorizontal: Spacing.lg },
  chipsRow: { flexGrow: 0, marginBottom: Spacing.sm },
  chipsRow2: { flexGrow: 0, marginBottom: Spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8 },
  skillChip: { backgroundColor: Colors.surface, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardInfo: { flex: 1, marginLeft: Spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name: { ...Typography.bodyStrong, color: Colors.textPrimary, flexShrink: 1 },
  vTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.successLight, borderRadius: Radius.sm, paddingHorizontal: 7, paddingVertical: 2 },
  vTagText: { ...Typography.tiny, fontWeight: '700', color: Colors.successText },
  skill: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 6, textTransform: 'capitalize' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  tagText: { ...Typography.tiny, color: Colors.textSecondary, fontWeight: '600' },
});
