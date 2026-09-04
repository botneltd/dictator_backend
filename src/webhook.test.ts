import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { FastifyInstance } from 'fastify';
import { buildServer } from './server.js';

const API_KEY = 'test-webhook-secret';

const recording = {
  id: 'rec-ok',
  createdAt: 1,
  durationSeconds: 5,
  recordingMode: 'basic',
  title: null,
  projectId: null,
  isFavorite: false,
  source: 'file',
};

const realtimeBase = {
  version: 1,
  type: 'realtime_transcript' as const,
  timestamp: Date.now(),
  recordingId: 'rec-rt',
  translationMode: 'one_way' as const,
  sessionActive: true,
  partialText: 'hello',
  finalText: '',
  partialTranslated: '',
  finalTranslated: '',
  partialTextA: '',
  finalTextA: '',
  partialTextB: '',
  finalTextB: '',
};

describe('webhook HTTP routes', () => {
  let app: FastifyInstance;
  let dataDir: string;

  before(async () => {
    dataDir = await mkdtemp(path.join(os.tmpdir(), 'dictator-webhook-'));
    app = await buildServer({
      port: 0,
      webhookApiKey: API_KEY,
      dataDir,
      bodyLimitMb: 1,
      logLevel: 'silent',
      logRealtimeLevel: 'debug',
    });
  });

  after(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
    assert.deepEqual(res.json(), { status: 'ok' });
  });

  it('GET /webhook is not found', async () => {
    const res = await app.inject({ method: 'GET', url: '/webhook' });
    assert.equal(res.statusCode, 404);
  });

  it('unknown routes return 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    assert.equal(res.statusCode, 404);
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

  it('returns 401 for non-bearer authorization', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Basic ${API_KEY}` },
      payload: { version: 1, recording: { id: 'rec-1' } },
    });
    assert.equal(res.statusCode, 401);
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        authorization: `Bearer ${API_KEY}`,
        'content-type': 'application/json',
      },
      payload: '{not json',
    });
    assert.equal(res.statusCode, 400);
  });

  it('returns 400 for non-object JSON body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        authorization: `Bearer ${API_KEY}`,
        'content-type': 'application/json',
      },
      payload: 'null',
    });
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.json(), { error: 'Invalid JSON body' });
  });

  it('returns 400 for empty JSON object', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {},
    });
    assert.equal(res.statusCode, 400);
    assert.match(res.json().error, /recording\.id is required/);
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

  it('returns 400 when realtime_transcript is missing recordingId', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: { ...realtimeBase, recordingId: '' },
    });
    assert.equal(res.statusCode, 400);
    assert.match(res.json().error, /recordingId is required/);
  });

  it('returns 400 when realtime_transcript is missing timestamp', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: { ...realtimeBase, timestamp: 'now' },
    });
    assert.equal(res.statusCode, 400);
    assert.match(res.json().error, /timestamp is required/);
  });

  it('treats missing type as recording_saved', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: { version: 1, recording },
    });
    assert.equal(res.statusCode, 204);
  });

  it('returns 204 for recording_saved with transcript', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        version: 1,
        type: 'recording_saved',
        recording,
        transcript: {
          id: 'trans-1',
          recordingId: recording.id,
          text: 'We need to ship.',
          translatedText: 'Meidän pitää julkaista.',
          language: 'fi',
          segments: null,
          summary: null,
          contentType: null,
          createdAt: 2,
        },
      },
    });
    assert.equal(res.statusCode, 204);
    assert.equal(res.body, '');
  });

  it('saves version 2 audio attachment and returns 204', async () => {
    const data = Buffer.from('hello audio').toString('base64');
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        version: 2,
        type: 'recording_saved',
        recording: { ...recording, id: 'rec-audio-http' },
        audio: {
          mimeType: 'audio/mp4',
          encoding: 'base64',
          filename: 'rec-audio-http.m4a',
          data,
        },
      },
    });
    assert.equal(res.statusCode, 204);
    const onDisk = await readFile(path.join(dataDir, 'audio', 'rec-audio-http', 'rec-audio-http.m4a'));
    assert.equal(onDisk.toString(), 'hello audio');
  });

  it('returns 204 for realtime_transcript updates', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: realtimeBase,
    });
    assert.equal(res.statusCode, 204);
  });

  it('returns 204 for realtime_transcript final snapshot', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        ...realtimeBase,
        sessionActive: false,
        finalText: 'Done',
      },
    });
    assert.equal(res.statusCode, 204);
  });
});
