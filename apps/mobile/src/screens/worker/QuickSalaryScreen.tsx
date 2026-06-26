import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useUpdateSkillsMutation } from '../../store/api/workerApi';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Button } from '../../components/common/Button';
import { ChipGroup } from '../../components/common/ChipGroup';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography, SALARY_BANDS } from '../../theme';

export function QuickSalaryScreen({ navigation, route }: any) {
  const en = useSelector((s: RootState) => s.auth.language) === 'en';
  const { skill_type, employment_type } = route.params ?? {};
  const [bandKey, setBandKey] = useState('');
  const [error, setError] = useState('');
  const [updateSkills, { isLoading }] = useUpdateSkillsMutation();

  const options = SALARY_BANDS.map((b) => ({ value: String(b.min), label: en ? b.labelEn : b.labelHi }));

  const save = async (withSalary: boolean) => {
    setError('');
    const band = withSalary ? SALARY_BANDS.find((b) => String(b.min) === bandKey) : null;
    try {
      await updateSkills({
        skills: [{
          skill_type,
          is_primary: true,
          experience_years: 0,
          employment_type: employment_type ?? null,
          expected_salary_min: band ? band.min : null,
          expected_salary_max: band ? band.max : null,
        }],
      }).unwrap();
      navigation.replace('QuickProfileSuccess');
    } catch {
      setError(en ? 'Could not save. Try again.' : 'सेव नहीं हुआ। फिर कोशिश करें।');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={en ? 'Create profile' : 'प्रोफ़ाइल बनाएँ'} subtitle={en ? 'Step 5 of 5' : 'स्टेप 5 / 5'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <ProgressBar current={5} total={5} />
        <Text style={styles.q}>{en ? 'What salary do you expect?' : 'Aapko kitni salary chahiye?'}</Text>
        <Text style={styles.sub}>{en ? 'Per month. You can change this later.' : 'प्रति माह। आप इसे बाद में बदल सकते हैं।'}</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}
        <ChipGroup options={options} selected={[bandKey]} onToggle={setBandKey} multiSelect={false} />
      </ScrollView>
      <View style={styles.footer}>
        <Button title={en ? 'Finish' : 'पूरा करें'} onPress={() => save(true)} loading={isLoading} icon="checkmark" disabled={!bandKey} />
        <TouchableOpacity style={styles.skip} onPress={() => save(false)} disabled={isLoading}><Text style={styles.skipText}>{en ? 'Skip for now' : 'अभी छोड़ें'}</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingTop: Spacing.lg },
  q: { ...Typography.h1, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: 6 },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  footer: { padding: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  skip: { alignItems: 'center', paddingVertical: Spacing.md },
  skipText: { ...Typography.body, color: Colors.textSecondary, textDecorationLine: 'underline' },
});
