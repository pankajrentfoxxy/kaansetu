import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { SecureStore } from '../../utils/storage';
import { setCredentials } from '../../store/authSlice';
import { t } from '../../utils/i18n';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme';
import { Input } from '../../components/common/Input';
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
    if (mobile.length !== 10) { setError('10 अंकों का सही नंबर दर्ज करें'); return; }
    setError(''); setLoading(true);
    try {
      await apiPost('/auth/send-otp', { mobile });
      setStep('otp');
    } catch (e: any) {
      setError(e.message ?? 'OTP भेजने में विफल');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('6 अंकों का OTP दर्ज करें'); return; }
    setError(''); setLoading(true);
    try {
      const data = await apiPost('/auth/verify-otp', { mobile, otp, role });
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      const finalRole = data.user?.role ?? role;
      dispatch(setCredentials({ userId: data.user.id, role: finalRole }));
    } catch (e: any) {
      setError(e.message ?? 'OTP गलत है');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.logo}>
            <BrandLogo size={68} />
          </View>

          {error ? <AlertCard type="danger" message={error} /> : null}

          {step === 'mobile' && (
            <View>
              <Text style={styles.title}>मोबाइल नंबर डालें</Text>
              <Text style={styles.subtitle}>मोबाइल नंबर से लॉगिन करें</Text>

              <Text style={styles.roleLabel}>आप कौन हैं?</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'WORKER' && styles.roleChipActive]}
                  onPress={() => setRole('WORKER')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.roleIcon, { backgroundColor: role === 'WORKER' ? Colors.primary : Colors.surfaceAlt }]}>
                    <Icon name="construct" size={26} color={role === 'WORKER' ? '#fff' : Colors.textTertiary} />
                  </View>
                  <Text style={[styles.roleChipText, role === 'WORKER' && styles.roleChipTextActive]}>कामगार</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'EMPLOYER' && styles.roleChipActive]}
                  onPress={() => setRole('EMPLOYER')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.roleIcon, { backgroundColor: role === 'EMPLOYER' ? Colors.primary : Colors.surfaceAlt }]}>
                    <Icon name="business" size={26} color={role === 'EMPLOYER' ? '#fff' : Colors.textTertiary} />
                  </View>
                  <Text style={[styles.roleChipText, role === 'EMPLOYER' && styles.roleChipTextActive]}>नियोक्ता</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.mobileRow}>
                <View style={styles.isdBox}><Text style={styles.isdText}>+91</Text></View>
                <View style={{ flex: 1 }}>
                  <Input
                    value={mobile}
                    onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="phone-pad"
                    placeholder="9876543210"
                    maxLength={10}
                    icon="call-outline"
                  />
                </View>
              </View>
              <Button title="OTP भेजें" onPress={sendOtp} loading={loading} icon="arrow-forward" />
            </View>
          )}

          {step === 'otp' && (
            <View>
              <TouchableOpacity onPress={() => setStep('mobile')} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="arrow-back" size={18} color={Colors.primary} />
                <Text style={styles.backText}>+91 {mobile}</Text>
              </TouchableOpacity>
              <Text style={styles.title}>OTP डालें</Text>
              <Text style={styles.subtitle}>आपके नंबर पर भेजा गया 6 अंकों का OTP</Text>
              <View style={styles.devHint}>
                <Icon name="flask-outline" size={16} color={Colors.warningText} />
                <Text style={styles.devHintText}>टेस्टिंग OTP: 123456</Text>
              </View>
              <Input
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                placeholder="1 2 3 4 5 6"
                maxLength={6}
                icon="keypad-outline"
                style={styles.otpInput}
              />
              <Button title="OTP जाँचें" onPress={verifyOtp} loading={loading} icon="checkmark" />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingTop: Spacing.huge },
  logo: { alignItems: 'center', marginBottom: Spacing.huge },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  roleLabel: { ...Typography.bodyStrong, color: Colors.textPrimary, marginBottom: Spacing.md },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.xl },
  roleChip: {
    flex: 1, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.sm,
  },
  roleChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  roleChipText: { ...Typography.bodyStrong, color: Colors.textSecondary },
  roleChipTextActive: { color: Colors.primaryText },
  mobileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  isdBox: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 16, height: 52, justifyContent: 'center' },
  isdText: { ...Typography.bodyLg, fontWeight: '700', color: Colors.textPrimary },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  backText: { color: Colors.primary, ...Typography.bodyStrong },
  devHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: 12,
    marginBottom: Spacing.lg,
  },
  devHintText: { ...Typography.captionStrong, color: Colors.warningText },
  otpInput: { letterSpacing: 8, fontWeight: '700', fontSize: 20 },
});
