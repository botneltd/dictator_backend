import { logger } from '../logger.js';
import type { RealtimeTranscriptPayload } from '../types.js';

export function handleRealtimeTranscript(
  payload: RealtimeTranscriptPayload,
  logRealtimeLevel: string
): void {
  if (!payload.recordingId || typeof payload.recordingId !== 'string') {
    throw new Error('recordingId is required');
  }
  if (typeof payload.timestamp !== 'number') {
    throw new Error('timestamp is required');
  }

  const logPayload = {
    event: 'webhook_received',
    type: 'realtime_transcript',
    receivedAt: Date.now(),
    recordingId: payload.recordingId,
    version: payload.version,
    timestamp: payload.timestamp,
    translationMode: payload.translationMode,
    sessionActive: payload.sessionActive,
    partialText: payload.partialText,
    finalText: payload.finalText,
    partialTranslated: payload.partialTranslated,
    finalTranslated: payload.finalTranslated,
    partialTextA: payload.partialTextA,
    finalTextA: payload.finalTextA,
    partialTextB: payload.partialTextB,
    finalTextB: payload.finalTextB,
  };

  const msg = payload.sessionActive ? 'realtime_transcript_update' : 'realtime_transcript_final';
  if (payload.sessionActive) {
    if (logRealtimeLevel === 'info') logger.info(logPayload, msg);
    else logger.debug(logPayload, msg);
  } else {
    logger.info(logPayload, msg);
  }
}
