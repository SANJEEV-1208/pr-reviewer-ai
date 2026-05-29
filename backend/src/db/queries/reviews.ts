import { query } from '../../config/database';

export interface ReviewRow {
  id: number;
  pull_request_id: number;
  commit_sha: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  raw_diff_size_bytes: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  model_used: string | null;
  review_body: string | null;
  bugs_found: object[];
  security_issues: object[];
  suggestions: object[];
  github_comment_id: number | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: Date;
  updated_at: Date;
}

export async function insertReview(data: {
  pullRequestId: number;
  commitSha: string;
  modelUsed: string;
}): Promise<ReviewRow> {
  const { rows } = await query<ReviewRow>(
    `INSERT INTO reviews (pull_request_id, commit_sha, status, model_used)
     VALUES ($1, $2, 'processing', $3)
     RETURNING *`,
    [data.pullRequestId, data.commitSha, data.modelUsed]
  );
  return rows[0];
}

export async function updateReview(
  id: number,
  data: {
    status: 'completed' | 'failed';
    reviewBody?: string;
    overallAssessment?: string;
    bugsFound?: object[];
    securityIssues?: object[];
    suggestions?: object[];
    githubCommentId?: number;
    promptTokens?: number;
    completionTokens?: number;
    durationMs?: number;
    rawDiffSizeBytes?: number;
    errorMessage?: string;
  }
): Promise<void> {
  await query(
    `UPDATE reviews SET
       status = $2,
       review_body = $3,
       overall_assessment = $4,
       bugs_found = $5,
       security_issues = $6,
       suggestions = $7,
       github_comment_id = $8,
       prompt_tokens = $9,
       completion_tokens = $10,
       duration_ms = $11,
       raw_diff_size_bytes = $12,
       error_message = $13,
       updated_at = NOW()
     WHERE id = $1`,
    [
      id,
      data.status,
      data.reviewBody ?? null,
      data.overallAssessment ?? null,
      JSON.stringify(data.bugsFound ?? []),
      JSON.stringify(data.securityIssues ?? []),
      JSON.stringify(data.suggestions ?? []),
      data.githubCommentId ?? null,
      data.promptTokens ?? null,
      data.completionTokens ?? null,
      data.durationMs ?? null,
      data.rawDiffSizeBytes ?? null,
      data.errorMessage ?? null,
    ]
  );
}

export async function getReviewsByUserId(
  userId: number,
  limit = 20,
  offset = 0
): Promise<ReviewRow[]> {
  const { rows } = await query<ReviewRow>(
    `SELECT r.* FROM reviews r
     JOIN pull_requests pr ON r.pull_request_id = pr.id
     JOIN repos repo ON pr.repo_id = repo.id
     WHERE repo.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
}

export async function getReviewById(id: number): Promise<ReviewRow | null> {
  const { rows } = await query<ReviewRow>('SELECT * FROM reviews WHERE id = $1', [id]);
  return rows[0] ?? null;
}
