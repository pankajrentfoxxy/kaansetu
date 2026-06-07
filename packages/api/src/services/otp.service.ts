import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { smsService } from './sms.service';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const otpService = {
  async sendOtp(userId: string, mobile: string, purpose: string = 'login'): Promise<void> {
    const otp = generateOtp();
    const hash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpSession.create({
      data: { user_id: userId, otp_hash: hash, mobile, purpose, expires_at: expiresAt },
    });

    await smsService.sendOtp(mobile, otp);
  },

  async verifyOtp(mobile: string, otp: string): Promise<boolean> {
    const session = await prisma.otpSession.findFirst({
      where: { mobile, used: false, expires_at: { gt: new Date() } },
      orderBy: { created_at: 'desc' },
    });

    if (!session) return false;
    if (session.attempts >= 5) return false;

    await prisma.otpSession.update({ where: { id: session.id }, data: { attempts: { increment: 1 } } });

    const match = await bcrypt.compare(otp, session.otp_hash);
    if (match) {
      await prisma.otpSession.update({ where: { id: session.id }, data: { used: true } });
    }
    return match;
  },
};
