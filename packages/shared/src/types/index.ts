export type UserRole = 'WORKER' | 'EMPLOYER' | 'ADMIN';

export type KycStatus =
  | 'PENDING'
  | 'AADHAAR_DONE'
  | 'PAN_DONE'
  | 'SELFIE_DONE'
  | 'BGC_INITIATED'
  | 'FULLY_VERIFIED'
  | 'BLOCKED'
  | 'SUSPENDED';

export type BgcStatus = 'INITIATED' | 'PENDING' | 'CLEAR' | 'FLAGGED' | 'ERROR';

export type HireStatus =
  | 'OFFER_SENT'
  | 'WORKER_SIGNED'
  | 'EMPLOYER_SIGNED'
  | 'ACTIVE'
  | 'TERMINATED';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: { id: string; role: UserRole; is_new_user: boolean };
}

export interface ScoreBreakdown {
  job_type: number;
  location: number;
  experience: number;
  verified: number;
  live_in: number;
}

export const JOB_TYPES = [
  'driver',
  'security_guard',
  'cook',
  'housekeeper',
  'delivery',
  'electrician',
  'plumber',
  'peon',
  'sweeper',
  'helper',
] as const;

export type JobType = typeof JOB_TYPES[number];

export const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी' },
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
] as const;

export const TOP_CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Surat', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
] as const;
