import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useUpdateHistoryMutation } from '../../store/api/workerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Input } from '../../components/common/Input';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography } from '../../theme';

const LEAVE_REASONS = [
  { value: 'better_pay', label: 'Better pay' },
  { value: 'family', label: 'Family reason' },
  { value: 'relocation', label: 'Relocation' },
  { value: 'contract_end', label: 'Contract ended' },
  { value: 'other', label: 'Other' },
];

interface HistoryEntry {
  employer_name: string;
  role: string;
  from_date: string;
  to_date: string;
  reference_name: string;
  reference_mobile: string;
  leave_reason: string;
}

const emptyEntry = (): HistoryEntry => ({
  employer_name: '',
  role: '',
  from_date: '',
  to_date: '',
  reference_name: '',
  reference_mobile: '',
  leave_reason: '',
});

export function WorkHistoryScreen({ navigation }: any) {
  const [entries, setEntries] = useState<HistoryEntry[]>([emptyEntry()]);
  const [error, setError] = useState('');
  const [updateHistory, { isLoading }] = useUpdateHistoryMutation();

  const update = (idx: number, field: keyof HistoryEntry, value: string) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!entries[0].employer_name) { setError('Enter at least one employer'); return; }
    setError('');
    try {
      await updateHistory({ history: entries.filter((e) => e.employer_name) }).unwrap();
      navigation.navigate('LocationPreferences');
    } catch {
      setError('Failed to save. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <ProgressBar current={3} total={7} label="Step 3 of 7" />
        <Text style={styles.title}>Work History</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        {entries.map((entry, i) => (
          <Card key={i} style={styles.card}>
            <Text style={styles.cardTitle}>Employer {i + 1}{i === 0 ? ' (Required)' : ''}</Text>
            <Input label="Company / Employer Name" value={entry.employer_name} onChangeText={(v) => update(i, 'employer_name', v)} placeholder="e.g. Sharma Household" />
            <Input label="Your Role" value={entry.role} onChangeText={(v) => update(i, 'role', v)} placeholder="e.g. Driver" />
            <Input label="From (YYYY-MM)" value={entry.from_date} onChangeText={(v) => update(i, 'from_date', v)} placeholder="2021-06" keyboardType="number-pad" />
            <Input label="To (YYYY-MM or blank if current)" value={entry.to_date} onChangeText={(v) => update(i, 'to_date', v)} placeholder="2023-12" keyboardType="number-pad" />
            <Input label="Reference Name" value={entry.reference_name} onChangeText={(v) => update(i, 'reference_name', v)} placeholder="Optional" />
            <Input label="Reference Mobile" value={entry.reference_mobile} onChangeText={(v) => update(i, 'reference_mobile', v)} keyboardType="phone-pad" placeholder="Optional" />
            {i === 0 && (
              <>
                <Text style={styles.label}>Reason for leaving</Text>
                <ChipGroup
                  options={LEAVE_REASONS}
                  selected={[entry.leave_reason]}
                  onToggle={(v) => update(i, 'leave_reason', v)}
                  multiSelect={false}
                />
              </>
            )}
          </Card>
        ))}

        {entries.length < 2 && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setEntries((p) => [...p, emptyEntry()])}>
            <Text style={styles.addText}>+ Add Employer 2 (Optional)</Text>
          </TouchableOpacity>
        )}

        <Button title="Save & Continue" onPress={handleSave} loading={isLoading} style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.lg },
  card: {},
  cardTitle: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.md },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs },
  addBtn: { paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary, borderRadius: 8, borderStyle: 'dashed' },
  addText: { ...Typography.body, color: Colors.primary },
  btn: { marginTop: Spacing.xl },
});
