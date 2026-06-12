function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: parsePositiveInt(process.env.PORT, 3000),
  webhookApiKey: requireEnv('WEBHOOK_API_KEY'),
  dataDir: process.env.DATA_DIR?.trim() || '/app/data',
  bodyLimitMb: parsePositiveInt(process.env.BODY_LIMIT_MB, 25),
  logLevel: process.env.LOG_LEVEL?.trim() || 'info',
  logRealtimeLevel: process.env.LOG_REALTIME_LEVEL?.trim() || 'debug',
};
