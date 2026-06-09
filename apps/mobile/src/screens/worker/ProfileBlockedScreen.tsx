import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useGetWorkerProfileQuery } from '../../store/api/workerApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography } from '../../theme';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';
const HELPLINE = '18001234567';

export function ProfileBlockedScreen() {
  const { data: worker } = useGetWorkerProfileQuery();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const lastBlock = worker?.blocks?.[worker.blocks.length - 1];

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', { uri: result.assets[0].uri, name: 'clearance.pdf', type: 'application/pdf' } as any);
      const { getItemAsync } = await import('expo-secure-store');
      const token = await getItemAsync('access_token');
      await fetch(`${BASE_URL}/api/v1/worker/reinstatement/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setUploaded(true);
    } catch {
      // silent fail, user can retry
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.icon}>🛡️</Text>
        <Text style={styles.title}>Your profile has been paused</Text>
        <Text style={styles.subtitle}>A new case was found during routine verification</Text>

        {lastBlock && (
          <Card style={styles.caseCard}>
            <Text style={styles.caseTitle}>Case Details</Text>
            {lastBlock.case_type && <Text style={styles.caseDetail}>Type: {lastBlock.case_type}</Text>}
            {lastBlock.case_district && <Text style={styles.caseDetail}>District: {lastBlock.case_district}</Text>}
            <Text style={styles.caseDetail}>Detected: {new Date(lastBlock.blocked_at).toLocaleDateString('en-IN')}</Text>
          </Card>
        )}

        <AlertCard
          type="info"
          title="Platform action taken"
          message="Your profile is blocked. Employers who had you shortlisted have been notified. You cannot apply for new jobs."
        />

        <Card>
          <Text style={styles.stepsTitle}>What next?</Text>
          <Text style={styles.step}>1. Obtain a court clearance certificate from the relevant court</Text>
          <Text style={styles.step}>2. Upload it below for our team to review</Text>
          <Text style={styles.step}>3. Our team will review within 48 hours</Text>
          <Text style={styles.step}>4. If cleared, your profile will be reinstated</Text>
        </Card>

        {uploaded ? (
          <AlertCard type="success" message="Document uploaded. Our team will review within 48 hours." />
        ) : (
          <Button
            title="📄 Upload Court Clearance"
            onPress={handleUpload}
            loading={uploading}
            variant="secondary"
            style={{ marginBottom: Spacing.md }}
          />
        )}

        <Button
          title="📞 Contact Support"
          onPress={() => Linking.openURL(`tel:${HELPLINE}`)}
          variant="ghost"
        />
        <Text style={styles.helpline}>Helpline: {HELPLINE}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dangerLight },
  inner: { padding: Spacing.xxl, alignItems: 'center' },
  icon: { fontSize: 72, marginBottom: Spacing.lg },
  title: { ...Typography.h1, color: Colors.danger, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  caseCard: { width: '100%', borderLeftWidth: 4, borderLeftColor: Colors.danger },
  caseTitle: { ...Typography.h3, color: Colors.danger, marginBottom: Spacing.sm },
  caseDetail: { ...Typography.body, color: Colors.textPrimary, marginBottom: 4 },
  stepsTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  step: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.sm },
  helpline: { ...Typography.caption, color: Colors.textTertiary, marginTop: Spacing.md },
});
