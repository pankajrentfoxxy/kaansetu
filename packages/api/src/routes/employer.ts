import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { surepassService } from '../services/surepass.service';
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

// Global worker search for hiring — browse all verified, open-to-work workers,
// independent of a posted job. Filters: q (name), skill_type, city, min_experience, verified.
employerRoutes.get('/workers/search', async (req: AuthRequest, res, next) => {
  try {
    const { q, skill_type, city, min_experience, verified, open_to_work } = req.query;
    const where: any = { deleted_at: null, blocked_at: null };
    if (open_to_work !== 'false') where.is_open_to_work = true;
    if (verified === 'true') where.kyc_status = 'FULLY_VERIFIED';
    if (q) where.full_name = { contains: String(q), mode: 'insensitive' };
    if (city) where.location = { is: { city: { contains: String(city), mode: 'insensitive' } } };
    if (skill_type) where.skills = { some: { skill_type: String(skill_type) } };

    const workers = await prisma.worker.findMany({
      where,
      include: { skills: true, location: true, verifications: true },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const min = min_experience ? Number(min_experience) : 0;
    const result = min > 0
      ? workers.filter((w) => Math.max(0, ...w.skills.map((s) => s.experience_years)) >= min)
      : workers;
    res.json(result);
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
    if (!worker_id) { res.status(422).json({ error: 'worker_id is required' }); return; }
    // Use upsert to handle duplicate shortlists gracefully
    const shortlist = await prisma.shortlist.upsert({
      where: {
        employer_id_worker_id_requirement_id: {
          employer_id: employer.id,
          worker_id,
          requirement_id: requirement_id ?? '',
        },
      },
      update: { notes },
      create: { employer_id: employer.id, worker_id, requirement_id: requirement_id ?? '', notes },
    });
    try {
      const worker = await prisma.worker.findUnique({ where: { id: worker_id }, include: { user: true } });
      const requirement = requirement_id
        ? await prisma.requirement.findUnique({ where: { id: requirement_id } })
        : null;
      const role = requirement?.job_type?.replace(/_/g, ' ') ?? 'a job';
      // Persist an in-app notification so the worker is informed even without an
      // FCM token (e.g. on web). Push is best-effort on top of this.
      await prisma.notification.create({
        data: {
          type: 'WORKER_SHORTLISTED',
          worker_id,
          title: 'You have been shortlisted!',
          body: `${employer.company_name} shortlisted you for ${role}. They may send you an offer soon.`,
          data: { employer_id: employer.id, requirement_id: requirement_id ?? null },
        },
      });
      if (worker?.user.fcm_token) {
        await fcmService.sendTemplate(worker.user.fcm_token, 'WORKER_NEW_JOB_MATCH', worker.id, true);
      }
    } catch { /* notification/FCM failure should not fail the shortlist */ }
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

    if (!worker_id) { res.status(422).json({ error: 'worker_id is required' }); return; }
    if (!offer_salary || isNaN(Number(offer_salary))) { res.status(422).json({ error: 'offer_salary must be a number' }); return; }
    if (!start_date) { res.status(422).json({ error: 'start_date is required' }); return; }

    const worker = await prisma.worker.findUniqueOrThrow({
      where: { id: worker_id },
      include: { location: true },
    });

    // requirement_id is optional — some hires may come from direct shortlist without a requirement
    let req_: any = null;
    if (requirement_id) {
      req_ = await prisma.requirement.findFirst({
        where: { id: requirement_id, employer_id: employer.id },
      });
    }
    // If requirement_id given but not found, use first active requirement
    if (!req_ && requirement_id) {
      req_ = await prisma.requirement.findFirst({ where: { employer_id: employer.id, status: 'ACTIVE' } });
    }
    // If still no requirement, create without it — use a placeholder
    const finalRequirementId = req_?.id ?? requirement_id;

    if (!finalRequirementId) {
      res.status(422).json({ error: 'No active requirement found for this employer. Please post a requirement first.' });
      return;
    }

    const hire = await prisma.hire.create({
      data: {
        employer_id: employer.id,
        worker_id,
        requirement_id: finalRequirementId,
        offer_salary: Number(offer_salary),
        start_date: new Date(start_date),
        status: 'OFFER_SENT',
      },
    });

    // Respond immediately — push/notification is a best-effort side effect.
    // The offer letter PDF is generated on demand (GET /api/v1/offer-letter/:hireId),
    // so there is no storage step to block or fail the hire.
    res.status(201).json({ ...hire, offer_letter_url: null });

    void (async () => {
      try {
        const workerUser = await prisma.user.findUnique({ where: { id: worker.user_id } });
        if (workerUser?.fcm_token) {
          await fcmService.sendTemplate(workerUser.fcm_token, 'HIRE_CONFIRMED', worker.id, true);
        }
        await prisma.notification.create({
          data: {
            type: 'OFFER_LETTER_READY',
            worker_id,
            title: 'Job Offer Received!',
            body: `${employer.company_name} has sent you an offer for ${req_?.job_type?.replace(/_/g, ' ') ?? 'a job'}. Tap to review and accept.`,
            data: { hire_id: hire.id },
          },
        });
      } catch { /* notification/FCM failure must not affect the hire */ }
    })();
  } catch (err) { next(err); }
});

employerRoutes.get('/hires', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const hires = await prisma.hire.findMany({
      where: { employer_id: employer.id },
      include: {
        worker: { include: { skills: true, location: true } },
        requirement: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(hires);
  } catch (err) { next(err); }
});

// Employer e-sign: update hire status to EMPLOYER_SIGNED
employerRoutes.put('/hire/:hireId/esign', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const { employer_signature_name } = req.body;
    const hire = await prisma.hire.findFirstOrThrow({
      where: { id: req.params.hireId, employer_id: employer.id },
      include: { worker: true, requirement: true },
    });
    const updated = await prisma.hire.update({
      where: { id: hire.id },
      data: {
        esign_employer_at: new Date(),
        status: 'EMPLOYER_SIGNED',
      },
    });
    // Notify worker
    try {
      const workerUser = await prisma.user.findUnique({ where: { id: hire.worker.user_id } });
      if (workerUser?.fcm_token) {
        await fcmService.sendTemplate(workerUser.fcm_token, 'HIRE_CONFIRMED', hire.worker.id, true);
      }
      await prisma.notification.create({
        data: {
          type: 'OFFER_LETTER_READY',
          worker_id: hire.worker_id,
          title: 'Job Offer Received!',
          body: `${employer.company_name} has sent you an offer for ${hire.requirement?.job_type?.replace(/_/g, ' ')}. Tap to review and accept.`,
          data: { hire_id: hire.id },
        },
      });
    } catch { /* ignore notification errors */ }
    res.json({ ...updated, employer_signature_name });
  } catch (err) { next(err); }
});

// Get applications (workers who applied via express-interest)
employerRoutes.get('/applications', async (req: AuthRequest, res, next) => {
  try {
    const employer = await getEmployer(req.user!.id);
    const notifications = await prisma.notification.findMany({
      where: { employer_id: employer.id, type: 'WORKER_APPLIED' },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    // Enrich with worker data
    const enriched = await Promise.all(notifications.map(async (n) => {
      try {
        const data = n.data as any;
        const worker = data?.worker_id ? await prisma.worker.findUnique({
          where: { id: data.worker_id },
          include: { skills: true, location: true, verifications: true },
        }) : null;
        return { ...n, worker };
      } catch { return { ...n, worker: null }; }
    }));
    res.json(enriched.filter((n) => n.worker));
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
