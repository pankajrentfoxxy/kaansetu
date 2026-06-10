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

const GENDER_OPTIONS = [
  { value: 'M', label: 'पुरुष' },
  { value: 'F', label: 'महिला' },
  { value: 'O', label: 'अन्य' },
];

const EDUCATION_OPTIONS = [
  { value: 'none', label: 'कोई नहीं' },
  { value: 'class5', label: 'कक्षा 5' },
  { value: '10th', label: '10वीं पास' },
  { value: '12th', label: '12वीं पास' },
  { value: 'graduate', label: 'ग्रेजुएट' },
  { value: 'postgraduate', label: 'पोस्ट-ग्रेजुएट' },
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
    if (!name.trim()) { setError('कृपया अपना नाम दर्ज करें'); return; }
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
      setError('सेव नहीं हो सका। फिर कोशिश करें।');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="व्यक्तिगत जानकारी" subtitle="चरण 1 / 7" onBack={() => navigation.goBack()} />
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
          <Text style={styles.photoLabel}>फोटो जोड़ें</Text>
        </TouchableOpacity>

        <Input label="पूरा नाम" value={name} onChangeText={setName} placeholder="आधार के अनुसार" icon="person-outline" />
        <Input label="जन्म तिथि" value={dob} onChangeText={setDob} placeholder="1990-01-15" keyboardType="number-pad" icon="calendar-outline" hint="साल-महीना-दिन" />
        <Input label="पिता / पति का नाम" value={fatherName} onChangeText={setFatherName} placeholder="वैकल्पिक" icon="people-outline" />

        <Text style={styles.label}>लिंग</Text>
        <ChipGroup options={GENDER_OPTIONS} selected={gender} onToggle={(v) => setGender([v])} multiSelect={false} />

        <Text style={styles.label}>शिक्षा</Text>
        <ChipGroup options={EDUCATION_OPTIONS} selected={education} onToggle={(v) => setEducation([v])} multiSelect={false} />

        <Button title="सेव करें और आगे बढ़ें" onPress={handleSave} loading={isLoading} icon="arrow-forward" style={styles.btn} />
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
