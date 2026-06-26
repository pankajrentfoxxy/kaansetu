import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Button } from '../../components/common/Button';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Colors, Spacing, Typography, EMPLOYMENT_TYPES } from '../../theme';

export function QuickJobTypeScreen({ navigation, route }: any) {
  const en = useSelector((s: RootState) => s.auth.language) === 'en';
  const skill_type = route.params?.skill_type;
  const [employmentType, setEmploymentType] = useState('');

  const options = EMPLOYMENT_TYPES.map((e) => ({ value: e.value, label: en ? e.labelEn : e.labelHi }));
  const go = (employment_type: string | null) => navigation.navigate('QuickSalary', { skill_type, employment_type });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={en ? 'Create profile' : 'प्रोफ़ाइल बनाएँ'} subtitle={en ? 'Step 4 of 5' : 'स्टेप 4 / 5'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <ProgressBar current={4} total={5} />
        <Text style={styles.q}>{en ? 'How do you want to work?' : 'Aap kis tarah kaam karna chahte hain?'}</Text>
        <Text style={styles.sub}>{en ? 'Choose one.' : 'एक चुनें।'}</Text>
        <ChipGroup options={options} selected={[employmentType]} onToggle={setEmploymentType} multiSelect={false} />
      </ScrollView>
      <View style={styles.footer}>
        <Button title={en ? 'Continue' : 'आगे बढ़ें'} onPress={() => go(employmentType || null)} icon="arrow-forward" disabled={!employmentType} />
        <TouchableOpacity style={styles.skip} onPress={() => go(null)}><Text style={styles.skipText}>{en ? 'Skip for now' : 'अभी छोड़ें'}</Text></TouchableOpacity>
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
