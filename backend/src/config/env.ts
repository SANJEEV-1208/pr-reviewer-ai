import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = [
  'DATABASE_URL',
  'REDIS_URL',
  'GITHUB_APP_ID',
  'GITHUB_WEBHOOK_SECRET',
  'GITHUB_APP_CLIENT_ID',
  'GITHUB_APP_CLIENT_SECRET',
  'GROQ_API_KEY',
  'JWT_SECRET',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Must supply either inline PEM content or a path to the .pem file
if (!process.env.GITHUB_APP_PRIVATE_KEY && !process.env.GITHUB_APP_PRIVATE_KEY_PATH) {
  throw new Error('Missing required env var: GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_PATH');
}

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  GITHUB_APP_ID: parseInt(process.env.GITHUB_APP_ID!, 10),
  // Inline PEM takes priority over file path (used in production on Render)
  GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
  GITHUB_APP_PRIVATE_KEY_PATH: process.env.GITHUB_APP_PRIVATE_KEY_PATH,
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET!,
  GITHUB_APP_CLIENT_ID: process.env.GITHUB_APP_CLIENT_ID!,
  GITHUB_APP_CLIENT_SECRET: process.env.GITHUB_APP_CLIENT_SECRET!,
  GROQ_API_KEY: process.env.GROQ_API_KEY!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Render backend URL — used for GitHub OAuth redirect_uri
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
  GITHUB_APP_URL: process.env.GITHUB_APP_URL || '',
};
