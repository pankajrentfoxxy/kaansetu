import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGetCaseAlertsQuery, useMarkAlertActionMutation } from '../../store/api/employerApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Spacing, Typography } from '../../theme';

export function CaseAlertScreen() {
  const { data: alerts = [] } = useGetCaseAlertsQuery();
  const [markAction, { isLoading }] = useMarkAlertActionMutation();

  if (alerts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState icon="✅" message="No case alerts" subMessage="Your workers are all clear" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Case Alerts</Text>
        <AlertCard type="warning" title="Action Required" message="Review each alert and mark your action taken." />

        {alerts.map((alert: any) => (
          <Card key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>Security Alert</Text>
                <Text style={styles.alertDetail}>Case: {alert.case_type}</Text>
                <Text style={styles.alertDetail}>District: {alert.case_district}</Text>
                <Text style={styles.alertDate}>Detected: {new Date(alert.notified_at).toLocaleDateString('en-IN')}</Text>
              </View>
            </View>

            <AlertCard
              type="success"
              title="Platform action taken"
              message="Worker profile blocked. Cannot apply for new jobs."
            />

            <Text style={styles.disclaimer}>
              This is information only. Verify independently before taking legal action.
            </Text>

            {!alert.employer_action && (
              <View style={styles.actions}>
                <Button
                  title="Mark Action Taken"
                  onPress={() => markAction({ id: alert.id, action: 'acknowledged' })}
                  loading={isLoading}
                  variant="secondary"
                  style={{ flex: 1, marginRight: Spacing.sm }}
                />
              </View>
            )}
            {alert.employer_action && (
              <Text style={styles.actionTaken}>✓ Action marked: {alert.employer_action}</Text>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.lg },
  title: { ...Typography.h1, color: Colors.danger, marginBottom: Spacing.md },
  alertCard: { borderTopWidth: 4, borderTopColor: Colors.danger },
  alertHeader: { flexDirection: 'row', marginBottom: Spacing.md },
  alertIcon: { fontSize: 30, marginRight: Spacing.sm },
  alertInfo: { flex: 1 },
  alertTitle: { ...Typography.h3, color: Colors.danger, fontWeight: '700' },
  alertDetail: { ...Typography.body, color: Colors.textPrimary },
  alertDate: { ...Typography.caption, color: Colors.textTertiary },
  disclaimer: { ...Typography.tiny, color: Colors.textTertiary, fontStyle: 'italic', marginBottom: Spacing.md },
  actions: { flexDirection: 'row' },
  actionTaken: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
});
