import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  // Accept token from the Authorization header, or from a `token` query param
  // (used for direct links like the offer-letter PDF, which open in a browser/viewer).
  const token = header?.startsWith('Bearer ')
    ? header.slice(7)
    : (typeof req.query.token === 'string' ? req.query.token : undefined);
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err: any) {
    const message = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'Invalid token';
    res.status(401).json({ error: message });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
