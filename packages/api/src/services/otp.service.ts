import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { smsService } from './sms.service';

const DEV_OTP = '123456';
// IS_DEV is true when NODE_ENV is not production OR when ALLOW_DEV_OTP=true
// Set ALLOW_DEV_OTP=true in Railway env to allow 123456 bypass without real SMS
const IS_DEV = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP === 'true';

function generateOtp(): string {
  // In dev, always use 123456 so you can test without SMS
  if (IS_DEV) return DEV_OTP;
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

    if (IS_DEV) {
      // Skip real SMS in dev — OTP is always 123456
      console.log(`[DEV] OTP for ${mobile}: ${otp}`);
      return;
    }

    await smsService.sendOtp(mobile, otp);
  },

  async verifyOtp(mobile: string, otp: string): Promise<boolean> {
    // Dev shortcut: 123456 always works
    if (IS_DEV && otp === DEV_OTP) {
      // Still create/mark a session so the rest of the flow works
      const session = await prisma.otpSession.findFirst({
        where: { mobile, used: false },
        orderBy: { created_at: 'desc' },
      });
      if (session) {
        await prisma.otpSession.update({ where: { id: session.id }, data: { used: true } });
      }
      return true;
    }

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
