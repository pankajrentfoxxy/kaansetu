import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  RefreshControl, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import {
  useGetWorkerProfileQuery,
  useGetJobsQuery,
  useToggleWorkMutation,
} from '../../store/api/workerApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Spacing, Typography } from '../../theme';
import { SecureStore } from '../../utils/storage';
import { logout } from '../../store/authSlice';
import { baseApi } from '../../store/api/baseApi';

const JOB_ICONS: Record<string, string> = {
  driver: '🚗',
  security_guard: '🛡️',
  cook: '🍳',
  housekeeper: '🏠',
  delivery: '📦',
  electrician: '🔧',
  plumber: '🔩',
  peon: '📋',
  sweeper: '🧹',
  helper: '👤',
};

function formatSalary(n: number) {
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function WorkerDashboardScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { data: worker, isLoading: profileLoading, refetch } = useGetWorkerProfileQuery();
  const { data: jobs = [], isLoading: jobsLoading } = useGetJobsQuery();
  const [toggleWork, { isLoading: toggling }] = useToggleWorkMutation();

  if (profileLoading) return <LoadingSpinner />;

  if (worker?.kyc_status === 'BLOCKED') {
    navigation.replace('ProfileBlocked');
    return null;
  }

  const verifications = worker?.verifications ?? [];
  const hasVerified = (type: string) =>
    verifications.some((v: any) => v.check_type === type && v.status === 'VERIFIED');

  const kycDone = worker?.kyc_status === 'FULLY_VERIFIED';
  const isOpen = worker?.is_open_to_work ?? true;

  // Profile completeness
  const checks = [
    !!worker?.full_name,
    !!worker?.location?.city,
    (worker?.skills?.length ?? 0) > 0,
    hasVerified('SELFIE'),
    hasVerified('AADHAAR'),
    hasVerified('PAN'),
    kycDone,
  ];
  const profilePct = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const handleLogout = () => {
    Alert.alert(
      'लॉगआउट करें?',
      'Logout / बाहर निकलें',
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'हाँ, निकलें',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            dispatch(baseApi.util.resetApiState());
            dispatch(logout());
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(worker?.full_name ?? 'KS')}</Text>
            </View>

            {/* Name + location */}
            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>
                {worker?.full_name || 'अपना नाम जोड़ें'}
              </Text>
              <Text style={styles.heroLocation}>
                📍 {worker?.location?.city ?? 'Location not set'}
              </Text>
              {(worker?.skills?.length ?? 0) > 0 && (
                <View style={styles.skillTag}>
                  <Text style={styles.skillTagText}>
                    {JOB_ICONS[worker?.skills?.[0]?.skill_type] ?? '💼'}{' '}
                    {worker?.skills?.[0]?.skill_type?.replace(/_/g, ' ') ?? ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Logout */}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.logoutIcon}>⎋</Text>
            </TouchableOpacity>
          </View>

          {/* Profile progress */}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Profile {profilePct}% complete</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PersonalDetails')}>
              <Text style={styles.progressEdit}>Edit →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${profilePct}%` }]} />
          </View>

          {/* Availability toggle */}
          <TouchableOpacity
            style={[styles.availToggle, isOpen ? styles.availOpen : styles.availClosed]}
            onPress={() => toggleWork()}
            disabled={toggling}
            activeOpacity={0.8}
          >
            <Text style={styles.availDot}>{isOpen ? '●' : '●'}</Text>
            <Text style={styles.availText}>
              {isOpen ? '✅ काम के लिए उपलब्ध हूँ  ·  Available for work' : '⛔ अभी उपलब्ध नहीं  ·  Not available now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── KYC Banner (if incomplete) ── */}
        {!kycDone && (
          <TouchableOpacity style={styles.kycBanner} onPress={() => navigation.navigate('KycVerification')} activeOpacity={0.85}>
            <View style={styles.kycLeft}>
              <Text style={styles.kycEmoji}>⚠️</Text>
              <View>
                <Text style={styles.kycTitle}>पहचान जाँच बाकी है</Text>
                <Text style={styles.kycSub}>Tap to complete verification — unlock all jobs</Text>
              </View>
            </View>
            <Text style={styles.kycArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* ── Verification Badges ── */}
        {kycDone && (
          <View style={styles.badgesCard}>
            <Text style={styles.badgesTitle}>✅ Fully Verified Profile</Text>
            <View style={styles.badgesRow}>
              {[
                { type: 'SELFIE', label: '📸 Selfie' },
                { type: 'AADHAAR', label: '🪪 Aadhaar' },
                { type: 'PAN', label: '💳 PAN' },
              ].map((b) => (
                hasVerified(b.type) ? (
                  <View key={b.type} style={styles.badge}>
                    <Text style={styles.badgeText}>{b.label} ✓</Text>
                  </View>
                ) : null
              ))}
              <View style={styles.badgeBgc}>
                <Text style={styles.badgeText}>🔍 BGC Clear ✓</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Matched Jobs ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💼 मैचिंग जॉब्स</Text>
          <Text style={styles.sectionSub}>Matched Jobs for You</Text>
        </View>

        {!kycDone ? (
          <View style={styles.lockedCard}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedTitle}>Job matches locked</Text>
            <Text style={styles.lockedSub}>Complete KYC verification to unlock matching jobs</Text>
            <TouchableOpacity style={styles.lockedBtn} onPress={() => navigation.navigate('KycVerification')}>
              <Text style={styles.lockedBtnText}>Start Verification →</Text>
            </TouchableOpacity>
          </View>
        ) : jobsLoading ? (
          <LoadingSpinner />
        ) : jobs.length === 0 ? (
          <EmptyState icon="📭" message="अभी कोई जॉब नहीं" subMessage="No matches yet. We'll notify you when jobs arrive!" />
        ) : (
          jobs.map((match: any) => {
            const req = match.requirement ?? {};
            return (
              <View key={match.id} style={styles.jobCard}>
                <View style={styles.jobCardTop}>
                  <View style={styles.jobIconCircle}>
                    <Text style={styles.jobIconText}>{JOB_ICONS[req.job_type] ?? '💼'}</Text>
                  </View>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{req.job_type?.replace(/_/g, ' ')?.toUpperCase() ?? 'Job'}</Text>
                    <Text style={styles.jobCompany}>{req.employer?.company_name ?? 'Company'}</Text>
                  </View>
                  <View style={styles.jobSalaryBox}>
                    <Text style={styles.jobSalary}>
                      {formatSalary(req.salary_min ?? 0)}–{formatSalary(req.salary_max ?? 0)}
                    </Text>
                    <Text style={styles.jobSalaryPer}>/month</Text>
                  </View>
                </View>
                <View style={styles.jobTags}>
                  {req.city && <View style={styles.tag}><Text style={styles.tagText}>📍 {req.city}</Text></View>}
                  {match.distance_km && (
                    <View style={styles.tag}><Text style={styles.tagText}>🚶 {Number(match.distance_km).toFixed(1)} km</Text></View>
                  )}
                  {req.is_live_in_required && <View style={styles.tagAccent}><Text style={styles.tagText}>🏠 Live-in</Text></View>}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 16, paddingBottom: 32 },

  // Hero
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroInfo: { flex: 1 },
  heroName: { color: '#fff', fontSize: 19, fontWeight: '700' },
  heroLocation: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  skillTag: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start',
  },
  skillTagText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoutIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Progress
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  progressEdit: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 14 },
  progressFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },

  // Availability
  availToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  availOpen: { backgroundColor: 'rgba(255,255,255,0.15)' },
  availClosed: { backgroundColor: 'rgba(0,0,0,0.2)' },
  availDot: { color: '#fff', fontSize: 10 },
  availText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },

  // KYC Banner
  kycBanner: {
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16,
    marginBottom: 16, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FCD34D',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  kycLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  kycEmoji: { fontSize: 28 },
  kycTitle: { fontSize: 15, fontWeight: '700', color: '#92400E' },
  kycSub: { fontSize: 12, color: '#B45309', marginTop: 2 },
  kycArrow: { fontSize: 20, color: '#D97706', fontWeight: '700' },

  // Badges
  badgesCard: {
    backgroundColor: '#F0FFF4', borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#86EFAC',
  },
  badgesTitle: { fontSize: 14, fontWeight: '700', color: '#166534', marginBottom: 10 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#4ADE80',
  },
  badgeBgc: {
    backgroundColor: '#EDE9FE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#A78BFA',
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#166534' },

  // Section
  section: { marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  sectionSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  // Locked
  lockedCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
    marginBottom: 16,
  },
  lockedIcon: { fontSize: 48, marginBottom: 12 },
  lockedTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  lockedSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  lockedBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  lockedBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Job Card
  jobCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E8EEF4',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  jobCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  jobIconCircle: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  jobIconText: { fontSize: 24 },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
  jobCompany: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  jobSalaryBox: { alignItems: 'flex-end' },
  jobSalary: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  jobSalaryPer: { fontSize: 11, color: Colors.textTertiary },
  jobTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagAccent: { backgroundColor: '#EDE9FE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
});
