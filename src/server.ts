import Fastify from 'fastify';
import { registerWebhookRoutes } from './routes/webhook.js';
import type { AppConfig } from './config.js';

export async function buildServer(config: AppConfig) {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
    bodyLimit: config.bodyLimitMb * 1024 * 1024,
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await registerWebhookRoutes(app, {
    webhookApiKey: config.webhookApiKey,
    dataDir: config.dataDir,
    logRealtimeLevel: config.logRealtimeLevel,
  });

  return app;
}
