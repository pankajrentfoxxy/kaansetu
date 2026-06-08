// Simple bilingual strings — Hindi + English
// Add more keys as needed

type Lang = 'hi' | 'en';

const strings: Record<string, Record<Lang, string>> = {
  // Common
  continue: { hi: 'जारी रखें', en: 'Continue' },
  submit: { hi: 'जमा करें', en: 'Submit' },
  skip: { hi: 'छोड़ें', en: 'Skip' },
  back: { hi: 'वापस', en: 'Back' },
  logout: { hi: '🚪 लॉगआउट', en: '🚪 Logout' },
  loading: { hi: 'लोड हो रहा है...', en: 'Loading...' },
  error: { hi: 'कुछ गलत हुआ', en: 'Something went wrong' },
  retry: { hi: 'फिर कोशिश करें', en: 'Try Again' },

  // OTP Screen
  enterMobile: { hi: 'मोबाइल नंबर दर्ज करें', en: 'Enter Mobile Number' },
  mobileHint: { hi: '10 अंकों का नंबर', en: '10-digit number' },
  getOtp: { hi: 'OTP भेजें', en: 'Get OTP' },
  enterOtp: { hi: 'OTP दर्ज करें', en: 'Enter OTP' },
  otpHint: { hi: 'आपके नंबर पर भेजा गया 6 अंकों का OTP', en: '6-digit OTP sent to your number' },
  verifyOtp: { hi: 'OTP जाँचें', en: 'Verify OTP' },
  loginAs: { hi: 'किस रूप में लॉगिन करें?', en: 'Login as?' },
  worker: { hi: '👷 मज़दूर / कामगार', en: '👷 Worker' },
  employer: { hi: '🏢 नियोक्ता / मालिक', en: '🏢 Employer' },
  devOtpHint: { hi: 'टेस्टिंग OTP: 123456', en: 'Testing OTP: 123456' },

  // Employer KYC
  empVerifyTitle: { hi: '🏢 व्यवसाय जाँच', en: '🏢 Business Verification' },
  empVerifySubtitle: { hi: 'अपना व्यवसाय सत्यापित करें', en: 'Verify your business' },
  companyName: { hi: 'कंपनी / दुकान का नाम', en: 'Company / Shop Name' },
  entityType: { hi: 'व्यवसाय का प्रकार', en: 'Business Type' },
  gstNumber: { hi: 'GST नंबर (वैकल्पिक)', en: 'GST Number (Optional)' },
  panNumber: { hi: 'PAN नंबर', en: 'PAN Number' },
  city: { hi: 'शहर', en: 'City' },
  state: { hi: 'राज्य', en: 'State' },
  pincode: { hi: 'पिनकोड', en: 'Pincode' },
  contactName: { hi: 'संपर्क व्यक्ति का नाम', en: 'Contact Person Name' },
  registerContinue: { hi: 'पंजीकरण करें और जारी रखें', en: 'Register & Continue' },
};

export function t(key: string, lang: string = 'hi'): string {
  const l = (lang === 'en' ? 'en' : 'hi') as Lang;
  return strings[key]?.[l] ?? strings[key]?.['en'] ?? key;
}
