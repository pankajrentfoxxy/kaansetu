import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { fcmService } from '../services/fcm.service';
import { smsService } from '../services/sms.service';
import { encrypt } from '../utils/crypto';
import { hmacSha256 } from '../utils/crypto';
import { scoringService } from '../services/scoring.service';
import { logger } from '../utils/logger';

export const webhookRoutes = Router();

const AUTHBRIDGE_IPS = (process.env.AUTHBRIDGE_WEBHOOK_IPS ?? '').split(',').filter(Boolean);

webhookRoutes.post('/authbridge', async (req: Request, res: Response) => {
  // Verify signature
  const signature = req.headers['x-signature'] as string;
  const secret = process.env.AUTHBRIDGE_WEBHOOK_SECRET ?? '';
  const payload = JSON.stringify(req.body);
  const expected = hmacSha256(secret, payload);

  if (signature !== expected && process.env.NODE_ENV === 'production') {
    logger.warn('Authbridge webhook signature mismatch');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  // IP whitelist check (production only)
  if (process.env.NODE_ENV === 'production' && AUTHBRIDGE_IPS.length > 0) {
    const clientIp = req.ip ?? '';
    if (!AUTHBRIDGE_IPS.includes(clientIp)) {
      logger.warn(`Authbridge webhook from unknown IP: ${clientIp}`);
      res.status(401).json({ error: 'IP not allowed' });
      return;
    }
  }

  res.status(200).json({ received: true });

  // Process asynchronously after responding
  setImmediate(async () => {
    try {
      const { reference_id, status, cases_found, case_details, report_url } = req.body;

      const bgcRecord = await prisma.backgroundCheck.findFirst({
        where: { authbridge_ref_id: reference_id },
        include: { worker: { include: { user: true } } },
      });

      if (!bgcRecord) {
        logger.warn(`No BGC record found for ref: ${reference_id}`);
        return;
      }

      const worker = bgcRecord.worker;
      const encryptedDetails = case_details ? encrypt(JSON.stringify(case_details)) : null;

      await prisma.backgroundCheck.update({
        where: { id: bgcRecord.id },
        data: {
          status: cases_found ? 'FLAGGED' : 'CLEAR',
          cases_found: !!cases_found,
          case_details: encryptedDetails ? { encrypted: encryptedDetails } : undefined,
          report_url,
          completed_at: new Date(),
          next_check_due: cases_found ? null : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      });

      if (cases_found) {
        await prisma.worker.update({
          where: { id: worker.id },
          data: { kyc_status: 'BLOCKED', blocked_at: new Date() },
        });

        const parsedCase = case_details ?? {};
        await prisma.workerBlock.create({
          data: {
            worker_id: worker.id,
            reason: 'Criminal case found during background verification',
            case_type: parsedCase.case_type ?? 'UNKNOWN',
            case_district: parsedCase.district ?? 'UNKNOWN',
            case_date: parsedCase.case_date ? new Date(parsedCase.case_date) : null,
            bgc_check_id: bgcRecord.id,
            blocked_by: 'SYSTEM',
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

        const affectedMap = new Map<string, any>();
        [...shortlists, ...hires].forEach((s) => affectedMap.set(s.employer.id, s.employer));

        for (const [, employer] of affectedMap) {
          await prisma.caseAlert.create({
            data: {
              worker_id: worker.id,
              employer_id: employer.id,
              bgc_check_id: bgcRecord.id,
              case_type: parsedCase.case_type ?? 'UNKNOWN',
              case_district: parsedCase.district ?? 'UNKNOWN',
              case_date: parsedCase.case_date ? new Date(parsedCase.case_date) : null,
            },
          });
          if (employer.user.fcm_token) {
            await fcmService.sendTemplate(employer.user.fcm_token, 'CASE_ALERT_EMPLOYER', employer.id, false);
          }
          if (employer.contact_mobile) {
            await smsService.sendAlert(
              employer.contact_mobile,
              'KaamSetu Security Alert: A worker in your account has a new case registered against them. Open the app for details.',
            );
          }
        }

        if (worker.user.fcm_token) {
          await fcmService.sendTemplate(worker.user.fcm_token, 'WORKER_PROFILE_BLOCKED', worker.id, true);
        }
        const workerUser = await prisma.user.findUnique({ where: { id: worker.user_id } });
        if (workerUser?.mobile) {
          await smsService.sendAlert(
            workerUser.mobile,
            'KaamSetu: Your profile has been paused due to a new case. Call our helpline 1800-XXX-XXXX for assistance.',
          );
        }

        await prisma.auditLog.create({
          data: {
            actor_id: 'SYSTEM',
            actor_role: 'SYSTEM',
            action: 'AUTO_BLOCK_WORKER',
            target_id: worker.id,
            target_type: 'WORKER',
            details: { bgc_ref: reference_id, employers_notified: affectedMap.size },
          },
        });

        logger.info(`Worker ${worker.id} blocked. ${affectedMap.size} employers notified.`);
      } else {
        if (worker.kyc_status === 'BGC_INITIATED') {
          await prisma.worker.update({ where: { id: worker.id }, data: { kyc_status: 'FULLY_VERIFIED' } });
        }
        await scoringService.recalculate(worker.id);
        logger.info(`Worker ${worker.id} BGC clear.`);
      }
    } catch (err) {
      logger.error('Authbridge webhook processing error', err);
    }
  });
});
