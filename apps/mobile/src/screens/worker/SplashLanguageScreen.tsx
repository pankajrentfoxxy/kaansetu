import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../../store/authSlice';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Icon } from '../../components/common/Icon';

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
    navigation.navigate('PhoneEntry');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <BrandLogo size={76} />
        </View>

        <Text style={styles.heading}>अपनी भाषा चुनें</Text>
        <Text style={styles.subheading}>Choose your language</Text>

        <View style={styles.grid}>
          {LANGUAGES.map((lang) => {
            const active = selected === lang.value;
            return (
              <TouchableOpacity
                key={lang.value}
                style={[styles.langCard, active && styles.langCardActive]}
                onPress={() => setSelected(lang.value)}
                activeOpacity={0.85}
              >
                <Text style={[styles.langLabel, active && styles.langLabelActive]}>{lang.label}</Text>
                <Text style={[styles.langSub, active && styles.langSubActive]}>{lang.sub}</Text>
                {active && (
                  <View style={styles.check}>
                    <Icon name="checkmark" size={13} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.9}>
          <Text style={styles.continueBtnText}>आगे बढ़ें</Text>
          <Icon name="arrow-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.lg },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.xxxl },
  heading: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center' },
  subheading: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  langCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  langCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  langLabel: { ...Typography.h3, color: Colors.textPrimary },
  langLabelActive: { color: Colors.primaryText },
  langSub: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  langSubActive: { color: Colors.primary },
  check: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 16,
    ...Shadows.accent,
  },
  continueBtnText: { color: '#fff', ...Typography.button, fontSize: 17 },
});
