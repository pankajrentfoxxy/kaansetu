import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { offerLetterService } from '../services/offerLetter.service';

export const offerLetterRoutes = Router();

// GET /api/v1/offer-letter/:hireId  → streams the offer-letter PDF on demand.
// Accessible to the worker or the employer party to the hire. Auth via Bearer
// header OR ?token= query (so it can be opened directly in a browser/PDF viewer).
offerLetterRoutes.get('/:hireId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const hire = await prisma.hire.findUnique({
      where: { id: req.params.hireId },
      include: { worker: true, employer: true, requirement: true },
    });
    if (!hire) { res.status(404).json({ error: 'Offer not found' }); return; }

    const isParty =
      hire.worker?.user_id === req.user!.id || hire.employer?.user_id === req.user!.id;
    if (!isParty) { res.status(403).json({ error: 'Forbidden' }); return; }

    const buffer = await offerLetterService.generateBuffer({
      id: hire.id,
      workerName: hire.worker?.full_name ?? 'Worker',
      companyName: hire.employer?.company_name ?? 'Company',
      role: hire.requirement?.job_type ?? 'General',
      salary: hire.offer_salary,
      startDate: hire.start_date,
      city: hire.employer?.city ?? '',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="offer-letter-${hire.id}.pdf"`);
    res.send(buffer);
  } catch (err) { next(err); }
});
