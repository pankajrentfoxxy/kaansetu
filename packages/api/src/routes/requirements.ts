import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

export const requirementsRoutes = Router();
requirementsRoutes.use(authenticate);

requirementsRoutes.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { job_type, city, is_pan_india } = req.query;
    const reqs = await prisma.requirement.findMany({
      where: {
        status: 'ACTIVE',
        expires_at: { gt: new Date() },
        ...(job_type ? { job_type: job_type as string } : {}),
        ...(city ? { city: city as string } : {}),
        ...(is_pan_india === 'true' ? { is_pan_india: true } : {}),
      },
      include: { employer: { select: { company_name: true, city: true } } },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json(reqs);
  } catch (err) { next(err); }
});

requirementsRoutes.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const req_ = await prisma.requirement.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { employer: { select: { company_name: true, city: true, entity_type: true } } },
    });
    res.json(req_);
  } catch (err) { next(err); }
});
