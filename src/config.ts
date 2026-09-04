export type AppConfig = {
  port: number;
  webhookApiKey: string;
  dataDir: string;
  bodyLimitMb: number;
  logLevel: string;
  logRealtimeLevel: string;
};

export function requireEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: parsePositiveInt(env.PORT, 3000),
    webhookApiKey: requireEnv('WEBHOOK_API_KEY', env),
    dataDir: env.DATA_DIR?.trim() || '/app/data',
    bodyLimitMb: parsePositiveInt(env.BODY_LIMIT_MB, 25),
    logLevel: env.LOG_LEVEL?.trim() || 'info',
    logRealtimeLevel: env.LOG_REALTIME_LEVEL?.trim() || 'debug',
  };
}
