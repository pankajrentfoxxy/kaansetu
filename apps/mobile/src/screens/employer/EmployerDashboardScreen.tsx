import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useGetEmployerProfileQuery, useGetRequirementsQuery, useGetCaseAlertsQuery } from '../../store/api/employerApi';
import { RequirementCard } from '../../components/employer/RequirementCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Colors, Spacing, Typography } from '../../theme';

export function EmployerDashboardScreen({ navigation }: any) {
  const { data: employer, isLoading: empLoading, refetch: refetchEmp } = useGetEmployerProfileQuery();
  const { data: requirements = [], isLoading: reqLoading, refetch: refetchReq } = useGetRequirementsQuery();
  const { data: alerts = [] } = useGetCaseAlertsQuery();

  const unreadAlerts = alerts.filter((a: any) => !a.employer_action).length;

  if (empLoading) return <LoadingSpinner />;

  const activeReqs = requirements.filter((r: any) => r.status === 'ACTIVE');
  const totalMatches = requirements.reduce((sum: number, r: any) => sum + (r._count?.matches ?? 0), 0);
  const totalHires = 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.inner}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetchEmp(); refetchReq(); }} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.company}>{employer?.company_name ?? 'Your Company'}</Text>
            <Text style={styles.city}>📍 {employer?.city ?? 'Add city'}</Text>
          </View>
          <TouchableOpacity style={styles.bell} onPress={() => navigation.navigate('CaseAlert')}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadAlerts > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadAlerts}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricNum}>{activeReqs.length}</Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricNum}>{totalMatches}</Text>
            <Text style={styles.metricLabel}>Matched</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricNum}>{totalHires}</Text>
            <Text style={styles.metricLabel}>Hired</Text>
          </View>
        </View>

        <Button
          title="+ Post New Requirement"
          onPress={() => navigation.navigate('PostRequirement')}
          style={styles.postBtn}
        />

        <Text style={styles.sectionTitle}>Active Requirements</Text>
        {reqLoading ? <LoadingSpinner /> : requirements.length === 0 ? (
          <EmptyState icon="📋" message="No requirements posted" subMessage="Post a requirement to find verified workers" />
        ) : (
          requirements.map((req: any) => (
            <RequirementCard
              key={req.id}
              jobType={req.job_type}
              city={req.city}
              salaryMin={req.salary_min}
              salaryMax={req.salary_max}
              matchCount={req._count?.matches ?? 0}
              status={req.status}
              onPress={() => navigation.navigate('MatchedProfiles', { requirementId: req.id })}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  company: { ...Typography.h2, color: Colors.textPrimary, fontWeight: '700' },
  city: { ...Typography.caption, color: Colors.textSecondary },
  bell: { position: 'relative', padding: Spacing.sm },
  bellIcon: { fontSize: 26 },
  badge: { position: 'absolute', top: 2, right: 2, backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.lg, marginBottom: Spacing.lg },
  metric: { alignItems: 'center' },
  metricNum: { fontSize: 26, fontWeight: '700', color: Colors.primary },
  metricLabel: { ...Typography.caption, color: Colors.textSecondary },
  postBtn: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.md },
});
