import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { SecureStore } from '../../utils/storage';
import { setCredentials } from '../../store/authSlice';
import { t } from '../../utils/i18n';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Icon } from '../../components/common/Icon';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';
type Step = 'mobile' | 'otp';
type Role = 'WORKER' | 'EMPLOYER';

export function MobileOtpScreen({ navigation }: any) {
  const lang = useSelector((s: RootState) => s.auth.language);
  const dispatch = useDispatch();
  const en = lang === 'en';

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<Role>('WORKER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiPost = async (path: string, body: object) => {
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? data.error ?? `Error ${res.status}`);
    return data;
  };

  const sendOtp = async () => {
    if (mobile.length !== 10) { setError(en ? 'Enter a valid 10-digit number' : '10 अंकों का सही नंबर दर्ज करें'); return; }
    setError(''); setLoading(true);
    try {
      await apiPost('/auth/send-otp', { mobile });
      setStep('otp');
    } catch (e: any) {
      setError(e.message ?? (en ? 'Failed to send OTP' : 'OTP भेजने में विफल'));
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError(en ? 'Enter the 6-digit OTP' : '6 अंकों का OTP दर्ज करें'); return; }
    setError(''); setLoading(true);
    try {
      const data = await apiPost('/auth/verify-otp', { mobile, otp, role });
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      const finalRole = data.user?.role ?? role;
      dispatch(setCredentials({ userId: data.user.id, role: finalRole }));
    } catch (e: any) {
      setError(e.message ?? (en ? 'Incorrect OTP' : 'OTP गलत है'));
    } finally { setLoading(false); }
  };

  const roles: { key: Role; icon: string; label: string }[] = [
    { key: 'WORKER', icon: 'construct', label: t('worker', lang) },
    { key: 'EMPLOYER', icon: 'business', label: t('employer', lang) },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Brand hero ── */}
          <View style={styles.hero}>
            <BrandLogo size={62} light showWordmark />
            <Text style={styles.heroTagline}>{en ? "India's trusted jobs app" : 'भरोसेमंद नौकरी ऐप'}</Text>
          </View>

          <View style={styles.body}>
            {error ? <View style={{ marginBottom: Spacing.lg }}><AlertCard type="danger" message={error} /></View> : null}

            {step === 'mobile' && (
              <>
                <Text style={styles.title}>{t('enterMobile', lang)}</Text>
                <Text style={styles.subtitle}>{t('loginWithMobile', lang)}</Text>

                <Text style={styles.fieldLabel}>{t('whoAreYou', lang)}</Text>
                <View style={styles.roleRow}>
                  {roles.map((r) => {
                    const active = role === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.roleCard, active && styles.roleCardActive]}
                        onPress={() => setRole(r.key)}
                        activeOpacity={0.9}
                      >
                        <View style={[styles.roleIcon, { backgroundColor: active ? '#fff' : Colors.surfaceAlt }]}>
                          <Icon name={r.icon} size={28} color={active ? Colors.primary : Colors.textTertiary} />
                        </View>
                        <Text style={[styles.roleText, active && styles.roleTextActive]}>{r.label}</Text>
                        {active && (
                          <View style={styles.roleCheck}><Icon name="checkmark" size={12} color="#fff" /></View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>{en ? 'Mobile number' : 'मोबाइल नंबर'}</Text>
                <View style={styles.mobileRow}>
                  <View style={styles.isdBox}>
                    <Text style={styles.flag}>🇮🇳</Text>
                    <Text style={styles.isdText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={mobile}
                    onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="phone-pad"
                    placeholder="98765 43210"
                    placeholderTextColor={Colors.textTertiary}
                    maxLength={10}
                    returnKeyType="done"
                    onSubmitEditing={sendOtp}
                  />
                </View>

                <Button title={t('sendOtp', lang)} onPress={sendOtp} loading={loading} icon="arrow-forward" style={styles.cta} />
                <Text style={styles.terms}>
                  {en ? 'By continuing you agree to our Terms & Privacy Policy' : 'जारी रखकर आप हमारी शर्तें और गोपनीयता नीति से सहमत हैं'}
                </Text>
              </>
            )}

            {step === 'otp' && (
              <>
                <TouchableOpacity onPress={() => { setStep('mobile'); setError(''); }} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="arrow-back" size={18} color={Colors.primary} />
                  <Text style={styles.backText}>+91 {mobile}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t('enterOtp', lang)}</Text>
                <Text style={styles.subtitle}>{t('otpHint', lang)}</Text>

                <View style={styles.devHint}>
                  <Icon name="flask-outline" size={16} color={Colors.warningText} />
                  <Text style={styles.devHintText}>{t('testingOtp', lang)}</Text>
                </View>

                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  placeholder="––––––"
                  placeholderTextColor={Colors.textTertiary}
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={verifyOtp}
                />

                <Button title={t('verifyOtp', lang)} onPress={verifyOtp} loading={loading} icon="checkmark" style={styles.cta} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, backgroundColor: Colors.background },

  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    ...Shadows.primary,
  },
  heroTagline: { color: 'rgba(255,255,255,0.9)', ...Typography.body, marginTop: Spacing.sm },

  body: { padding: Spacing.xl, paddingTop: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },

  fieldLabel: { ...Typography.bodyStrong, color: Colors.textPrimary, marginBottom: Spacing.md },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.xl },
  roleCard: {
    flex: 1, borderRadius: Radius.lg, paddingVertical: Spacing.xl, alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, ...Shadows.sm,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  roleText: { ...Typography.bodyLg, fontWeight: '700', color: Colors.textSecondary },
  roleTextActive: { color: Colors.primaryText },
  roleCheck: {
    position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xl },
  isdBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border,
    paddingHorizontal: 14, height: 60,
  },
  flag: { fontSize: 20 },
  isdText: { ...Typography.bodyLg, fontWeight: '800', color: Colors.textPrimary },
  phoneInput: {
    flex: 1, height: 60, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border,
    paddingHorizontal: 16, ...Typography.h3, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 1,
  },

  cta: { marginTop: Spacing.xs },
  terms: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  backText: { color: Colors.primary, ...Typography.bodyStrong },
  devHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: 12, marginBottom: Spacing.lg,
  },
  devHintText: { ...Typography.captionStrong, color: Colors.warningText },
  otpInput: {
    height: 64, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.primary,
    textAlign: 'center', letterSpacing: 14, fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xl,
  },
});
