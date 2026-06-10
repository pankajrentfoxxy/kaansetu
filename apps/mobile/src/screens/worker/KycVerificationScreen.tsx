import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { Input } from '../../components/common/Input';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Icon } from '../../components/common/Icon';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme';
import { SecureStore } from '../../utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';
const IS_DEV = __DEV__ || process.env.NODE_ENV !== 'production' || process.env.EXPO_PUBLIC_DEV_MODE === 'true';

const STEPS = [
  { id: 'SELFIE', icon: 'camera', title: 'अपना फोटो लें', hint: 'सेल्फी लेकर पहचान करें' },
  { id: 'ADDRESS', icon: 'home', title: 'पता दर्ज करें', hint: 'शहर, राज्य और पिनकोड भरें' },
  { id: 'AADHAAR', icon: 'card', title: 'आधार कार्ड जोड़ें', hint: 'DigiLocker से जोड़ें' },
  { id: 'PAN', icon: 'document-text', title: 'PAN कार्ड जाँच', hint: 'PAN नंबर डालें' },
  { id: 'BGC', icon: 'shield-checkmark', title: 'बैकग्राउंड जाँच', hint: '24-48 घंटे में पूरा होगा' },
] as const;

function getActiveStep(verifications: any[], kycStatus: string): number {
  const verified = (type: string) => verifications.some((v: any) => v.check_type === type && v.status === 'VERIFIED');
  if (!verified('SELFIE')) return 0;
  if (!verified('ADDRESS')) return 1;
  if (!verified('AADHAAR')) return 2;
  if (!verified('PAN')) return 3;
  if (kycStatus !== 'FULLY_VERIFIED') return 4;
  return 5;
}

export function KycVerificationScreen({ navigation }: any) {
  const { data: worker, refetch } = useGetWorkerProfileQuery();
  const [error, setError] = useState('');

  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressError, setAddressError] = useState('');

  const [panNumber, setPanNumber] = useState('');
  const [panError, setPanError] = useState('');

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

  const handleSelfie = async () => {
    setError('');
    if (IS_DEV) {
      try { await mockSelfie().unwrap(); refetch(); } catch { setError('फोटो जाँच विफल। फिर कोशिश करें।'); }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const formData = new FormData();
    formData.append('selfie', { uri, name: 'selfie.jpg', type: 'image/jpeg' } as any);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const resp = await fetch(`${BASE_URL}/api/v1/worker/kyc/upload-selfie`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      if (!resp.ok) throw new Error('Upload failed');
      refetch();
    } catch { setError('फोटो अपलोड विफल। फिर कोशिश करें।'); }
  };

  const handleAddress = async () => {
    setAddressError(''); setError('');
    const c = city.trim() || 'Mumbai';
    const s = state.trim() || 'Maharashtra';
    const p = pincode.trim() || '400001';
    try {
      await updateLocation({ city: c, state: s, pincode: p }).unwrap();
      if (IS_DEV) await mockAddress({ city: c, state: s, pincode: p }).unwrap();
      refetch();
    } catch { setAddressError('पता सेव नहीं हुआ। फिर कोशिश करें।'); }
  };

  const handleAadhaar = async () => {
    setError('');
    if (IS_DEV) {
      try { await mockAadhaar().unwrap(); refetch(); } catch { setError('आधार जाँच विफल। फिर कोशिश करें।'); }
      return;
    }
    setError('इस बिल्ड में DigiLocker उपलब्ध नहीं है।');
  };

  const handlePan = async () => {
    setPanError(''); setError('');
    if (IS_DEV) {
      try { await mockPan().unwrap(); refetch(); } catch { setError('PAN जाँच विफल। फिर कोशिश करें।'); }
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) { setPanError('गलत PAN नंबर — जैसे: ABCDE1234F'); return; }
    try { await verifyPan({ pan_number: panNumber }).unwrap(); refetch(); }
    catch { setPanError('PAN जाँच विफल। जाँचें और फिर कोशिश करें।'); }
  };

  const handleBgc = async () => {
    setError('');
    if (IS_DEV) {
      try { await mockBgc().unwrap(); refetch(); } catch { setError('जाँच शुरू नहीं हुई। फिर कोशिश करें।'); }
      return;
    }
    try { await initiateBgc().unwrap(); refetch(); }
    catch { setError('बैकग्राउंड जाँच शुरू नहीं हुई। फिर कोशिश करें।'); }
  };

  if (allDone) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Icon name="checkmark-circle" size={72} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>बधाई हो!</Text>
          <Text style={styles.successBody}>आपकी पहचान पूरी तरह सत्यापित हो गई है। अब आप सभी काम देख सकते हैं।</Text>
          <View style={styles.successBadges}>
            {['सेल्फी', 'पता', 'आधार', 'पैन', 'पुलिस जाँच'].map((b) => (
              <View key={b} style={styles.successBadge}>
                <Icon name="checkmark" size={13} color={Colors.successText} />
                <Text style={styles.successBadgeText}>{b}</Text>
              </View>
            ))}
          </View>
          <Button title="डैशबोर्ड पर जाएं" onPress={() => navigation.navigate('WorkerTabs')} icon="arrow-forward" style={styles.successBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="पहचान सत्यापन" subtitle={`चरण ${activeStep + 1} / 5`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <ProgressBar current={activeStep + 1} total={5} />
        <Text style={styles.hint}>सभी 5 चरण पूरे करें — काम पाने के लिए ज़रूरी है</Text>

        {error ? <AlertCard type="danger" message={error} /> : null}
        {IS_DEV && <AlertCard type="info" message="DEV MODE: टेस्ट KYC चालू — कोई असली API कॉल नहीं" />}

        {STEPS.map((step, index) => {
          const status = getStepStatus(index);
          const isActive = status === 'active';
          const isDone = status === 'done';
          const isLast = index === STEPS.length - 1;

          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.timeline}>
                <View style={[
                  styles.stepDot,
                  isDone && styles.stepDotDone,
                  isActive && styles.stepDotActive,
                ]}>
                  <Icon
                    name={isDone ? 'checkmark' : isActive ? step.icon : 'lock-closed'}
                    size={isDone ? 18 : 18}
                    color={isDone ? '#fff' : isActive ? Colors.primary : Colors.textTertiary}
                  />
                </View>
                {!isLast && <View style={[styles.connector, isDone && styles.connectorDone]} />}
              </View>

              <View style={[styles.stepCard, isActive && styles.stepCardActive, isDone && styles.stepCardDone]}>
                <View style={styles.stepHeadRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepNumber}>चरण {index + 1}</Text>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>
                  {isDone && (
                    <View style={styles.doneTag}>
                      <Text style={styles.doneTagText}>पूरा</Text>
                    </View>
                  )}
                </View>
                {!isDone && <Text style={styles.stepHint}>{step.hint}</Text>}

                {isActive && step.id === 'SELFIE' && (
                  <Button title="फोटो लें" onPress={handleSelfie} loading={mockSelfieLoading} icon="camera" style={styles.stepBtn} />
                )}

                {isActive && step.id === 'ADDRESS' && (
                  <View style={styles.formBlock}>
                    <Input label="शहर" value={city} onChangeText={setCity} placeholder="जैसे: Mumbai" icon="business-outline" />
                    <Input label="राज्य" value={state} onChangeText={setState} placeholder="जैसे: Maharashtra" icon="map-outline" />
                    <Input label="पिनकोड" value={pincode} onChangeText={setPincode} placeholder="400001" keyboardType="number-pad" maxLength={6} icon="mail-outline" />
                    {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
                    <Button title="पता सेव करें" onPress={handleAddress} loading={locationLoading || mockAddressLoading} icon="checkmark" style={styles.stepBtn} />
                  </View>
                )}

                {isActive && step.id === 'AADHAAR' && (
                  <Button title="आधार जोड़ें" onPress={handleAadhaar} loading={mockAadhaarLoading} icon="card" style={styles.stepBtn} />
                )}

                {isActive && step.id === 'PAN' && (
                  <View style={styles.formBlock}>
                    {!IS_DEV && (
                      <Input
                        label="PAN नंबर"
                        value={panNumber}
                        onChangeText={(v) => { setPanNumber(v.toUpperCase()); setPanError(''); }}
                        placeholder="ABCDE1234F"
                        autoCapitalize="characters"
                        maxLength={10}
                        icon="document-text-outline"
                        error={panError || undefined}
                      />
                    )}
                    <Button title="PAN जाँचें" onPress={handlePan} loading={panLoading || mockPanLoading} icon="checkmark" style={styles.stepBtn} />
                  </View>
                )}

                {isActive && step.id === 'BGC' && (
                  kycStatus === 'BGC_INITIATED' ? (
                    <AlertCard type="info" message="जाँच चल रही है — 24-48 घंटे में पूरा होगा" />
                  ) : (
                    <Button title="जाँच शुरू करें" onPress={handleBgc} loading={bgcLoading || mockBgcLoading} icon="shield-checkmark" style={styles.stepBtn} />
                  )
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  hint: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg, marginTop: 2 },

  stepRow: { flexDirection: 'row' },
  timeline: { alignItems: 'center', width: 44 },
  stepDot: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  stepDotActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  stepDotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  connector: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  connectorDone: { backgroundColor: Colors.success },

  stepCard: {
    flex: 1, marginLeft: Spacing.md, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, ...Shadows.sm,
  },
  stepCardActive: { borderColor: Colors.primary, borderWidth: 1.5 },
  stepCardDone: { opacity: 0.85 },
  stepHeadRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepNumber: { ...Typography.tiny, color: Colors.textTertiary, marginBottom: 2 },
  stepTitle: { ...Typography.h3, color: Colors.textPrimary },
  doneTag: { backgroundColor: Colors.successLight, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  doneTagText: { ...Typography.tiny, fontWeight: '700', color: Colors.successText },
  stepHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  formBlock: { marginTop: Spacing.md },
  errorText: { ...Typography.caption, color: Colors.dangerText, marginBottom: Spacing.sm },
  stepBtn: { marginTop: Spacing.md },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  successTitle: { ...Typography.display, color: Colors.textPrimary, marginBottom: Spacing.sm },
  successBody: { ...Typography.bodyLg, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  successBadges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: Spacing.huge },
  successBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successLight, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  successBadgeText: { ...Typography.captionStrong, color: Colors.successText },
  successBtn: { alignSelf: 'stretch' },
});
