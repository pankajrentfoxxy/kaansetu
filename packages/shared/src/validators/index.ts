import { z } from 'zod';

export const MobileSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
});

export const OtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export const PersonalDetailsSchema = z.object({
  full_name: z.string().min(2).max(200).regex(/^[ऀ-ॿa-zA-Z\s]+$/, 'Letters only'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => {
    const age = (Date.now() - new Date(d).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 18 && age <= 70;
  }, 'Age must be between 18 and 70'),
  gender: z.enum(['M', 'F', 'O']),
  education_level: z.enum(['none', 'class5', '10th', '12th', 'graduate', 'postgraduate']).optional(),
});

export const PanSchema = z.object({
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
});

export const RequirementSchema = z.object({
  job_type: z.string().min(1),
  openings: z.number().min(1).max(1000),
  salary_min: z.number().min(1000),
  salary_max: z.number().min(1000),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().max(10).optional(),
  is_pan_india: z.boolean(),
  is_live_in_required: z.boolean(),
  min_experience_years: z.number().min(0).max(50),
  start_date: z.string().optional(),
}).refine((d) => d.salary_max >= d.salary_min, { message: 'Max salary must be >= min salary' })
  .refine((d) => d.is_pan_india || d.city, { message: 'Provide city or enable Pan India' });

export const GstSchema = z.object({
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number'),
});
