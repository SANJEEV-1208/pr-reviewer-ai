import { query } from '../../config/database';

export interface PullRequestRow {
  id: number;
  repo_id: number;
  github_pr_id: number;
  pr_number: number;
  title: string;
  author_login: string;
  base_branch: string;
  head_branch: string;
  html_url: string;
  state: string;
  created_at: Date;
  updated_at: Date;
}

export async function upsertPullRequest(data: {
  repoId: number;
  githubPrId: number;
  prNumber: number;
  title: string;
  authorLogin: string;
  baseBranch: string;
  headBranch: string;
  htmlUrl: string;
}): Promise<PullRequestRow> {
  const { rows } = await query<PullRequestRow>(
    `INSERT INTO pull_requests
       (repo_id, github_pr_id, pr_number, title, author_login, base_branch, head_branch, html_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (repo_id, github_pr_id)
     DO UPDATE SET
       title = EXCLUDED.title,
       state = 'open',
       updated_at = NOW()
     RETURNING *`,
    [
      data.repoId,
      data.githubPrId,
      data.prNumber,
      data.title,
      data.authorLogin,
      data.baseBranch,
      data.headBranch,
      data.htmlUrl,
    ]
  );
  return rows[0];
}
