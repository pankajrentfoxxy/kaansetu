import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { usePostRequirementMutation } from '../../store/api/employerApi';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { JobIcon } from '../../components/common/JobIcon';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography, JOB_TYPES, getJobMeta } from '../../theme';

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
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [postRequirement, { isLoading }] = usePostRequirementMutation();

  // Capture the job's location so nearby workers can be matched (haversine on the backend).
  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow location to find nearby workers.'); return; }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const [place] = await Location.reverseGeocodeAsync(pos.coords);
      if (place?.city) setCity(place.city);
      if (place?.postalCode) setPincode(place.postalCode);
    } catch {
      Alert.alert('Location error', 'Could not get your location. Enter a pincode instead.');
    } finally { setLocating(false); }
  };

  // Geocode a 6-digit pincode to coordinates so distance matching works without GPS.
  const geocodePincode = async (pin: string) => {
    if (pin.length !== 6) return;
    try {
      const [r] = await Location.geocodeAsync(`${pin}, India`);
      if (r) setCoords({ latitude: r.latitude, longitude: r.longitude });
    } catch { /* geocode best-effort */ }
  };

  const handlePost = async () => {
    if (!jobType) { setError('Please select a job type'); return; }
    if (salaryMin && salaryMax && Number(salaryMax) < Number(salaryMin)) { setError('Max salary must be ≥ min salary'); return; }
    if (!panIndia && !city) { setError('Enter a city or enable Pan India'); return; }
    setError('');
    try {
      const req = await postRequirement({
        job_type: jobType,
        openings: Number(openings) || 1,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        city: city || undefined,
        pincode: pincode || undefined,
        latitude: panIndia ? undefined : coords?.latitude,
        longitude: panIndia ? undefined : coords?.longitude,
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Post Requirement" subtitle="Find verified workers" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {error ? <AlertCard type="danger" message={error} /> : null}

        <Text style={styles.sectionTitle}>Job type</Text>
        <View style={styles.jobGrid}>
          {JOB_TYPES.map((type) => {
            const meta = getJobMeta(type);
            const active = jobType === type;
            return (
              <TouchableOpacity key={type} style={[styles.jobTile, active && styles.jobTileActive]} onPress={() => setJobType(type)} activeOpacity={0.85}>
                <JobIcon jobType={type} size={38} />
                <Text style={[styles.jobTileLabel, active && styles.jobTileLabelActive]} numberOfLines={1}>{meta.labelEn}</Text>
                {active && <View style={styles.tileCheck}><Icon name="checkmark" size={10} color="#fff" /></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Salary (₹/month) <Text style={styles.optional}>· optional</Text></Text>
        <View style={styles.row2}>
          <View style={styles.flex1}><Input label="Minimum" value={salaryMin} onChangeText={setSalaryMin} placeholder="15000" keyboardType="number-pad" icon="cash-outline" /></View>
          <View style={styles.flex1}><Input label="Maximum" value={salaryMax} onChangeText={setSalaryMax} placeholder="25000" keyboardType="number-pad" icon="cash-outline" /></View>
        </View>
        <Text style={styles.hint}>Leave blank to show "Negotiable".</Text>

        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.toggleCard}>
          <Icon name="globe-outline" size={22} color={Colors.textSecondary} style={styles.toggleIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Pan India</Text>
            <Text style={styles.toggleSub}>All cities across India</Text>
          </View>
          <ToggleSwitch value={panIndia} onToggle={() => setPanIndia(!panIndia)} onColor={Colors.primary} />
        </View>
        {!panIndia && (
          <>
            <TouchableOpacity style={styles.locBtn} onPress={useCurrentLocation} disabled={locating} activeOpacity={0.85}>
              {locating ? <ActivityIndicator size="small" color={Colors.primary} /> : <Icon name="locate" size={18} color={Colors.primary} />}
              <Text style={styles.locBtnText}>{coords ? 'Location set ✓ — tap to update' : 'Use current location'}</Text>
            </TouchableOpacity>
            <View style={styles.row2}>
              <View style={styles.flex1}><Input label="City" value={city} onChangeText={setCity} placeholder="e.g. Delhi" icon="business-outline" /></View>
              <View style={styles.flex1}><Input label="Pincode" value={pincode} onChangeText={(v) => { const p = v.replace(/\D/g, '').slice(0, 6); setPincode(p); geocodePincode(p); }} placeholder="110001" keyboardType="number-pad" maxLength={6} icon="mail-outline" /></View>
            </View>
            <Text style={styles.hint}>
              {coords ? 'Workers near this location will be matched first.' : 'Add a pincode or use current location to match nearby workers.'}
            </Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Minimum experience</Text>
        <View style={styles.chipRow}>
          {EXP_OPTIONS.map((opt) => {
            const active = experience === opt.value;
            return (
              <TouchableOpacity key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => setExperience(opt.value)} activeOpacity={0.85}>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Openings</Text>
        <View style={styles.chipRow}>
          {['1', '2', '3', '5', '10'].map((n) => {
            const active = openings === n;
            return (
              <TouchableOpacity key={n} style={[styles.chip, active && styles.chipActive]} onPress={() => setOpenings(n)} activeOpacity={0.85}>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.toggleCard, { marginTop: Spacing.lg }]}>
          <Icon name="bed-outline" size={22} color={Colors.textSecondary} style={styles.toggleIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Live-in required</Text>
            <Text style={styles.toggleSub}>Worker must stay at premises</Text>
          </View>
          <ToggleSwitch value={liveIn} onToggle={() => setLiveIn(!liveIn)} onColor={Colors.primary} />
        </View>

        <Button title="Find Matching Workers" onPress={handlePost} loading={isLoading} icon="search" style={styles.postBtn} />
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.md },
  optional: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '500' },
  hint: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },
  locBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingVertical: 12, marginBottom: Spacing.md },
  locBtnText: { ...Typography.bodyStrong, color: Colors.primary },
  jobGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  jobTile: { width: '23.5%', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: 2, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, marginBottom: 8 },
  jobTileActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  jobTileLabel: { ...Typography.tiny, fontSize: 10, color: Colors.textSecondary, marginTop: 5, fontWeight: '600' },
  jobTileLabelActive: { color: Colors.primaryText },
  tileCheck: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  toggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  toggleIcon: { marginRight: Spacing.md },
  toggleLabel: { ...Typography.bodyStrong, color: Colors.textPrimary },
  toggleSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipLabel: { ...Typography.bodyStrong, color: Colors.textSecondary },
  chipLabelActive: { color: '#fff' },
  postBtn: { marginTop: Spacing.xxl },
});
