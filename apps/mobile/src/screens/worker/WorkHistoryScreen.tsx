import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetWorkerProfileQuery, useUpdateHistoryMutation } from '../../store/api/workerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Input } from '../../components/common/Input';
import { ChipGroup } from '../../components/common/ChipGroup';
import { DateScrollPicker } from '../../components/common/DateScrollPicker';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AlertCard } from '../../components/common/AlertCard';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { useT } from '../../utils/i18n';

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
  employer_name: '', role: '', from_date: '', to_date: '',
  reference_name: '', reference_mobile: '', leave_reason: '', is_current: false,
});

function parseDate(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  // Year-only ("YYYY") → Jan 1 of that year.
  const yearMatch = cleaned.match(/^(\d{4})$/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    return y >= 1970 && y <= 2030 ? `${y}-01-01` : null;
  }
  const match = cleaned.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (year < 1970 || year > 2030) return null;
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function WorkHistoryScreen({ navigation }: any) {
  const tr = useT();
  const LEAVE_REASONS = [
    { value: 'better_pay', label: tr('betterPay') },
    { value: 'family', label: tr('familyReason') },
    { value: 'relocation', label: tr('relocation') },
    { value: 'contract_end', label: tr('contractEnded') },
    { value: 'other', label: tr('other') },
  ];
  const { data: worker } = useGetWorkerProfileQuery();
  const [entries, setEntries] = useState<HistoryEntry[]>([emptyEntry()]);
  const [prefilled, setPrefilled] = useState(false);
  const [error, setError] = useState('');
  const [updateHistory, { isLoading }] = useUpdateHistoryMutation();

  useEffect(() => {
    if (worker?.work_history?.length && !prefilled) {
      const existing: HistoryEntry[] = worker.work_history.map((h: any) => ({
        employer_name: h.employer_name ?? '',
        role: h.role ?? '',
        from_date: h.from_date ? h.from_date.slice(0, 4) : '',
        to_date: h.to_date ? h.to_date.slice(0, 4) : '',
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

    for (let i = 0; i < filled.length; i++) {
      const e = filled[i];
      if (!e.role.trim()) { setError(`${tr('employerN')} ${i + 1}: ${tr('yourRole')}`); return; }
      if (!parseDate(e.from_date)) { setError(`${tr('employerN')} ${i + 1}: ${tr('fromYear')}`); return; }
      if (e.to_date && !parseDate(e.to_date)) { setError(`${tr('employerN')} ${i + 1}: ${tr('toYear')}`); return; }
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
      setError(tr('saveFailed'));
    }
  };

  const handleSkip = () => navigation.navigate('LocationPreferences');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title={tr('workHistory')} subtitle={`${tr('stepOf')} 3 / 7`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ProgressBar current={3} total={7} />
        <Text style={styles.subtitle}>{tr('prevEmployerInfo')}</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        {entries.map((entry, i) => (
          <Card key={i} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardNum}><Text style={styles.cardNumText}>{i + 1}</Text></View>
              <Text style={styles.cardTitle}>{tr('employerN')} {i + 1}{i === 0 ? '' : ` (${tr('optional')})`}</Text>
            </View>

            <Input label={tr('companyEmployerName')} value={entry.employer_name} onChangeText={(v) => update(i, 'employer_name', v)} placeholder="ABC Pvt Ltd" icon="business-outline" />
            <Input label={tr('yourRole')} value={entry.role} onChangeText={(v) => update(i, 'role', v)} placeholder={tr('worker')} icon="briefcase-outline" />
            <DateScrollPicker label={tr('fromYear')} value={entry.from_date} onChange={(v) => update(i, 'from_date', v)} yearOnly maxYear={new Date().getFullYear()} />
            <DateScrollPicker label={tr('toYear')} value={entry.to_date} onChange={(v) => update(i, 'to_date', v)} yearOnly maxYear={new Date().getFullYear()} />
            <Input label={`${tr('refName')} (${tr('optional')})`} value={entry.reference_name} onChangeText={(v) => update(i, 'reference_name', v)} placeholder={tr('refName')} icon="person-outline" />
            <Input label={`${tr('refMobile')} (${tr('optional')})`} value={entry.reference_mobile} onChangeText={(v) => update(i, 'reference_mobile', v)} keyboardType="phone-pad" placeholder="10" maxLength={10} icon="call-outline" />
            <Text style={styles.label}>{tr('reasonLeaving')}</Text>
            <ChipGroup options={LEAVE_REASONS} selected={[entry.leave_reason]} onToggle={(v) => update(i, 'leave_reason', v)} multiSelect={false} />
          </Card>
        ))}

        {entries.length < 3 && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setEntries((p) => [...p, emptyEntry()])} activeOpacity={0.8}>
            <Icon name="add" size={20} color={Colors.primary} />
            <Text style={styles.addText}>{tr('addEmployer')}</Text>
          </TouchableOpacity>
        )}

        <Button title={tr('saveContinue')} onPress={handleSave} loading={isLoading} icon="arrow-forward" style={styles.btn} />

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>{tr('noExperienceSkip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  card: { marginBottom: Spacing.lg },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  cardNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardNumText: { ...Typography.captionStrong, color: Colors.primary, fontWeight: '700' },
  cardTitle: { ...Typography.h3, color: Colors.textPrimary },
  label: { ...Typography.captionStrong, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: Spacing.md, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md,
    borderStyle: 'dashed', marginBottom: Spacing.lg,
  },
  addText: { ...Typography.bodyStrong, color: Colors.primary },
  btn: { marginTop: Spacing.sm },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.lg },
  skipText: { ...Typography.body, color: Colors.textSecondary, textDecorationLine: 'underline' },
});
