import { query } from '../../config/database';

export interface UserRow {
  id: number;
  github_id: number;
  github_login: string;
  github_email: string | null;
  avatar_url: string | null;
  access_token: string;
  created_at: Date;
  updated_at: Date;
}

export async function upsertUser(data: {
  githubId: number;
  githubLogin: string;
  githubEmail?: string | null;
  avatarUrl?: string | null;
  accessToken: string;
}): Promise<UserRow> {
  const { rows } = await query<UserRow>(
    `INSERT INTO users (github_id, github_login, github_email, avatar_url, access_token)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (github_id)
     DO UPDATE SET
       github_login = EXCLUDED.github_login,
       github_email = EXCLUDED.github_email,
       avatar_url = EXCLUDED.avatar_url,
       access_token = EXCLUDED.access_token,
       updated_at = NOW()
     RETURNING *`,
    [data.githubId, data.githubLogin, data.githubEmail ?? null, data.avatarUrl ?? null, data.accessToken]
  );
  return rows[0];
}

export async function getUserById(id: number): Promise<UserRow | null> {
  const { rows } = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}
