import { Platform } from 'react-native';

// Phone Number Hint (Android / Google Identity Services).
// Returns the user-picked phone number, or null to fall back to manual entry.
//
// The native module is not wired in this build (keeps the APK build safe).
// To enable: add a phone-hint native module (react-native-phone-number-hint, or
// a ~40-line Kotlin wrapper around Identity.getSignInClient().getPhoneNumberHintIntent())
// and return its result here. All callers already handle null → manual entry.
export async function getPhoneNumberHint(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  return null;
}
