import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useUpdateSkillsMutation } from '../../store/api/workerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography } from '../../theme';

const JOB_OPTIONS = [
  { value: 'driver', label: 'Driver', icon: '🚗' },
  { value: 'security_guard', label: 'Security Guard', icon: '🛡' },
  { value: 'cook', label: 'Cook / Chef', icon: '🍳' },
  { value: 'housekeeper', label: 'Housekeeper', icon: '🏠' },
  { value: 'delivery', label: 'Delivery', icon: '📦' },
  { value: 'electrician', label: 'Electrician', icon: '🔧' },
  { value: 'plumber', label: 'Plumber', icon: '🔩' },
  { value: 'peon', label: 'Office Boy / Peon', icon: '📋' },
  { value: 'sweeper', label: 'Sweeper', icon: '🧹' },
  { value: 'helper', label: 'Helper', icon: '👤' },
];

const DRIVER_SPECS = [
  { value: 'car', label: 'Car' },
  { value: 'heavy_vehicle', label: 'Heavy Vehicle' },
  { value: 'truck', label: 'Truck' },
  { value: 'auto', label: 'Auto' },
  { value: 'bus', label: 'Bus' },
];

const EXP_OPTIONS = [
  { value: '0', label: '0-1 yr' },
  { value: '2', label: '1-3 yr' },
  { value: '4', label: '3-5 yr' },
  { value: '7', label: '5-10 yr' },
  { value: '10', label: '10+ yr' },
];

export function OccupationSkillsScreen({ navigation }: any) {
  const [selected, setSelected] = useState<string[]>([]);
  const [driverSpec, setDriverSpec] = useState<string[]>([]);
  const [licenceNumber, setLicenceNumber] = useState('');
  const [experience, setExperience] = useState<string[]>(['0']);
  const [error, setError] = useState('');
  const [updateSkills, { isLoading }] = useUpdateSkillsMutation();

  const toggleSkill = (val: string) => {
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );
  };

  const handleSave = async () => {
    if (selected.length === 0) { setError('Select at least one skill'); return; }
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
      setError('Failed to save. Please try again.');
    }
  };

  const isDriverSelected = selected.includes('driver');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <ProgressBar current={2} total={7} label="Step 2 of 7" />
        <Text style={styles.title}>Occupation & Skills</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        <Text style={styles.label}>What kind of work do you do? (Select all that apply)</Text>
        <ChipGroup options={JOB_OPTIONS} selected={selected} onToggle={toggleSkill} />

        {isDriverSelected && (
          <>
            <Text style={styles.label}>Vehicle type</Text>
            <ChipGroup options={DRIVER_SPECS} selected={driverSpec} onToggle={(v) => setDriverSpec([v])} multiSelect={false} />
            <Input
              label="Driving Licence Number"
              value={licenceNumber}
              onChangeText={setLicenceNumber}
              placeholder="MH01234567890123"
            />
          </>
        )}

        <Text style={styles.label}>Experience</Text>
        <ChipGroup options={EXP_OPTIONS} selected={experience} onToggle={(v) => setExperience([v])} multiSelect={false} />

        <Button title="Save & Continue" onPress={handleSave} loading={isLoading} style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.lg },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  btn: { marginTop: Spacing.xxl },
});
