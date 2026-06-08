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

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
type Step = 'mobile' | 'otp' | 'role';

export function MobileOtpScreen({ navigation }: any) {
  const lang = useSelector((s: RootState) => s.auth.language);
  const dispatch = useDispatch();

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiPost = async (path: string, body: object) => {
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Request failed');
    return data;
  };

  const sendOtp = async () => {
    if (mobile.length !== 10) { setError('10 अंकों का नंबर दर्ज करें / Enter 10-digit number'); return; }
    setError(''); setLoading(true);
    try {
      await apiPost('/auth/send-otp', { mobile: `+91${mobile}` });
      setStep('otp');
    } catch (e: any) {
      setError(e.message ?? 'OTP भेजने में विफल / Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('6 अंकों का OTP दर्ज करें'); return; }
    setError(''); setLoading(true);
    try {
      const data = await apiPost('/auth/verify-otp', { mobile: `+91${mobile}`, otp });
      if (data.access_token) {
        await SecureStore.setItemAsync('access_token', data.access_token);
        await SecureStore.setItemAsync('refresh_token', data.refresh_token);
        dispatch(setCredentials({ userId: data.user.id, role: data.user.role }));
      } else {
        setStep('role');
      }
    } catch (e: any) {
      setError(e.message ?? 'OTP गलत है / Invalid OTP');
    } finally { setLoading(false); }
  };

  const selectRole = async (role: 'WORKER' | 'EMPLOYER') => {
    setError(''); setLoading(true);
    try {
      const data = await apiPost('/auth/set-role', { mobile: `+91${mobile}`, role });
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      dispatch(setCredentials({ userId: data.user.id, role: data.user.role }));
      if (role === 'EMPLOYER') navigation.navigate('EmployerRegistration');
    } catch (e: any) {
      setError(e.message ?? 'Role selection failed');
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

          {step === 'role' && (
            <View>
              <Text style={styles.title}>{t('loginAs', lang)}</Text>
              <Text style={styles.subtitle}>आप क्या हैं? / Who are you?</Text>
              <TouchableOpacity style={[styles.roleCard, styles.roleWorker]} onPress={() => selectRole('WORKER')}>
                <Text style={styles.roleIcon}>👷</Text>
                <Text style={styles.roleTitle}>मज़दूर / कामगार</Text>
                <Text style={styles.roleDesc}>Worker — काम ढूंढें</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleCard, styles.roleEmployer]} onPress={() => selectRole('EMPLOYER')}>
                <Text style={styles.roleIcon}>🏢</Text>
                <Text style={styles.roleTitle}>नियोक्ता / मालिक</Text>
                <Text style={styles.roleDesc}>Employer — कामगार ढूंढें</Text>
              </TouchableOpacity>
              {loading && <Text style={{ textAlign: 'center', color: Colors.textSecondary }}>Loading...</Text>}
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
  roleCard: {
    borderRadius: 16, padding: Spacing.xl, marginBottom: Spacing.lg,
    alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  roleWorker: { backgroundColor: '#EBF5FF', borderWidth: 2, borderColor: Colors.primary },
  roleEmployer: { backgroundColor: '#F0FFF4', borderWidth: 2, borderColor: Colors.success },
  roleIcon: { fontSize: 48, marginBottom: 8 },
  roleTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  roleDesc: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
});
