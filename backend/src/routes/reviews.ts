import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getReviewsByUserId, getReviewById } from '../db/queries/reviews';
import { query } from '../config/database';

const router = Router();

router.use(authenticate);

// GET /api/reviews?limit=20&offset=0
router.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const reviews = await getReviewsByUserId(req.user!.userId, limit, offset);

  // Join with PR info for the response
  const enriched = await Promise.all(
    reviews.map(async (r) => {
      const { rows } = await query(
        `SELECT pr.pr_number, pr.title, pr.html_url, pr.author_login,
                repo.full_name as repo_full_name
         FROM pull_requests pr
         JOIN repos repo ON pr.repo_id = repo.id
         WHERE pr.id = $1`,
        [r.pull_request_id]
      );
      const pr = rows[0];
      return {
        id: r.id,
        status: r.status,
        overallAssessment: (r as unknown as { overall_assessment?: string }).overall_assessment,
        commitSha: r.commit_sha.slice(0, 7),
        durationMs: r.duration_ms,
        createdAt: r.created_at,
        pr: pr
          ? {
              number: pr.pr_number,
              title: pr.title,
              htmlUrl: pr.html_url,
              author: pr.author_login,
              repoFullName: pr.repo_full_name,
            }
          : null,
      };
    })
  );

  res.json(enriched);
});

// GET /api/reviews/stats
router.get('/stats', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const [assessmentRows, dailyRows, summaryRows] = await Promise.all([
    query(
      `SELECT r.overall_assessment as assessment, COUNT(*) as count
       FROM reviews r
       JOIN pull_requests pr ON r.pull_request_id = pr.id
       JOIN repos repo ON pr.repo_id = repo.id
       WHERE repo.user_id = $1 AND r.status = 'completed'
       GROUP BY r.overall_assessment`,
      [userId]
    ),
    query(
      `SELECT DATE(r.created_at) as date, COUNT(*) as count
       FROM reviews r
       JOIN pull_requests pr ON r.pull_request_id = pr.id
       JOIN repos repo ON pr.repo_id = repo.id
       WHERE repo.user_id = $1
         AND r.created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(r.created_at)
       ORDER BY date ASC`,
      [userId]
    ),
    query(
      `SELECT
         COUNT(*) as total,
         ROUND(AVG(r.duration_ms)) as avg_duration_ms,
         COUNT(*) FILTER (WHERE r.status = 'completed') as completed,
         COUNT(*) FILTER (WHERE r.status = 'failed') as failed
       FROM reviews r
       JOIN pull_requests pr ON r.pull_request_id = pr.id
       JOIN repos repo ON pr.repo_id = repo.id
       WHERE repo.user_id = $1`,
      [userId]
    ),
  ]);

  res.json({
    summary: summaryRows.rows[0],
    assessmentBreakdown: assessmentRows.rows,
    dailyActivity: dailyRows.rows,
  });
});

// GET /api/reviews/:id
router.get('/:id', async (req: Request, res: Response) => {
  const review = await getReviewById(parseInt(req.params.id, 10));
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  res.json(review);
});

export default router;
