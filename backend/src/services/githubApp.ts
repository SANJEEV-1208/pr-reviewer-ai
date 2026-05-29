import { App } from '@octokit/app';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { upsertRepo } from '../db/queries/repos';

// Prefer inline PEM env var (production on Render); fall back to file path (local dev)
const privateKey = env.GITHUB_APP_PRIVATE_KEY
  ? env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/\r/g, '')
  : fs.readFileSync(path.resolve(env.GITHUB_APP_PRIVATE_KEY_PATH!), 'utf8').replace(/\r/g, '');

export const githubApp = new App({
  appId: env.GITHUB_APP_ID,
  privateKey,
  webhooks: { secret: env.GITHUB_WEBHOOK_SECRET },
  oauth: {
    clientId: env.GITHUB_APP_CLIENT_ID,
    clientSecret: env.GITHUB_APP_CLIENT_SECRET,
  },
});

export async function getOctokitForInstallation(installationId: number) {
  return githubApp.getInstallationOctokit(installationId);
}

export async function upsertRepoFromInstallation(
  installationId: number,
  repos: Array<{ id: number; full_name: string; name: string; private?: boolean }>
): Promise<void> {
  for (const repo of repos) {
    const [owner, name] = repo.full_name.split('/');
    try {
      await upsertRepo({
        githubRepoId: repo.id,
        owner,
        name,
        fullName: repo.full_name,
        installationId,
      });
      logger.info('Repo upserted from installation', { fullName: repo.full_name });
    } catch (err) {
      logger.error('Failed to upsert repo', {
        fullName: repo.full_name,
        error: (err as Error).message,
      });
    }
  }
}
