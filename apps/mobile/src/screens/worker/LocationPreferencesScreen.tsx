import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useGetWorkerProfileQuery, useUpdateLocationMutation } from '../../store/api/workerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Input } from '../../components/common/Input';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Button } from '../../components/common/Button';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { AlertCard } from '../../components/common/AlertCard';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { useT } from '../../utils/i18n';

const TOP_CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Surat', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Gurugram',
];

export function LocationPreferencesScreen({ navigation }: any) {
  const tr = useT();
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

  useEffect(() => {
    if (!prefilled) return;
    if (worker?.location?.city) return;
    detectLocation();
  }, [prefilled]);

  const detectLocation = async () => {
    setDetecting(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(tr('locationDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
      const [place] = await Location.reverseGeocodeAsync(pos.coords);
      if (place) {
        const addr = [place.street, place.district ?? place.subregion ?? place.city, place.region].filter(Boolean).join(', ');
        setAddress(addr);
        setCity(place.city ?? place.district ?? place.subregion ?? '');
        setPincode(place.postalCode ?? '');
        setLocationDetected(true);
      }
    } catch {
      setError(tr('locationDenied'));
    } finally {
      setDetecting(false);
    }
  };

  const toggleCity = (c: string) =>
    setPreferredCities((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const handleSave = async () => {
    setError('');
    try {
      const lat = latitude !== undefined ? Math.round(latitude * 1e6) / 1e6 : undefined;
      const lng = longitude !== undefined ? Math.round(longitude * 1e6) / 1e6 : undefined;
      await updateLocation({
        current_address: address, city, pincode,
        latitude: lat, longitude: lng,
        preferred_cities: preferredCities,
        is_live_in_ok: liveIn, is_pan_india: panIndia,
      }).unwrap();
      navigation.navigate('KycVerification');
    } catch {
      setError(tr('saveFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title={tr('locationPrefsTitle')} subtitle={`${tr('stepOf')} 4 / 7`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ProgressBar current={4} total={7} />

        {detecting && <AlertCard type="info" message={tr('detectingLocation')} />}
        {locationDetected && !detecting && <AlertCard type="success" message={`${tr('locationFound')}: ${city || address}`} />}
        {error ? <AlertCard type="danger" message={error} /> : null}

        <Button
          title={detecting ? tr('detecting') : tr('redetectLocation')}
          onPress={detectLocation}
          variant="secondary"
          loading={detecting}
          icon="location"
          style={{ marginBottom: Spacing.lg }}
        />

        <Input label={tr('livingAddress')} value={address} onChangeText={setAddress} multiline placeholder={tr('currentAddress')} icon="home-outline" />
        <Input label={tr('city')} value={city} onChangeText={setCity} placeholder="Delhi" icon="business-outline" />
        <Input label={tr('pincode')} value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} placeholder="110001" icon="mail-outline" />

        <Text style={styles.label}>{tr('preferredCities')}</Text>
        <ChipGroup options={TOP_CITIES.map((c) => ({ value: c, label: c }))} selected={preferredCities} onToggle={toggleCity} />

        <View style={styles.toggleCard}>
          <Icon name="bed-outline" size={22} color={Colors.textSecondary} style={styles.toggleIcon} />
          <View style={{ flex: 1, marginRight: 10 }}>
            <ToggleSwitch value={liveIn} onToggle={() => setLiveIn(!liveIn)} label={tr('willingLiveIn')} onColor={Colors.primary} />
          </View>
        </View>
        <View style={styles.toggleCard}>
          <Icon name="globe-outline" size={22} color={Colors.textSecondary} style={styles.toggleIcon} />
          <View style={{ flex: 1, marginRight: 10 }}>
            <ToggleSwitch value={panIndia} onToggle={() => setPanIndia(!panIndia)} label={tr('openPanIndia')} onColor={Colors.primary} />
          </View>
        </View>

        <Button title={tr('saveContinue')} onPress={handleSave} loading={isLoading} icon="arrow-forward" style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  label: { ...Typography.captionStrong, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  toggleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  toggleIcon: { marginRight: Spacing.md },
  btn: { marginTop: Spacing.xl },
});
