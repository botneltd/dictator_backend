import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { saveAudioAttachment } from './audio.js';
import { redactAudioForLog } from './logger.js';

describe('audio', () => {
  let tempDir: string;

  before(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'dictator-backend-'));
  });

  after(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('decodes base64 and writes file', async () => {
    const data = Buffer.from('hello audio').toString('base64');
    const saved = await saveAudioAttachment(tempDir, 'rec-1', {
      mimeType: 'audio/mp4',
      encoding: 'base64',
      filename: 'rec-1.m4a',
      data,
    });

    assert.equal(saved.bytesWritten, 11);
    const onDisk = await readFile(saved.path);
    assert.equal(onDisk.toString(), 'hello audio');
  });

  it('redacts audio data in logs', () => {
    const redacted = redactAudioForLog({
      mimeType: 'audio/mp4',
      encoding: 'base64',
      filename: 'rec-1.m4a',
      data: 'AAAA',
    });
    assert.equal(redacted.data.redacted, true);
    assert.equal(redacted.data.base64Length, 4);
    assert.equal('data' in redacted && typeof redacted.data === 'object', true);
  });
});
