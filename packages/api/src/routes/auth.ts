import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { otpService } from '../services/otp.service';
import { signAccessToken, createRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/jwt';
import { validate } from '../middleware/validate';
import { otpRateLimit, loginRateLimit } from '../middleware/rateLimit';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRoutes = Router();

const SendOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
});

const VerifyOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6).regex(/^\d{6}$/),
  role: z.enum(['WORKER', 'EMPLOYER']).optional(),
});

const RefreshSchema = z.object({ refresh_token: z.string().min(1) });

authRoutes.post('/send-otp', otpRateLimit, validate(SendOtpSchema), async (req, res, next) => {
  try {
    const { mobile } = req.body;
    let user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      user = await prisma.user.create({ data: { mobile, role: 'WORKER' } });
    }
    await prisma.user.update({ where: { id: user.id }, data: { mobile_verified: false } });
    await otpService.sendOtp(user.id, mobile, 'login');
    res.json({
      success: true,
      expires_in: 300,
      ...(process.env.NODE_ENV !== 'production' && { dev_note: 'Use OTP 123456 in development' }),
    });
  } catch (err) { next(err); }
});

authRoutes.post('/verify-otp', loginRateLimit, validate(VerifyOtpSchema), async (req, res, next) => {
  try {
    const { mobile, otp, role } = req.body;
    let user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const valid = await otpService.verifyOtp(mobile, otp);
    if (!valid) {
      res.status(401).json({ error: 'Invalid or expired OTP' });
      return;
    }

    const isNewUser = !user.mobile_verified;
    // Only allow role assignment for brand-new users; returning users always keep their existing role
    const updatedRole = isNewUser ? (role ?? user.role) : user.role;
    await prisma.user.update({
      where: { id: user.id },
      data: { mobile_verified: true, role: updatedRole as any },
    });

    if (updatedRole === 'WORKER' && !await prisma.worker.findUnique({ where: { user_id: user.id } })) {
      await prisma.worker.create({ data: { user_id: user.id, full_name: '' } });
    }
    if (updatedRole === 'EMPLOYER' && !await prisma.employer.findUnique({ where: { user_id: user.id } })) {
      await prisma.employer.create({ data: { user_id: user.id, company_name: '', entity_type: 'INDIVIDUAL' } });
    }

    const accessToken = signAccessToken(user.id, updatedRole);
    const refreshToken = await createRefreshToken(user.id);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, role: updatedRole, is_new_user: isNewUser },
    });
  } catch (err) { next(err); }
});

authRoutes.post('/refresh', validate(RefreshSchema), async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const userId = await verifyRefreshToken(refresh_token);
    if (!userId) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }
    await revokeRefreshToken(refresh_token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }
    const accessToken = signAccessToken(userId, user.role);
    const newRefreshToken = await createRefreshToken(userId);
    res.json({ access_token: accessToken, refresh_token: newRefreshToken });
  } catch (err) { next(err); }
});

authRoutes.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) await revokeRefreshToken(refresh_token);
    res.json({ success: true });
  } catch (err) { next(err); }
});
