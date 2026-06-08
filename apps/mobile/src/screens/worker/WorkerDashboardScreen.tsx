import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useGetWorkerProfileQuery, useGetJobsQuery, useToggleWorkMutation } from '../../store/api/workerApi';
import { Avatar } from '../../components/common/Avatar';
import { ProfileScoreRing } from '../../components/worker/ProfileScoreRing';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { JobCard } from '../../components/worker/JobCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Spacing, Typography } from '../../theme';
import { SecureStore } from '../../utils/storage';
import { logout } from '../../store/authSlice';
import { baseApi } from '../../store/api/baseApi';

export function WorkerDashboardScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { data: worker, isLoading: profileLoading, refetch } = useGetWorkerProfileQuery();
  const { data: jobs = [], isLoading: jobsLoading } = useGetJobsQuery();
  const [toggleWork] = useToggleWorkMutation();

  if (profileLoading) return <LoadingSpinner />;

  if (worker?.kyc_status === 'BLOCKED') {
    navigation.replace('ProfileBlocked');
    return null;
  }

  const verifications = worker?.verifications ?? [];
  const hasVerified = (type: string) =>
    verifications.some((v: any) => v.check_type === type && v.status === 'VERIFIED');
  const kycDone = worker?.kyc_status === 'FULLY_VERIFIED';

  const handleLogout = () => {
    Alert.alert(
      'Logout / लॉगआउट',
      'Are you sure you want to logout?\nक्या आप लॉगआउट करना चाहते हैं?',
      [
        { text: 'Cancel / रद्द करें', style: 'cancel' },
        {
          text: 'Logout / हाँ, निकलें',
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
        contentContainerStyle={styles.inner}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={worker?.full_name ?? 'Worker'} size={52} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{worker?.full_name || 'अपना नाम जोड़ें'}</Text>
            <Text style={styles.location}>📍 {worker?.location?.city ?? 'Location not set'}</Text>
            {worker?.is_open_to_work && (
              <Text style={styles.openText}>● काम के लिए उपलब्ध</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <ProfileScoreRing score={worker?.profile_score ?? 0} size={56} />
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available for work toggle */}
        <ToggleSwitch
          value={worker?.is_open_to_work ?? true}
          onToggle={toggleWork}
          label={worker?.is_open_to_work ? '✅ काम के लिए उपलब्ध हूँ' : '❌ अभी उपलब्ध नहीं हूँ'}
        />

        {/* Verification badges */}
        <View style={styles.badgeRow}>
          {hasVerified('SELFIE') && <StatusBadge status="verified" customLabel="📸 Selfie ✓" />}
          {hasVerified('AADHAAR') && <StatusBadge status="verified" customLabel="🪪 Aadhaar ✓" />}
          {hasVerified('PAN') && <StatusBadge status="verified" customLabel="💳 PAN ✓" />}
          {kycDone && <StatusBadge status="verified" customLabel="🔍 BGC Clear ✓" />}
        </View>

        {/* KYC prompt if incomplete */}
        {!kycDone && (
          <TouchableOpacity
            style={styles.kycPrompt}
            onPress={() => navigation.navigate('KycVerification')}
          >
            <Text style={styles.kycTitle}>⚠️ पहचान जाँच बाकी है</Text>
            <Text style={styles.kycSub}>Verification incomplete — tap to complete KYC</Text>
            <Text style={styles.kycCta}>जाँच पूरी करें →</Text>
          </TouchableOpacity>
        )}

        {/* Matched Jobs */}
        <Text style={styles.sectionTitle}>💼 मैचिंग जॉब्स / Matched Jobs</Text>

        {!kycDone ? (
          <EmptyState
            icon="🔒"
            message="KYC पूरी करें"
            subMessage="Job matches unlock after full verification"
          />
        ) : jobsLoading ? <LoadingSpinner /> : jobs.length === 0 ? (
          <EmptyState
            icon="📭"
            message="अभी कोई जॉब नहीं"
            subMessage="No matching jobs yet. Check back soon!"
          />
        ) : (
          jobs.map((match: any) => (
            <JobCard
              key={match.id}
              jobType={match.requirement?.job_type ?? ''}
              companyName={match.requirement?.employer?.company_name ?? ''}
              salaryMin={match.requirement?.salary_min ?? 0}
              salaryMax={match.requirement?.salary_max ?? 0}
              city={match.requirement?.employer?.city}
              distanceKm={match.distance_km ? Number(match.distance_km) : undefined}
              isLiveIn={match.requirement?.is_live_in_required}
              onPress={() => {}}
            />
          ))
        )}

        {/* Bottom spacer */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.lg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.lg, backgroundColor: Colors.surface,
    padding: Spacing.lg, borderRadius: 12,
  },
  headerInfo: { flex: 1, marginHorizontal: Spacing.md },
  headerRight: { alignItems: 'center', gap: 8 },
  name: { ...Typography.h3, color: Colors.textPrimary, fontWeight: '600' },
  location: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  openText: { ...Typography.tiny, color: Colors.success, marginTop: 4, fontWeight: '600' },
  logoutBtn: {
    marginTop: 6, paddingVertical: 4, paddingHorizontal: 8,
    backgroundColor: Colors.dangerLight, borderRadius: 6,
  },
  logoutText: { fontSize: 11, color: Colors.danger, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: Spacing.md },
  kycPrompt: {
    backgroundColor: Colors.warningLight, padding: Spacing.lg,
    borderRadius: 12, marginBottom: Spacing.lg,
    borderLeftWidth: 4, borderLeftColor: Colors.warning,
  },
  kycTitle: { fontSize: 16, fontWeight: '700', color: Colors.warning, marginBottom: 4 },
  kycSub: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 8 },
  kycCta: { ...Typography.body, color: Colors.primary, fontWeight: '700' },
  sectionTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
});
