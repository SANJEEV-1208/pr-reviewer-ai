import { getOctokitForInstallation } from './githubApp';
import { logger } from '../utils/logger';

const MAX_DIFF_CHARS = 60000;

export async function fetchPRDiff(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number
): Promise<{ diff: string; truncated: boolean; sizeBytes: number }> {
  const octokit = await getOctokitForInstallation(installationId);

  const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: 'diff' },
  });

  const rawDiff = response.data as unknown as string;
  const sizeBytes = Buffer.byteLength(rawDiff, 'utf8');

  if (rawDiff.length <= MAX_DIFF_CHARS) {
    return { diff: rawDiff, truncated: false, sizeBytes };
  }

  logger.warn('Diff truncated due to size', { owner, repo, prNumber, sizeBytes });
  const truncated =
    rawDiff.slice(0, MAX_DIFF_CHARS) +
    '\n\n[... diff truncated due to size. Review the remaining changes manually ...]';

  return { diff: truncated, truncated: true, sizeBytes };
}

export async function postPRComment(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<number> {
  const octokit = await getOctokitForInstallation(installationId);

  const { data } = await octokit.request(
    'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
    { owner, repo, issue_number: prNumber, body }
  ) as { data: { id: number } };

  logger.info('PR comment posted', { owner, repo, prNumber, commentId: data.id });
  return data.id;
}
