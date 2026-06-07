import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { usePostRequirementMutation } from '../../store/api/employerApi';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
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
  { value: 'peon', label: 'Office Peon', icon: '📋' },
  { value: 'sweeper', label: 'Sweeper', icon: '🧹' },
  { value: 'helper', label: 'Helper', icon: '👤' },
];

const EXP_OPTIONS = [
  { value: '0', label: 'Any' },
  { value: '1', label: '1+ yr' },
  { value: '3', label: '3+ yr' },
  { value: '5', label: '5+ yr' },
  { value: '10', label: '10+ yr' },
];

export function PostRequirementScreen({ navigation }: any) {
  const [jobType, setJobType] = useState<string[]>([]);
  const [openings, setOpenings] = useState('1');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [experience, setExperience] = useState<string[]>(['0']);
  const [panIndia, setPanIndia] = useState(false);
  const [liveIn, setLiveIn] = useState(false);
  const [error, setError] = useState('');
  const [postRequirement, { isLoading }] = usePostRequirementMutation();

  const handlePost = async () => {
    if (!jobType[0]) { setError('Select a job type'); return; }
    if (!salaryMin || !salaryMax) { setError('Enter salary range'); return; }
    if (Number(salaryMax) < Number(salaryMin)) { setError('Max salary must be >= min salary'); return; }
    if (!panIndia && !city) { setError('Enter city or enable Pan India'); return; }
    setError('');
    try {
      const req = await postRequirement({
        job_type: jobType[0],
        openings: Number(openings),
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax),
        city: city || undefined,
        pincode: pincode || undefined,
        is_pan_india: panIndia,
        is_live_in_required: liveIn,
        min_experience_years: Number(experience[0] ?? 0),
      }).unwrap();
      navigation.navigate('MatchedProfiles', { requirementId: req.id });
    } catch {
      setError('Failed to post requirement. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Post a Requirement</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        <Text style={styles.label}>Job Type</Text>
        <ChipGroup options={JOB_OPTIONS} selected={jobType} onToggle={(v) => setJobType([v])} multiSelect={false} />

        <Input label="Number of Openings" value={openings} onChangeText={setOpenings} keyboardType="number-pad" />
        <Input label="Minimum Salary (₹/month)" value={salaryMin} onChangeText={setSalaryMin} keyboardType="number-pad" placeholder="e.g. 15000" />
        <Input label="Maximum Salary (₹/month)" value={salaryMax} onChangeText={setSalaryMax} keyboardType="number-pad" placeholder="e.g. 25000" />
        <Input label="City" value={city} onChangeText={setCity} placeholder="e.g. Delhi" />
        <Input label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />

        <Text style={styles.label}>Minimum Experience</Text>
        <ChipGroup options={EXP_OPTIONS} selected={experience} onToggle={(v) => setExperience([v])} multiSelect={false} />

        <View style={styles.toggleRow}>
          <ToggleSwitch value={panIndia} onToggle={() => setPanIndia(!panIndia)} label="Pan India visibility" />
        </View>
        <View style={styles.toggleRow}>
          <ToggleSwitch value={liveIn} onToggle={() => setLiveIn(!liveIn)} label="Must live at employer's premises" />
        </View>

        <Button title="Find Matching Profiles →" onPress={handlePost} loading={isLoading} style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.lg },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  toggleRow: { marginBottom: Spacing.md },
  btn: { marginTop: Spacing.xl },
});
