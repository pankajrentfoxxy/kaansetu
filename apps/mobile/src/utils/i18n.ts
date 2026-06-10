// Bilingual strings — Hindi + English. Non hi/en languages fall back to English.
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

type Lang = 'hi' | 'en';

const strings: Record<string, Record<Lang, string>> = {
  // Common
  continue: { hi: 'जारी रखें', en: 'Continue' },
  submit: { hi: 'जमा करें', en: 'Submit' },
  skip: { hi: 'छोड़ें', en: 'Skip' },
  back: { hi: 'वापस', en: 'Back' },
  logout: { hi: 'लॉगआउट', en: 'Logout' },
  loading: { hi: 'लोड हो रहा है...', en: 'Loading...' },
  error: { hi: 'कुछ गलत हुआ', en: 'Something went wrong' },
  retry: { hi: 'फिर कोशिश करें', en: 'Try Again' },
  cancel: { hi: 'रद्द करें', en: 'Cancel' },
  save: { hi: 'सेव करें', en: 'Save' },
  saveContinue: { hi: 'सेव करें और आगे बढ़ें', en: 'Save & Continue' },
  next: { hi: 'आगे बढ़ें', en: 'Next' },
  edit: { hi: 'बदलें', en: 'Edit' },
  perMonth: { hi: 'हर महीना', en: 'per month' },
  yes: { hi: 'हाँ', en: 'Yes' },
  no: { hi: 'नहीं', en: 'No' },

  // Tabs
  tabHome: { hi: 'होम', en: 'Home' },
  tabJobs: { hi: 'काम', en: 'Jobs' },
  tabOffers: { hi: 'ऑफर', en: 'Offers' },
  tabProfile: { hi: 'प्रोफ़ाइल', en: 'Profile' },
  tabVerify: { hi: 'जाँच', en: 'Verify' },
  tabPost: { hi: 'पोस्ट करें', en: 'Post' },

  // OTP / login
  enterMobile: { hi: 'मोबाइल नंबर डालें', en: 'Enter mobile number' },
  loginWithMobile: { hi: 'मोबाइल नंबर से लॉगिन करें', en: 'Login with your mobile number' },
  whoAreYou: { hi: 'आप कौन हैं?', en: 'Who are you?' },
  worker: { hi: 'कामगार', en: 'Worker' },
  employer: { hi: 'नियोक्ता', en: 'Employer' },
  sendOtp: { hi: 'OTP भेजें', en: 'Send OTP' },
  enterOtp: { hi: 'OTP डालें', en: 'Enter OTP' },
  otpHint: { hi: 'आपके नंबर पर भेजा गया 6 अंकों का OTP', en: '6-digit OTP sent to your number' },
  verifyOtp: { hi: 'OTP जाँचें', en: 'Verify OTP' },
  testingOtp: { hi: 'टेस्टिंग OTP: 123456', en: 'Testing OTP: 123456' },

  // Dashboard
  addYourName: { hi: 'अपना नाम जोड़ें', en: 'Add your name' },
  setLocation: { hi: 'स्थान सेट करें', en: 'Set location' },
  profileComplete: { hi: 'प्रोफ़ाइल पूरी', en: 'profile complete' },
  complete: { hi: 'पूरी करें', en: 'Complete' },
  availableForWork: { hi: 'काम के लिए उपलब्ध हूँ', en: 'Available for work' },
  notAvailableNow: { hi: 'अभी उपलब्ध नहीं', en: 'Not available now' },
  kycPending: { hi: 'पहचान जाँच बाकी है', en: 'Identity check pending' },
  kycPendingSub: { hi: 'पूरा करें और सभी जॉब अनलॉक करें', en: 'Complete it to unlock all jobs' },
  fullyVerified: { hi: 'पूरी तरह सत्यापित प्रोफ़ाइल', en: 'Fully verified profile' },
  newJobOffer: { hi: 'नया जॉब ऑफर', en: 'new job offer' },
  newJobOffers: { hi: 'नए जॉब ऑफर', en: 'new job offers' },
  reviewAccept: { hi: 'देखें और स्वीकार करें', en: 'Review and accept' },
  jobsForYou: { hi: 'आपके लिए काम', en: 'Jobs for you' },
  jobsLocked: { hi: 'काम लॉक हैं', en: 'Jobs are locked' },
  jobsLockedSub: { hi: 'जॉब देखने के लिए पहचान जाँच पूरी करें', en: 'Complete verification to see jobs' },
  startVerification: { hi: 'जाँच शुरू करें', en: 'Start verification' },
  noJobs: { hi: 'अभी कोई काम नहीं', en: 'No jobs yet' },
  noJobsSub: { hi: 'नए काम आते ही हम आपको सूचित करेंगे।', en: "We'll notify you when new jobs arrive." },
  myJobOffers: { hi: 'मेरे जॉब ऑफर', en: 'My job offers' },
  noOffers: { hi: 'अभी कोई ऑफर नहीं', en: 'No offers yet' },
  noOffersSub: { hi: 'नियोक्ता के ऑफर यहाँ दिखेंगे।', en: 'Offers from employers will appear here.' },
  apply: { hi: 'आवेदन करें', en: 'Apply' },
  applied: { hi: 'आवेदन किया', en: 'Applied' },
  alreadyApplied: { hi: 'आपने आवेदन कर दिया है', en: 'You have already applied' },
  setAvailableFirst: { hi: 'आवेदन के लिए उपलब्धता चालू करें', en: 'Turn on availability to apply' },
  accept: { hi: 'स्वीकारें', en: 'Accept' },
  decline: { hi: 'अस्वीकारें', en: 'Decline' },
  pending: { hi: 'इंतज़ार', en: 'Pending' },
  active: { hi: 'सक्रिय', en: 'Active' },
  rejected: { hi: 'अस्वीकृत', en: 'Rejected' },
  hired: { hi: 'आप हायर हो गए!', en: 'You are hired!' },
  salary: { hi: 'वेतन', en: 'Salary' },
  startDate: { hi: 'शुरू तारीख', en: 'Start date' },
  location: { hi: 'स्थान', en: 'Location' },
  distance: { hi: 'दूरी', en: 'Distance' },
  experience: { hi: 'अनुभव', en: 'Experience' },
  stayRequired: { hi: 'साथ रहना ज़रूरी', en: 'Live-in required' },
  notifications: { hi: 'सूचनाएँ', en: 'Notifications' },
  noNotifications: { hi: 'अभी कोई सूचना नहीं', en: 'No notifications yet' },
  noNotificationsSub: { hi: 'नई सूचनाएँ यहाँ दिखेंगी।', en: 'New notifications will appear here.' },

  // Profile
  myProfile: { hi: 'मेरी प्रोफ़ाइल', en: 'My Profile' },
  personalDetails: { hi: 'व्यक्तिगत जानकारी', en: 'Personal Details' },
  occupationSkills: { hi: 'काम और हुनर', en: 'Work & Skills' },
  workHistory: { hi: 'काम का अनुभव', en: 'Work History' },
  locationPrefs: { hi: 'जगह और पसंद', en: 'Location & Preferences' },
  verification: { hi: 'पहचान सत्यापन', en: 'Verification' },
  language: { hi: 'भाषा', en: 'Language' },
  account: { hi: 'खाता', en: 'Account' },
  verified: { hi: 'सत्यापित', en: 'Verified' },
  notVerified: { hi: 'सत्यापित नहीं', en: 'Not verified' },
  logoutConfirm: { hi: 'क्या आप लॉगआउट करना चाहते हैं?', en: 'Do you want to logout?' },

  // Refer & Earn
  referEarn: { hi: 'रेफर करें और कमाएँ', en: 'Refer & Earn' },
  referEarnSub: { hi: 'दोस्तों को बुलाएँ, पॉइंट कमाएँ', en: 'Invite friends, earn points' },
  yourPoints: { hi: 'आपके पॉइंट', en: 'Your points' },
  yourReferralCode: { hi: 'आपका रेफरल कोड', en: 'Your referral code' },
  shareCode: { hi: 'कोड शेयर करें', en: 'Share code' },
  copied: { hi: 'कॉपी हो गया', en: 'Copied' },
  referralsJoined: { hi: 'दोस्त जुड़े', en: 'friends joined' },
  haveACode: { hi: 'किसी का कोड है?', en: 'Have a code?' },
  enterReferralCode: { hi: 'रेफरल कोड डालें', en: 'Enter referral code' },
  redeemPoints: { hi: 'पॉइंट इस्तेमाल करें', en: 'Use your points' },
  boostProfile: { hi: 'प्रोफ़ाइल बूस्ट', en: 'Boost Profile' },
  boostProfileSub: { hi: 'नियोक्ता को पहले दिखें (7 दिन)', en: 'Show first to employers (7 days)' },
  panIndiaJobs: { hi: 'पूरे भारत के काम', en: 'Pan-India Jobs' },
  panIndiaJobsSub: { hi: 'अपने शहर के बाहर के काम देखें (30 दिन)', en: 'See jobs outside your city (30 days)' },
  redeem: { hi: 'पाएँ', en: 'Redeem' },
  active7: { hi: 'चालू', en: 'Active' },
  notEnoughPoints: { hi: 'पर्याप्त पॉइंट नहीं', en: 'Not enough points' },
  points: { hi: 'पॉइंट', en: 'points' },
  howItWorks: { hi: 'हर दोस्त के जुड़ने पर 100 पॉइंट कमाएँ।', en: 'Earn 100 points for every friend who joins.' },
};

export function t(key: string, lang: string = 'hi'): string {
  const l = (lang === 'en' ? 'en' : 'hi') as Lang;
  return strings[key]?.[l] ?? strings[key]?.['en'] ?? key;
}

// Hook: returns a translator bound to the current language.
export function useT(): (key: string) => string {
  const lang = useSelector((s: RootState) => s.auth.language);
  return (key: string) => t(key, lang);
}
