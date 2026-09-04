import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { AddressInfo } from 'node:net';
import { buildServer } from './server.js';
import type { AppConfig } from './config.js';

function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    port: 0,
    webhookApiKey: 'factory-secret',
    dataDir: os.tmpdir(),
    bodyLimitMb: 1,
    logLevel: 'silent',
    logRealtimeLevel: 'debug',
    ...overrides,
  };
}

describe('buildServer factory', () => {
  it('boots routes without listen', async () => {
    const app = await buildServer(testConfig());
    try {
      await app.ready();
      assert.equal(app.hasRoute({ method: 'GET', url: '/health' }), true);
      assert.equal(app.hasRoute({ method: 'POST', url: '/webhook' }), true);

      const health = await app.inject({ method: 'GET', url: '/health' });
      assert.equal(health.statusCode, 200);
      assert.deepEqual(health.json(), { status: 'ok' });
    } finally {
      await app.close();
    }
  });

  it('listens on an ephemeral port and serves health over HTTP', async () => {
    const app = await buildServer(testConfig());
    try {
      await app.listen({ port: 0, host: '127.0.0.1' });
      const address = app.server.address() as AddressInfo;
      assert.ok(address.port > 0);

      const res = await fetch(`http://127.0.0.1:${address.port}/health`);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { status: 'ok' });
    } finally {
      await app.close();
    }
  });
});

describe('buildServer disk error path', () => {
  let blocker: string;

  before(async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'dictator-server-'));
    blocker = path.join(dir, 'not-a-dir');
    await writeFile(blocker, 'nope');
  });

  after(async () => {
    await rm(path.dirname(blocker), { recursive: true, force: true });
  });

  it('still returns 204 when audio cannot be saved', async () => {
    const app = await buildServer(testConfig({ dataDir: blocker }));
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/webhook',
        headers: { authorization: 'Bearer factory-secret' },
        payload: {
          version: 2,
          type: 'recording_saved',
          recording: {
            id: 'rec-disk-fail',
            createdAt: 1,
            durationSeconds: 1,
            recordingMode: 'basic',
            title: null,
            projectId: null,
            isFavorite: false,
            source: 'file',
          },
          audio: {
            mimeType: 'audio/mp4',
            encoding: 'base64',
            filename: 'clip.m4a',
            data: Buffer.from('x').toString('base64'),
          },
        },
      });
      assert.equal(res.statusCode, 204);
    } finally {
      await app.close();
    }
  });
});
