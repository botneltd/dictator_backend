import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleRealtimeTranscript } from './realtime-transcript.js';

const basePayload = {
  version: 1,
  type: 'realtime_transcript' as const,
  timestamp: 1_730_000_000_000,
  recordingId: 'rec-rt',
  translationMode: 'one_way' as const,
  sessionActive: true,
  partialText: 'hel',
  finalText: '',
  partialTranslated: '',
  finalTranslated: '',
  partialTextA: '',
  finalTextA: '',
  partialTextB: '',
  finalTextB: '',
};

describe('handleRealtimeTranscript', () => {
  it('throws when recordingId is missing', () => {
    assert.throws(
      () =>
        handleRealtimeTranscript(
          { ...basePayload, recordingId: '' },
          'debug'
        ),
      /recordingId is required/
    );
  });

  it('throws when timestamp is missing', () => {
    assert.throws(
      () =>
        handleRealtimeTranscript(
          { ...basePayload, timestamp: undefined as unknown as number },
          'debug'
        ),
      /timestamp is required/
    );
  });

  it('accepts active session updates', () => {
    assert.doesNotThrow(() => handleRealtimeTranscript(basePayload, 'info'));
    assert.doesNotThrow(() => handleRealtimeTranscript(basePayload, 'debug'));
  });

  it('accepts final session snapshot', () => {
    assert.doesNotThrow(() =>
      handleRealtimeTranscript(
        {
          ...basePayload,
          sessionActive: false,
          finalText: 'Done',
        },
        'debug'
      )
    );
  });
});
