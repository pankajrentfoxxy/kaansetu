import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../../store/authSlice';
import { Colors } from '../../theme';

const LANGUAGES = [
  { value: 'hi', label: 'हिन्दी', sub: 'Hindi' },
  { value: 'en', label: 'English', sub: 'English' },
  { value: 'mr', label: 'मराठी', sub: 'Marathi' },
  { value: 'ta', label: 'தமிழ்', sub: 'Tamil' },
  { value: 'te', label: 'తెలుగు', sub: 'Telugu' },
  { value: 'bn', label: 'বাংলা', sub: 'Bengali' },
  { value: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ', sub: 'Punjabi' },
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
    <SafeAreaView style={st.container}>
      <View style={st.inner}>
        {/* Logo */}
        <View style={st.logoWrap}>
          <View style={st.logoIcon}>
            <Text style={st.logoIconText}>KS</Text>
          </View>
          <Text style={st.logoText}>KaamSetu</Text>
          <Text style={st.logoTagline}>काम सेतु · Work Bridge</Text>
        </View>

        <Text style={st.heading}>अपनी भाषा चुनें</Text>
        <Text style={st.subheading}>Choose your language</Text>

        <View style={st.langGrid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.value}
              style={[st.langChip, selected === lang.value && st.langChipActive]}
              onPress={() => setSelected(lang.value)}
            >
              <Text style={[st.langLabel, selected === lang.value && st.langLabelActive]}>
                {lang.label}
              </Text>
              <Text style={[st.langSub, selected === lang.value && st.langSubActive]}>
                {lang.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={st.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={st.continueBtnText}>आगे बढ़ें · Continue →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  logoIconText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  logoText: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  logoTagline: { fontSize: 15, color: Colors.textSecondary, marginTop: 4 },
  heading: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  subheading: { fontSize: 15, color: Colors.textSecondary, marginBottom: 20 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  langChip: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    minWidth: 100,
  },
  langChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  langLabel: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  langLabelActive: { color: '#fff' },
  langSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  langSubActive: { color: 'rgba(255,255,255,0.75)' },
  continueBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
