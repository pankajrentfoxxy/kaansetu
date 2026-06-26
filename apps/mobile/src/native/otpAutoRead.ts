import { Platform } from 'react-native';

// SMS User Consent OTP auto-read (Android). Calls onCode(code) when the SMS
// arrives, and returns an unsubscribe function.
//
// The native module is not wired in this build (keeps the APK build safe).
// To enable: add `react-native-otp-verify`, then in start() call
// RNOtpVerify.getOtp() + addListener, parse the 6-digit code, and call onCode.
// User Consent needs no SMS hash, so otp.service.ts / sms.service.ts stay as-is.
// Callers fall back to manual entry (+ iOS QuickType) when this is a no-op.
export const otpAutoReadSupported = false;

export function startOtpAutoRead(_onCode: (code: string) => void): () => void {
  if (Platform.OS !== 'android') return () => {};
  return () => {};
}
