import { prisma } from '../config/database';
import { haversine } from '../utils/haversine';
import { fcmService } from './fcm.service';
import { logger } from '../utils/logger';

interface ScoreBreakdown {
  job_type: number;
  location: number;
  experience: number;
  verified: number;
  live_in: number;
}

function scoreJobType(required: string, skills: any[]): number {
  if (skills.some((s) => s.skill_type === required && s.is_primary)) return 30;
  if (skills.some((s) => s.skill_type === required)) return 20;
  return 0;
}

function scoreLocation(
  req: { latitude: any; longitude: any; is_pan_india: boolean },
  workerLoc: any,
  isPanIndia: boolean,
): { score: number; distanceKm: number | null } {
  if (isPanIndia) return { score: 20, distanceKm: null };
  if (!workerLoc?.latitude || !req.latitude) return { score: 5, distanceKm: null };
  const km = haversine(
    Number(req.latitude), Number(req.longitude),
    Number(workerLoc.latitude), Number(workerLoc.longitude),
  );
  let score = 3;
  if (km <= 5) score = 25;
  else if (km <= 20) score = 18;
  else if (km <= 50) score = 10;
  return { score, distanceKm: Math.round(km * 100) / 100 };
}

function scoreExperience(required: number, skills: any[]): number {
  const maxExp = Math.max(0, ...skills.map((s) => s.experience_years));
  if (maxExp >= required) return 20;
  if (maxExp >= required - 1) return 10;
  return 0;
}

function scoreLiveIn(required: boolean, workerOk: boolean): number {
  if (!required) return 10;
  return workerOk ? 10 : 0;
}

export const matchingService = {
  async runMatchingForRequirement(requirementId: string): Promise<void> {
    const req = await prisma.requirement.findUnique({
      where: { id: requirementId },
    });
    if (!req) return;

    const workers = await prisma.worker.findMany({
      where: {
        kyc_status: 'FULLY_VERIFIED',
        is_open_to_work: true,
        blocked_at: null,
        deleted_at: null,
      },
      include: { skills: true, location: true, user: true },
    });

    const matchData: any[] = [];

    for (const worker of workers) {
      const jobTypeScore = scoreJobType(req.job_type, worker.skills);
      if (jobTypeScore === 0) continue;

      const { score: locationScore, distanceKm } = scoreLocation(req, worker.location, worker.is_pan_india);
      const expScore = scoreExperience(req.min_experience_years, worker.skills);
      const liveInScore = scoreLiveIn(req.is_live_in_required, worker.is_live_in_ok);

      const breakdown: ScoreBreakdown = {
        job_type: jobTypeScore,
        location: locationScore,
        experience: expScore,
        verified: 15,
        live_in: liveInScore,
      };
      const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

      matchData.push({ worker, breakdown, total, distanceKm });
    }

    matchData.sort((a, b) => b.total - a.total);

    for (const m of matchData) {
      await prisma.match.upsert({
        where: { requirement_id_worker_id: { requirement_id: requirementId, worker_id: m.worker.id } },
        create: {
          requirement_id: requirementId,
          worker_id: m.worker.id,
          match_score: m.total,
          score_breakdown: m.breakdown,
          distance_km: m.distanceKm,
        },
        update: {
          match_score: m.total,
          score_breakdown: m.breakdown,
          distance_km: m.distanceKm,
        },
      });
    }

    const top20 = matchData.slice(0, 20);
    for (const m of top20) {
      if (m.worker.user.fcm_token) {
        await fcmService.sendTemplate(m.worker.user.fcm_token, 'WORKER_NEW_JOB_MATCH', m.worker.id, true);
      }
    }

    logger.info(`Matching completed for requirement ${requirementId}: ${matchData.length} matches`);
  },
};
