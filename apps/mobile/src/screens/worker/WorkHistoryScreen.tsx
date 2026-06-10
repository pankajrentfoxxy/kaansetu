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

const LEAVE_REASONS = [
  { value: 'better_pay', label: 'बेहतर वेतन' },
  { value: 'family', label: 'पारिवारिक कारण' },
  { value: 'relocation', label: 'जगह बदली' },
  { value: 'contract_end', label: 'काम पूरा हुआ' },
  { value: 'other', label: 'अन्य' },
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
  employer_name: '', role: '', from_date: '', to_date: '',
  reference_name: '', reference_mobile: '', leave_reason: '', is_current: false,
});

function parseDate(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
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

  useEffect(() => {
    if (worker?.work_history?.length && !prefilled) {
      const existing: HistoryEntry[] = worker.work_history.map((h: any) => ({
        employer_name: h.employer_name ?? '',
        role: h.role ?? '',
        from_date: h.from_date ? h.from_date.slice(0, 7) : '',
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

    for (let i = 0; i < filled.length; i++) {
      const e = filled[i];
      if (!e.role.trim()) { setError(`नियोक्ता ${i + 1}: पद/काम भरें`); return; }
      if (!parseDate(e.from_date)) { setError(`नियोक्ता ${i + 1}: सही शुरू तारीख चुनें`); return; }
      if (e.to_date && !parseDate(e.to_date)) { setError(`नियोक्ता ${i + 1}: सही अंतिम तारीख चुनें या खाली छोड़ें`); return; }
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
      setError('सेव नहीं हो सका। फिर कोशिश करें।');
    }
  };

  const handleSkip = () => navigation.navigate('LocationPreferences');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="काम का अनुभव" subtitle="चरण 3 / 7" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ProgressBar current={3} total={7} />
        <Text style={styles.subtitle}>पिछले नियोक्ता की जानकारी दें</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        {entries.map((entry, i) => (
          <Card key={i} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardNum}><Text style={styles.cardNumText}>{i + 1}</Text></View>
              <Text style={styles.cardTitle}>नियोक्ता {i + 1}{i === 0 ? '' : ' (वैकल्पिक)'}</Text>
            </View>

            <Input label="कंपनी / नियोक्ता का नाम" value={entry.employer_name} onChangeText={(v) => update(i, 'employer_name', v)} placeholder="जैसे शर्मा परिवार / ABC Pvt Ltd" icon="business-outline" />
            <Input label="आपका पद / काम" value={entry.role} onChangeText={(v) => update(i, 'role', v)} placeholder="जैसे ड्राइवर, रसोइया, गार्ड" icon="briefcase-outline" />
            <DateScrollPicker label="शुरू तारीख" value={entry.from_date} onChange={(v) => update(i, 'from_date', v)} monthOnly maxYear={new Date().getFullYear()} />
            <DateScrollPicker label="अंतिम तारीख (अभी काम कर रहे हैं तो खाली छोड़ें)" value={entry.to_date} onChange={(v) => update(i, 'to_date', v)} monthOnly maxYear={new Date().getFullYear()} />
            <Input label="संदर्भ व्यक्ति का नाम (वैकल्पिक)" value={entry.reference_name} onChangeText={(v) => update(i, 'reference_name', v)} placeholder="मैनेजर / मालिक का नाम" icon="person-outline" />
            <Input label="संदर्भ मोबाइल (वैकल्पिक)" value={entry.reference_mobile} onChangeText={(v) => update(i, 'reference_mobile', v)} keyboardType="phone-pad" placeholder="10 अंकों का नंबर" maxLength={10} icon="call-outline" />
            <Text style={styles.label}>छोड़ने का कारण</Text>
            <ChipGroup options={LEAVE_REASONS} selected={[entry.leave_reason]} onToggle={(v) => update(i, 'leave_reason', v)} multiSelect={false} />
          </Card>
        ))}

        {entries.length < 3 && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setEntries((p) => [...p, emptyEntry()])} activeOpacity={0.8}>
            <Icon name="add" size={20} color={Colors.primary} />
            <Text style={styles.addText}>एक और नियोक्ता जोड़ें</Text>
          </TouchableOpacity>
        )}

        <Button title="सेव करें और आगे बढ़ें" onPress={handleSave} loading={isLoading} icon="arrow-forward" style={styles.btn} />

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>कोई अनुभव नहीं — छोड़ें</Text>
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
