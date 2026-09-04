import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { handleRecordingSaved } from './recording-saved.js';

describe('handleRecordingSaved', () => {
  let tempDir: string;

  before(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'dictator-recording-'));
  });

  after(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('throws when recording.id is missing', async () => {
    await assert.rejects(
      () =>
        handleRecordingSaved(
          { version: 1, recording: { id: '' } } as never,
          tempDir
        ),
      /recording\.id is required/
    );
  });

  it('saves audio attachment when present', async () => {
    const data = Buffer.from('audio-bytes').toString('base64');
    await handleRecordingSaved(
      {
        version: 2,
        recording: {
          id: 'rec-audio',
          createdAt: 1,
          durationSeconds: 10,
          recordingMode: 'basic',
          title: null,
          projectId: null,
          isFavorite: false,
          source: 'file',
        },
        audio: {
          mimeType: 'audio/mp4',
          encoding: 'base64',
          filename: 'rec-audio.m4a',
          data,
        },
      },
      tempDir
    );

    const onDisk = await readFile(path.join(tempDir, 'audio', 'rec-audio', 'rec-audio.m4a'));
    assert.equal(onDisk.toString(), 'audio-bytes');
  });

  it('logs without audio when attachment is absent', async () => {
    await assert.doesNotReject(() =>
      handleRecordingSaved(
        {
          version: 1,
          recording: {
            id: 'rec-no-audio',
            createdAt: 1,
            durationSeconds: null,
            recordingMode: null,
            title: 'Test',
            projectId: null,
            isFavorite: false,
            source: 'text',
          },
        },
        tempDir
      )
    );
  });
});
