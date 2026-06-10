import { Colors } from './colors';

// Every job type gets ONE consistent icon + color pair.
// Workers learn the shape + color, not the word. Replaces emojis everywhere.
// `icon` names are from MaterialCommunityIcons (@expo/vector-icons).

export type JobMeta = {
  icon: string;
  color: string; // icon / text color (dark, readable on `bg`)
  bg: string; // light tile background
  labelHi: string;
  labelEn: string;
};

const JOB_META: Record<string, JobMeta> = {
  driver: { icon: 'steering', color: Colors.primary, bg: Colors.primaryLight, labelHi: 'ड्राइवर', labelEn: 'Driver' },
  security_guard: { icon: 'shield-account', color: Colors.warningDark, bg: Colors.warningLight, labelHi: 'गार्ड', labelEn: 'Security Guard' },
  cook: { icon: 'chef-hat', color: Colors.coral, bg: Colors.coralLight, labelHi: 'रसोइया', labelEn: 'Cook' },
  housekeeper: { icon: 'home-heart', color: Colors.teal, bg: Colors.tealLight, labelHi: 'हाउसकीपर', labelEn: 'Housekeeper' },
  delivery: { icon: 'package-variant-closed', color: Colors.green, bg: Colors.greenLight, labelHi: 'डिलीवरी', labelEn: 'Delivery' },
  electrician: { icon: 'flash', color: Colors.purple, bg: Colors.purpleLight, labelHi: 'इलेक्ट्रिशियन', labelEn: 'Electrician' },
  plumber: { icon: 'pipe-wrench', color: Colors.pink, bg: Colors.pinkLight, labelHi: 'प्लंबर', labelEn: 'Plumber' },
  peon: { icon: 'clipboard-text-outline', color: Colors.gray, bg: Colors.grayLight, labelHi: 'चपरासी', labelEn: 'Peon' },
  sweeper: { icon: 'broom', color: Colors.teal, bg: Colors.tealLight, labelHi: 'सफाईकर्मी', labelEn: 'Sweeper' },
  helper: { icon: 'hand-heart-outline', color: Colors.gray, bg: Colors.grayLight, labelHi: 'हेल्पर', labelEn: 'Helper' },
};

const DEFAULT_META: JobMeta = {
  icon: 'briefcase-outline',
  color: Colors.primary,
  bg: Colors.primaryLight,
  labelHi: 'काम',
  labelEn: 'Job',
};

export function getJobMeta(jobType?: string | null): JobMeta {
  if (!jobType) return DEFAULT_META;
  return JOB_META[jobType] ?? DEFAULT_META;
}

// Pretty label for a job type, in the chosen language.
export function jobLabel(jobType?: string | null, lang: string = 'hi'): string {
  const meta = getJobMeta(jobType);
  return lang === 'en' ? meta.labelEn : meta.labelHi;
}

export const JOB_TYPES = Object.keys(JOB_META);
