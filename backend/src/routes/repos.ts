import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getReposByUserId, updateRepoConfig } from '../db/queries/repos';

const router = Router();

router.use(authenticate);

// GET /api/repos — list repos connected to the current user
router.get('/', async (req: Request, res: Response) => {
  const repos = await getReposByUserId(req.user!.userId);
  res.json(repos.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    owner: r.owner,
    name: r.name,
    enabled: r.enabled,
    focusRules: r.focus_rules,
  })));
});

// POST /api/repos/:id/config — update focus rules + enabled flag
router.post('/:id/config', async (req: Request, res: Response) => {
  const repoId = parseInt(req.params.id, 10);
  const { focusRules, enabled } = req.body as { focusRules?: string[]; enabled?: boolean };

  if (!Array.isArray(focusRules) || typeof enabled !== 'boolean') {
    res.status(400).json({ error: 'focusRules (array) and enabled (boolean) are required' });
    return;
  }

  const updated = await updateRepoConfig(repoId, focusRules, enabled);
  if (!updated) {
    res.status(404).json({ error: 'Repo not found' });
    return;
  }

  res.json({ success: true });
});

export default router;
