import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, Linking } from 'react-native';
import { useConfirmHireMutation } from '../../store/api/employerApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { Input } from '../../components/common/Input';
import { Colors, Spacing, Typography } from '../../theme';

export function HireConfirmedScreen({ navigation, route }: any) {
  const { workerId, requirementId, workerName, role, companyName } = route.params ?? {};
  const [salary, setSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [offerUrl, setOfferUrl] = useState('');
  const [error, setError] = useState('');
  const [confirmHire, { isLoading }] = useConfirmHireMutation();

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (confirmed) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 5 }).start();
    }
  }, [confirmed]);

  const handleConfirm = async () => {
    if (!salary || !startDate) { setError('Enter salary and start date'); return; }
    try {
      const result = await confirmHire({
        worker_id: workerId,
        requirement_id: requirementId,
        offer_salary: Number(salary),
        start_date: startDate,
      }).unwrap();
      setOfferUrl(result.offer_letter_url ?? '');
      setConfirmed(true);
    } catch {
      setError('Failed to confirm hire. Please try again.');
    }
  };

  if (!confirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.title}>Confirm Hire</Text>
          {error ? <AlertCard type="danger" message={error} /> : null}
          <Input label="Offered Salary (₹/month)" value={salary} onChangeText={setSalary} keyboardType="number-pad" placeholder="e.g. 20000" />
          <Input label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2024-03-01" keyboardType="number-pad" />
          <Button title="Confirm & Generate Offer Letter" onPress={handleConfirm} loading={isLoading} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Animated.View style={[styles.checkContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkIcon}>✅</Text>
        </Animated.View>
        <Text style={styles.congrats}>Congratulations!</Text>
        <Text style={styles.subtitle}>Job offer confirmed successfully</Text>

        <Card>
          <Text style={styles.sectionTitle}>Offer Details</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Worker</Text><Text style={styles.rowValue}>{workerName ?? 'Worker'}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Role</Text><Text style={styles.rowValue}>{role ?? '—'}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Salary</Text><Text style={styles.rowValue}>₹{Number(salary).toLocaleString('en-IN')}/mo</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Start Date</Text><Text style={styles.rowValue}>{startDate}</Text></View>
        </Card>

        <AlertCard
          type="info"
          title="Background re-checks scheduled"
          message="This worker will be re-verified every 6 months. You'll be alerted immediately if any case is found."
        />

        <Card>
          <Text style={styles.sectionTitle}>Offer Letter</Text>
          <Text style={styles.desc}>Generated and sent to both parties</Text>
          {offerUrl ? (
            <Button title="📄 Download Offer Letter" onPress={() => Linking.openURL(offerUrl)} variant="secondary" />
          ) : null}
        </Card>

        <Button title="Post Another Requirement" onPress={() => navigation.navigate('PostRequirement')} variant="ghost" style={{ marginTop: Spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xxl, alignItems: 'center' },
  checkContainer: { marginBottom: Spacing.lg },
  checkIcon: { fontSize: 72 },
  congrats: { ...Typography.h1, color: Colors.success, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { ...Typography.body, color: Colors.textSecondary },
  rowValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  desc: { ...Typography.caption, color: Colors.textTertiary, marginBottom: Spacing.md },
});
