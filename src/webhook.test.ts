import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';

const API_KEY = 'test-webhook-secret';

describe('webhook routes', () => {
  let app: FastifyInstance;

  before(async () => {
    process.env.WEBHOOK_API_KEY = API_KEY;
    process.env.LOG_LEVEL = 'silent';
    const { buildServer } = await import('./server.js');
    app = await buildServer();
  });

  after(async () => {
    await app.close();
  });

  it('returns 401 without bearer token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      payload: { version: 1, recording: { id: 'rec-1' } },
    });
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.json(), { error: 'Unauthorized' });
  });

  it('returns 401 with wrong bearer token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: 'Bearer wrong-key' },
      payload: { version: 1, recording: { id: 'rec-1' } },
    });
    assert.equal(res.statusCode, 401);
  });

  it('returns 400 for invalid recording payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: { version: 1, recording: { id: '' } },
    });
    assert.equal(res.statusCode, 400);
    assert.match(res.json().error, /recording\.id is required/);
  });

  it('returns 204 for recording_saved', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        version: 1,
        type: 'recording_saved',
        recording: {
          id: 'rec-ok',
          createdAt: 1,
          durationSeconds: 5,
          recordingMode: 'basic',
          title: null,
          projectId: null,
          isFavorite: false,
          source: 'file',
        },
      },
    });
    assert.equal(res.statusCode, 204);
    assert.equal(res.body, '');
  });

  it('returns 204 for realtime_transcript', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        version: 1,
        type: 'realtime_transcript',
        timestamp: Date.now(),
        recordingId: 'rec-rt',
        translationMode: 'one_way',
        sessionActive: true,
        partialText: 'hello',
        finalText: '',
        partialTranslated: '',
        finalTranslated: '',
        partialTextA: '',
        finalTextA: '',
        partialTextB: '',
        finalTextB: '',
      },
    });
    assert.equal(res.statusCode, 204);
  });
});

describe('health route', () => {
  let app: FastifyInstance;

  before(async () => {
    process.env.WEBHOOK_API_KEY = API_KEY;
    process.env.LOG_LEVEL = 'silent';
    const { buildServer } = await import('./server.js');
    app = await buildServer();
  });

  after(async () => {
    await app.close();
  });

  it('returns ok status', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { status: 'ok' });
  });
});
