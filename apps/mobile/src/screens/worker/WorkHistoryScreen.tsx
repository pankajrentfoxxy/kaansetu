import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useGetWorkerProfileQuery, useUpdateHistoryMutation } from '../../store/api/workerApi';
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
  is_current: boolean;
}

const emptyEntry = (): HistoryEntry => ({
  employer_name: '',
  role: '',
  from_date: '',
  to_date: '',
  reference_name: '',
  reference_mobile: '',
  leave_reason: '',
  is_current: false,
});

/** Normalise "2021-6" → "2021-06" and validate YYYY-MM */
function parseDate(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  // Accept YYYY-MM or YYYY-MM-DD
  const match = cleaned.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (year < 1970 || year > 2030) return null;
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function WorkHistoryScreen({ navigation }: any) {
  const { data: worker } = useGetWorkerProfileQuery();
  const [entries, setEntries] = useState<HistoryEntry[]>([emptyEntry()]);
  const [prefilled, setPrefilled] = useState(false);
  const [error, setError] = useState('');
  const [updateHistory, { isLoading }] = useUpdateHistoryMutation();

  // Pre-fill from existing work history
  useEffect(() => {
    if (worker?.work_history?.length && !prefilled) {
      const existing: HistoryEntry[] = worker.work_history.map((h: any) => ({
        employer_name: h.employer_name ?? '',
        role: h.role ?? '',
        from_date: h.from_date ? h.from_date.slice(0, 7) : '',   // ISO → YYYY-MM
        to_date: h.to_date ? h.to_date.slice(0, 7) : '',
        reference_name: h.reference_name ?? '',
        reference_mobile: h.reference_mobile ?? '',
        leave_reason: h.leave_reason ?? '',
        is_current: h.is_current ?? false,
      }));
      setEntries(existing);
      setPrefilled(true);
    }
  }, [worker, prefilled]);

  const update = (idx: number, field: keyof HistoryEntry, value: string | boolean) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSave = async () => {
    setError('');
    const filled = entries.filter((e) => e.employer_name.trim());

    // Validate each filled entry
    for (let i = 0; i < filled.length; i++) {
      const e = filled[i];
      if (!e.role.trim()) {
        setError(`Employer ${i + 1}: Role/designation is required`);
        return;
      }
      if (!parseDate(e.from_date)) {
        setError(`Employer ${i + 1}: Enter valid From date (e.g. 2021-06)`);
        return;
      }
      if (e.to_date && !parseDate(e.to_date)) {
        setError(`Employer ${i + 1}: Enter valid To date (e.g. 2023-12) or leave blank`);
        return;
      }
    }

    try {
      await updateHistory({
        history: filled.map((e) => ({
          employer_name: e.employer_name.trim(),
          role: e.role.trim(),
          from_date: parseDate(e.from_date)!,
          to_date: e.to_date ? parseDate(e.to_date) : null,
          is_current: !e.to_date,
          reference_name: e.reference_name || undefined,
          reference_mobile: e.reference_mobile || undefined,
          leave_reason: e.leave_reason || undefined,
        })),
      }).unwrap();
      navigation.navigate('LocationPreferences');
    } catch {
      setError('Failed to save. Please try again.');
    }
  };

  const handleSkip = () => navigation.navigate('LocationPreferences');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <ProgressBar current={3} total={7} label="Step 3 of 7" />
        <Text style={styles.title}>Work History</Text>
        <Text style={styles.subtitle}>पिछले नियोक्ता की जानकारी / Previous employer info</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        {entries.map((entry, i) => (
          <Card key={i} style={styles.card}>
            <Text style={styles.cardTitle}>Employer {i + 1}{i === 0 ? ' *' : ' (Optional)'}</Text>

            <Input
              label="Company / Employer Name *"
              value={entry.employer_name}
              onChangeText={(v) => update(i, 'employer_name', v)}
              placeholder="e.g. Sharma Household / ABC Pvt Ltd"
            />
            <Input
              label="Your Role / Designation *"
              value={entry.role}
              onChangeText={(v) => update(i, 'role', v)}
              placeholder="e.g. Driver, Cook, Security Guard"
            />
            <Input
              label="From Date * (YYYY-MM)"
              value={entry.from_date}
              onChangeText={(v) => update(i, 'from_date', v)}
              placeholder="2021-06"
              keyboardType="number-pad"
            />
            <Input
              label="To Date (YYYY-MM) — leave blank if current job"
              value={entry.to_date}
              onChangeText={(v) => update(i, 'to_date', v)}
              placeholder="2023-12"
              keyboardType="number-pad"
            />
            <Input
              label="Reference Name (Optional)"
              value={entry.reference_name}
              onChangeText={(v) => update(i, 'reference_name', v)}
              placeholder="Manager / Owner name"
            />
            <Input
              label="Reference Mobile (Optional)"
              value={entry.reference_mobile}
              onChangeText={(v) => update(i, 'reference_mobile', v)}
              keyboardType="phone-pad"
              placeholder="10-digit mobile"
              maxLength={10}
            />
            <Text style={styles.label}>Reason for leaving</Text>
            <ChipGroup
              options={LEAVE_REASONS}
              selected={[entry.leave_reason]}
              onToggle={(v) => update(i, 'leave_reason', v)}
              multiSelect={false}
            />
          </Card>
        ))}

        {entries.length < 3 && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setEntries((p) => [...p, emptyEntry()])}>
            <Text style={styles.addText}>+ Add Another Employer (Optional)</Text>
          </TouchableOpacity>
        )}

        <Button title="Save & Continue" onPress={handleSave} loading={isLoading} style={styles.btn} />

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip — No work history / Fresher</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  card: { marginBottom: Spacing.lg },
  cardTitle: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.md },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  addBtn: {
    paddingVertical: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 8, borderStyle: 'dashed',
    marginBottom: Spacing.md,
  },
  addText: { ...Typography.body, color: Colors.primary },
  btn: { marginTop: Spacing.sm },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.lg },
  skipText: { ...Typography.body, color: Colors.textSecondary, textDecorationLine: 'underline' },
});
