import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUpdateSkillsMutation } from '../../store/api/workerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { JobIcon } from '../../components/common/JobIcon';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography, JOB_TYPES, getJobMeta } from '../../theme';
import { useT } from '../../utils/i18n';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export function OccupationSkillsScreen({ navigation }: any) {
  const tr = useT();
  const lang = useSelector((s: RootState) => s.auth.language);
  const yr = lang === 'en' ? 'yr' : 'साल';
  const DRIVER_SPECS = [
    { value: 'car', label: lang === 'en' ? 'Car' : 'कार' },
    { value: 'heavy_vehicle', label: lang === 'en' ? 'Heavy vehicle' : 'भारी वाहन' },
    { value: 'truck', label: lang === 'en' ? 'Truck' : 'ट्रक' },
    { value: 'auto', label: lang === 'en' ? 'Auto' : 'ऑटो' },
    { value: 'bus', label: lang === 'en' ? 'Bus' : 'बस' },
  ];
  const EXP_OPTIONS = [
    { value: '0', label: `0-1 ${yr}` },
    { value: '2', label: `1-3 ${yr}` },
    { value: '4', label: `3-5 ${yr}` },
    { value: '7', label: `5-10 ${yr}` },
    { value: '10', label: `10+ ${yr}` },
  ];
  const [selected, setSelected] = useState<string[]>([]);
  const [driverSpec, setDriverSpec] = useState<string[]>([]);
  const [licenceNumber, setLicenceNumber] = useState('');
  const [experience, setExperience] = useState<string[]>(['0']);
  const [error, setError] = useState('');
  const [updateSkills, { isLoading }] = useUpdateSkillsMutation();

  const toggleSkill = (val: string) => {
    setSelected((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const handleSave = async () => {
    if (selected.length === 0) { setError(tr('selectAtLeastOne')); return; }
    setError('');
    try {
      const skills = selected.map((s, i) => ({
        skill_type: s,
        specialisation: s === 'driver' ? driverSpec[0] : undefined,
        experience_years: Number(experience[0] ?? 0),
        licence_number: s === 'driver' ? licenceNumber || undefined : undefined,
        is_primary: i === 0,
      }));
      await updateSkills({ skills }).unwrap();
      navigation.navigate('WorkHistory');
    } catch {
      setError(tr('saveFailed'));
    }
  };

  const isDriverSelected = selected.includes('driver');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title={tr('yourWorkSkills')} subtitle={`${tr('stepOf')} 2 / 7`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ProgressBar current={2} total={7} />

        {error ? <AlertCard type="danger" message={error} /> : null}

        <Text style={styles.label}>{tr('whatWorkDoYouDo')}</Text>
        <Text style={styles.hint}>{tr('selectOneOrMore')}</Text>

        <View style={styles.grid}>
          {JOB_TYPES.map((type) => {
            const meta = getJobMeta(type);
            const active = selected.includes(type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.jobTile, active && styles.jobTileActive]}
                onPress={() => toggleSkill(type)}
                activeOpacity={0.85}
              >
                <JobIcon jobType={type} size={40} />
                <Text style={[styles.jobTileLabel, active && styles.jobTileLabelActive]} numberOfLines={1}>{lang === 'en' ? meta.labelEn : meta.labelHi}</Text>
                {active && (
                  <View style={styles.tileCheck}>
                    <Icon name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {isDriverSelected && (
          <View style={styles.driverBox}>
            <Text style={styles.label}>{tr('vehicleType')}</Text>
            <ChipGroup options={DRIVER_SPECS} selected={driverSpec} onToggle={(v) => setDriverSpec([v])} multiSelect={false} />
            <Input label={tr('drivingLicence')} value={licenceNumber} onChangeText={setLicenceNumber} placeholder="MH01234567890123" icon="card-outline" />
          </View>
        )}

        <Text style={[styles.label, { marginTop: Spacing.lg }]}>{tr('howManyYearsExp')}</Text>
        <ChipGroup options={EXP_OPTIONS} selected={experience} onToggle={(v) => setExperience([v])} multiSelect={false} />

        <Button title={tr('saveContinue')} onPress={handleSave} loading={isLoading} icon="arrow-forward" style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  label: { ...Typography.bodyStrong, color: Colors.textPrimary, marginBottom: 2 },
  hint: { ...Typography.caption, color: Colors.textTertiary, marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  jobTile: {
    width: '31.5%', backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
    marginBottom: 8,
  },
  jobTileActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  jobTileLabel: { ...Typography.tiny, fontSize: 11, color: Colors.textSecondary, marginTop: 6, fontWeight: '600' },
  jobTileLabelActive: { color: Colors.primaryText },
  tileCheck: {
    position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  driverBox: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginTop: Spacing.sm },
  btn: { marginTop: Spacing.xxl },
});
