import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useGetEmployerProfileQuery } from '../../store/api/employerApi';
import { t } from '../../utils/i18n';
import { Colors, Spacing, Typography } from '../../theme';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';

type Step = 'BUSINESS' | 'PAN' | 'DONE';

const STEPS = [
  { id: 'BUSINESS', icon: '🏢', title: 'व्यवसाय जाँच', sub: 'Business Verify' },
  { id: 'PAN',      icon: '💳', title: 'PAN जाँच',    sub: 'PAN Verify' },
  { id: 'DONE',     icon: '✅', title: 'पूरा हुआ',    sub: 'All Done' },
];

export function EmployerVerificationScreen({ navigation }: any) {
  const lang = useSelector((s: RootState) => s.auth.language);
  const { data: employer, isLoading, refetch } = useGetEmployerProfileQuery();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isLoading) return <LoadingSpinner />;

  const verifications: any[] = employer?.verifications ?? [];
  const hasBusiness = verifications.some((v: any) => v.check_type === 'BUSINESS' && v.status === 'VERIFIED');
  const hasPan = verifications.some((v: any) => v.check_type === 'PAN' && v.status === 'VERIFIED');
  const isFullyVerified = hasBusiness && hasPan;

  const getToken = async () => {
    const { SecureStore } = await import('../../utils/storage');
    return await SecureStore.getItemAsync('access_token');
  };

  const mockVerify = async (type: 'business' | 'pan') => {
    setError(''); setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/v1/employer/kyc/mock-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      await refetch();
    } catch (e: any) {
      setError(e.message ?? 'कुछ गलत हुआ / Something went wrong');
    } finally { setLoading(false); }
  };

  if (isFullyVerified) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>सत्यापन पूरा हुआ!</Text>
          <Text style={styles.successSub}>Business Verification Complete</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('EmployerTabs')}>
            <Text style={styles.doneBtnText}>डैशबोर्ड पर जाएं →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>🏢 {t('empVerifyTitle', lang)}</Text>
        <Text style={styles.subtitle}>{t('empVerifySubtitle', lang)}</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Progress steps */}
        <View style={styles.stepsRow}>
          {STEPS.slice(0, 2).map((s, i) => {
            const done = s.id === 'BUSINESS' ? hasBusiness : hasPan;
            return (
              <View key={s.id} style={styles.stepItem}>
                <View style={[styles.stepCircle, done && styles.stepDone]}>
                  <Text style={styles.stepCircleText}>{done ? '✓' : `${i + 1}`}</Text>
                </View>
                <Text style={styles.stepLabel}>{s.icon} {s.title}</Text>
                <Text style={styles.stepSub}>{s.sub}</Text>
              </View>
            );
          })}
        </View>

        {/* Step cards */}
        {/* Business Verification */}
        <View style={[styles.card, hasBusiness && styles.cardDone]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏢</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>व्यवसाय सत्यापन</Text>
              <Text style={styles.cardSub}>Business Verification</Text>
            </View>
            {hasBusiness && <Text style={styles.doneTag}>✅ Done</Text>}
          </View>
          {!hasBusiness && (
            <>
              <Text style={styles.cardDesc}>
                आपके व्यवसाय का नाम और पता जाँचा जाएगा।{'\n'}
                Your business name & address will be verified.
              </Text>
              <TouchableOpacity
                style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
                onPress={() => mockVerify('business')}
                disabled={loading}
              >
                <Text style={styles.actionBtnText}>
                  {loading ? 'जाँच हो रही है...' : '🔍 व्यवसाय जाँचें / Verify Business'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* PAN Verification */}
        <View style={[styles.card, hasPan && styles.cardDone, !hasBusiness && styles.cardLocked]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>PAN सत्यापन</Text>
              <Text style={styles.cardSub}>PAN Card Verification</Text>
            </View>
            {hasPan && <Text style={styles.doneTag}>✅ Done</Text>}
            {!hasBusiness && <Text style={styles.lockedTag}>🔒 Locked</Text>}
          </View>
          {hasBusiness && !hasPan && (
            <>
              <Text style={styles.cardDesc}>
                आपका PAN कार्ड सत्यापित किया जाएगा।{'\n'}
                Your PAN card will be verified.
              </Text>
              <TouchableOpacity
                style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
                onPress={() => mockVerify('pan')}
                disabled={loading}
              >
                <Text style={styles.actionBtnText}>
                  {loading ? 'जाँच हो रही है...' : '💳 PAN जाँचें / Verify PAN'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  errorBox: { backgroundColor: Colors.dangerLight, padding: Spacing.md, borderRadius: 8, marginBottom: Spacing.md },
  errorText: { color: Colors.danger, fontWeight: '600' },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xl },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepCircleText: { fontWeight: '700', color: Colors.textPrimary, fontSize: 14 },
  stepLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  stepSub: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.border },
  cardDone: { borderColor: Colors.success, backgroundColor: '#F0FFF4' },
  cardLocked: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 10 },
  cardIcon: { fontSize: 32 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 12, color: Colors.textSecondary },
  cardDesc: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
  doneTag: { fontSize: 12, fontWeight: '700', color: Colors.success },
  lockedTag: { fontSize: 12, fontWeight: '700', color: Colors.textTertiary },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: Spacing.md, alignItems: 'center' },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { fontSize: 72, marginBottom: Spacing.lg },
  successTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  successSub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
