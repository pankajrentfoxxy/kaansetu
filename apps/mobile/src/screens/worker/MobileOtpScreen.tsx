import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import { useSendOtpMutation, useVerifyOtpMutation } from '../../store/api/authApi';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography } from '../../theme';

export function MobileOtpScreen({ navigation, route }: any) {
  const role = route.params?.role ?? 'WORKER';
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const dispatch = useDispatch();

  const [sendOtp, { isLoading: sending }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter valid 10-digit mobile number');
      return;
    }
    setError('');
    try {
      await sendOtp({ mobile }).unwrap();
      setOtpSent(true);
      setCountdown(30);
    } catch {
      setError('Failed to send OTP. Try again.');
    }
  };

  const handleOtpChange = (val: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter 6-digit OTP'); return; }
    setError('');
    try {
      const result = await verifyOtp({ mobile, otp: code, role }).unwrap();
      await SecureStore.setItemAsync('access_token', result.access_token);
      await SecureStore.setItemAsync('refresh_token', result.refresh_token);
      dispatch(setCredentials({ userId: result.user.id, role: result.user.role }));
    } catch {
      setError('Invalid OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <Text style={styles.title}>Login / Register</Text>
        <Text style={styles.subtitle}>
          {role === 'EMPLOYER' ? 'Employer Account' : 'Worker Account'}
        </Text>

        {error ? <AlertCard type="danger" message={error} /> : null}

        {!otpSent ? (
          <>
            <View style={styles.mobileRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <TextInput
                style={styles.mobileInput}
                placeholder="Mobile number"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
              />
            </View>
            <Button title="Get OTP" onPress={handleSendOtp} loading={sending} />
          </>
        ) : (
          <>
            <Text style={styles.hint}>Enter OTP sent to +91 {mobile}</Text>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputRefs.current[i] = r; }}
                  style={styles.otpBox}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>
            <Button title="Verify OTP" onPress={handleVerify} loading={verifying} style={{ marginBottom: Spacing.md }} />
            <TouchableOpacity
              onPress={countdown <= 0 ? handleSendOtp : undefined}
              disabled={countdown > 0}
            >
              <Text style={[styles.resend, countdown > 0 && styles.resendDisabled]}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {role === 'WORKER' ? 'Are you an employer? ' : 'Are you a worker? '}
          </Text>
          <TouchableOpacity onPress={() => navigation.setParams({ role: role === 'WORKER' ? 'EMPLOYER' : 'WORKER' })}>
            <Text style={styles.switchLink}>{role === 'WORKER' ? 'Switch to Employer' : 'Switch to Worker'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, padding: Spacing.xxl, justifyContent: 'center' },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.primary, marginBottom: Spacing.xl },
  mobileRow: { flexDirection: 'row', marginBottom: Spacing.lg },
  prefix: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  prefixText: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  mobileInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 48,
  },
  hint: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  otpBox: {
    width: 46, height: 52, borderWidth: 2, borderColor: Colors.border,
    borderRadius: 8, fontSize: 20, fontWeight: '700', color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  resend: { ...Typography.body, color: Colors.primary, textAlign: 'center' },
  resendDisabled: { color: Colors.textTertiary },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xxl },
  switchText: { ...Typography.caption, color: Colors.textSecondary },
  switchLink: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
});
