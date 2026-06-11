import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetWorkerProfileQuery, useUpdatePersonalMutation } from '../../store/api/workerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Input } from '../../components/common/Input';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { AlertCard } from '../../components/common/AlertCard';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Icon } from '../../components/common/Icon';
import { Colors, Spacing, Typography } from '../../theme';
import { useT } from '../../utils/i18n';

export function PersonalDetailsScreen({ navigation }: any) {
  const tr = useT();
  const GENDER_OPTIONS = [
    { value: 'M', label: tr('male') },
    { value: 'F', label: tr('female') },
    { value: 'O', label: tr('other') },
  ];
  const EDUCATION_OPTIONS = [
    { value: 'none', label: tr('eduNone') },
    { value: 'class5', label: tr('eduClass5') },
    { value: '10th', label: tr('edu10') },
    { value: '12th', label: tr('edu12') },
    { value: 'graduate', label: tr('eduGrad') },
    { value: 'postgraduate', label: tr('eduPostgrad') },
  ];
  const { data: worker } = useGetWorkerProfileQuery();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState<string[]>([]);
  const [education, setEducation] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [updatePersonal, { isLoading }] = useUpdatePersonalMutation();

  useEffect(() => {
    if (worker && !prefilled) {
      if (worker.full_name) setName(worker.full_name);
      if (worker.dob) setDob(worker.dob.split('T')[0]);
      if (worker.father_name) setFatherName(worker.father_name);
      if (worker.gender) setGender([worker.gender]);
      if (worker.education_level) setEducation([worker.education_level]);
      setPrefilled(true);
    }
  }, [worker, prefilled]);

  const handleSave = async () => {
    if (!name.trim()) { setError(tr('nameRequired')); return; }
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
      setError(tr('saveFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title={tr('personalDetails')} subtitle={`${tr('stepOf')} 1 / 7`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ProgressBar current={1} total={7} />

        {error ? <AlertCard type="danger" message={error} /> : null}

        <TouchableOpacity style={styles.photoCircle} activeOpacity={0.8}>
          <View>
            <Avatar name={name || 'You'} size={84} fontSize={30} />
            <View style={styles.cameraBadge}>
              <Icon name="camera" size={15} color="#fff" />
            </View>
          </View>
          <Text style={styles.photoLabel}>{tr('addPhoto')}</Text>
        </TouchableOpacity>

        <Input label={tr('fullName')} value={name} onChangeText={setName} placeholder={tr('asPerAadhaar')} icon="person-outline" />
        <Input label={tr('dateOfBirth')} value={dob} onChangeText={setDob} placeholder="1990-01-15" keyboardType="number-pad" icon="calendar-outline" hint={tr('dobHint')} />
        <Input label={tr('fatherHusbandName')} value={fatherName} onChangeText={setFatherName} placeholder={tr('optional')} icon="people-outline" />

        <Text style={styles.label}>{tr('gender')}</Text>
        <ChipGroup options={GENDER_OPTIONS} selected={gender} onToggle={(v) => setGender([v])} multiSelect={false} />

        <Text style={styles.label}>{tr('education')}</Text>
        <ChipGroup options={EDUCATION_OPTIONS} selected={education} onToggle={(v) => setEducation([v])} multiSelect={false} />

        <Button title={tr('saveContinue')} onPress={handleSave} loading={isLoading} icon="arrow-forward" style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  label: { ...Typography.captionStrong, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  photoCircle: { alignItems: 'center', marginVertical: Spacing.lg },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  photoLabel: { ...Typography.captionStrong, color: Colors.primary, marginTop: Spacing.sm },
  btn: { marginTop: Spacing.xxl },
});
