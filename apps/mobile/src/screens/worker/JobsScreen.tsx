import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useGetJobsQuery, useApplyJobMutation, useGetWorkerProfileQuery } from '../../store/api/workerApi';
import { SearchBar } from '../../components/common/SearchBar';
import { JobCard } from '../../components/common/JobCard';
import { JobFilterSheet, JobFilters, EMPTY_JOB_FILTERS, activeFilterCount } from '../../components/common/JobFilterSheet';
import { JobFeedSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Icon } from '../../components/common/Icon';
import { JobIcon } from '../../components/common/JobIcon';
import { Colors, Radius, Shadows, Spacing, Typography, jobLabel } from '../../theme';
import { salaryRange } from '../../utils/format';

export function JobsScreen({ navigation }: any) {
  const lang = useSelector((s: RootState) => s.auth.language);
  const en = lang === 'en';
  const { data: jobs = [], isLoading, refetch } = useGetJobsQuery();
  const { data: worker } = useGetWorkerProfileQuery();
  const [applyJob, { isLoading: applying }] = useApplyJobMutation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFilters>(EMPTY_JOB_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const categories: string[] = [...new Set(jobs.map((m: any) => m.requirement?.job_type).filter(Boolean))] as string[];
  const q = search.trim().toLowerCase();
  const filtered = jobs.filter((m: any) => {
    const req = m.requirement ?? {};
    if (category && req.job_type !== category) return false;
    if (filters.maxDistanceKm != null && !(m.distance_km != null && Number(m.distance_km) <= filters.maxDistanceKm)) return false;
    if (filters.minSalary != null && !((req.salary_max ?? req.salary_min ?? 0) >= filters.minSalary)) return false;
    if (filters.urgentOnly && !req.is_urgent) return false;
    if (filters.liveInOnly && !req.is_live_in_required) return false;
    if (q && !`${jobLabel(req.job_type, lang)} ${req.employer?.company_name ?? ''} ${req.city ?? ''}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const nFilters = activeFilterCount(filters);

  const handleApply = async () => {
    if (!worker?.is_open_to_work) {
      Alert.alert(en ? 'Not available' : 'उपलब्ध नहीं', en ? 'Turn on your availability before applying.' : 'आवेदन करने से पहले उपलब्धता चालू करें।');
      return;
    }
    try {
      await applyJob(selected.id).unwrap();
      setSelected(null);
      Alert.alert(en ? 'Applied!' : 'आवेदन हो गया!', en ? 'Your application was sent to the employer.' : 'आपका आवेदन नियोक्ता को भेज दिया गया।');
      refetch();
    } catch (e: any) {
      Alert.alert(en ? 'Error' : 'त्रुटि', e?.data?.error ?? (en ? 'Could not apply.' : 'आवेदन नहीं हो सका।'));
    }
  };

  const selReq = selected?.requirement ?? {};
  const selApplied = !!selected?.applied_at;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.h1}>{en ? 'Browse Jobs' : 'नौकरियाँ देखें'}</Text>
        <Text style={styles.sub}>{filtered.length} {en ? 'jobs' : 'नौकरियाँ'}</Text>
      </View>

      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder={en ? 'Search role, company or city' : 'काम, कंपनी या शहर खोजें'} />
        </View>
        <TouchableOpacity style={[styles.filterBtn, nFilters > 0 && styles.filterBtnActive]} onPress={() => setSheet(true)} activeOpacity={0.85}>
          <Icon name="options-outline" size={20} color={nFilters > 0 ? '#fff' : Colors.textSecondary} />
          {nFilters > 0 && <View style={styles.filterDot}><Text style={styles.filterDotText}>{nFilters}</Text></View>}
        </TouchableOpacity>
      </View>

      {categories.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.lg }}>
          <TouchableOpacity style={[styles.chip, !category && styles.chipActive]} onPress={() => setCategory(null)} activeOpacity={0.8}>
            <Text style={[styles.chipText, !category && styles.chipTextActive]}>{en ? 'All' : 'सभी'}</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(category === cat ? null : cat)} activeOpacity={0.8}>
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{jobLabel(cat, lang)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <View style={styles.list}><JobFeedSkeleton /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m: any) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: any) => (
            <JobCard match={item} lang={lang} applied={!!item.applied_at} onPress={() => setSelected(item)} />
          )}
          ListEmptyComponent={<EmptyState icon="search-outline" message={en ? 'No matching jobs' : 'कोई मेल खाती नौकरी नहीं'} subMessage={en ? 'Try a different search or filter.' : 'कोई और खोज या फ़िल्टर आज़माएँ।'} />}
        />
      )}

      <JobFilterSheet visible={sheet} value={filters} onChange={setFilters} onClose={() => setSheet(false)} en={en} />

      {/* Job detail + apply */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.detailSheet}>
            <View style={styles.handle} />
            <View style={styles.detailHead}>
              <JobIcon jobType={selReq.job_type} size={52} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.detailTitle}>{jobLabel(selReq.job_type, lang)}</Text>
                <Text style={styles.detailCompany} numberOfLines={1}>{selReq.employer?.company_name ?? (en ? 'Company' : 'कंपनी')}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}><Icon name="close" size={20} color={Colors.textSecondary} /></TouchableOpacity>
            </View>
            <View style={styles.detailRow}><Icon name="cash-outline" size={18} color={Colors.textTertiary} /><Text style={styles.detailVal}>{salaryRange(selReq.salary_min, selReq.salary_max, en)}{(selReq.salary_min != null || selReq.salary_max != null) ? (en ? '/month' : '/माह') : ''}</Text></View>
            {selReq.city && <View style={styles.detailRow}><Icon name="location-outline" size={18} color={Colors.textTertiary} /><Text style={styles.detailVal}>{selReq.city}{selReq.state ? `, ${selReq.state}` : ''}</Text></View>}
            {selected?.distance_km != null && <View style={styles.detailRow}><Icon name="walk-outline" size={18} color={Colors.textTertiary} /><Text style={styles.detailVal}>{Number(selected.distance_km).toFixed(1)} {en ? 'km away' : 'किमी दूर'}</Text></View>}

            {selApplied ? (
              <View style={styles.appliedNote}><Icon name="checkmark-circle" size={18} color={Colors.successText} /><Text style={styles.appliedNoteText}>{en ? 'Already applied' : 'पहले ही आवेदन किया'}</Text></View>
            ) : (
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply} disabled={applying} activeOpacity={0.9}>
                {applying ? <ActivityIndicator color="#fff" /> : (<><Text style={styles.applyText}>{en ? 'Apply now' : 'आवेदन करें'}</Text><Icon name="arrow-forward" size={20} color="#fff" /></>)}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  h1: { ...Typography.h1, color: Colors.textPrimary },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  toolbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: Spacing.lg },
  filterBtn: { width: 46, height: 46, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterDot: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterDotText: { color: '#fff', ...Typography.tiny, fontWeight: '800' },
  chipsRow: { flexGrow: 0, marginBottom: Spacing.sm },
  chip: { backgroundColor: Colors.surface, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  detailSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderStrong, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  detailHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailTitle: { ...Typography.h2, color: Colors.textPrimary },
  detailCompany: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailVal: { ...Typography.bodyStrong, color: Colors.textPrimary },
  appliedNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.successLight, borderRadius: Radius.md, paddingVertical: 15, marginTop: Spacing.lg },
  appliedNoteText: { ...Typography.bodyStrong, color: Colors.successText },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 16, marginTop: Spacing.lg, ...Shadows.accent },
  applyText: { color: '#fff', ...Typography.button, fontSize: 17 },
});
