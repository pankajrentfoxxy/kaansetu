import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { useUpdateLocationMutation } from '../../store/api/workerApi';
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
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [liveIn, setLiveIn] = useState(false);
  const [panIndia, setPanIndia] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [updateLocation, { isLoading }] = useUpdateLocationMutation();

  const detectLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setError('Location permission denied'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
      const [place] = await Location.reverseGeocodeAsync(pos.coords);
      if (place) {
        setAddress(`${place.street ?? ''}, ${place.district ?? place.city ?? ''}, ${place.region ?? ''}`);
        setCity(place.city ?? place.district ?? '');
        setPincode(place.postalCode ?? '');
      }
    } catch {
      setError('Could not detect location');
    } finally {
      setDetecting(false);
    }
  };

  const toggleCity = (c: string) =>
    setPreferredCities((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const handleSave = async () => {
    setError('');
    try {
      await updateLocation({
        current_address: address,
        city,
        pincode,
        latitude,
        longitude,
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
        {error ? <AlertCard type="danger" message={error} /> : null}

        <Button title="📍 Detect my location" onPress={detectLocation} variant="secondary" loading={detecting} style={{ marginBottom: Spacing.lg }} />

        {address ? <AlertCard type="success" message={`Detected: ${address}`} /> : null}

        <Input label="Living Address" value={address} onChangeText={setAddress} multiline placeholder="Your current address" />
        <Input label="City" value={city} onChangeText={setCity} placeholder="e.g. Delhi" />
        <Input label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />

        <Text style={styles.label}>Preferred Job Cities</Text>
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
