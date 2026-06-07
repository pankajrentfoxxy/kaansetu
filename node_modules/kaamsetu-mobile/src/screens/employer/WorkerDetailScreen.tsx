import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useAddShortlistMutation } from '../../store/api/employerApi';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography } from '../../theme';

export function WorkerDetailScreen({ navigation, route }: any) {
  const { worker, requirementId } = route.params ?? {};
  const [addShortlist, { isLoading }] = useAddShortlistMutation();
  const [shortlisted, setShortlisted] = useState(false);
  const [error, setError] = useState('');

  const verifications = worker?.verifications ?? [];
  const hasV = (type: string) => verifications.some((v: any) => v.check_type === type && v.status === 'VERIFIED');

  const handleShortlist = async () => {
    try {
      await addShortlist({ worker_id: worker.id, requirement_id: requirementId }).unwrap();
      setShortlisted(true);
    } catch {
      setError('Failed to shortlist. Please try again.');
    }
  };

  if (!worker) return <AlertCard type="danger" message="Worker not found" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Profile Header */}
        <View style={styles.profile}>
          <Avatar name={worker.full_name} size={72} fontSize={26} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{worker.full_name}</Text>
            <Text style={styles.skill}>{worker.skills?.[0]?.skill_type} · {worker.skills?.[0]?.experience_years} yrs</Text>
            <Text style={styles.city}>📍 {worker.location?.city ?? 'Location not set'}</Text>
          </View>
        </View>

        {/* Verification Table */}
        <Card>
          <Text style={styles.sectionTitle}>Verifications</Text>
          {[
            { label: 'Aadhaar', type: 'AADHAAR' },
            { label: 'PAN', type: 'PAN' },
            { label: 'Selfie', type: 'SELFIE' },
            { label: 'Criminal Check', type: 'CRIMINAL' },
            { label: 'Address', type: 'ADDRESS' },
          ].map((v) => (
            <View key={v.type} style={styles.vRow}>
              <Text style={styles.vLabel}>{v.label}</Text>
              <StatusBadge status={hasV(v.type) ? 'verified' : worker.kyc_status === 'FULLY_VERIFIED' && v.type === 'CRIMINAL' ? 'verified' : 'pending'} />
            </View>
          ))}
        </Card>

        {/* Work History */}
        {worker.work_history?.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Work History</Text>
            {worker.work_history.map((h: any, i: number) => (
              <View key={i} style={styles.historyItem}>
                <Text style={styles.historyCompany}>{h.employer_name}</Text>
                <Text style={styles.historyRole}>{h.role}</Text>
                <Text style={styles.historyDuration}>{h.from_date?.slice(0, 7)} — {h.to_date?.slice(0, 7) ?? 'Present'}</Text>
              </View>
            ))}
          </Card>
        )}

        {error ? <AlertCard type="danger" message={error} /> : null}
        {shortlisted ? (
          <AlertCard type="success" message="Worker shortlisted! They have been notified." />
        ) : (
          <View style={styles.actions}>
            <Button title="Shortlist" onPress={handleShortlist} loading={isLoading} variant="secondary" style={{ flex: 1, marginRight: Spacing.sm }} />
            <Button
              title="Confirm Hire"
              onPress={() => navigation.navigate('HireConfirmed', { workerId: worker.id, requirementId })}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.lg },
  profile: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.lg },
  profileInfo: { flex: 1, marginLeft: Spacing.md },
  name: { ...Typography.h2, color: Colors.textPrimary, fontWeight: '700' },
  skill: { ...Typography.body, color: Colors.textSecondary },
  city: { ...Typography.caption, color: Colors.textTertiary },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  vRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  vLabel: { ...Typography.body, color: Colors.textSecondary },
  historyItem: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyCompany: { ...Typography.h3, color: Colors.textPrimary },
  historyRole: { ...Typography.body, color: Colors.textSecondary },
  historyDuration: { ...Typography.caption, color: Colors.textTertiary },
  actions: { flexDirection: 'row', marginTop: Spacing.xl },
});
