import { saveAudioAttachment } from '../audio.js';
import { logger, redactAudioForLog } from '../logger.js';
import type { RecordingSavedPayload } from '../types.js';

export async function handleRecordingSaved(
  payload: RecordingSavedPayload,
  dataDir: string
): Promise<void> {
  const recordingId = payload.recording?.id;
  if (!recordingId || typeof recordingId !== 'string') {
    throw new Error('recording.id is required');
  }

  const logPayload: Record<string, unknown> = {
    event: 'webhook_received',
    type: 'recording_saved',
    receivedAt: Date.now(),
    version: payload.version,
    recordingId,
    recording: payload.recording,
    transcript: payload.transcript ?? null,
  };

  if (payload.audio?.data) {
    try {
      const saved = await saveAudioAttachment(dataDir, recordingId, payload.audio);
      logPayload.audio = {
        ...redactAudioForLog(payload.audio),
        saved,
      };
    } catch (err) {
      logPayload.audio = {
        ...redactAudioForLog(payload.audio),
        saveError: err instanceof Error ? err.message : String(err),
      };
      logger.error({ err, recordingId }, 'Failed to save audio attachment');
    }
  } else {
    logPayload.audio = 'absent';
  }

  logger.info(logPayload, 'recording_saved');
}
