import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import webhookRouter from './routes/webhook';
import authRouter from './routes/auth';
import reposRouter from './routes/repos';
import reviewsRouter from './routes/reviews';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

  // Webhook route must be mounted before express.json() so express.raw() gets the raw Buffer
  app.use('/api/webhooks', webhookRouter);

  app.use(express.json());

  app.use('/api/auth', authRouter);
  app.use('/api/repos', reposRouter);
  app.use('/api/reviews', reviewsRouter);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use(errorHandler);

  return app;
}
