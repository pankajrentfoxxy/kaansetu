import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useGetWorkerProfileQuery } from '../../store/api/workerApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { SecureStore } from '../../utils/storage';

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
      const token = await SecureStore.getItemAsync('access_token');
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

  const STEPS = [
    'संबंधित कोर्ट से क्लीयरेंस सर्टिफिकेट लें',
    'उसे नीचे अपलोड करें',
    'हमारी टीम 48 घंटे में जाँचेगी',
    'सही पाए जाने पर प्रोफ़ाइल फिर चालू होगी',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Icon name="pause" size={44} color={Colors.dangerText} />
        </View>
        <Text style={styles.title}>आपकी प्रोफ़ाइल रोक दी गई है</Text>
        <Text style={styles.subtitle}>नियमित जाँच के दौरान एक नया मामला मिला है</Text>

        {lastBlock && (
          <Card style={styles.caseCard}>
            <Text style={styles.caseTitle}>मामले की जानकारी</Text>
            {lastBlock.case_type && <DetailLine label="प्रकार" value={lastBlock.case_type} />}
            {lastBlock.case_district && <DetailLine label="जिला" value={lastBlock.case_district} />}
            <DetailLine label="पता चला" value={new Date(lastBlock.blocked_at).toLocaleDateString('en-IN')} />
          </Card>
        )}

        <AlertCard
          type="warning"
          title="प्लेटफॉर्म की कार्रवाई"
          message="आपकी प्रोफ़ाइल रोक दी गई है। जिन नियोक्ताओं ने आपको शॉर्टलिस्ट किया था उन्हें सूचित कर दिया गया है। आप नए काम के लिए आवेदन नहीं कर सकते।"
        />

        <Card>
          <Text style={styles.stepsTitle}>आगे क्या करें?</Text>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </Card>

        {uploaded ? (
          <AlertCard type="success" message="दस्तावेज़ अपलोड हो गया। हमारी टीम 48 घंटे में जाँचेगी।" />
        ) : (
          <Button title="कोर्ट क्लीयरेंस अपलोड करें" onPress={handleUpload} loading={uploading} variant="primary" icon="document-attach-outline" style={{ marginBottom: Spacing.md }} />
        )}

        <Button title="सहायता से संपर्क करें" onPress={() => Linking.openURL(`tel:${HELPLINE}`)} variant="secondary" icon="call-outline" />
        <Text style={styles.helpline}>हेल्पलाइन: {HELPLINE}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, alignItems: 'center' },
  iconWrap: { width: 92, height: 92, borderRadius: 46, backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, marginBottom: Spacing.lg },
  title: { ...Typography.h1, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  caseCard: { width: '100%', borderLeftWidth: 4, borderLeftColor: Colors.danger },
  caseTitle: { ...Typography.h3, color: Colors.dangerText, marginBottom: Spacing.md },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  detailLabel: { ...Typography.body, color: Colors.textSecondary },
  detailValue: { ...Typography.bodyStrong, color: Colors.textPrimary },
  stepsTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  stepNumText: { ...Typography.captionStrong, color: Colors.primary, fontWeight: '700' },
  stepText: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  helpline: { ...Typography.caption, color: Colors.textTertiary, marginTop: Spacing.md },
});
