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
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim();
    const where: any = { deleted_at: null };
    if (status) where.kyc_status = status;
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { user: { mobile: { contains: search } } },
      ];
    }
    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where, include: { user: true, skills: true, verifications: true },
        orderBy: { created_at: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.worker.count({ where }),
    ]);
    res.json({ workers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

adminRoutes.get('/workers/:id', async (req, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        user: true, skills: true, verifications: true, work_history: true, location: true,
        blocks: { orderBy: { blocked_at: 'desc' } }, point_transactions: { orderBy: { created_at: 'desc' }, take: 10 },
      },
    });
    const referrals = worker.referral_code
      ? await prisma.worker.count({ where: { referred_by_code: worker.referral_code } })
      : 0;
    res.json({ ...worker, referrals_count: referrals });
  } catch (err) { next(err); }
});

adminRoutes.get('/employers', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = 20;
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim();
    const where: any = { deleted_at: null };
    if (status) where.kyc_status = status;
    if (search) {
      where.OR = [
        { company_name: { contains: search, mode: 'insensitive' } },
        { user: { mobile: { contains: search } } },
      ];
    }
    const [employers, total] = await Promise.all([
      prisma.employer.findMany({
        where, include: { user: true, verifications: true, _count: { select: { requirements: true, hires: true } } },
        orderBy: { created_at: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.employer.count({ where }),
    ]);
    res.json({ employers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

adminRoutes.get('/employers/:id', async (req, res, next) => {
  try {
    const employer = await prisma.employer.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        user: true, verifications: true,
        requirements: { orderBy: { created_at: 'desc' }, take: 20, include: { _count: { select: { matches: true } } } },
        hires: { orderBy: { created_at: 'desc' }, take: 20, include: { worker: { select: { full_name: true } } } },
      },
    });
    res.json(employer);
  } catch (err) { next(err); }
});

adminRoutes.get('/hires', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = 20;
    const [hires, total] = await Promise.all([
      prisma.hire.findMany({
        include: {
          worker: { select: { id: true, full_name: true } },
          employer: { select: { id: true, company_name: true } },
          requirement: { select: { job_type: true } },
        },
        orderBy: { created_at: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.hire.count(),
    ]);
    res.json({ hires, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// Breakdown stats for charts
adminRoutes.get('/stats', async (_req, res, next) => {
  try {
    const [kycGroups, hireGroups, reqGroups, pointsAgg, featured, employersWithUnlocks] = await Promise.all([
      prisma.worker.groupBy({ by: ['kyc_status'], _count: true, where: { deleted_at: null } }),
      prisma.hire.groupBy({ by: ['status'], _count: true }),
      prisma.requirement.groupBy({ by: ['job_type'], _count: true }),
      prisma.pointTransaction.aggregate({ _sum: { delta: true } }),
      prisma.requirement.count({ where: { OR: [{ is_featured: true }, { is_urgent: true }] } }),
      prisma.employer.count({ where: { contact_unlocks: { gt: 0 } } }),
    ]);
    res.json({
      kycStatus: kycGroups.map((g) => ({ label: g.kyc_status, value: g._count })),
      hireStatus: hireGroups.map((g) => ({ label: g.status, value: g._count })),
      topJobTypes: reqGroups.map((g) => ({ label: g.job_type, value: g._count })).sort((a, b) => b.value - a.value).slice(0, 6),
      pointsIssued: pointsAgg._sum.delta ?? 0,
      promotions: { featured, employersWithUnlocks },
    });
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

// ── Job postings ─────────────────────────────────────────────────────────────
adminRoutes.get('/requirements', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = 30;
    const requirements = await prisma.requirement.findMany({
      include: { employer: { select: { company_name: true, city: true } }, _count: { select: { matches: true, hires: true } } },
      orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.requirement.count();
    res.json({ requirements, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// Promote a job posting: featured / urgent badge + optional note + days live
adminRoutes.post('/requirements/:id/promote', async (req: AuthRequest, res, next) => {
  try {
    const { is_featured, is_urgent, promo_note, days } = req.body ?? {};
    const featured_until = is_featured && days
      ? new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000)
      : (is_featured ? undefined : null);
    const updated = await prisma.requirement.update({
      where: { id: req.params.id },
      data: {
        is_featured: !!is_featured,
        is_urgent: !!is_urgent,
        promo_note: promo_note ?? null,
        ...(featured_until !== undefined ? { featured_until } : {}),
      },
    });
    await logAudit(req, 'PROMOTE_REQUIREMENT', req.params.id, 'REQUIREMENT', { is_featured, is_urgent });
    res.json({ success: true, requirement: updated });
  } catch (err) { next(err); }
});

// Grant an employer extra worker-contact unlocks (paid feature, admin-tracked)
adminRoutes.post('/employers/:id/grant-contacts', async (req: AuthRequest, res, next) => {
  try {
    const count = Number(req.body?.count ?? 0);
    const updated = await prisma.employer.update({
      where: { id: req.params.id },
      data: { contact_unlocks: { increment: count } },
    });
    await logAudit(req, 'GRANT_CONTACTS', req.params.id, 'EMPLOYER', { count });
    res.json({ success: true, contact_unlocks: updated.contact_unlocks });
  } catch (err) { next(err); }
});

// Promotions overview: featured/urgent posts + employers with granted contacts
adminRoutes.get('/promotions', async (_req, res, next) => {
  try {
    const [featured, employersWithUnlocks] = await Promise.all([
      prisma.requirement.findMany({
        where: { OR: [{ is_featured: true }, { is_urgent: true }] },
        include: { employer: { select: { company_name: true, city: true } } },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      prisma.employer.findMany({
        where: { contact_unlocks: { gt: 0 } },
        select: { id: true, company_name: true, city: true, contact_unlocks: true },
        orderBy: { contact_unlocks: 'desc' },
        take: 50,
      }),
    ]);
    res.json({ featured, employersWithUnlocks });
  } catch (err) { next(err); }
});
