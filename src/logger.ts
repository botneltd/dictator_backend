import pino from 'pino';
import type { AudioPayload } from './types.js';

export const logger = pino({
  level: process.env.LOG_LEVEL?.trim() || 'info',
});

export function redactAudioForLog(audio: AudioPayload) {
  const base64Length = audio.data.length;
  return {
    mimeType: audio.mimeType,
    encoding: audio.encoding,
    filename: audio.filename,
    data: {
      redacted: true,
      base64Length,
      approxBytes: Math.floor((base64Length * 3) / 4),
    },
  };
}
