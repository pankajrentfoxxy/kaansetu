import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { fcmService } from '../services/fcm.service';
import { smsService } from '../services/sms.service';

export const adminRoutes = Router();
adminRoutes.use(authenticate, requireRole('ADMIN'));

async function logAudit(req: AuthRequest, action: string, targetId?: string, targetType?: string, details?: any) {
  await prisma.auditLog.create({
    data: {
      actor_id: req.user!.id,
      actor_role: req.user!.role,
      action,
      target_id: targetId,
      target_type: targetType,
      details,
      ip_address: req.ip,
    },
  });
}

adminRoutes.get('/dashboard', async (_req, res, next) => {
  try {
    const [workers, employers, hires, blocked, kycPending] = await Promise.all([
      prisma.worker.count({ where: { deleted_at: null } }),
      prisma.employer.count({ where: { deleted_at: null } }),
      prisma.hire.count({ where: { status: 'ACTIVE' } }),
      prisma.worker.count({ where: { kyc_status: 'BLOCKED' } }),
      prisma.worker.count({ where: { kyc_status: { in: ['BGC_INITIATED', 'SELFIE_DONE'] } } }),
    ]);
    res.json({ workers, employers, hires, blocked, kycPending });
  } catch (err) { next(err); }
});

adminRoutes.get('/kyc-queue', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = 20;
    const workers = await prisma.worker.findMany({
      where: { kyc_status: { in: ['BGC_INITIATED', 'SELFIE_DONE', 'PAN_DONE', 'AADHAAR_DONE'] }, deleted_at: null },
      include: { documents: true, verifications: true, user: true },
      orderBy: { created_at: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    res.json(workers);
  } catch (err) { next(err); }
});

adminRoutes.post('/kyc/:worker_id/approve', async (req: AuthRequest, res, next) => {
  try {
    await prisma.worker.update({
      where: { id: req.params.worker_id },
      data: { kyc_status: 'FULLY_VERIFIED' },
    });
    await logAudit(req, 'APPROVE_KYC', req.params.worker_id, 'WORKER');
    res.json({ success: true });
  } catch (err) { next(err); }
});

adminRoutes.post('/kyc/:worker_id/reject', async (req: AuthRequest, res, next) => {
  try {
    const { reason } = req.body;
    await prisma.worker.update({
      where: { id: req.params.worker_id },
      data: { kyc_status: 'SUSPENDED', block_reason: reason },
    });
    await logAudit(req, 'REJECT_KYC', req.params.worker_id, 'WORKER', { reason });
    res.json({ success: true });
  } catch (err) { next(err); }
});

adminRoutes.post('/workers/:id/block', async (req: AuthRequest, res, next) => {
  try {
    const { reason, case_type, case_district } = req.body;
    const worker = await prisma.worker.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { user: true },
    });

    await prisma.worker.update({
      where: { id: worker.id },
      data: { kyc_status: 'BLOCKED', blocked_at: new Date(), block_reason: reason },
    });

    await prisma.workerBlock.create({
      data: {
        worker_id: worker.id,
        reason,
        case_type,
        case_district,
        blocked_by: req.user!.id,
      },
    });

    await prisma.match.deleteMany({ where: { worker_id: worker.id } });

    const shortlists = await prisma.shortlist.findMany({
      where: { worker_id: worker.id },
      include: { employer: { include: { user: true } } },
    });
    const hires = await prisma.hire.findMany({
      where: { worker_id: worker.id, status: 'ACTIVE' },
      include: { employer: { include: { user: true } } },
    });

    const affectedEmployers = new Map<string, any>();
    [...shortlists, ...hires].forEach((s) => affectedEmployers.set(s.employer.id, s.employer));

    for (const [, employer] of affectedEmployers) {
      await prisma.caseAlert.create({
        data: {
          worker_id: worker.id,
          employer_id: employer.id,
          bgc_check_id: 'MANUAL',
          case_type: case_type ?? 'UNKNOWN',
          case_district: case_district ?? 'UNKNOWN',
        },
      });
      if (employer.user.fcm_token) {
        await fcmService.sendTemplate(employer.user.fcm_token, 'CASE_ALERT_EMPLOYER', employer.id, false);
      }
      if (employer.contact_mobile) {
        await smsService.sendAlert(
          employer.contact_mobile,
          `KaamSetu Alert: A worker in your account has been flagged. Please check the KaamSetu app for details.`,
        );
      }
    }

    if (worker.user.fcm_token) {
      await fcmService.sendTemplate(worker.user.fcm_token, 'WORKER_PROFILE_BLOCKED', worker.id, true);
    }

    await logAudit(req, 'BLOCK_WORKER', worker.id, 'WORKER', { reason, case_type, case_district });
    res.json({ success: true, employers_notified: affectedEmployers.size });
  } catch (err) { next(err); }
});

adminRoutes.post('/workers/:id/reinstate', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { user: true },
    });

    await prisma.worker.update({
      where: { id: worker.id },
      data: { kyc_status: 'FULLY_VERIFIED', blocked_at: null, block_reason: null },
    });

    const lastBlock = await prisma.workerBlock.findFirst({
      where: { worker_id: worker.id, reinstated_at: null },
      orderBy: { blocked_at: 'desc' },
    });
    if (lastBlock) {
      await prisma.workerBlock.update({
        where: { id: lastBlock.id },
        data: { reinstated_at: new Date(), reinstated_by: req.user!.id },
      });
    }

    if (worker.user.fcm_token) {
      await fcmService.sendTemplate(worker.user.fcm_token, 'WORKER_REINSTATED', worker.id, true);
    }

    await logAudit(req, 'REINSTATE_WORKER', worker.id, 'WORKER');
    res.json({ success: true });
  } catch (err) { next(err); }
});

adminRoutes.get('/workers', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = 20;
    const workers = await prisma.worker.findMany({
      where: { deleted_at: null },
      include: { user: true, skills: true, verifications: true },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.worker.count({ where: { deleted_at: null } });
    res.json({ workers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

adminRoutes.get('/employers', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = 20;
    const employers = await prisma.employer.findMany({
      where: { deleted_at: null },
      include: { user: true, verifications: true },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.employer.count({ where: { deleted_at: null } });
    res.json({ employers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

adminRoutes.get('/analytics', async (_req, res, next) => {
  try {
    const [
      totalWorkers, verifiedWorkers, blockedWorkers,
      totalEmployers, totalHires, totalRequirements,
    ] = await Promise.all([
      prisma.worker.count({ where: { deleted_at: null } }),
      prisma.worker.count({ where: { kyc_status: 'FULLY_VERIFIED', deleted_at: null } }),
      prisma.worker.count({ where: { kyc_status: 'BLOCKED' } }),
      prisma.employer.count({ where: { deleted_at: null } }),
      prisma.hire.count(),
      prisma.requirement.count(),
    ]);
    res.json({
      workers: { total: totalWorkers, verified: verifiedWorkers, blocked: blockedWorkers },
      employers: { total: totalEmployers },
      hires: { total: totalHires },
      requirements: { total: totalRequirements },
      verification_rate: totalWorkers > 0 ? Math.round((verifiedWorkers / totalWorkers) * 100) : 0,
    });
  } catch (err) { next(err); }
});

adminRoutes.get('/case-alerts', async (req, res, next) => {
  try {
    const alerts = await prisma.caseAlert.findMany({
      include: { employer: true },
      orderBy: { notified_at: 'desc' },
      take: 50,
    });
    res.json(alerts);
  } catch (err) { next(err); }
});
