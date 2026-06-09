import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { useGetWorkerProfileQuery, useUpdateLocationMutation } from '../../store/api/workerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Input } from '../../components/common/Input';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Button } from '../../components/common/Button';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography } from '../../theme';

const TOP_CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Surat', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Gurugram',
];

export function LocationPreferencesScreen({ navigation }: any) {
  const { data: worker } = useGetWorkerProfileQuery();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [liveIn, setLiveIn] = useState(false);
  const [panIndia, setPanIndia] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [error, setError] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [updateLocation, { isLoading }] = useUpdateLocationMutation();

  // Pre-fill from existing profile
  useEffect(() => {
    if (worker?.location && !prefilled) {
      const loc = worker.location;
      if (loc.current_address) setAddress(loc.current_address);
      if (loc.city) setCity(loc.city);
      if (loc.pincode) setPincode(loc.pincode);
      if (loc.latitude) setLatitude(loc.latitude);
      if (loc.longitude) setLongitude(loc.longitude);
      if (loc.preferred_cities?.length) setPreferredCities(loc.preferred_cities);
      if (worker.is_live_in_ok) setLiveIn(true);
      if (worker.is_pan_india) setPanIndia(true);
      setPrefilled(true);
    }
  }, [worker, prefilled]);

  // Auto-detect location on mount (only if no saved location)
  useEffect(() => {
    if (!prefilled) return; // wait for prefill check first
    if (worker?.location?.city) return; // already have saved location
    detectLocation();
  }, [prefilled]);

  const detectLocation = async () => {
    setDetecting(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied — please enter manually below');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
      const [place] = await Location.reverseGeocodeAsync(pos.coords);
      if (place) {
        const addr = [place.street, place.district ?? place.subregion ?? place.city, place.region]
          .filter(Boolean).join(', ');
        setAddress(addr);
        setCity(place.city ?? place.district ?? place.subregion ?? '');
        setPincode(place.postalCode ?? '');
        setLocationDetected(true);
      }
    } catch {
      setError('Could not detect location — please enter manually below');
    } finally {
      setDetecting(false);
    }
  };

  const toggleCity = (c: string) =>
    setPreferredCities((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const handleSave = async () => {
    setError('');
    try {
      // Round to 6 decimal places — DB column is Decimal(10,8), GPS returns 9-15 digits
      const lat = latitude !== undefined ? Math.round(latitude * 1e6) / 1e6 : undefined;
      const lng = longitude !== undefined ? Math.round(longitude * 1e6) / 1e6 : undefined;
      await updateLocation({
        current_address: address,
        city,
        pincode,
        latitude: lat,
        longitude: lng,
        preferred_cities: preferredCities,
        is_live_in_ok: liveIn,
        is_pan_india: panIndia,
      }).unwrap();
      navigation.navigate('KycVerification');
    } catch {
      setError('Failed to save. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <ProgressBar current={4} total={7} label="Step 4 of 7" />
        <Text style={styles.title}>Location & Preferences</Text>

        {detecting && (
          <AlertCard type="info" message="📍 Detecting your location automatically..." />
        )}
        {locationDetected && !detecting && (
          <AlertCard type="success" message={`📍 Location detected: ${city || address}`} />
        )}
        {error ? <AlertCard type="danger" message={error} /> : null}

        {/* Re-detect button */}
        <Button
          title={detecting ? 'Detecting...' : '📍 Re-detect my location'}
          onPress={detectLocation}
          variant="secondary"
          loading={detecting}
          style={{ marginBottom: Spacing.lg }}
        />

        <Input
          label="Living Address"
          value={address}
          onChangeText={setAddress}
          multiline
          placeholder="Your current address"
        />
        <Input
          label="City *"
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Delhi"
        />
        <Input
          label="Pincode"
          value={pincode}
          onChangeText={setPincode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="110001"
        />

        <Text style={styles.label}>Preferred Job Cities (select multiple)</Text>
        <ChipGroup
          options={TOP_CITIES.map((c) => ({ value: c, label: c }))}
          selected={preferredCities}
          onToggle={toggleCity}
        />

        <View style={styles.toggleRow}>
          <ToggleSwitch value={liveIn} onToggle={() => setLiveIn(!liveIn)} label="Willing to live at employer's house" />
        </View>
        <View style={styles.toggleRow}>
          <ToggleSwitch value={panIndia} onToggle={() => setPanIndia(!panIndia)} label="Open to jobs anywhere in India" />
        </View>

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
  toggleRow: { marginBottom: Spacing.md },
  btn: { marginTop: Spacing.xl },
});
