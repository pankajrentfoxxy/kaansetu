import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGetWorkerProfileQuery, useVerifyPanMutation, useInitiateBgcMutation } from '../../store/api/workerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { VerificationCard } from '../../components/worker/VerificationCard';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { Card } from '../../components/common/Card';
import { Colors, Spacing, Typography } from '../../theme';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function KycVerificationScreen({ navigation }: any) {
  const { data: worker, refetch } = useGetWorkerProfileQuery();
  const [consentGiven, setConsentGiven] = useState(false);
  const [consent2Given, setConsent2Given] = useState(false);
  const [panNumber, setPanNumber] = useState('');
  const [panError, setPanError] = useState('');
  const [verifyPan, { isLoading: panLoading }] = useVerifyPanMutation();
  const [initiateBgc, { isLoading: bgcLoading }] = useInitiateBgcMutation();
  const [error, setError] = useState('');

  const kycStatus = worker?.kyc_status ?? 'PENDING';
  const verifications = worker?.verifications ?? [];

  const hasVerification = (type: string) =>
    verifications.some((v: any) => v.check_type === type && v.status === 'VERIFIED');

  const currentStep = () => {
    if (!hasVerification('AADHAAR')) return 1;
    if (!hasVerification('PAN')) return 2;
    if (!hasVerification('SELFIE')) return 3;
    if (kycStatus === 'BGC_INITIATED') return 4;
    return 5;
  };

  const step = currentStep();
  const consentDone = consentGiven && consent2Given;

  const handlePanVerify = async () => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      setPanError('Invalid PAN format (e.g. ABCDE1234F)');
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
    try {
      await initiateBgc().unwrap();
      refetch();
    } catch {
      setError('BGC initiation failed. Please try again.');
    }
  };

  const handleSelfieUpload = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const formData = new FormData();
    formData.append('selfie', { uri, name: 'selfie.jpg', type: 'image/jpeg' } as any);
    try {
      const token = await (await import('expo-secure-store')).getItemAsync('access_token');
      await fetch(`${BASE_URL}/api/v1/worker/kyc/upload-selfie`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      refetch();
    } catch {
      setError('Selfie upload failed. Please try again.');
    }
  };

  if (!consentDone) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.title}>Consent Required</Text>
          <AlertCard type="info" message="Before we can verify your identity, we need your consent." />
          <Card>
            <TouchableOpacity style={styles.checkRow} onPress={() => setConsentGiven(!consentGiven)}>
              <Text style={styles.checkBox}>{consentGiven ? '☑' : '☐'}</Text>
              <Text style={styles.checkText}>I agree to share my Aadhaar data for identity verification</Text>
            </TouchableOpacity>
          </Card>
          <Card>
            <TouchableOpacity style={styles.checkRow} onPress={() => setConsent2Given(!consent2Given)}>
              <Text style={styles.checkBox}>{consent2Given ? '☑' : '☐'}</Text>
              <Text style={styles.checkText}>I understand my data will be checked periodically for criminal records (every 180 days)</Text>
            </TouchableOpacity>
          </Card>
          <Button
            title="I Agree — Continue to KYC"
            onPress={() => {}}
            disabled={!consentGiven || !consent2Given}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <ProgressBar current={step} total={5} label={`Step ${step} of 5`} />
        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>Complete all steps to access job matches</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        <VerificationCard
          title="Aadhaar (via DigiLocker)"
          icon="🪪"
          status={hasVerification('AADHAAR') ? 'verified' : 'pending'}
          description="Link your Aadhaar to auto-fill your details"
          actionLabel="Link Aadhaar via DigiLocker"
          onAction={() => {}}
        />

        <VerificationCard
          title="PAN Card"
          icon="🪪"
          status={hasVerification('PAN') ? 'verified' : hasVerification('AADHAAR') ? 'pending' : 'in_progress'}
          description="Enter your PAN number"
        >
          {hasVerification('AADHAAR') && !hasVerification('PAN') && (
            <View style={{ marginTop: Spacing.sm }}>
              <Input
                label="PAN Number"
                value={panNumber}
                onChangeText={(v) => { setPanNumber(v.toUpperCase()); setPanError(''); }}
                error={panError}
                placeholder="ABCDE1234F"
                maxLength={10}
                autoCapitalize="characters"
              />
              <Button title="Verify PAN" onPress={handlePanVerify} loading={panLoading} />
            </View>
          )}
        </VerificationCard>

        <VerificationCard
          title="Selfie Capture"
          icon="🤳"
          status={hasVerification('SELFIE') ? 'verified' : 'pending'}
          description="Take a photo to confirm your identity"
          actionLabel="Take Selfie"
          onAction={hasVerification('PAN') ? handleSelfieUpload : undefined}
        />

        <VerificationCard
          title="Criminal Background Check"
          icon="🔍"
          status={
            kycStatus === 'FULLY_VERIFIED' ? 'verified'
            : kycStatus === 'BGC_INITIATED' ? 'in_progress'
            : 'pending'
          }
          description={kycStatus === 'BGC_INITIATED' ? 'Check in progress (24–48 hrs)' : 'Initiated after selfie'}
          actionLabel="Start Background Check"
          onAction={hasVerification('SELFIE') && kycStatus !== 'BGC_INITIATED' ? handleBgc : undefined}
          loading={bgcLoading}
        />

        <VerificationCard
          title="Address Verification"
          icon="📍"
          status={kycStatus === 'FULLY_VERIFIED' ? 'verified' : 'pending'}
          description="Verified as part of background check"
        />

        {kycStatus === 'FULLY_VERIFIED' && (
          <Button title="Go to Dashboard →" onPress={() => navigation.navigate('WorkerTabs')} style={{ marginTop: Spacing.xl }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkBox: { fontSize: 20, marginRight: Spacing.sm, color: Colors.primary },
  checkText: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
});
