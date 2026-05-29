import { reviewQueue } from './reviewQueue';
import { processReview } from '../services/reviewService';
import { logger } from '../utils/logger';

reviewQueue.process(async (job) => {
  logger.info('Worker picked up job', { jobId: job.id, repo: job.data.repoFullName });
  await processReview(job.data);
});

reviewQueue.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id });
});

reviewQueue.on('failed', (job, err) => {
  logger.error('Job failed', { jobId: job?.id, error: err.message, attempts: job?.attemptsMade });
});

logger.info('Review worker started');
