import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export function verifyWebhook(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;

  if (!signature) {
    logger.warn('Webhook received without X-Hub-Signature-256 header');
    res.status(401).json({ error: 'Missing webhook signature' });
    return;
  }

  const rawBody = req.body as Buffer;
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', env.GITHUB_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')}`;

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    logger.warn('Webhook signature mismatch — possible spoofed request');
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  // Attach parsed payload so downstream handlers don't need to JSON.parse again
  try {
    req.body = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  next();
}
