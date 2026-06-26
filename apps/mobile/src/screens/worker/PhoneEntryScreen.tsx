import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useSendOtpMutation } from '../../store/api/authApi';
import { t } from '../../utils/i18n';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Icon } from '../../components/common/Icon';
import { getPhoneNumberHint } from '../../native/phoneNumberHint';

type Role = 'WORKER' | 'EMPLOYER';

export function PhoneEntryScreen({ navigation }: any) {
  const lang = useSelector((s: RootState) => s.auth.language);
  const en = lang === 'en';
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<Role>('WORKER');
  const [hint, setHint] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState('');
  const [sendOtp, { isLoading }] = useSendOtpMutation();

  // Android: offer the device's phone number as a one-tap pick.
  useEffect(() => {
    getPhoneNumberHint().then((num) => {
      if (num) { const d = num.replace(/\D/g, '').slice(-10); setHint(d); setMobile(d); }
      else setManual(true);
    });
  }, []);

  const submit = async (mob: string) => {
    if (mob.length !== 10) { setError(en ? 'Enter a valid 10-digit number' : '10 अंकों का सही नंबर दर्ज करें'); return; }
    setError('');
    try {
      await sendOtp({ mobile: mob }).unwrap();
      navigation.navigate('OtpVerify', { mobile: mob, role });
    } catch (e: any) {
      setError(e?.data?.error ?? (en ? 'Failed to send OTP' : 'OTP भेजने में विफल'));
    }
  };

  const roles: { key: Role; icon: string; label: string }[] = [
    { key: 'WORKER', icon: 'construct', label: t('worker', lang) },
    { key: 'EMPLOYER', icon: 'business', label: t('employer', lang) },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <BrandLogo size={62} light showWordmark />
            <Text style={styles.heroTagline}>{en ? "India's trusted jobs app" : 'भरोसेमंद नौकरी ऐप'}</Text>
          </View>

          <View style={styles.body}>
            {error ? <View style={{ marginBottom: Spacing.lg }}><AlertCard type="danger" message={error} /></View> : null}

            <Text style={styles.title}>{t('enterMobile', lang)}</Text>
            <Text style={styles.subtitle}>{t('loginWithMobile', lang)}</Text>

            <Text style={styles.fieldLabel}>{t('whoAreYou', lang)}</Text>
            <View style={styles.roleRow}>
              {roles.map((r) => {
                const active = role === r.key;
                return (
                  <TouchableOpacity key={r.key} style={[styles.roleCard, active && styles.roleCardActive]} onPress={() => setRole(r.key)} activeOpacity={0.9}>
                    <View style={[styles.roleIcon, { backgroundColor: active ? '#fff' : Colors.surfaceAlt }]}>
                      <Icon name={r.icon} size={28} color={active ? Colors.primary : Colors.textTertiary} />
                    </View>
                    <Text style={[styles.roleText, active && styles.roleTextActive]}>{r.label}</Text>
                    {active && <View style={styles.roleCheck}><Icon name="checkmark" size={12} color="#fff" /></View>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {hint && !manual ? (
              <>
                <Button title={`${en ? 'Continue with' : 'इसके साथ जारी रखें'} +91 ${hint.replace(/(\d{5})(\d{5})/, '$1 $2')}`} onPress={() => submit(hint)} loading={isLoading} icon="arrow-forward" />
                <TouchableOpacity style={styles.diff} onPress={() => { setManual(true); setMobile(''); }}><Text style={styles.diffText}>{en ? 'Use a different number' : 'दूसरा नंबर इस्तेमाल करें'}</Text></TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>{en ? 'Mobile number' : 'मोबाइल नंबर'}</Text>
                <View style={styles.mobileRow}>
                  <View style={styles.isdBox}><Text style={styles.flag}>🇮🇳</Text><Text style={styles.isdText}>+91</Text></View>
                  <TextInput
                    style={styles.phoneInput}
                    value={mobile}
                    onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="phone-pad"
                    placeholder="98765 43210"
                    placeholderTextColor={Colors.textTertiary}
                    maxLength={10}
                    returnKeyType="done"
                    onSubmitEditing={() => submit(mobile)}
                  />
                </View>
                <Button title={t('sendOtp', lang)} onPress={() => submit(mobile)} loading={isLoading} icon="arrow-forward" style={styles.cta} />
              </>
            )}

            <Text style={styles.terms}>{en ? 'By continuing you agree to our Terms & Privacy Policy' : 'जारी रखकर आप हमारी शर्तें और गोपनीयता नीति से सहमत हैं'}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, backgroundColor: Colors.background },
  hero: { backgroundColor: Colors.primary, alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xxxl, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl, ...Shadows.primary },
  heroTagline: { color: 'rgba(255,255,255,0.9)', ...Typography.body, marginTop: Spacing.sm },
  body: { padding: Spacing.xl, paddingTop: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  fieldLabel: { ...Typography.bodyStrong, color: Colors.textPrimary, marginBottom: Spacing.md },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.xl },
  roleCard: { flex: 1, borderRadius: Radius.lg, paddingVertical: Spacing.xl, alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, ...Shadows.sm },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  roleText: { ...Typography.bodyLg, fontWeight: '700', color: Colors.textSecondary },
  roleTextActive: { color: Colors.primaryText },
  roleCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xl },
  isdBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, paddingHorizontal: 14, height: 60 },
  flag: { fontSize: 20 },
  isdText: { ...Typography.bodyLg, fontWeight: '800', color: Colors.textPrimary },
  phoneInput: { flex: 1, height: 60, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, paddingHorizontal: 16, ...Typography.h3, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 1 },
  cta: { marginTop: Spacing.xs },
  diff: { alignItems: 'center', paddingVertical: Spacing.md },
  diffText: { ...Typography.bodyStrong, color: Colors.primary },
  terms: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18 },
});
