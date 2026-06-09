import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { execSync } from 'child_process';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { workerRoutes } from './routes/worker';
import { employerRoutes } from './routes/employer';
import { requirementsRoutes } from './routes/requirements';
import { matchesRoutes } from './routes/matches';
import { adminRoutes } from './routes/admin';
import { webhookRoutes } from './routes/webhooks';
import { logger } from './utils/logger';
import './jobs/scheduler';

// Run DB migrations before starting server (Railway / production)
if (process.env.NODE_ENV === 'production') {
  try {
    logger.info('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logger.info('Migrations complete.');
  } catch (e) {
    logger.error('Migration failed — continuing anyway', e);
  }
}

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // Allow all origins in dev, or when dev-mode bypass is active (ALLOW_DEV_OTP=true)
    const isDev = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP === 'true';
    const allowed = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? [];
    const isLocalhost = !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isDev || isLocalhost || allowed.includes(origin ?? '')) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/worker', workerRoutes);
app.use('/api/v1/employer', employerRoutes);
app.use('/api/v1/requirements', requirementsRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => logger.info(`KaamSetu API running on port ${PORT}`));

export default app;
