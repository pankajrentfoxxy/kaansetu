import { prisma } from '../config/database';

const SCORE_MAP = {
  mobile_verified: 10,
  personal_details: 15,
  skills_filled: 10,
  work_history: 15,
  location_set: 5,
  aadhaar_verified: 15,
  pan_verified: 10,
  selfie_uploaded: 5,
  bgc_clear: 15,
};

export const scoringService = {
  async recalculate(workerId: string): Promise<number> {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        user: true,
        skills: true,
        work_history: true,
        location: true,
        documents: true,
        verifications: true,
        background_checks: { orderBy: { initiated_at: 'desc' }, take: 1 },
      },
    });

    if (!worker) return 0;

    let score = 0;

    if (worker.user.mobile_verified) score += SCORE_MAP.mobile_verified;
    if (worker.full_name && worker.dob && worker.gender) score += SCORE_MAP.personal_details;
    if (worker.skills.length > 0) score += SCORE_MAP.skills_filled;
    if (worker.work_history.length > 0) score += SCORE_MAP.work_history;
    if (worker.location?.city) score += SCORE_MAP.location_set;

    const aadhaarDone = worker.verifications.some(
      (v) => v.check_type === 'AADHAAR' && v.status === 'VERIFIED',
    );
    if (aadhaarDone) score += SCORE_MAP.aadhaar_verified;

    const panDone = worker.verifications.some(
      (v) => v.check_type === 'PAN' && v.status === 'VERIFIED',
    );
    if (panDone) score += SCORE_MAP.pan_verified;

    const selfieDone = worker.verifications.some(
      (v) => v.check_type === 'SELFIE' && v.status === 'VERIFIED',
    );
    if (selfieDone) score += SCORE_MAP.selfie_uploaded;

    const bgcClear = worker.background_checks[0]?.status === 'CLEAR';
    if (bgcClear) score += SCORE_MAP.bgc_clear;

    await prisma.worker.update({ where: { id: workerId }, data: { profile_score: score } });
    return score;
  },
};
