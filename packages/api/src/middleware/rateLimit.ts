import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

// Bypass rate limits in dev OR when ALLOW_DEV_OTP=true (for testing on Railway)
const IS_DEV = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP === 'true';

// In dev, skip rate limiting entirely so testing isn't blocked
const noLimit: RequestHandler = (_req, _res, next) => next();

export const otpRateLimit = IS_DEV ? noLimit : rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body?.mobile ?? req.ip ?? 'unknown',
  message: { error: 'Too many OTP requests. Try again in 1 hour.' },
});

export const loginRateLimit = IS_DEV ? noLimit : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

export const apiRateLimit = IS_DEV ? noLimit : rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Rate limit exceeded.' },
});
