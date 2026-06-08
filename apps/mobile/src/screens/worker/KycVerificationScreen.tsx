import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  useGetWorkerProfileQuery,
  useUpdateLocationMutation,
  useVerifyPanMutation,
  useInitiateBgcMutation,
  useMockSelfieMutation,
  useMockAddressMutation,
  useMockAadhaarMutation,
  useMockPanMutation,
  useMockBgcMutation,
} from '../../store/api/workerApi';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { Card } from '../../components/common/Card';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Colors, Spacing, Typography } from '../../theme';
import { SecureStore } from '../../utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const IS_DEV = __DEV__ || process.env.NODE_ENV !== 'production';

// Step order: Selfie → Address → Aadhaar → PAN → BGC
const STEPS = [
  {
    id: 'SELFIE',
    emoji: '🤳',
    hindi: 'अपना फोटो लें',
    english: 'Take Your Photo',
    hint: 'सेल्फी लेकर पहचान करें',
    hintEn: 'Confirm identity with a selfie',
  },
  {
    id: 'ADDRESS',
    emoji: '🏠',
    hindi: 'पता दर्ज करें',
    english: 'Enter Your Address',
    hint: 'शहर, राज्य और पिनकोड भरें',
    hintEn: 'Enter city, state and pincode',
  },
  {
    id: 'AADHAAR',
    emoji: '🪪',
    hindi: 'आधार कार्ड जोड़ें',
    english: 'Link Aadhaar Card',
    hint: 'DigiLocker से जोड़ें',
    hintEn: 'Link via DigiLocker',
  },
  {
    id: 'PAN',
    emoji: '💳',
    hindi: 'PAN कार्ड जाँच',
    english: 'Verify PAN Card',
    hint: 'PAN नंबर डालें',
    hintEn: 'Enter your PAN number',
  },
  {
    id: 'BGC',
    emoji: '🔍',
    hindi: 'बैकग्राउंड जाँच',
    english: 'Background Check',
    hint: '24-48 घंटे में पूरा होगा',
    hintEn: 'Completes in 24–48 hours',
  },
] as const;

type StepId = typeof STEPS[number]['id'];

function getActiveStep(verifications: any[], kycStatus: string): number {
  const verified = (type: string) =>
    verifications.some((v: any) => v.check_type === type && v.status === 'VERIFIED');

  if (!verified('SELFIE')) return 0;
  if (!verified('ADDRESS')) return 1;
  if (!verified('AADHAAR')) return 2;
  if (!verified('PAN')) return 3;
  if (kycStatus !== 'FULLY_VERIFIED') return 4;
  return 5; // all done
}

function StepStatus({ status }: { status: 'done' | 'active' | 'locked' }) {
  if (status === 'done') return <Text style={styles.statusIcon}>✅</Text>;
  if (status === 'active') return <Text style={styles.statusIcon}>⏳</Text>;
  return <Text style={[styles.statusIcon, { opacity: 0.4 }]}>🔒</Text>;
}

export function KycVerificationScreen({ navigation }: any) {
  const { data: worker, refetch } = useGetWorkerProfileQuery();
  const [error, setError] = useState('');

  // Address form state
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressError, setAddressError] = useState('');

  // PAN form state
  const [panNumber, setPanNumber] = useState('');
  const [panError, setPanError] = useState('');

  // Mutations
  const [updateLocation, { isLoading: locationLoading }] = useUpdateLocationMutation();
  const [verifyPan, { isLoading: panLoading }] = useVerifyPanMutation();
  const [initiateBgc, { isLoading: bgcLoading }] = useInitiateBgcMutation();
  const [mockSelfie, { isLoading: mockSelfieLoading }] = useMockSelfieMutation();
  const [mockAddress, { isLoading: mockAddressLoading }] = useMockAddressMutation();
  const [mockAadhaar, { isLoading: mockAadhaarLoading }] = useMockAadhaarMutation();
  const [mockPan, { isLoading: mockPanLoading }] = useMockPanMutation();
  const [mockBgc, { isLoading: mockBgcLoading }] = useMockBgcMutation();

  const kycStatus = worker?.kyc_status ?? 'PENDING';
  const verifications = worker?.verifications ?? [];
  const activeStep = getActiveStep(verifications, kycStatus);
  const allDone = kycStatus === 'FULLY_VERIFIED';

  const getStepStatus = (index: number): 'done' | 'active' | 'locked' => {
    if (index < activeStep) return 'done';
    if (index === activeStep) return 'active';
    return 'locked';
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelfie = async () => {
    setError('');
    if (IS_DEV) {
      try {
        await mockSelfie().unwrap();
        refetch();
      } catch {
        setError('Mock selfie failed. Try again.');
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const formData = new FormData();
    formData.append('selfie', { uri, name: 'selfie.jpg', type: 'image/jpeg' } as any);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const resp = await fetch(`${BASE_URL}/api/v1/worker/kyc/upload-selfie`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!resp.ok) throw new Error('Upload failed');
      refetch();
    } catch {
      setError('Selfie upload failed. Please try again.');
    }
  };

  const handleAddress = async () => {
    setAddressError('');
    setError('');
    const c = city.trim() || 'Mumbai';
    const s = state.trim() || 'Maharashtra';
    const p = pincode.trim() || '400001';
    try {
      await updateLocation({ city: c, state: s, pincode: p }).unwrap();
      if (IS_DEV) {
        await mockAddress({ city: c, state: s, pincode: p }).unwrap();
      }
      refetch();
    } catch {
      setAddressError('Address save failed. Please try again.');
    }
  };

  const handleAadhaar = async () => {
    setError('');
    if (IS_DEV) {
      try {
        await mockAadhaar().unwrap();
        refetch();
      } catch {
        setError('Mock Aadhaar failed. Try again.');
      }
      return;
    }
    // In prod: open DigiLocker flow (handled by native navigation / deep link)
    setError('DigiLocker integration not configured in this build.');
  };

  const handlePan = async () => {
    setPanError('');
    setError('');
    if (IS_DEV) {
      try {
        await mockPan().unwrap();
        refetch();
      } catch {
        setError('Mock PAN failed. Try again.');
      }
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      setPanError('गलत PAN नंबर — जैसे: ABCDE1234F');
      return;
    }
    try {
      await verifyPan({ pan_number: panNumber }).unwrap();
      refetch();
    } catch {
      setPanError('PAN verification failed. Check and try again.');
    }
  };

  const handleBgc = async () => {
    setError('');
    if (IS_DEV) {
      try {
        await mockBgc().unwrap();
        refetch();
      } catch {
        setError('Mock BGC failed. Try again.');
      }
      return;
    }
    try {
      await initiateBgc().unwrap();
      refetch();
    } catch {
      setError('Background check initiation failed. Please try again.');
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (allDone) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>बधाई हो!</Text>
          <Text style={styles.successSubtitle}>Congratulations!</Text>
          <Text style={styles.successBody}>
            आपकी पहचान सफलतापूर्वक सत्यापित हो गई है।{'\n'}
            Your identity has been fully verified.
          </Text>
          <Button
            title="डैशबोर्ड पर जाएं — Go to Dashboard"
            onPress={() => navigation.navigate('WorkerTabs')}
            style={styles.bigButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Main KYC screen ───────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <ProgressBar current={activeStep + 1} total={5} label={`Step ${activeStep + 1} of 5`} />

        <Text style={styles.heading}>पहचान सत्यापन</Text>
        <Text style={styles.subheading}>Identity Verification</Text>
        <Text style={styles.hint}>
          सभी 5 चरण पूरे करें — नौकरी पाने के लिए ज़रूरी है{'\n'}
          Complete all 5 steps to access job matches
        </Text>

        {error ? <AlertCard type="danger" message={error} /> : null}
        {IS_DEV && (
          <AlertCard
            type="info"
            message="DEV MODE: Mock KYC active — no real API calls"
          />
        )}

        {STEPS.map((step, index) => {
          const status = getStepStatus(index);
          const isActive = status === 'active';

          return (
            <Card key={step.id} style={[styles.stepCard, isActive && styles.stepCardActive]}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <View style={styles.stepTitleBlock}>
                  <Text style={styles.stepNumber}>चरण {index + 1} / Step {index + 1}</Text>
                  <Text style={styles.stepHindi}>{step.hindi}</Text>
                  <Text style={styles.stepEnglish}>{step.english}</Text>
                </View>
                <StepStatus status={status} />
              </View>

              <Text style={styles.stepHint}>
                {step.hint} · {step.hintEn}
              </Text>

              {/* Selfie */}
              {isActive && step.id === 'SELFIE' && (
                <Button
                  title="📷  फोटो लें — Take Photo"
                  onPress={handleSelfie}
                  loading={mockSelfieLoading}
                  style={styles.bigButton}
                />
              )}

              {/* Address */}
              {isActive && step.id === 'ADDRESS' && (
                <View style={styles.formBlock}>
                  <Text style={styles.inputLabel}>शहर / City</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="जैसे: Mumbai"
                    placeholderTextColor={Colors.textSecondary}
                  />
                  <Text style={styles.inputLabel}>राज्य / State</Text>
                  <TextInput
                    style={styles.input}
                    value={state}
                    onChangeText={setState}
                    placeholder="जैसे: Maharashtra"
                    placeholderTextColor={Colors.textSecondary}
                  />
                  <Text style={styles.inputLabel}>पिनकोड / Pincode</Text>
                  <TextInput
                    style={styles.input}
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="जैसे: 400001"
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={Colors.textSecondary}
                  />
                  {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
                  <Button
                    title="🏠  पता सेव करें — Save Address"
                    onPress={handleAddress}
                    loading={locationLoading || mockAddressLoading}
                    style={styles.bigButton}
                  />
                </View>
              )}

              {/* Aadhaar */}
              {isActive && step.id === 'AADHAAR' && (
                <Button
                  title="🪪  आधार जोड़ें — Link Aadhaar"
                  onPress={handleAadhaar}
                  loading={mockAadhaarLoading}
                  style={styles.bigButton}
                />
              )}

              {/* PAN */}
              {isActive && step.id === 'PAN' && (
                <View style={styles.formBlock}>
                  {!IS_DEV && (
                    <>
                      <Text style={styles.inputLabel}>PAN नंबर / PAN Number</Text>
                      <TextInput
                        style={styles.input}
                        value={panNumber}
                        onChangeText={(v) => { setPanNumber(v.toUpperCase()); setPanError(''); }}
                        placeholder="ABCDE1234F"
                        autoCapitalize="characters"
                        maxLength={10}
                        placeholderTextColor={Colors.textSecondary}
                      />
                      {panError ? <Text style={styles.errorText}>{panError}</Text> : null}
                    </>
                  )}
                  <Button
                    title="💳  PAN जाँचें — Verify PAN"
                    onPress={handlePan}
                    loading={panLoading || mockPanLoading}
                    style={styles.bigButton}
                  />
                </View>
              )}

              {/* BGC */}
              {isActive && step.id === 'BGC' && (
                <>
                  {kycStatus === 'BGC_INITIATED' ? (
                    <AlertCard
                      type="info"
                      message="जाँच चल रही है — 24-48 घंटे में पूरा होगा\nCheck in progress — results in 24–48 hours"
                    />
                  ) : (
                    <Button
                      title="🔍  जाँच शुरू करें — Start Check"
                      onPress={handleBgc}
                      loading={bgcLoading || mockBgcLoading}
                      style={styles.bigButton}
                    />
                  )}
                </>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Headings
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  hint: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },

  // Step cards
  stepCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border ?? '#E0E0E0',
  },
  stepCardActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight ?? '#F0F7FF',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepEmoji: {
    fontSize: 36,
    marginRight: Spacing.sm,
  },
  stepTitleBlock: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  stepHindi: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  stepEnglish: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusIcon: {
    fontSize: 28,
    marginLeft: Spacing.sm,
  },
  stepHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },

  // Forms
  formBlock: {
    marginTop: Spacing.sm,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border ?? '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    fontSize: 18,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface ?? '#FFFFFF',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger ?? '#D32F2F',
    marginBottom: Spacing.sm,
  },

  // Big CTA button
  bigButton: {
    marginTop: Spacing.md,
    minHeight: 56,
  },

  // Success screen
  successEmoji: {
    fontSize: 72,
    textAlign: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.success ?? '#2E7D32',
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  successBody: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: Spacing.xl,
  },
});
