import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useGetWorkerProfileQuery, useUpdatePersonalMutation } from '../../store/api/workerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Input } from '../../components/common/Input';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography } from '../../theme';

const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

const EDUCATION_OPTIONS = [
  { value: 'none', label: 'No formal' },
  { value: 'class5', label: 'Class 5' },
  { value: '10th', label: '10th pass' },
  { value: '12th', label: '12th pass' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'postgraduate', label: 'Post-graduate' },
];

export function PersonalDetailsScreen({ navigation }: any) {
  const { data: worker } = useGetWorkerProfileQuery();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState<string[]>([]);
  const [education, setEducation] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [updatePersonal, { isLoading }] = useUpdatePersonalMutation();

  // Pre-fill form with existing profile data
  useEffect(() => {
    if (worker && !prefilled) {
      if (worker.full_name) setName(worker.full_name);
      if (worker.dob) setDob(worker.dob.split('T')[0]); // strip time if ISO
      if (worker.father_name) setFatherName(worker.father_name);
      if (worker.gender) setGender([worker.gender]);
      if (worker.education_level) setEducation([worker.education_level]);
      setPrefilled(true);
    }
  }, [worker, prefilled]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setError('');
    try {
      await updatePersonal({
        full_name: name,
        dob: dob || undefined,
        gender: gender[0],
        father_name: fatherName || undefined,
        education_level: education[0],
      }).unwrap();
      navigation.navigate('OccupationSkills');
    } catch {
      setError('Failed to save. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <ProgressBar current={1} total={7} label="Step 1 of 7" />
        <Text style={styles.title}>Personal Details</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        <TouchableOpacity style={styles.photoCircle}>
          <Avatar name={name || 'You'} size={80} fontSize={28} />
          <Text style={styles.photoLabel}>Tap to add photo</Text>
        </TouchableOpacity>

        <Input label="Full Name" value={name} onChangeText={setName} placeholder="As per Aadhaar" />
        <Input
          label="Date of Birth (YYYY-MM-DD)"
          value={dob}
          onChangeText={setDob}
          placeholder="1990-01-15"
          keyboardType="number-pad"
        />
        <Input label="Father's / Husband's Name" value={fatherName} onChangeText={setFatherName} placeholder="Optional" />

        <Text style={styles.label}>Gender</Text>
        <ChipGroup options={GENDER_OPTIONS} selected={gender} onToggle={(v) => setGender([v])} multiSelect={false} />

        <Text style={styles.label}>Education</Text>
        <ChipGroup options={EDUCATION_OPTIONS} selected={education} onToggle={(v) => setEducation([v])} multiSelect={false} />

        <Button title="Save & Continue" onPress={handleSave} loading={isLoading} style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.lg },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  photoCircle: { alignItems: 'center', marginBottom: Spacing.xxl },
  photoLabel: { ...Typography.caption, color: Colors.primary, marginTop: Spacing.sm },
  btn: { marginTop: Spacing.xxl },
});
