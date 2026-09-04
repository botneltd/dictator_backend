import { buildServer } from './server.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = await buildServer(config);

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info({ port: config.port, dataDir: config.dataDir }, 'Dictator webhook receiver listening');
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
