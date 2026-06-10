import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetCaseAlertsQuery, useMarkAlertActionMutation } from '../../store/api/employerApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { EmptyState } from '../../components/common/EmptyState';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export function CaseAlertScreen({ navigation }: any) {
  const { data: alerts = [] } = useGetCaseAlertsQuery();
  const [markAction, { isLoading }] = useMarkAlertActionMutation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Case Alerts" onBack={() => navigation?.goBack?.()} />
      {alerts.length === 0 ? (
        <EmptyState icon="shield-checkmark-outline" message="No case alerts" subMessage="Your workers are all clear" />
      ) : (
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
          <AlertCard type="warning" title="Action Required" message="Review each alert and mark your action taken." />

          {alerts.map((alert: any) => (
            <Card key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIconWrap}>
                  <Icon name="warning" size={22} color={Colors.dangerText} />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>Security Alert</Text>
                  <DetailLine label="Case" value={alert.case_type} />
                  <DetailLine label="District" value={alert.case_district} />
                  <Text style={styles.alertDate}>Detected {new Date(alert.notified_at).toLocaleDateString('en-IN')}</Text>
                </View>
              </View>

              <AlertCard type="success" title="Platform action taken" message="Worker profile blocked. Cannot apply for new jobs." />

              <Text style={styles.disclaimer}>This is information only. Verify independently before taking legal action.</Text>

              {!alert.employer_action ? (
                <Button
                  title="Mark Action Taken"
                  onPress={() => markAction({ id: alert.id, action: 'acknowledged' })}
                  loading={isLoading}
                  variant="primary"
                  icon="checkmark-done"
                />
              ) : (
                <View style={styles.actionTaken}>
                  <Icon name="checkmark-circle" size={16} color={Colors.successText} />
                  <Text style={styles.actionTakenText}>Action marked: {alert.employer_action}</Text>
                </View>
              )}
            </Card>
          ))}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}: </Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.lg },
  alertCard: { borderLeftWidth: 4, borderLeftColor: Colors.danger },
  alertHeader: { flexDirection: 'row', marginBottom: Spacing.md },
  alertIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  alertInfo: { flex: 1 },
  alertTitle: { ...Typography.h3, color: Colors.dangerText, marginBottom: 4 },
  detailLine: { flexDirection: 'row', marginTop: 1 },
  detailLabel: { ...Typography.body, color: Colors.textSecondary },
  detailValue: { ...Typography.bodyStrong, color: Colors.textPrimary },
  alertDate: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },
  disclaimer: { ...Typography.caption, color: Colors.textTertiary, fontStyle: 'italic', marginBottom: Spacing.md },
  actionTaken: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionTakenText: { ...Typography.captionStrong, color: Colors.successText },
});
