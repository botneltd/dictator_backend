import { buildServer } from './server.js';
import { config } from './config.js';

const app = await buildServer();

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info({ port: config.port, dataDir: config.dataDir }, 'Dictator webhook receiver listening');
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
