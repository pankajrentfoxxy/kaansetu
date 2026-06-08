import { firebaseAdmin } from '../config/firebase';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const TEMPLATES = {
  CASE_ALERT_EMPLOYER: {
    title: 'Security Alert — Action Required',
    body: 'A worker in your account has a new case registered. Tap to view details.',
    data: { type: 'CASE_ALERT', screen: 'CaseAlert' },
  },
  WORKER_PROFILE_BLOCKED: {
    title: 'Your profile has been paused',
    body: 'A new case was found during routine verification. Tap to learn more.',
    data: { type: 'PROFILE_BLOCKED', screen: 'ProfileBlocked' },
  },
  WORKER_NEW_JOB_MATCH: {
    title: 'New job opportunity',
    body: 'A new job matching your profile is available. Tap to view.',
    data: { type: 'JOB_MATCH', screen: 'WorkerDashboard' },
  },
  HIRE_CONFIRMED: {
    title: 'Congratulations! Job confirmed',
    body: 'Your offer letter is ready. Tap to view and sign.',
    data: { type: 'HIRE_CONFIRMED', screen: 'HireConfirmed' },
  },
  WORKER_REINSTATED: {
    title: 'Profile reinstated',
    body: 'Your profile is now active again. You can apply for jobs.',
    data: { type: 'REINSTATED', screen: 'WorkerDashboard' },
  },
} as const;

type TemplateKey = keyof typeof TEMPLATES;

export const fcmService = {
  async sendToToken(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string | null> {
    const hasFirebase = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== 'dummy';
    if (!hasFirebase) {
      logger.info(`[DEV] FCM skipped → ${title}`);
      return null;
    }
    try {
      const messageId = await firebaseAdmin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: 'high' },
      });
      return messageId;
    } catch (err) {
      logger.error('FCM send failed', err);
      return null;
    }
  },

  async sendTemplate(
    fcmToken: string,
    template: TemplateKey,
    recipientId: string,
    isWorker: boolean,
  ): Promise<void> {
    const t = TEMPLATES[template];
    const messageId = await this.sendToToken(fcmToken, t.title, t.body, t.data);
    await prisma.notification.create({
      data: {
        type: template,
        worker_id: isWorker ? recipientId : undefined,
        employer_id: isWorker ? undefined : recipientId,
        title: t.title,
        body: t.body,
        data: t.data,
        fcm_message_id: messageId ?? undefined,
        delivered_at: messageId ? new Date() : undefined,
      },
    });
  },
};
