import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { surepassService } from '../services/surepass.service';
import { authrbridge } from '../services/authbridge.service';
import { s3Service } from '../services/s3.service';
import { scoringService } from '../services/scoring.service';
import { fcmService } from '../services/fcm.service';
import { encrypt, validateMaskedAadhaar } from '../utils/crypto';

export const workerRoutes = Router();
workerRoutes.use(authenticate, requireRole('WORKER'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const PersonalSchema = z.object({
  full_name: z.string().min(2).max(200),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  father_name: z.string().max(200).optional(),
  education_level: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
});

const SkillsSchema = z.object({
  skills: z.array(z.object({
    skill_type: z.string().min(1).max(50),
    specialisation: z.string().optional(),
    experience_years: z.number().min(0).max(60),
    licence_number: z.string().optional(),
    is_primary: z.boolean(),
  })),
});

const LocationSchema = z.object({
  current_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().max(10).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  preferred_cities: z.array(z.string()).optional(),
  is_live_in_ok: z.boolean().optional(),
  is_pan_india: z.boolean().optional(),
});

async function getWorker(userId: string) {
  return prisma.worker.findUniqueOrThrow({
    where: { user_id: userId },
    include: {
      skills: true,
      work_history: true,
      location: true,
      documents: true,
      verifications: true,
      background_checks: { orderBy: { initiated_at: 'desc' }, take: 1 },
    },
  });
}

workerRoutes.get('/profile', async (req: AuthRequest, res, next) => {
  try {
    const worker = await getWorker(req.user!.id);
    res.json(worker);
  } catch (err) { next(err); }
});

workerRoutes.put('/profile/personal', validate(PersonalSchema), async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const updated = await prisma.worker.update({
      where: { id: worker.id },
      data: {
        full_name: req.body.full_name,
        dob: req.body.dob ? new Date(req.body.dob) : undefined,
        gender: req.body.gender,
        father_name: req.body.father_name,
        education_level: req.body.education_level,
        language: req.body.language,
      },
    });
    await scoringService.recalculate(worker.id);
    res.json(updated);
  } catch (err) { next(err); }
});

workerRoutes.put('/profile/skills', validate(SkillsSchema), async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    await prisma.workerSkill.deleteMany({ where: { worker_id: worker.id } });
    await prisma.workerSkill.createMany({
      data: req.body.skills.map((s: any) => ({ ...s, worker_id: worker.id })),
    });
    await scoringService.recalculate(worker.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

workerRoutes.put('/profile/history', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    await prisma.workHistory.deleteMany({ where: { worker_id: worker.id } });
    const histories = req.body.history ?? [];
    await prisma.workHistory.createMany({
      data: histories.map((h: any) => ({
        ...h,
        worker_id: worker.id,
        from_date: new Date(h.from_date),
        to_date: h.to_date ? new Date(h.to_date) : null,
      })),
    });
    await scoringService.recalculate(worker.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

workerRoutes.put('/profile/location', validate(LocationSchema), async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const { is_live_in_ok, is_pan_india, latitude, longitude, preferred_cities, ...rest } = req.body;
    await prisma.workerLocation.upsert({
      where: { worker_id: worker.id },
      create: { worker_id: worker.id, ...rest, latitude, longitude, preferred_cities: preferred_cities ?? [] },
      update: { ...rest, latitude, longitude, preferred_cities: preferred_cities ?? [] },
    });
    await prisma.worker.update({
      where: { id: worker.id },
      data: { is_live_in_ok: is_live_in_ok ?? worker.is_live_in_ok, is_pan_india: is_pan_india ?? worker.is_pan_india },
    });
    await scoringService.recalculate(worker.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

workerRoutes.put('/profile/toggle-work', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const updated = await prisma.worker.update({
      where: { id: worker.id },
      data: { is_open_to_work: !worker.is_open_to_work },
    });
    res.json({ is_open_to_work: updated.is_open_to_work });
  } catch (err) { next(err); }
});

workerRoutes.post('/kyc/consent', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    await prisma.worker.update({
      where: { id: worker.id },
      data: { consent_given_at: new Date(), consent_ip: req.ip },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

workerRoutes.post('/kyc/initiate-aadhaar', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const { client_id } = req.body;
    const data = await surepassService.downloadAadhaar(client_id);

    const masked = data.masked_aadhaar ?? data.aadhaar_number;
    if (!validateMaskedAadhaar(masked)) {
      throw new Error('Invalid masked Aadhaar format received');
    }

    let photoUrl: string | undefined;
    if (data.profile_image) {
      photoUrl = await s3Service.uploadBase64(
        `workers/${worker.id}/aadhaar-photo.jpg`,
        data.profile_image,
        'image/jpeg',
      );
    }

    await prisma.workerDocument.upsert({
      where: { worker_id: worker.id },
      create: {
        worker_id: worker.id,
        masked_aadhaar: masked,
        aadhaar_xml_url: data.xml_url,
        digilocker_client_id: client_id,
      },
      update: { masked_aadhaar: masked, aadhaar_xml_url: data.xml_url, digilocker_client_id: client_id },
    });

    await prisma.worker.update({
      where: { id: worker.id },
      data: {
        full_name: data.full_name ?? worker.full_name,
        dob: data.dob ? new Date(data.dob) : worker.dob,
        gender: data.gender ?? worker.gender,
        father_name: data.father_name ?? worker.father_name,
        profile_photo_url: photoUrl ?? worker.profile_photo_url,
        kyc_status: 'AADHAAR_DONE',
      },
    });

    if (data.address) {
      await prisma.workerLocation.upsert({
        where: { worker_id: worker.id },
        create: {
          worker_id: worker.id,
          full_address: data.address,
          aadhaar_district: data.district,
          aadhaar_state: data.state,
          city: data.district,
          state: data.state,
          pincode: data.pincode,
          preferred_cities: [],
        },
        update: {
          full_address: data.address,
          aadhaar_district: data.district,
          aadhaar_state: data.state,
        },
      });
    }

    await prisma.workerVerification.create({
      data: { worker_id: worker.id, check_type: 'AADHAAR', status: 'VERIFIED', verified_at: new Date() },
    });

    await prisma.user.update({ where: { id: req.user!.id }, data: { mobile_verified: true } });
    await scoringService.recalculate(worker.id);

    res.json({
      success: true,
      worker_data: {
        name: data.full_name,
        dob: data.dob,
        masked_aadhaar: masked,
        address: data.address,
      },
    });
  } catch (err) { next(err); }
});

workerRoutes.post('/kyc/verify-pan', async (req: AuthRequest, res, next) => {
  try {
    const { pan_number } = req.body;
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number)) {
      res.status(422).json({ error: 'Invalid PAN format' });
      return;
    }
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    await surepassService.verifyPan(pan_number);

    const encrypted = encrypt(pan_number);
    await prisma.workerDocument.upsert({
      where: { worker_id: worker.id },
      create: { worker_id: worker.id, pan_number: encrypted },
      update: { pan_number: encrypted },
    });

    await prisma.workerVerification.create({
      data: { worker_id: worker.id, check_type: 'PAN', status: 'VERIFIED', verified_at: new Date() },
    });
    await prisma.worker.update({ where: { id: worker.id }, data: { kyc_status: 'PAN_DONE' } });
    await scoringService.recalculate(worker.id);

    res.json({ success: true });
  } catch (err) { next(err); }
});

workerRoutes.post('/kyc/upload-selfie', upload.single('selfie'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      res.status(422).json({ error: 'No file uploaded' });
      return;
    }
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(req.file.mimetype)) {
      res.status(422).json({ error: 'Only JPEG/PNG allowed' });
      return;
    }
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const url = await s3Service.upload(
      `workers/${worker.id}/selfie.jpg`,
      req.file.buffer,
      req.file.mimetype,
    );

    await prisma.workerDocument.upsert({
      where: { worker_id: worker.id },
      create: { worker_id: worker.id, selfie_url: url },
      update: { selfie_url: url },
    });

    await prisma.workerVerification.create({
      data: { worker_id: worker.id, check_type: 'SELFIE', status: 'VERIFIED', verified_at: new Date() },
    });
    await prisma.worker.update({ where: { id: worker.id }, data: { kyc_status: 'SELFIE_DONE' } });
    await scoringService.recalculate(worker.id);

    res.json({ success: true, selfie_url: url });
  } catch (err) { next(err); }
});

workerRoutes.post('/kyc/initiate-bgc', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({
      where: { user_id: req.user!.id },
      include: { documents: true, location: true },
    });

    const validStatuses = ['SELFIE_DONE', 'PAN_DONE'];
    if (!validStatuses.includes(worker.kyc_status)) {
      res.status(400).json({ error: 'Complete selfie verification before initiating background check' });
      return;
    }

    const refId = await authrbridge.initiateCheck(
      {
        full_name: worker.full_name,
        dob: worker.dob?.toISOString().split('T')[0],
        father_name: worker.father_name ?? undefined,
        masked_aadhaar: worker.documents?.masked_aadhaar ?? undefined,
        address: worker.location?.full_address ?? undefined,
        city: worker.location?.city ?? undefined,
        state: worker.location?.state ?? undefined,
      },
      'ONBOARDING',
    );

    await prisma.backgroundCheck.create({
      data: { worker_id: worker.id, check_type: 'ONBOARDING', authbridge_ref_id: refId, status: 'INITIATED' },
    });
    await prisma.worker.update({ where: { id: worker.id }, data: { kyc_status: 'BGC_INITIATED' } });

    res.json({ success: true, message: 'Background check initiated. Results in 24-48 hours.' });
  } catch (err) { next(err); }
});

workerRoutes.get('/jobs', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const matches = await prisma.match.findMany({
      where: { worker_id: worker.id },
      include: { requirement: { include: { employer: true } } },
      orderBy: { match_score: 'desc' },
      take: 50,
    });
    res.json(matches);
  } catch (err) { next(err); }
});

workerRoutes.post('/jobs/:matchId/apply', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const match = await prisma.match.findFirst({
      where: { id: req.params.matchId, worker_id: worker.id },
      include: { requirement: { include: { employer: { include: { user: true } } } } },
    });
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }

    // Notify employer via FCM (best-effort)
    try {
      const employerFcm = match.requirement.employer.user?.fcm_token;
      if (employerFcm) {
        await fcmService.sendTemplate(employerFcm, 'WORKER_NEW_JOB_MATCH', worker.id, true);
      }
    } catch { /* ignore FCM errors */ }

    // Log notification record for the employer
    try {
      await prisma.notification.create({
        data: {
          type: 'WORKER_APPLIED',
          employer_id: match.requirement.employer.id,
          title: 'New Job Application',
          body: `${worker.full_name || 'A worker'} has applied for your ${match.requirement.job_type?.replace(/_/g, ' ')} requirement.`,
          data: { match_id: match.id, worker_id: worker.id },
        },
      });
    } catch { /* ignore notification errors */ }

    res.json({ success: true, message: 'Application sent successfully' });
  } catch (err) { next(err); }
});

workerRoutes.get('/notifications', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const notifs = await prisma.notification.findMany({
      where: { worker_id: worker.id },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json(notifs);
  } catch (err) { next(err); }
});

// ── DEV-MODE MOCK KYC ENDPOINTS ──────────────────────────────────────────────

workerRoutes.post('/kyc/mock-selfie', async (req: AuthRequest, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_OTP !== 'true') {
    res.status(403).json({ error: 'Mock endpoints are not available in production' });
    return;
  }
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    await prisma.workerDocument.upsert({
      where: { worker_id: worker.id },
      create: { worker_id: worker.id, selfie_url: 'mock://selfie' },
      update: { selfie_url: 'mock://selfie' },
    });
    await prisma.workerVerification.create({
      data: { worker_id: worker.id, check_type: 'SELFIE', status: 'VERIFIED', verified_at: new Date() },
    });
    await prisma.worker.update({ where: { id: worker.id }, data: { kyc_status: 'SELFIE_DONE' } });
    await scoringService.recalculate(worker.id);
    res.json({ success: true, mock: true });
  } catch (err) { next(err); }
});

workerRoutes.post('/kyc/mock-address', async (req: AuthRequest, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_OTP !== 'true') {
    res.status(403).json({ error: 'Mock endpoints are not available in production' });
    return;
  }
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    await prisma.workerLocation.upsert({
      where: { worker_id: worker.id },
      create: {
        worker_id: worker.id,
        city: req.body.city ?? 'Mumbai',
        state: req.body.state ?? 'Maharashtra',
        pincode: req.body.pincode ?? '400001',
        preferred_cities: [],
      },
      update: {
        city: req.body.city ?? 'Mumbai',
        state: req.body.state ?? 'Maharashtra',
        pincode: req.body.pincode ?? '400001',
      },
    });
    await prisma.workerVerification.create({
      data: { worker_id: worker.id, check_type: 'ADDRESS', status: 'VERIFIED', verified_at: new Date() },
    });
    await scoringService.recalculate(worker.id);
    res.json({ success: true, mock: true });
  } catch (err) { next(err); }
});

workerRoutes.post('/kyc/mock-aadhaar', async (req: AuthRequest, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_OTP !== 'true') {
    res.status(403).json({ error: 'Mock endpoints are not available in production' });
    return;
  }
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    await prisma.workerDocument.upsert({
      where: { worker_id: worker.id },
      create: { worker_id: worker.id, masked_aadhaar: 'XXXXXXXX1234' },
      update: { masked_aadhaar: 'XXXXXXXX1234' },
    });
    await prisma.worker.update({
      where: { id: worker.id },
      data: {
        full_name: worker.full_name || 'Test Worker',
        kyc_status: 'AADHAAR_DONE',
      },
    });
    await prisma.workerVerification.create({
      data: { worker_id: worker.id, check_type: 'AADHAAR', status: 'VERIFIED', verified_at: new Date() },
    });
    await scoringService.recalculate(worker.id);
    res.json({ success: true, mock: true });
  } catch (err) { next(err); }
});

workerRoutes.post('/kyc/mock-pan', async (req: AuthRequest, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_OTP !== 'true') {
    res.status(403).json({ error: 'Mock endpoints are not available in production' });
    return;
  }
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const encrypted = encrypt('ABCDE1234F');
    await prisma.workerDocument.upsert({
      where: { worker_id: worker.id },
      create: { worker_id: worker.id, pan_number: encrypted },
      update: { pan_number: encrypted },
    });
    await prisma.workerVerification.create({
      data: { worker_id: worker.id, check_type: 'PAN', status: 'VERIFIED', verified_at: new Date() },
    });
    await prisma.worker.update({ where: { id: worker.id }, data: { kyc_status: 'PAN_DONE' } });
    await scoringService.recalculate(worker.id);
    res.json({ success: true, mock: true });
  } catch (err) { next(err); }
});

workerRoutes.post('/kyc/mock-bgc', async (req: AuthRequest, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_OTP !== 'true') {
    res.status(403).json({ error: 'Mock endpoints are not available in production' });
    return;
  }
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    await prisma.backgroundCheck.create({
      data: {
        worker_id: worker.id,
        check_type: 'ONBOARDING',
        authbridge_ref_id: `MOCK-${Date.now()}`,
        status: 'CLEAR',
      },
    });
    await prisma.worker.update({ where: { id: worker.id }, data: { kyc_status: 'FULLY_VERIFIED' } });
    await scoringService.recalculate(worker.id);
    res.json({ success: true, mock: true });
  } catch (err) { next(err); }
});

// ── END MOCK KYC ENDPOINTS ───────────────────────────────────────────────────

workerRoutes.post('/reinstatement/upload', upload.single('document'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) { res.status(422).json({ error: 'No file uploaded' }); return; }
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const url = await s3Service.upload(
      `workers/${worker.id}/clearance-doc.pdf`,
      req.file.buffer,
      req.file.mimetype,
    );
    await prisma.workerDocument.upsert({
      where: { worker_id: worker.id },
      create: { worker_id: worker.id, clearance_doc_url: url },
      update: { clearance_doc_url: url },
    });
    res.json({ success: true, message: 'Clearance document uploaded. Our team will review within 48 hours.' });
  } catch (err) { next(err); }
});
