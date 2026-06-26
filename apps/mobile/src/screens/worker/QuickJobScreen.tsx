import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Button } from '../../components/common/Button';
import { JobIcon } from '../../components/common/JobIcon';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography, JOB_TYPES, getJobMeta } from '../../theme';

export function QuickJobScreen({ navigation }: any) {
  const en = useSelector((s: RootState) => s.auth.language) === 'en';
  const [jobType, setJobType] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={en ? 'Create profile' : 'प्रोफ़ाइल बनाएँ'} subtitle={en ? 'Step 2 of 5' : 'स्टेप 2 / 5'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <ProgressBar current={2} total={5} />
        <Text style={styles.q}>{en ? 'What work are you looking for?' : 'Aap kaunsa kaam karte hain?'}</Text>
        <Text style={styles.sub}>{en ? 'Pick your main job.' : 'अपना मुख्य काम चुनें।'}</Text>
        <View style={styles.grid}>
          {JOB_TYPES.map((type) => {
            const meta = getJobMeta(type);
            const active = jobType === type;
            return (
              <TouchableOpacity key={type} style={[styles.tile, active && styles.tileActive]} onPress={() => setJobType(type)} activeOpacity={0.85}>
                <JobIcon jobType={type} size={40} />
                <Text style={[styles.tileLabel, active && styles.tileLabelActive]} numberOfLines={1}>{en ? meta.labelEn : meta.labelHi}</Text>
                {active && <View style={styles.check}><Icon name="checkmark" size={11} color="#fff" /></View>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button title={en ? 'Continue' : 'आगे बढ़ें'} onPress={() => navigation.navigate('QuickLocation', { skill_type: jobType })} icon="arrow-forward" disabled={!jobType} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingTop: Spacing.lg },
  q: { ...Typography.h1, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: 6 },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '31.5%', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, marginBottom: 10 },
  tileActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  tileLabel: { ...Typography.tiny, color: Colors.textSecondary, marginTop: 6, fontWeight: '600', textAlign: 'center' },
  tileLabelActive: { color: Colors.primaryText },
  check: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
});
