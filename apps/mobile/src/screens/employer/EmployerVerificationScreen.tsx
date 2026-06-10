import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetEmployerProfileQuery } from '../../store/api/employerApi';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Icon } from '../../components/common/Icon';
import { SecureStore } from '../../utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';

export function EmployerVerificationScreen({ navigation }: any) {
  const { data: employer, isLoading, refetch } = useGetEmployerProfileQuery();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isLoading) return <LoadingSpinner />;

  const verifications: any[] = employer?.verifications ?? [];
  const hasBusiness = verifications.some((v: any) => v.check_type === 'BUSINESS' && v.status === 'VERIFIED');
  const hasPan = verifications.some((v: any) => v.check_type === 'PAN' && v.status === 'VERIFIED');
  const isFullyVerified = hasBusiness && hasPan;

  const mockVerify = async (type: 'business' | 'pan') => {
    setError(''); setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const res = await fetch(`${BASE_URL}/api/v1/employer/kyc/mock-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      await refetch();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally { setLoading(false); }
  };

  if (isFullyVerified) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}><Icon name="checkmark-circle" size={72} color={Colors.success} /></View>
          <Text style={styles.successTitle}>Verification complete!</Text>
          <Text style={styles.successSub}>Your business is now verified. You can post jobs and hire workers.</Text>
          <Button title="Go to Dashboard" onPress={() => navigation.navigate('EmployerTabs')} icon="arrow-forward" style={styles.successBtn} />
        </View>
      </SafeAreaView>
    );
  }

  const steps = [
    {
      id: 'business', icon: 'business', title: 'Business Verification',
      desc: 'Your business name and address will be verified.',
      done: hasBusiness, locked: false,
    },
    {
      id: 'pan', icon: 'card', title: 'PAN Verification',
      desc: 'Your PAN card will be verified.',
      done: hasPan, locked: !hasBusiness,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Business Verification" subtitle="Verify your business to start hiring" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        {error ? <AlertCard type="danger" message={error} /> : null}

        {steps.map((step, index) => {
          const active = !step.done && !step.locked;
          const isLast = index === steps.length - 1;
          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.timeline}>
                <View style={[styles.dot, step.done && styles.dotDone, active && styles.dotActive]}>
                  <Icon
                    name={step.done ? 'checkmark' : step.locked ? 'lock-closed' : step.icon}
                    size={18}
                    color={step.done ? '#fff' : active ? Colors.primary : Colors.textTertiary}
                  />
                </View>
                {!isLast && <View style={[styles.connector, step.done && styles.connectorDone]} />}
              </View>

              <View style={[styles.card, active && styles.cardActive, step.done && styles.cardDone]}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{step.title}</Text>
                  {step.done && <View style={styles.doneTag}><Text style={styles.doneTagText}>Done</Text></View>}
                  {step.locked && <View style={styles.lockTag}><Text style={styles.lockTagText}>Locked</Text></View>}
                </View>
                {active && (
                  <>
                    <Text style={styles.cardDesc}>{step.desc}</Text>
                    <Button
                      title={step.id === 'business' ? 'Verify Business' : 'Verify PAN'}
                      onPress={() => mockVerify(step.id as 'business' | 'pan')}
                      loading={loading}
                      icon="shield-checkmark"
                      style={styles.cardBtn}
                    />
                  </>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  stepRow: { flexDirection: 'row' },
  timeline: { alignItems: 'center', width: 44 },
  dot: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border },
  dotActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  dotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  connector: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  connectorDone: { backgroundColor: Colors.success },

  card: { flex: 1, marginLeft: Spacing.md, marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, ...Shadows.sm },
  cardActive: { borderColor: Colors.primary, borderWidth: 1.5 },
  cardDone: { opacity: 0.85 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...Typography.h3, color: Colors.textPrimary },
  doneTag: { backgroundColor: Colors.successLight, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  doneTagText: { ...Typography.tiny, fontWeight: '700', color: Colors.successText },
  lockTag: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  lockTagText: { ...Typography.tiny, fontWeight: '700', color: Colors.textTertiary },
  cardDesc: { ...Typography.body, color: Colors.textSecondary, marginTop: 6 },
  cardBtn: { marginTop: Spacing.md },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  successTitle: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  successSub: { ...Typography.bodyLg, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.huge },
  successBtn: { alignSelf: 'stretch' },
});
