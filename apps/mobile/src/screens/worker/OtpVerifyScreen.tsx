import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { SecureStore } from '../../utils/storage';
import { setCredentials } from '../../store/authSlice';
import { useVerifyOtpMutation, useSendOtpMutation } from '../../store/api/authApi';
import { t } from '../../utils/i18n';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { Icon } from '../../components/common/Icon';
import { startOtpAutoRead, otpAutoReadSupported } from '../../native/otpAutoRead';

export function OtpVerifyScreen({ navigation, route }: any) {
  const { mobile, role } = route.params ?? {};
  const lang = useSelector((s: RootState) => s.auth.language);
  const en = lang === 'en';
  const dispatch = useDispatch();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [reading, setReading] = useState(otpAutoReadSupported && Platform.OS === 'android');
  const [seconds, setSeconds] = useState(30);
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp] = useSendOtpMutation();

  const submit = async (code: string) => {
    if (code.length !== 6) { setError(en ? 'Enter the 6-digit code' : '6 अंकों का OTP दर्ज करें'); return; }
    setError('');
    try {
      const data = await verifyOtp({ mobile, otp: code, role }).unwrap();
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      dispatch(setCredentials({ userId: data.user.id, role: data.user.role ?? role }));
      // New vs returning routing is handled by the WorkerDashboard full_name guard.
    } catch (e: any) {
      setError(e?.data?.error ?? (en ? 'Incorrect OTP' : 'OTP गलत है'));
    }
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;

  // Android auto-read (no-op until the native module is added) → fills + verifies.
  useEffect(() => {
    if (!otpAutoReadSupported) { setReading(false); return; }
    const stop = startOtpAutoRead((code) => { setOtp(code); setReading(false); submitRef.current(code); });
    const timer = setTimeout(() => setReading(false), 20000);
    return () => { stop(); clearTimeout(timer); };
  }, []);

  // Resend countdown.
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const resend = async () => {
    if (seconds > 0) return;
    try { await resendOtp({ mobile }).unwrap(); setSeconds(30); } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="arrow-back" size={18} color={Colors.primary} />
            <Text style={styles.backText}>+91 {mobile}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('enterOtp', lang)}</Text>
          <Text style={styles.subtitle}>{en ? `Sent to +91 ${mobile}` : `+91 ${mobile} पर भेजा`}</Text>

          {error ? <View style={{ marginBottom: Spacing.md }}><AlertCard type="danger" message={error} /></View> : null}

          <View style={styles.devHint}>
            <Icon name="flask-outline" size={16} color={Colors.warningText} />
            <Text style={styles.devHintText}>{t('testingOtp', lang)}</Text>
          </View>

          {reading ? (
            <View style={styles.readingRow}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.readingText}>{en ? 'Reading your OTP…' : 'OTP padhi jaa rahi hai…'}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="––––––"
            placeholderTextColor={Colors.textTertiary}
            maxLength={6}
            autoFocus={!reading}
            editable={!reading}
            textContentType="oneTimeCode"
            returnKeyType="done"
            onSubmitEditing={() => submit(otp)}
          />

          <Button title={t('verifyOtp', lang)} onPress={() => submit(otp)} loading={isLoading} icon="checkmark" style={styles.cta} />

          <TouchableOpacity style={styles.resend} onPress={resend} disabled={seconds > 0}>
            <Text style={[styles.resendText, seconds > 0 && styles.resendDim]}>
              {seconds > 0 ? (en ? `Resend OTP in ${seconds}s` : `${seconds}s में दोबारा भेजें`) : (en ? 'Resend OTP' : 'OTP दोबारा भेजें')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingTop: Spacing.huge },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  backText: { color: Colors.primary, ...Typography.bodyStrong },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  devHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: 12, marginBottom: Spacing.lg },
  devHintText: { ...Typography.captionStrong, color: Colors.warningText },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  readingText: { ...Typography.body, color: Colors.textSecondary },
  otpInput: { height: 64, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.primary, textAlign: 'center', letterSpacing: 14, fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xl },
  cta: { marginTop: Spacing.xs },
  resend: { alignItems: 'center', paddingVertical: Spacing.lg },
  resendText: { ...Typography.bodyStrong, color: Colors.primary },
  resendDim: { color: Colors.textTertiary },
});
