import cron from 'node-cron';
import { prisma } from '../config/database';
import { authrbridge } from '../services/authbridge.service';
import { logger } from '../utils/logger';

// Runs every day at 2:00 AM IST (20:30 UTC)
cron.schedule('30 20 * * *', async () => {
  logger.info('Nightly BGC re-check job started');
  try {
    const workersToCheck = await prisma.backgroundCheck.findMany({
      where: {
        status: 'CLEAR',
        next_check_due: { lte: new Date() },
        worker: { kyc_status: 'FULLY_VERIFIED', blocked_at: null, deleted_at: null },
      },
      include: {
        worker: { include: { documents: true, location: true } },
      },
    });

    let success = 0;
    let failed = 0;

    for (const check of workersToCheck) {
      try {
        const refId = await authrbridge.initiateCheck(
          {
            full_name: check.worker.full_name,
            dob: check.worker.dob?.toISOString().split('T')[0],
            father_name: check.worker.father_name ?? undefined,
            masked_aadhaar: check.worker.documents?.masked_aadhaar ?? undefined,
            address: check.worker.location?.full_address ?? undefined,
            city: check.worker.location?.city ?? undefined,
            state: check.worker.location?.state ?? undefined,
          },
          'PERIODIC',
        );

        await prisma.backgroundCheck.create({
          data: {
            worker_id: check.worker.id,
            check_type: 'PERIODIC',
            authbridge_ref_id: refId,
            status: 'INITIATED',
          },
        });
        success++;
      } catch (err) {
        logger.error(`BGC re-check failed for worker ${check.worker.id}`, err);
        // Retry next day by not updating next_check_due
        failed++;
      }
    }

    logger.info(`Nightly BGC re-check: ${success} initiated, ${failed} failed`);
  } catch (err) {
    logger.error('Nightly BGC job error', err);
  }
});

logger.info('Nightly BGC scheduler registered (2AM IST / 20:30 UTC)');
