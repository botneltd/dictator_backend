import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePositiveInt, requireEnv, loadConfig } from './config.js';

describe('config helpers', () => {
  it('requireEnv returns trimmed value', () => {
    process.env.TEST_REQUIRE_ENV = '  secret  ';
    assert.equal(requireEnv('TEST_REQUIRE_ENV'), 'secret');
    delete process.env.TEST_REQUIRE_ENV;
  });

  it('requireEnv throws when missing', () => {
    delete process.env.TEST_MISSING_ENV;
    assert.throws(
      () => requireEnv('TEST_MISSING_ENV'),
      /Missing required environment variable: TEST_MISSING_ENV/
    );
  });

  it('requireEnv reads from an explicit env object', () => {
    assert.equal(requireEnv('WEBHOOK_API_KEY', { WEBHOOK_API_KEY: '  from-arg  ' }), 'from-arg');
  });

  it('parsePositiveInt uses fallback for invalid values', () => {
    assert.equal(parsePositiveInt(undefined, 3000), 3000);
    assert.equal(parsePositiveInt('', 3000), 3000);
    assert.equal(parsePositiveInt('abc', 3000), 3000);
    assert.equal(parsePositiveInt('-1', 3000), 3000);
    assert.equal(parsePositiveInt('0', 3000), 3000);
  });

  it('parsePositiveInt parses valid integers', () => {
    assert.equal(parsePositiveInt('8080', 3000), 8080);
    assert.equal(parsePositiveInt('25', 10), 25);
  });
});

describe('loadConfig', () => {
  it('throws when WEBHOOK_API_KEY is missing', () => {
    assert.throws(() => loadConfig({}), /Missing required environment variable: WEBHOOK_API_KEY/);
    assert.throws(
      () => loadConfig({ WEBHOOK_API_KEY: '   ' }),
      /Missing required environment variable: WEBHOOK_API_KEY/
    );
  });

  it('applies defaults when optional env is omitted', () => {
    const cfg = loadConfig({ WEBHOOK_API_KEY: 'secret' });
    assert.equal(cfg.port, 3000);
    assert.equal(cfg.webhookApiKey, 'secret');
    assert.equal(cfg.dataDir, '/app/data');
    assert.equal(cfg.bodyLimitMb, 25);
    assert.equal(cfg.logLevel, 'info');
    assert.equal(cfg.logRealtimeLevel, 'debug');
  });

  it('reads explicit env values', () => {
    const cfg = loadConfig({
      WEBHOOK_API_KEY: '  abc  ',
      PORT: '8080',
      DATA_DIR: '/tmp/dictator-data',
      BODY_LIMIT_MB: '10',
      LOG_LEVEL: 'debug',
      LOG_REALTIME_LEVEL: 'info',
    });
    assert.equal(cfg.webhookApiKey, 'abc');
    assert.equal(cfg.port, 8080);
    assert.equal(cfg.dataDir, '/tmp/dictator-data');
    assert.equal(cfg.bodyLimitMb, 10);
    assert.equal(cfg.logLevel, 'debug');
    assert.equal(cfg.logRealtimeLevel, 'info');
  });
});
