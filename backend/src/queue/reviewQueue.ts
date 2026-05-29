import Bull from 'bull';
import Redis from 'ioredis';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

function createRedisClient() {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export interface ReviewJobData {
  installationId: number;
  repoFullName: string;
  repoGithubId: number;
  owner: string;
  repoName: string;
  prNumber: number;
  prGithubId: number;
  prTitle: string;
  prAuthor: string;
  prHtmlUrl: string;
  commitSha: string;
  headBranch: string;
  baseBranch: string;
}

export const reviewQueue = new Bull<ReviewJobData>('pr-reviews', {
  createClient: () => createRedisClient(),
});

export async function enqueueReview(jobData: ReviewJobData): Promise<void> {
  const dedupKey = `review:${jobData.repoFullName}:${jobData.prNumber}:${jobData.commitSha}`;

  // Redis SET NX: only set if key doesn't exist, expire in 1 hour
  const wasSet = await redis.set(dedupKey, '1', 'EX', 3600, 'NX');

  if (!wasSet) {
    logger.info('Duplicate review job skipped', { dedupKey });
    return;
  }

  await reviewQueue.add(jobData, {
    jobId: dedupKey, // Bull-level dedup as a second safety net
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  logger.info('Review job enqueued', { dedupKey });
}
