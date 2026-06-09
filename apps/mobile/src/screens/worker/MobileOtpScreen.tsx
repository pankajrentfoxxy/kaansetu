import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { SecureStore } from '../../utils/storage';
import { setCredentials } from '../../store/authSlice';
import { t } from '../../utils/i18n';
import { Colors, Spacing, Typography } from '../../theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';
type Step = 'mobile' | 'otp';
type Role = 'WORKER' | 'EMPLOYER';

export function MobileOtpScreen({ navigation }: any) {
  const lang = useSelector((s: RootState) => s.auth.language);
  const dispatch = useDispatch();

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
    if (mobile.length !== 10) { setError('10 अंकों का नंबर दर्ज करें / Enter 10-digit number'); return; }
    setError(''); setLoading(true);
    try {
      await apiPost('/auth/send-otp', { mobile });
      setStep('otp');
    } catch (e: any) {
      setError(e.message ?? 'OTP भेजने में विफल / Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('6 अंकों का OTP दर्ज करें'); return; }
    setError(''); setLoading(true);
    try {
      // Pass the selected role so backend sets it correctly on first login
      const data = await apiPost('/auth/verify-otp', { mobile, otp, role });
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      // Navigate to EmployerRegistration for new employers before dispatching credentials
      // (dispatching triggers nav re-render to EmployerTabs)
      const finalRole = data.user?.role ?? role;
      if (finalRole === 'EMPLOYER' && data.user?.is_new_user) {
        dispatch(setCredentials({ userId: data.user.id, role: finalRole }));
        // AppNavigator will auto-show EmployerTabs
      } else {
        dispatch(setCredentials({ userId: data.user.id, role: finalRole }));
      }
    } catch (e: any) {
      setError(e.message ?? 'OTP गलत है / Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          <View style={styles.logo}>
            <Text style={styles.logoText}>KaamSetu</Text>
            <Text style={styles.logoSub}>काम सेतु · Work Bridge</Text>
          </View>

          {error ? <AlertCard type="danger" message={error} /> : null}

          {step === 'mobile' && (
            <View>
              <Text style={styles.title}>{t('enterMobile', lang)}</Text>
              <Text style={styles.subtitle}>मोबाइल नंबर से लॉगिन करें</Text>

              {/* Role Selection */}
              <Text style={styles.roleLabel}>आप कौन हैं? / I am a:</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'WORKER' && styles.roleChipActive]}
                  onPress={() => setRole('WORKER')}
                >
                  <Text style={styles.roleChipEmoji}>👷</Text>
                  <Text style={[styles.roleChipText, role === 'WORKER' && styles.roleChipTextActive]}>
                    कामगार{'\n'}Worker
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'EMPLOYER' && styles.roleChipEmployer]}
                  onPress={() => setRole('EMPLOYER')}
                >
                  <Text style={styles.roleChipEmoji}>🏢</Text>
                  <Text style={[styles.roleChipText, role === 'EMPLOYER' && styles.roleChipTextActive]}>
                    नियोक्ता{'\n'}Employer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Mobile Input */}
              <View style={styles.mobileRow}>
                <View style={styles.isdBox}><Text style={styles.isdText}>🇮🇳 +91</Text></View>
                <View style={{ flex: 1 }}>
                  <Input
                    label=""
                    value={mobile}
                    onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="phone-pad"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </View>
              </View>
              <Button title={t('getOtp', lang)} onPress={sendOtp} loading={loading} />
            </View>
          )}

          {step === 'otp' && (
            <View>
              <TouchableOpacity onPress={() => setStep('mobile')} style={styles.backBtn}>
                <Text style={styles.backText}>← +91 {mobile}</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{t('enterOtp', lang)}</Text>
              <Text style={styles.subtitle}>{t('otpHint', lang)}</Text>
              <View style={styles.devHint}>
                <Text style={styles.devHintText}>🧪 {t('devOtpHint', lang)}</Text>
              </View>
              <Input
                label=""
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                placeholder="123456"
                maxLength={6}
              />
              <Button title={t('verifyOtp', lang)} onPress={verifyOtp} loading={loading} />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingTop: 60 },
  logo: { alignItems: 'center', marginBottom: 48 },
  logoText: { fontSize: 40, fontWeight: '800', color: Colors.primary },
  logoSub: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  roleLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
  roleChip: {
    flex: 1, borderRadius: 14, padding: 16, alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: '#E2E8F0',
    elevation: 1,
  },
  roleChipActive: {
    borderColor: Colors.primary, backgroundColor: '#EBF5FF',
  },
  roleChipEmployer: {
    borderColor: Colors.success, backgroundColor: '#F0FFF4',
  },
  roleChipEmoji: { fontSize: 32, marginBottom: 6 },
  roleChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  roleChipTextActive: { color: Colors.textPrimary },
  mobileRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: Spacing.md },
  isdBox: { backgroundColor: Colors.surface, borderRadius: 8, padding: 14, marginBottom: 4 },
  isdText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  backBtn: { marginBottom: Spacing.lg },
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  devHint: {
    backgroundColor: '#FFF9C4', borderRadius: 8, padding: 10,
    marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: '#F59E0B',
  },
  devHintText: { fontSize: 13, color: '#92400E', fontWeight: '600' },
});
