import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';

const ACCESS_SECRET = process.env.JWT_SECRET ?? 'change_me_in_production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'change_me_refresh_in_production';

export interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, ACCESS_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = uuidv4();
  const hash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { user_id: userId, token_hash: hash, expires_at: expiresAt } });
  return token;
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  const records = await prisma.refreshToken.findMany({
    where: { revoked: false, expires_at: { gt: new Date() } },
    orderBy: { created_at: 'desc' },
    take: 100,
  });
  for (const record of records) {
    const match = await bcrypt.compare(token, record.token_hash);
    if (match) return record.user_id;
  }
  return null;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const records = await prisma.refreshToken.findMany({
    where: { revoked: false },
    take: 200,
  });
  for (const record of records) {
    const match = await bcrypt.compare(token, record.token_hash);
    if (match) {
      await prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
      return;
    }
  }
}
