import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

export const matchesRoutes = Router();
matchesRoutes.use(authenticate);

matchesRoutes.get('/worker', async (req: AuthRequest, res, next) => {
  try {
    const worker = await prisma.worker.findUniqueOrThrow({ where: { user_id: req.user!.id } });
    const matches = await prisma.match.findMany({
      where: { worker_id: worker.id },
      include: { requirement: { include: { employer: { select: { company_name: true, city: true } } } } },
      orderBy: { match_score: 'desc' },
      take: 30,
    });
    res.json(matches);
  } catch (err) { next(err); }
});
