import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { surepassService } from '../services/surepass.service';
import { offerLetterService } from '../services/offerLetter.service';
import { fcmService } from '../services/fcm.service';

export const employerRoutes = Router();
employerRoutes.use(authenticate, requireRole('EMPLOYER'));

const ProfileSchema = z.object({
  company_name: z.string().min(1).max(200),
  entity_type: z.string().min(1).max(30),
  gst_number: z.string().max(20).optional(),
  pan_number: z.string().max(20).optional(),
  tan_number: z.string().max(20).optional(),
  cin_number: z.string().max(25).optional(),
  registered_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().max(10).optional(),
  contact_name: z.string().optional(),
  contact_mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
});

async function getEmployer(userId: string) {
  return prisma.employer.findUniqueOrThrow({ where: { user_id: userId } });
}

employerRoutes.get('/profile', async (req: AuthRequest, res, next) => {
  try {
    const employer = await prisma.employer.findUniqueOrThrow({
      where: { user_id: req.user!.id },
      include: { verifications: true },
    });
    res.json(employer);
  } catch (err) { next(err); }
});

employerRoutes.put('/profile', validate(ProfileSchema), async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const updated = await prisma.employer.update({ where: { id: employer.id }, data: req.body });
    res.json(updated);
  } catch (err) { next(err); }
});

employerRoutes.post('/kyc/verify-gst', async (req: AuthRequest, res, next) => {
  try {
    const { gst_number } = req.body;
    const employer = await getEmployer(req.user!.id);
    await surepassService.verifyGst(gst_number);
    await prisma.employerVerification.create({
      data: { employer_id: employer.id, check_type: 'GST', status: 'VERIFIED', verified_at: new Date() },
    });
    await prisma.employer.update({ where: { id: employer.id }, data: { gst_number, kyc_status: 'GST_VERIFIED' } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

employerRoutes.post('/kyc/verify-pan', async (req: AuthRequest, res, next) => {
  try {
    const { pan_number } = req.body;
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number)) {
      res.status(422).json({ error: 'Invalid PAN format' });
      return;
    }
    const employer = await getEmployer(req.user!.id);
    await surepassService.verifyPan(pan_number);
    await prisma.employerVerification.create({
      data: { employer_id: employer.id, check_type: 'PAN', status: 'VERIFIED', verified_at: new Date() },
    });
    await prisma.employer.update({
      where: { id: employer.id },
      data: { pan_number, kyc_status: 'PAN_VERIFIED' },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

employerRoutes.post('/requirements', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const requirement = await prisma.requirement.create({
      data: { ...req.body, employer_id: employer.id, expires_at: expiresAt },
    });
    // Run matching asynchronously
    const { matchingService } = await import('../services/matching.service');
    matchingService.runMatchingForRequirement(requirement.id).catch(console.error);
    res.status(201).json(requirement);
  } catch (err) { next(err); }
});

employerRoutes.get('/requirements', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const reqs = await prisma.requirement.findMany({
      where: { employer_id: employer.id },
      include: { _count: { select: { matches: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json(reqs);
  } catch (err) { next(err); }
});

employerRoutes.put('/requirements/:id', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const req_ = await prisma.requirement.findFirstOrThrow({
      where: { id: req.params.id, employer_id: employer.id },
    });
    const updated = await prisma.requirement.update({ where: { id: req_.id }, data: req.body });
    res.json(updated);
  } catch (err) { next(err); }
});

employerRoutes.get('/requirements/:id/matches', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    await prisma.requirement.findFirstOrThrow({
      where: { id: req.params.id, employer_id: employer.id },
    });
    const matches = await prisma.match.findMany({
      where: { requirement_id: req.params.id },
      include: {
        worker: {
          include: { skills: true, location: true, verifications: true, work_history: true },
        },
      },
      orderBy: { match_score: 'desc' },
    });
    res.json(matches);
  } catch (err) { next(err); }
});

employerRoutes.post('/shortlist', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const { worker_id, requirement_id, notes } = req.body;
    const shortlist = await prisma.shortlist.create({
      data: { employer_id: employer.id, worker_id, requirement_id, notes },
    });
    const worker = await prisma.worker.findUnique({ where: { id: worker_id }, include: { user: true } });
    if (worker?.user.fcm_token) {
      await fcmService.sendTemplate(worker.user.fcm_token, 'WORKER_NEW_JOB_MATCH', worker.id, true);
    }
    res.status(201).json(shortlist);
  } catch (err) { next(err); }
});

employerRoutes.get('/shortlist', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const list = await prisma.shortlist.findMany({
      where: { employer_id: employer.id },
      include: { worker: { include: { skills: true, verifications: true, location: true } } },
    });
    res.json(list);
  } catch (err) { next(err); }
});

employerRoutes.post('/hire', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const { worker_id, requirement_id, offer_salary, start_date } = req.body;

    const worker = await prisma.worker.findUniqueOrThrow({
      where: { id: worker_id },
      include: { location: true },
    });
    const req_ = await prisma.requirement.findFirstOrThrow({
      where: { id: requirement_id, employer_id: employer.id },
    });

    const hire = await prisma.hire.create({
      data: {
        employer_id: employer.id,
        worker_id,
        requirement_id,
        offer_salary,
        start_date: new Date(start_date),
        status: 'OFFER_SENT',
      },
    });

    const pdfUrl = await offerLetterService.generate({
      id: hire.id,
      workerName: worker.full_name,
      companyName: employer.company_name,
      role: req_.job_type,
      salary: offer_salary,
      startDate: new Date(start_date),
      city: employer.city ?? '',
    });

    await prisma.hire.update({ where: { id: hire.id }, data: { offer_letter_url: pdfUrl } });

    const workerUser = await prisma.user.findUnique({ where: { id: worker.user_id } });
    if (workerUser?.fcm_token) {
      await fcmService.sendTemplate(workerUser.fcm_token, 'HIRE_CONFIRMED', worker.id, true);
    }

    res.status(201).json({ ...hire, offer_letter_url: pdfUrl });
  } catch (err) { next(err); }
});

employerRoutes.get('/hires', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const hires = await prisma.hire.findMany({
      where: { employer_id: employer.id },
      include: { worker: true, requirement: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(hires);
  } catch (err) { next(err); }
});

employerRoutes.get('/case-alerts', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const alerts = await prisma.caseAlert.findMany({
      where: { employer_id: employer.id },
      orderBy: { notified_at: 'desc' },
    });
    res.json(alerts);
  } catch (err) { next(err); }
});

employerRoutes.post('/case-alerts/:id/action', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const { action } = req.body;
    const alert = await prisma.caseAlert.findFirstOrThrow({
      where: { id: req.params.id, employer_id: employer.id },
    });
    await prisma.caseAlert.update({
      where: { id: alert.id },
      data: { employer_action: action, employer_acted_at: new Date() },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Mock KYC endpoints (dev/demo only) ──────────────────────────────────────
employerRoutes.post('/kyc/mock-business', async (req: AuthRequest, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_OTP !== 'true') {
    return res.status(403).json({ message: 'Not available in production' });
  }
  try {
    const employer = await getEmployer(req.user!.id);
    const existing = await prisma.employerVerification.findFirst({ where: { employer_id: employer.id, check_type: 'BUSINESS' } });
    if (existing) {
      await prisma.employerVerification.update({ where: { id: existing.id }, data: { status: 'VERIFIED', verified_at: new Date() } });
    } else {
      await prisma.employerVerification.create({ data: { employer_id: employer.id, check_type: 'BUSINESS', status: 'VERIFIED', verified_at: new Date() } });
    }
    res.json({ success: true, message: 'Mock business verified' });
  } catch (err) { next(err); }
});

employerRoutes.post('/kyc/mock-pan', async (req: AuthRequest, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_OTP !== 'true') {
    return res.status(403).json({ message: 'Not available in production' });
  }
  try {
    const employer = await getEmployer(req.user!.id);
    const existing = await prisma.employerVerification.findFirst({ where: { employer_id: employer.id, check_type: 'PAN' } });
    if (existing) {
      await prisma.employerVerification.update({ where: { id: existing.id }, data: { status: 'VERIFIED', verified_at: new Date() } });
    } else {
      await prisma.employerVerification.create({ data: { employer_id: employer.id, check_type: 'PAN', status: 'VERIFIED', verified_at: new Date() } });
    }
    res.json({ success: true, message: 'Mock PAN verified' });
  } catch (err) { next(err); }
});
