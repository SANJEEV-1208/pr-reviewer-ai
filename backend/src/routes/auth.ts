import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { upsertUser, getUserById } from '../db/queries/users';
import { authenticate, JwtPayload } from '../middleware/authenticate';
import { logger } from '../utils/logger';
import { query } from '../config/database';

const router = Router();

// Step 1: Redirect browser to GitHub OAuth
router.get('/github', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: env.GITHUB_APP_CLIENT_ID,
    scope: 'read:user user:email',
    redirect_uri: `${env.BACKEND_URL}/api/auth/github/callback`,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2: GitHub redirects back with ?code=...
router.get('/github/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (typeof code !== 'string') {
    res.status(400).json({ error: 'Missing OAuth code' });
    return;
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_APP_CLIENT_ID,
        client_secret: env.GITHUB_APP_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      logger.error('GitHub OAuth token exchange failed', { error: tokenData.error });
      res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
      return;
    }

    // Fetch user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const githubUser = (await userResponse.json()) as {
      id: number;
      login: string;
      email: string | null;
      avatar_url: string;
    };

    // Upsert user in DB
    const user = await upsertUser({
      githubId: githubUser.id,
      githubLogin: githubUser.login,
      githubEmail: githubUser.email,
      avatarUrl: githubUser.avatar_url,
      accessToken: tokenData.access_token,
    });

    // Link any repos owned by this user that were installed before they logged in
    await query(
      `UPDATE repos SET user_id = $1 WHERE owner = $2 AND user_id IS NULL`,
      [user.id, githubUser.login]
    );

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, githubLogin: user.github_login } satisfies JwtPayload,
      env.JWT_SECRET,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    // Redirect to frontend with token in query string
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (err) {
    logger.error('OAuth callback error', { error: (err as Error).message });
    res.redirect(`${env.FRONTEND_URL}/login?error=server_error`);
  }
});

// GET /api/auth/me — return current user from JWT
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    id: user.id,
    githubLogin: user.github_login,
    githubEmail: user.github_email,
    avatarUrl: user.avatar_url,
  });
});

export default router;
