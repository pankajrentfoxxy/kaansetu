import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, Alert } from 'react-native';
import { useConfirmHireMutation, useEsignHireMutation } from '../../store/api/employerApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { Input } from '../../components/common/Input';
import { DateScrollPicker } from '../../components/common/DateScrollPicker';
import { Colors, Spacing, Typography } from '../../theme';

type Step = 'form' | 'esign' | 'done';

export function HireConfirmedScreen({ navigation, route }: any) {
  const { workerId, requirementId, workerName, role, companyName, _hireId } = route.params ?? {};
  const [salary, setSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [esignName, setEsignName] = useState('');
  // If coming from Hires tab with existing hire, skip straight to e-sign step
  const [hireId, setHireId] = useState(_hireId ?? '');
  const [step, setStep] = useState<Step>(_hireId ? 'esign' : 'form');
  const [error, setError] = useState('');

  const [confirmHire, { isLoading: confirming }] = useConfirmHireMutation();
  const [esignHire, { isLoading: signing }] = useEsignHireMutation();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (step === 'done') {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 5 }).start();
    }
  }, [step]);

  const handleConfirm = async () => {
    if (!salary) { setError('Please enter the offered salary'); return; }
    if (!startDate) { setError('Please select a start date'); return; }
    if (isNaN(Number(salary)) || Number(salary) <= 0) { setError('Enter a valid salary amount'); return; }
    setError('');
    try {
      const result = await confirmHire({
        worker_id: workerId,
        requirement_id: requirementId,
        offer_salary: Number(salary),
        start_date: startDate,
      }).unwrap();
      setHireId(result.id);
      setStep('esign');
    } catch (e: any) {
      setError(e?.data?.error ?? e?.message ?? 'Failed to confirm hire. Please try again.');
    }
  };

  const handleEsign = async () => {
    if (!esignName.trim()) { setError('Please type your full name to e-sign'); return; }
    if (esignName.trim().length < 3) { setError('Please enter your complete name'); return; }
    setError('');
    try {
      await esignHire({ hireId, employer_signature_name: esignName.trim() }).unwrap();
      setStep('done');
    } catch (e: any) {
      setError(e?.data?.error ?? e?.message ?? 'E-sign failed. Please try again.');
    }
  };

  // ── Step 1: Form ──────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.title}>✅ Confirm Hire</Text>
          <Text style={styles.subtitle}>
            {workerName ? `Hiring ${workerName}` : 'Enter offer details below'}
          </Text>

          {error ? <AlertCard type="danger" message={error} /> : null}

          <Input
            label="Offered Salary (₹/month) *"
            value={salary}
            onChangeText={setSalary}
            keyboardType="number-pad"
            placeholder="e.g. 20000"
          />

          <DateScrollPicker
            label="Start Date *"
            value={startDate}
            onChange={setStartDate}
            minYear={new Date().getFullYear()}
            maxYear={new Date().getFullYear() + 2}
          />

          <Button
            title={confirming ? 'Creating Offer...' : 'Confirm & Proceed to E-Sign'}
            onPress={handleConfirm}
            loading={confirming}
            style={{ marginTop: Spacing.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 2: E-Sign ────────────────────────────────────────────────────────
  if (step === 'esign') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.esignIcon}>✍️</Text>
          <Text style={styles.title}>E-Sign the Offer Letter</Text>
          <Text style={styles.subtitle}>
            By typing your name below, you are electronically signing the job offer for {workerName ?? 'this worker'}.
            The worker will receive the offer and can accept or reject it.
          </Text>

          <Card>
            <Text style={styles.sectionTitle}>Offer Summary</Text>
            <View style={styles.row}><Text style={styles.rowLabel}>Worker</Text><Text style={styles.rowValue}>{workerName ?? 'Worker'}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Salary</Text><Text style={styles.rowValue}>₹{Number(salary).toLocaleString('en-IN')}/mo</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Start Date</Text><Text style={styles.rowValue}>{startDate}</Text></View>
          </Card>

          {error ? <AlertCard type="danger" message={error} /> : null}

          <View style={styles.esignBox}>
            <Text style={styles.esignLabel}>Type your full name to sign</Text>
            <Input
              label=""
              value={esignName}
              onChangeText={setEsignName}
              placeholder="Your Full Name"
              autoCapitalize="words"
            />
            {esignName.length > 2 && (
              <View style={styles.signaturePreview}>
                <Text style={styles.signatureText}>{esignName}</Text>
                <Text style={styles.signatureSubtext}>Electronic Signature</Text>
              </View>
            )}
          </View>

          <Button
            title={signing ? 'Submitting...' : '✅ Submit & Send Offer to Worker'}
            onPress={handleEsign}
            loading={signing}
            style={{ marginTop: Spacing.md }}
          />

          <Button
            title="← Go Back"
            onPress={() => { setStep('form'); setError(''); }}
            variant="ghost"
            style={{ marginTop: Spacing.sm }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 3: Done ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Animated.View style={[styles.checkContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkIcon}>🎉</Text>
        </Animated.View>
        <Text style={styles.congrats}>Offer Sent!</Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>
          The offer letter has been sent to {workerName ?? 'the worker'}. They will receive a notification and can accept or decline it.
        </Text>

        <Card>
          <Text style={styles.sectionTitle}>Offer Details</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Worker</Text><Text style={styles.rowValue}>{workerName ?? 'Worker'}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Salary</Text><Text style={styles.rowValue}>₹{Number(salary).toLocaleString('en-IN')}/mo</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Start Date</Text><Text style={styles.rowValue}>{startDate}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Status</Text><Text style={[styles.rowValue, { color: '#16A34A' }]}>✅ Offer Sent</Text></View>
        </Card>

        <AlertCard
          type="info"
          title="What happens next?"
          message="The worker will review your offer and either accept or decline. You'll be notified of their decision. Background re-checks are scheduled every 6 months."
        />

        <Button
          title="Post Another Requirement"
          onPress={() => navigation.navigate('PostRequirement')}
          variant="secondary"
          style={{ marginTop: Spacing.md }}
        />
        <Button
          title="Back to Dashboard"
          onPress={() => navigation.navigate('EmployerTabs')}
          variant="ghost"
          style={{ marginTop: Spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xxl, alignItems: 'stretch' },
  checkContainer: { marginBottom: Spacing.lg, alignItems: 'center' },
  checkIcon: { fontSize: 72 },
  congrats: { ...Typography.h1, color: Colors.success, textAlign: 'center', marginBottom: Spacing.sm },
  esignIcon: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { ...Typography.body, color: Colors.textSecondary },
  rowValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  esignBox: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: Colors.border },
  esignLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  signaturePreview: {
    marginTop: 12, borderTopWidth: 2, borderTopColor: Colors.primary, paddingTop: 8, alignItems: 'center',
  },
  signatureText: { fontFamily: 'serif', fontSize: 22, color: Colors.primary, fontStyle: 'italic' },
  signatureSubtext: { fontSize: 11, color: Colors.textTertiary, marginTop: 4 },
});
