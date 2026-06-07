import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { useGetWorkerProfileQuery, useGetJobsQuery, useToggleWorkMutation } from '../../store/api/workerApi';
import { Avatar } from '../../components/common/Avatar';
import { ProfileScoreRing } from '../../components/worker/ProfileScoreRing';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { JobCard } from '../../components/worker/JobCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Spacing, Typography } from '../../theme';

export function WorkerDashboardScreen({ navigation }: any) {
  const { data: worker, isLoading: profileLoading, refetch } = useGetWorkerProfileQuery();
  const { data: jobs = [], isLoading: jobsLoading } = useGetJobsQuery();
  const [toggleWork] = useToggleWorkMutation();

  if (profileLoading) return <LoadingSpinner />;

  const verifications = worker?.verifications ?? [];
  const hasVerified = (type: string) => verifications.some((v: any) => v.check_type === type && v.status === 'VERIFIED');

  if (worker?.kyc_status === 'BLOCKED') {
    navigation.replace('ProfileBlocked');
    return null;
  }

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
            <Text style={styles.name}>{worker?.full_name ?? 'Complete your profile'}</Text>
            <Text style={styles.location}>📍 {worker?.location?.city ?? 'Add location'}</Text>
            {worker?.is_open_to_work && (
              <View style={styles.openDot}>
                <Text style={styles.openText}>● Open to work</Text>
              </View>
            )}
          </View>
          <ProfileScoreRing score={worker?.profile_score ?? 0} size={64} />
        </View>

        <ToggleSwitch
          value={worker?.is_open_to_work ?? true}
          onToggle={toggleWork}
          label={worker?.is_open_to_work ? 'Available for work' : 'Not available'}
        />

        {/* Verification badges */}
        <View style={styles.badgeRow}>
          {hasVerified('AADHAAR') && <StatusBadge status="verified" customLabel="Aadhaar ✓" />}
          {hasVerified('PAN') && <StatusBadge status="verified" customLabel="PAN ✓" />}
          {worker?.kyc_status === 'FULLY_VERIFIED' && <StatusBadge status="verified" customLabel="Clear ✓" />}
        </View>

        {worker?.kyc_status !== 'FULLY_VERIFIED' && (
          <View style={styles.kycPrompt}>
            <Text style={styles.kycText}>Complete verification to unlock job matches</Text>
          </View>
        )}

        {/* Matched Jobs */}
        <Text style={styles.sectionTitle}>Matched Jobs</Text>
        {jobsLoading ? <LoadingSpinner /> : jobs.length === 0 ? (
          <EmptyState
            icon="💼"
            message="No job matches yet"
            subMessage="Complete your profile and KYC to see matching jobs"
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: 12 },
  headerInfo: { flex: 1, marginHorizontal: Spacing.md },
  name: { ...Typography.h3, color: Colors.textPrimary, fontWeight: '600' },
  location: { ...Typography.caption, color: Colors.textSecondary },
  openDot: { marginTop: 4 },
  openText: { ...Typography.tiny, color: Colors.success },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: Spacing.md },
  kycPrompt: { backgroundColor: Colors.warningLight, padding: Spacing.md, borderRadius: 8, marginBottom: Spacing.md },
  kycText: { ...Typography.caption, color: Colors.warning, fontWeight: '600' },
  sectionTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
});
