import { Router, Request, Response } from 'express';
import express from 'express';
import { verifyWebhook } from '../middleware/verifyWebhook';
import { logger } from '../utils/logger';
import { enqueueReview } from '../queue/reviewQueue';
import { upsertRepoFromInstallation } from '../services/githubApp';

const router = Router();

router.post(
  '/github',
  express.raw({ type: 'application/json' }),
  verifyWebhook,
  async (req: Request, res: Response) => {
    const event = req.headers['x-github-event'] as string;
    const payload = req.body;

    logger.debug('Webhook received', { event, action: payload.action });

    // Respond immediately — all processing is async
    res.status(200).json({ message: 'ok' });

    try {
      if (event === 'ping') {
        logger.info('GitHub ping received — webhook configured correctly');
        return;
      }

      if (event === 'installation') {
        await handleInstallationEvent(payload);
        return;
      }

      if (event === 'pull_request') {
        await handlePullRequestEvent(payload);
        return;
      }
    } catch (err) {
      logger.error('Error processing webhook', { event, error: (err as Error).message });
    }
  }
);

async function handleInstallationEvent(payload: {
  action: string;
  installation: { id: number };
  repositories?: Array<{ id: number; full_name: string; name: string; private: boolean }>;
  repositories_added?: Array<{ id: number; full_name: string; name: string; private: boolean }>;
}): Promise<void> {
  const { action, installation } = payload;

  if (action === 'created' || action === 'added') {
    const repos = payload.repositories || payload.repositories_added || [];
    logger.info('GitHub App installed', {
      installationId: installation.id,
      repoCount: repos.length,
    });
    await upsertRepoFromInstallation(installation.id, repos);
  }

  if (action === 'deleted') {
    logger.info('GitHub App uninstalled', { installationId: installation.id });
    // Repos are kept in DB for history; just mark as disabled via cascade or leave as-is
  }
}

async function handlePullRequestEvent(payload: {
  action: string;
  number: number;
  pull_request: {
    id: number;
    title: string;
    html_url: string;
    head: { sha: string; ref: string };
    base: { ref: string };
    user: { login: string };
  };
  repository: {
    id: number;
    full_name: string;
    name: string;
    owner: { login: string };
  };
  installation: { id: number };
}): Promise<void> {
  const { action, number: prNumber, pull_request, repository, installation } = payload;

  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    return;
  }

  logger.info('PR event received', {
    repo: repository.full_name,
    prNumber,
    action,
    sha: pull_request.head.sha,
  });

  await enqueueReview({
    installationId: installation.id,
    repoFullName: repository.full_name,
    repoGithubId: repository.id,
    owner: repository.owner.login,
    repoName: repository.name,
    prNumber,
    prGithubId: pull_request.id,
    prTitle: pull_request.title,
    prAuthor: pull_request.user.login,
    prHtmlUrl: pull_request.html_url,
    commitSha: pull_request.head.sha,
    headBranch: pull_request.head.ref,
    baseBranch: pull_request.base.ref,
  });
}

export default router;
