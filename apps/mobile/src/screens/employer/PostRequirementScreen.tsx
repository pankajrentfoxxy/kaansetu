import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Switch,
} from 'react-native';
import { usePostRequirementMutation } from '../../store/api/employerApi';
import { Colors } from '../../theme';

const JOB_OPTIONS = [
  { value: 'driver', label: 'Driver', icon: 'D' },
  { value: 'security_guard', label: 'Security', icon: 'S' },
  { value: 'cook', label: 'Cook', icon: 'C' },
  { value: 'housekeeper', label: 'Housekeeper', icon: 'H' },
  { value: 'delivery', label: 'Delivery', icon: 'D' },
  { value: 'electrician', label: 'Electrician', icon: 'E' },
  { value: 'plumber', label: 'Plumber', icon: 'P' },
  { value: 'peon', label: 'Peon', icon: 'P' },
  { value: 'sweeper', label: 'Sweeper', icon: 'S' },
  { value: 'helper', label: 'Helper', icon: 'H' },
];

const EXP_OPTIONS = [
  { value: '0', label: 'Any' },
  { value: '1', label: '1+ yr' },
  { value: '3', label: '3+ yr' },
  { value: '5', label: '5+ yr' },
  { value: '10', label: '10+ yr' },
];

export function PostRequirementScreen({ navigation }: any) {
  const [jobType, setJobType] = useState('');
  const [openings, setOpenings] = useState('1');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [experience, setExperience] = useState('0');
  const [panIndia, setPanIndia] = useState(false);
  const [liveIn, setLiveIn] = useState(false);
  const [error, setError] = useState('');
  const [postRequirement, { isLoading }] = usePostRequirementMutation();

  const handlePost = async () => {
    if (!jobType) { setError('Please select a job type'); return; }
    if (!salaryMin || !salaryMax) { setError('Please enter salary range'); return; }
    if (Number(salaryMax) < Number(salaryMin)) { setError('Max salary must be >= min salary'); return; }
    if (!panIndia && !city) { setError('Enter a city or enable Pan India'); return; }
    setError('');
    try {
      const req = await postRequirement({
        job_type: jobType,
        openings: Number(openings) || 1,
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax),
        city: city || undefined,
        pincode: pincode || undefined,
        is_pan_india: panIndia,
        is_live_in_required: liveIn,
        min_experience_years: Number(experience),
      }).unwrap();
      navigation.navigate('MatchedProfiles', { requirementId: req.id });
    } catch {
      setError('Failed to post. Please try again.');
    }
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Text style={st.backText}>back</Text>
          </TouchableOpacity>
          <View>
            <Text style={st.title}>Post Requirement</Text>
            <Text style={st.titleSub}>Post a new job need</Text>
          </View>
        </View>

        {error ? <View style={st.errorBox}><Text style={st.errorText}>{error}</Text></View> : null}

        <Text style={st.sectionTitle}>Job Type</Text>
        <View style={st.jobGrid}>
          {JOB_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[st.jobChip, jobType === opt.value && st.jobChipActive]}
              onPress={() => setJobType(opt.value)}
            >
              <Text style={[st.jobChipLabel, jobType === opt.value && st.jobChipLabelActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={st.sectionTitle}>Salary (Rs/month)</Text>
        <View style={st.row2}>
          <View style={st.field}>
            <Text style={st.fieldLabel}>Minimum</Text>
            <TextInput style={st.input} value={salaryMin} onChangeText={setSalaryMin} placeholder="15000" placeholderTextColor={Colors.textTertiary} keyboardType="number-pad" />
          </View>
          <View style={st.field}>
            <Text style={st.fieldLabel}>Maximum</Text>
            <TextInput style={st.input} value={salaryMax} onChangeText={setSalaryMax} placeholder="25000" placeholderTextColor={Colors.textTertiary} keyboardType="number-pad" />
          </View>
        </View>

        <Text style={st.sectionTitle}>Location</Text>
        <View style={st.toggleRow}>
          <View style={st.toggleInfo}>
            <Text style={st.toggleLabel}>Pan India</Text>
            <Text style={st.toggleSub}>All cities across India</Text>
          </View>
          <Switch value={panIndia} onValueChange={setPanIndia} trackColor={{ false: '#D1D5DB', true: Colors.primary }} thumbColor="#fff" />
        </View>
        {!panIndia && (
          <View style={st.row2}>
            <View style={st.field}>
              <Text style={st.fieldLabel}>City</Text>
              <TextInput style={st.input} value={city} onChangeText={setCity} placeholder="e.g. Delhi" placeholderTextColor={Colors.textTertiary} />
            </View>
            <View style={st.field}>
              <Text style={st.fieldLabel}>Pincode</Text>
              <TextInput style={st.input} value={pincode} onChangeText={setPincode} placeholder="110001" placeholderTextColor={Colors.textTertiary} keyboardType="number-pad" maxLength={6} />
            </View>
          </View>
        )}

        <Text style={st.sectionTitle}>Min Experience</Text>
        <View style={st.chipRow}>
          {EXP_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.value} style={[st.chip, experience === opt.value && st.chipActive]} onPress={() => setExperience(opt.value)}>
              <Text style={[st.chipLabel, experience === opt.value && st.chipLabelActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={st.sectionTitle}>Openings</Text>
        <View style={st.chipRow}>
          {['1', '2', '3', '5', '10'].map((n) => (
            <TouchableOpacity key={n} style={[st.chip, openings === n && st.chipActive]} onPress={() => setOpenings(n)}>
              <Text style={[st.chipLabel, openings === n && st.chipLabelActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={st.toggleRow}>
          <View style={st.toggleInfo}>
            <Text style={st.toggleLabel}>Live-in Required</Text>
            <Text style={st.toggleSub}>Worker must stay at premises</Text>
          </View>
          <Switch value={liveIn} onValueChange={setLiveIn} trackColor={{ false: '#D1D5DB', true: Colors.primary }} thumbColor="#fff" />
        </View>

        <TouchableOpacity style={[st.postBtn, isLoading && st.postBtnDisabled]} onPress={handlePost} disabled={isLoading} activeOpacity={0.85}>
          <Text style={st.postBtnText}>{isLoading ? 'Posting...' : 'Find Matching Workers'}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  titleSub: { fontSize: 13, color: Colors.textSecondary },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  errorText: { fontSize: 14, color: '#B91C1C', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginTop: 20, marginBottom: 10 },
  jobGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  jobChip: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#E2E8F0' },
  jobChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  jobChipLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  jobChipLabelActive: { color: '#fff' },
  row2: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 16, color: Colors.textPrimary, borderWidth: 1.5, borderColor: '#E2E8F0' },
  toggleRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  toggleSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  chipLabelActive: { color: '#fff' },
  postBtn: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 24 },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
