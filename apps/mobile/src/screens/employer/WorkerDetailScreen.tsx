import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useAddShortlistMutation } from '../../store/api/employerApi';
import { Colors } from '../../theme';

const JOB_ICONS: Record<string, string> = {
  driver: '🚗', security_guard: '🛡️', cook: '🍳', housekeeper: '🏠',
  delivery: '📦', electrician: '🔧', plumber: '🔩', peon: '📋', sweeper: '🧹', helper: '👤',
};

function getInitials(name: string) {
  return (name || 'W').split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
}

export function WorkerDetailScreen({ navigation, route }: any) {
  const { worker, requirementId } = route.params ?? {};
  const [addShortlist, { isLoading }] = useAddShortlistMutation();
  const [shortlisted, setShortlisted] = useState(false);
  const [error, setError] = useState('');

  if (!worker) {
    return (
      <SafeAreaView style={st.container}>
        <Text style={{ padding: 20, color: Colors.danger }}>Worker not found</Text>
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
    { label: 'Criminal BGC', type: 'CRIMINAL' },
  ];

  return (
    <SafeAreaView style={st.container}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Text style={st.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={st.hero}>
          <View style={st.avatar}>
            <Text style={st.avatarText}>{getInitials(worker.full_name)}</Text>
          </View>
          <Text style={st.name}>{worker.full_name}</Text>
          <View style={st.skillRow}>
            <Text style={st.skillIcon}>{JOB_ICONS[skill?.skill_type] ?? '💼'}</Text>
            <Text style={st.skillText}>
              {skill?.skill_type?.replace(/_/g, ' ') ?? 'General'} · {skill?.experience_years ?? 0} yrs exp
            </Text>
          </View>
          <Text style={st.city}>📍 {worker.location?.city ?? 'Location not set'}</Text>
          {isFullyVerified && (
            <View style={st.verifiedBadge}>
              <Text style={st.verifiedText}>✅ Fully Verified Profile</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={st.statsRow}>
          <View style={st.stat}>
            <Text style={st.statNum}>{skill?.experience_years ?? 0}</Text>
            <Text style={st.statLabel}>Yrs Exp</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.stat}>
            <Text style={st.statNum}>{worker.work_history?.length ?? 0}</Text>
            <Text style={st.statLabel}>Past Jobs</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.stat}>
            <Text style={st.statNum}>{verifications.filter((v: any) => v.status === 'VERIFIED').length}</Text>
            <Text style={st.statLabel}>Verified</Text>
          </View>
        </View>

        {/* Skills */}
        {(worker.skills?.length ?? 0) > 0 && (
          <View style={st.card}>
            <Text style={st.cardTitle}>Skills</Text>
            <View style={st.skillTagsRow}>
              {worker.skills.map((s: any) => (
                <View key={s.id} style={st.skillTag}>
                  <Text style={st.skillTagText}>
                    {JOB_ICONS[s.skill_type] ?? '💼'} {s.skill_type?.replace(/_/g, ' ')} · {s.experience_years} yrs
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Verifications */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Verification Status</Text>
          {verifyChecks.map((v) => {
            const done = hasV(v.type) || (isFullyVerified && v.type === 'CRIMINAL');
            return (
              <View key={v.type} style={st.vRow}>
                <Text style={st.vLabel}>{v.label}</Text>
                <View style={[st.vBadge, done ? st.vBadgeDone : st.vBadgePending]}>
                  <Text style={[st.vBadgeText, done ? { color: '#166534' } : { color: Colors.textSecondary }]}>
                    {done ? '✓ Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Work History */}
        {(worker.work_history?.length ?? 0) > 0 && (
          <View style={st.card}>
            <Text style={st.cardTitle}>Work History</Text>
            {worker.work_history.map((h: any, i: number) => (
              <View key={i} style={[st.histItem, i < worker.work_history.length - 1 && st.histItemBorder]}>
                <Text style={st.histCompany}>{h.employer_name}</Text>
                <Text style={st.histRole}>{h.role}</Text>
                <Text style={st.histDur}>
                  {h.from_date?.slice(0, 7)} — {h.to_date?.slice(0, 7) ?? 'Present'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Location */}
        {worker.location && (
          <View style={st.card}>
            <Text style={st.cardTitle}>Location</Text>
            <Text style={st.locationText}>
              {[worker.location.city, worker.location.state, worker.location.pincode].filter(Boolean).join(', ')}
            </Text>
            {worker.is_live_in_ok && (
              <View style={st.liveInTag}>
                <Text style={st.liveInText}>🏠 Live-in OK</Text>
              </View>
            )}
          </View>
        )}

        {/* Error */}
        {error ? (
          <View style={st.errorBox}>
            <Text style={st.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Actions */}
        {shortlisted ? (
          <View style={st.successBox}>
            <Text style={st.successText}>✅ Shortlisted! Worker has been notified.</Text>
          </View>
        ) : (
          <View style={st.actionsRow}>
            <TouchableOpacity
              style={[st.actionBtn, st.actionBtnSecondary, isLoading && { opacity: 0.6 }]}
              onPress={handleShortlist}
              disabled={isLoading}
            >
              <Text style={[st.actionBtnText, { color: Colors.primary }]}>
                {isLoading ? 'Saving...' : '⭐ Shortlist'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={st.actionBtn}
              onPress={() => navigation.navigate('HireConfirmed', { workerId: worker.id, requirementId })}
            >
              <Text style={st.actionBtnText}>✅ Confirm Hire</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 16 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  hero: { backgroundColor: Colors.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  skillIcon: { fontSize: 20 },
  skillText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  city: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 10 },
  verifiedBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  verifiedText: { color: '#A7F3D0', fontSize: 13, fontWeight: '700' },
  statsRow: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E2E8F0' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  skillTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  skillTagText: { fontSize: 13, color: Colors.primary, fontWeight: '600', textTransform: 'capitalize' },
  vRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  vLabel: { fontSize: 14, color: Colors.textSecondary },
  vBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  vBadgeDone: { backgroundColor: '#DCFCE7' },
  vBadgePending: { backgroundColor: '#F1F5F9' },
  vBadgeText: { fontSize: 12, fontWeight: '700' },
  histItem: { paddingVertical: 10 },
  histItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  histCompany: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  histRole: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  histDur: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  locationText: { fontSize: 15, color: Colors.textPrimary },
  liveInTag: { backgroundColor: '#EDE9FE', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8, alignSelf: 'flex-start' },
  liveInText: { fontSize: 13, color: '#6B21A8', fontWeight: '600' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  errorText: { fontSize: 14, color: '#B91C1C' },
  successBox: { backgroundColor: '#F0FFF4', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#86EFAC' },
  successText: { fontSize: 15, fontWeight: '700', color: '#166534' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.primary },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
