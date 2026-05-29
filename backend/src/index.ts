import { env } from './config/env';
import { testConnection } from './config/database';
import { createApp } from './app';
import { logger } from './utils/logger';

// Start the Bull worker (import triggers queue.process())
import './queue/reviewWorker';

async function main() {
  await testConnection();

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`, { env: env.NODE_ENV });
  });
}

main().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
