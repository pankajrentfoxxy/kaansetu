import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../../store/authSlice';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Button } from '../../components/common/Button';
import { Colors, Spacing, Typography } from '../../theme';

const LANGUAGES = [
  { value: 'hi', label: 'हिन्दी' },
  { value: 'en', label: 'English' },
  { value: 'mr', label: 'मराठी' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
];

export function SplashLanguageScreen({ navigation }: any) {
  const [selected, setSelected] = useState('hi');
  const dispatch = useDispatch();

  const handleContinue = async () => {
    await AsyncStorage.setItem('language', selected);
    dispatch(setLanguage(selected));
    navigation.navigate('OTP');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>KaamSetu</Text>
          <Text style={styles.tagline}>काम सेतु · Work Bridge</Text>
        </View>
        <Text style={styles.heading}>Choose your language</Text>
        <Text style={styles.subheading}>अपनी भाषा चुनें</Text>
        <ChipGroup
          options={LANGUAGES}
          selected={[selected]}
          onToggle={setSelected}
          multiSelect={false}
        />
        <Button title="Continue →" onPress={handleContinue} style={styles.btn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, padding: Spacing.xxl, justifyContent: 'center' },
  logo: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoText: { fontSize: 36, fontWeight: '700', color: Colors.primary },
  tagline: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  heading: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subheading: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  btn: { marginTop: Spacing.xxl },
});
