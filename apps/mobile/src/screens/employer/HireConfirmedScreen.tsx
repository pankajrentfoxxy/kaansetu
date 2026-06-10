import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfirmHireMutation, useEsignHireMutation } from '../../store/api/employerApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { Input } from '../../components/common/Input';
import { DateScrollPicker } from '../../components/common/DateScrollPicker';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type Step = 'form' | 'esign' | 'done';

export function HireConfirmedScreen({ navigation, route }: any) {
  const { workerId, requirementId, workerName, _hireId, offerSalary, startDate: initialStartDate } = route.params ?? {};
  const [salary, setSalary] = useState(offerSalary != null ? String(offerSalary) : '');
  const [startDate, setStartDate] = useState(initialStartDate ? String(initialStartDate).slice(0, 10) : '');
  const [esignName, setEsignName] = useState('');
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

  const OfferRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );

  // ── Step 1: Form ──
  if (step === 'form') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="Confirm Hire" subtitle={workerName ? `Hiring ${workerName}` : undefined} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error ? <AlertCard type="danger" message={error} /> : null}

          <Input label="Offered Salary (₹/month)" value={salary} onChangeText={setSalary} keyboardType="number-pad" placeholder="e.g. 20000" icon="cash-outline" />
          <DateScrollPicker label="Start Date" value={startDate} onChange={setStartDate} minYear={new Date().getFullYear()} maxYear={new Date().getFullYear() + 2} />

          <Button title="Confirm & Proceed to E-Sign" onPress={handleConfirm} loading={confirming} icon="arrow-forward" style={{ marginTop: Spacing.lg }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 2: E-Sign ──
  if (step === 'esign') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="E-Sign Offer Letter" onBack={() => { setStep('form'); setError(''); }} />
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.lead}>
            By typing your name below, you are electronically signing the job offer for {workerName ?? 'this worker'}. The worker will receive it and can accept or decline.
          </Text>

          <Card>
            <Text style={styles.cardTitle}>Offer Summary</Text>
            <OfferRow label="Worker" value={workerName ?? 'Worker'} />
            <OfferRow label="Salary" value={`₹${Number(salary).toLocaleString('en-IN')}/mo`} />
            <OfferRow label="Start Date" value={startDate} />
          </Card>

          {error ? <AlertCard type="danger" message={error} /> : null}

          <View style={styles.esignBox}>
            <Text style={styles.esignLabel}>Type your full name to sign</Text>
            <Input value={esignName} onChangeText={setEsignName} placeholder="Your Full Name" autoCapitalize="words" icon="create-outline" />
            {esignName.length > 2 && (
              <View style={styles.signaturePreview}>
                <Text style={styles.signatureText}>{esignName}</Text>
                <Text style={styles.signatureSubtext}>Electronic Signature</Text>
              </View>
            )}
          </View>

          <Button title="Submit & Send Offer" onPress={handleEsign} loading={signing} icon="send" style={{ marginTop: Spacing.md }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 3: Done ──
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.doneInner} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.checkContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.checkCircle}>
            <Icon name="checkmark" size={56} color="#fff" />
          </View>
        </Animated.View>
        <Text style={styles.congrats}>Offer Sent!</Text>
        <Text style={styles.doneSub}>
          The offer letter has been sent to {workerName ?? 'the worker'}. They'll be notified and can accept or decline.
        </Text>

        <Card style={{ alignSelf: 'stretch' }}>
          <Text style={styles.cardTitle}>Offer Details</Text>
          <OfferRow label="Worker" value={workerName ?? 'Worker'} />
          <OfferRow label="Salary" value={`₹${Number(salary).toLocaleString('en-IN')}/mo`} />
          <OfferRow label="Start Date" value={startDate} />
          <OfferRow label="Status" value="Offer Sent" valueColor={Colors.successText} />
        </Card>

        <AlertCard type="info" title="What happens next?" message="The worker will accept or decline. You'll be notified. Background re-checks run every 6 months." />

        <Button title="Post Another Requirement" onPress={() => navigation.navigate('PostRequirement')} variant="secondary" icon="add" style={{ marginTop: Spacing.sm, alignSelf: 'stretch' }} />
        <Button title="Back to Dashboard" onPress={() => navigation.navigate('EmployerTabs')} variant="ghost" style={{ marginTop: Spacing.sm, alignSelf: 'stretch' }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl },
  doneInner: { padding: Spacing.xl, alignItems: 'center' },
  lead: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  cardTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { ...Typography.body, color: Colors.textSecondary },
  rowValue: { ...Typography.bodyStrong, color: Colors.textPrimary },
  esignBox: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, padding: Spacing.lg, marginVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  esignLabel: { ...Typography.captionStrong, color: Colors.textPrimary, marginBottom: Spacing.sm },
  signaturePreview: { marginTop: Spacing.md, borderTopWidth: 2, borderTopColor: Colors.primary, paddingTop: Spacing.sm, alignItems: 'center' },
  signatureText: { fontFamily: 'serif', fontSize: 24, color: Colors.primary, fontStyle: 'italic' },
  signatureSubtext: { ...Typography.tiny, color: Colors.textTertiary, marginTop: 4 },
  checkContainer: { marginTop: Spacing.huge, marginBottom: Spacing.lg, alignItems: 'center' },
  checkCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  congrats: { ...Typography.display, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  doneSub: { ...Typography.bodyLg, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
});
