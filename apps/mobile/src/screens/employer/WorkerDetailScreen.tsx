import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAddShortlistMutation } from '../../store/api/employerApi';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Avatar } from '../../components/common/Avatar';
import { JobIcon } from '../../components/common/JobIcon';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Shadows, Spacing, Typography, jobLabel } from '../../theme';

export function WorkerDetailScreen({ navigation, route }: any) {
  const { worker, requirementId } = route.params ?? {};
  const [addShortlist, { isLoading }] = useAddShortlistMutation();
  const [shortlisted, setShortlisted] = useState(false);
  const [error, setError] = useState('');

  if (!worker) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Worker" onBack={() => navigation.goBack()} />
        <Text style={{ padding: Spacing.xl, color: Colors.dangerText }}>Worker not found</Text>
      </SafeAreaView>
    );
  }

  const verifications = worker.verifications ?? [];
  const hasV = (type: string) => verifications.some((v: any) => v.check_type === type && v.status === 'VERIFIED');
  const isFullyVerified = worker.kyc_status === 'FULLY_VERIFIED';
  const skill = worker.skills?.[0];

  const handleShortlist = async () => {
    try {
      await addShortlist({ worker_id: worker.id, requirement_id: requirementId }).unwrap();
      setShortlisted(true);
    } catch {
      setError('Failed to shortlist. Please try again.');
    }
  };

  const verifyChecks = [
    { label: 'Selfie', type: 'SELFIE' },
    { label: 'Aadhaar', type: 'AADHAAR' },
    { label: 'PAN Card', type: 'PAN' },
    { label: 'Address', type: 'ADDRESS' },
    { label: 'Criminal background', type: 'CRIMINAL' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Worker Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Avatar name={worker.full_name ?? 'W'} size={84} color="rgba(255,255,255,0.2)" />
          <Text style={styles.name}>{worker.full_name}</Text>
          <View style={styles.skillRow}>
            <Text style={styles.skillText}>{jobLabel(skill?.skill_type, 'en')} · {skill?.experience_years ?? 0} yrs exp</Text>
          </View>
          <View style={styles.cityRow}>
            <Icon name="location-sharp" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.city}>{worker.location?.city ?? 'Location not set'}</Text>
          </View>
          {isFullyVerified && (
            <View style={styles.verifiedBadge}>
              <Icon name="shield-checkmark" size={14} color="#A7F3D0" />
              <Text style={styles.verifiedText}>Fully Verified Profile</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat num={skill?.experience_years ?? 0} label="Yrs Exp" />
          <View style={styles.statDivider} />
          <Stat num={worker.work_history?.length ?? 0} label="Past Jobs" />
          <View style={styles.statDivider} />
          <Stat num={verifications.filter((v: any) => v.status === 'VERIFIED').length} label="Verified" />
        </View>

        {/* Skills */}
        {(worker.skills?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skills</Text>
            <View style={styles.skillTagsRow}>
              {worker.skills.map((s: any) => (
                <View key={s.id} style={styles.skillChip}>
                  <JobIcon jobType={s.skill_type} size={28} />
                  <Text style={styles.skillChipText}>{jobLabel(s.skill_type, 'en')} · {s.experience_years} yrs</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Verifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verification Status</Text>
          {verifyChecks.map((v, i) => {
            const done = hasV(v.type) || (isFullyVerified && v.type === 'CRIMINAL');
            return (
              <View key={v.type} style={[styles.vRow, i < verifyChecks.length - 1 && styles.vRowBorder]}>
                <Text style={styles.vLabel}>{v.label}</Text>
                <View style={[styles.vBadge, done ? styles.vBadgeDone : styles.vBadgePending]}>
                  {done && <Icon name="checkmark" size={12} color={Colors.successText} />}
                  <Text style={[styles.vBadgeText, { color: done ? Colors.successText : Colors.textSecondary }]}>{done ? 'Verified' : 'Pending'}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Work history */}
        {(worker.work_history?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Work History</Text>
            {worker.work_history.map((h: any, i: number) => (
              <View key={i} style={[styles.histItem, i < worker.work_history.length - 1 && styles.histItemBorder]}>
                <Text style={styles.histCompany}>{h.employer_name}</Text>
                <Text style={styles.histRole}>{h.role}</Text>
                <Text style={styles.histDur}>{h.from_date?.slice(0, 7)} — {h.to_date?.slice(0, 7) ?? 'Present'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Location */}
        {worker.location && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            <Text style={styles.locationText}>{[worker.location.city, worker.location.state, worker.location.pincode].filter(Boolean).join(', ')}</Text>
            {worker.is_live_in_ok && (
              <View style={styles.liveInTag}><Text style={styles.liveInText}>Live-in OK</Text></View>
            )}
          </View>
        )}

        {error ? <AlertCard type="danger" message={error} /> : null}

        {shortlisted ? (
          <AlertCard type="success" message="Shortlisted! Worker has been notified." />
        ) : (
          <View style={styles.actionsRow}>
            <Button title="Shortlist" onPress={handleShortlist} loading={isLoading} variant="secondary" icon="star-outline" style={{ flex: 1 }} />
            <Button title="Confirm Hire" onPress={() => navigation.navigate('HireConfirmed', { workerId: worker.id, workerName: worker.full_name, requirementId })} variant="accent" icon="checkmark" style={{ flex: 1.4 }} />
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  hero: { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.primary },
  name: { color: '#fff', ...Typography.h1, marginTop: Spacing.md, marginBottom: 6 },
  skillRow: { marginBottom: 4 },
  skillText: { color: 'rgba(255,255,255,0.9)', ...Typography.bodyStrong, textTransform: 'capitalize' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: Spacing.md },
  city: { color: 'rgba(255,255,255,0.8)', ...Typography.caption },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  verifiedText: { color: '#A7F3D0', ...Typography.captionStrong },
  statsRow: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { ...Typography.h1, fontWeight: '800', color: Colors.primary },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  skillTagsRow: { gap: 8 },
  skillChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 6 },
  skillChipText: { ...Typography.captionStrong, color: Colors.textPrimary, textTransform: 'capitalize' },
  vRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  vRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  vLabel: { ...Typography.body, color: Colors.textSecondary },
  vBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  vBadgeDone: { backgroundColor: Colors.successLight },
  vBadgePending: { backgroundColor: Colors.surfaceAlt },
  vBadgeText: { ...Typography.tiny, fontWeight: '700' },
  histItem: { paddingVertical: 10 },
  histItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  histCompany: { ...Typography.bodyStrong, color: Colors.textPrimary },
  histRole: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  histDur: { ...Typography.tiny, color: Colors.textTertiary, marginTop: 2 },
  locationText: { ...Typography.body, color: Colors.textPrimary },
  liveInTag: { backgroundColor: Colors.purpleLight, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5, marginTop: Spacing.sm, alignSelf: 'flex-start' },
  liveInText: { ...Typography.caption, color: Colors.purple, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.sm },
});
