import { query } from '../../config/database';

export interface RepoRow {
  id: number;
  github_repo_id: number;
  owner: string;
  name: string;
  full_name: string;
  installation_id: number;
  user_id: number | null;
  focus_rules: string[];
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function upsertRepo(data: {
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  installationId: number;
  userId?: number;
}): Promise<RepoRow> {
  const { rows } = await query<RepoRow>(
    `INSERT INTO repos (github_repo_id, owner, name, full_name, installation_id, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (github_repo_id)
     DO UPDATE SET
       installation_id = EXCLUDED.installation_id,
       owner = EXCLUDED.owner,
       name = EXCLUDED.name,
       full_name = EXCLUDED.full_name,
       updated_at = NOW()
     RETURNING *`,
    [data.githubRepoId, data.owner, data.name, data.fullName, data.installationId, data.userId ?? null]
  );
  return rows[0];
}

export async function getRepoByGithubId(githubRepoId: number): Promise<RepoRow | null> {
  const { rows } = await query<RepoRow>(
    'SELECT * FROM repos WHERE github_repo_id = $1',
    [githubRepoId]
  );
  return rows[0] ?? null;
}

export async function getReposByUserId(userId: number): Promise<RepoRow[]> {
  const { rows } = await query<RepoRow>(
    'SELECT * FROM repos WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

export async function updateRepoConfig(
  repoId: number,
  focusRules: string[],
  enabled: boolean
): Promise<RepoRow | null> {
  const { rows } = await query<RepoRow>(
    `UPDATE repos SET focus_rules = $2, enabled = $3, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [repoId, JSON.stringify(focusRules), enabled]
  );
  return rows[0] ?? null;
}

export async function linkRepoToUser(repoId: number, userId: number): Promise<void> {
  await query('UPDATE repos SET user_id = $2, updated_at = NOW() WHERE id = $1', [repoId, userId]);
}
