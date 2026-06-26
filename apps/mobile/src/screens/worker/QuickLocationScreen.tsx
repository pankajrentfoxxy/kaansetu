import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import * as Location from 'expo-location';
import { RootState } from '../../store';
import { useUpdateLocationMutation } from '../../store/api/workerApi';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { lookupPincode } from '../../utils/pincode';

export function QuickLocationScreen({ navigation, route }: any) {
  const en = useSelector((s: RootState) => s.auth.language) === 'en';
  const skill_type = route.params?.skill_type;
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState('');
  const [updateLocation, { isLoading }] = useUpdateLocationMutation();

  const detect = async () => {
    setDetecting(true); setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setManual(true); return; }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const [p] = await Location.reverseGeocodeAsync(pos.coords);
      if (p) {
        setCity(p.city ?? p.subregion ?? '');
        setState(p.region ?? '');
        setPincode(p.postalCode ?? '');
        setAddress([p.name, p.street, p.district].filter(Boolean).join(', '));
      }
    } catch {
      setManual(true);
    } finally { setDetecting(false); }
  };

  useEffect(() => { detect(); }, []);

  const onPincode = async (pin: string) => {
    setPincode(pin);
    if (pin.length === 6) {
      const info = await lookupPincode(pin);
      if (info) { setCity(info.city); setState(info.state); }
      try { const [r] = await Location.geocodeAsync(`${pin}, India`); if (r) setCoords({ latitude: r.latitude, longitude: r.longitude }); } catch {}
    }
  };

  const next = async () => {
    if (!city) { setError(en ? 'Please set your location' : 'कृपया अपना स्थान चुनें'); return; }
    setError('');
    try {
      await updateLocation({
        current_address: address || undefined,
        city, state: state || undefined, pincode: pincode || undefined,
        latitude: coords?.latitude, longitude: coords?.longitude,
      }).unwrap();
      navigation.navigate('QuickJobType', { skill_type });
    } catch {
      setError(en ? 'Could not save. Try again.' : 'सेव नहीं हुआ। फिर कोशिश करें।');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={en ? 'Create profile' : 'प्रोफ़ाइल बनाएँ'} subtitle={en ? 'Step 3 of 5' : 'स्टेप 3 / 5'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ProgressBar current={3} total={5} />
        <Text style={styles.q}>{en ? 'Where are you?' : 'Aap kahan rehte hain?'}</Text>
        <Text style={styles.sub}>{en ? 'We use this to show nearby jobs.' : 'इससे हम पास की नौकरियाँ दिखाते हैं।'}</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        {detecting ? (
          <View style={styles.detectCard}><ActivityIndicator color={Colors.primary} /><Text style={styles.detectText}>{en ? 'Detecting your location…' : 'आपका स्थान खोज रहे हैं…'}</Text></View>
        ) : city && !manual ? (
          <View style={styles.foundCard}>
            <View style={styles.foundIcon}><Icon name="location" size={22} color={Colors.success} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.foundCity}>{city}{state ? `, ${state}` : ''}</Text>
              {pincode ? <Text style={styles.foundSub}>{en ? 'Pincode' : 'पिन'} {pincode}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => setManual(true)}><Text style={styles.change}>{en ? 'Change' : 'बदलें'}</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.detectBtn} onPress={detect} activeOpacity={0.85}>
              <Icon name="locate" size={18} color={Colors.primary} />
              <Text style={styles.detectBtnText}>{en ? 'Use current location' : 'मेरा स्थान इस्तेमाल करें'}</Text>
            </TouchableOpacity>
            <Input label={en ? 'Pincode' : 'पिनकोड'} value={pincode} onChangeText={(v) => onPincode(v.replace(/\D/g, '').slice(0, 6))} placeholder="110001" keyboardType="number-pad" maxLength={6} icon="mail-outline" />
            <Input label={en ? 'City' : 'शहर'} value={city} onChangeText={setCity} placeholder={en ? 'e.g. Delhi' : 'जैसे दिल्ली'} icon="business-outline" />
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button title={en ? 'Continue' : 'आगे बढ़ें'} onPress={next} loading={isLoading} icon="arrow-forward" disabled={!city} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingTop: Spacing.lg },
  q: { ...Typography.h1, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: 6 },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  detectCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  detectText: { ...Typography.body, color: Colors.textSecondary },
  foundCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.successLight, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#B8E6D5', padding: Spacing.lg },
  foundIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D6F0E5', alignItems: 'center', justifyContent: 'center' },
  foundCity: { ...Typography.h3, color: Colors.successText },
  foundSub: { ...Typography.caption, color: Colors.successText, marginTop: 2 },
  change: { ...Typography.bodyStrong, color: Colors.primary },
  detectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingVertical: 13, marginBottom: Spacing.lg },
  detectBtnText: { ...Typography.bodyStrong, color: Colors.primary },
  footer: { padding: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
});
