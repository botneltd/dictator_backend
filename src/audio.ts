import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AudioPayload } from './types.js';

export type SavedAudio = {
  path: string;
  bytesWritten: number;
  mimeType: string;
  filename: string;
};

export async function saveAudioAttachment(
  dataDir: string,
  recordingId: string,
  audio: AudioPayload
): Promise<SavedAudio> {
  const dir = path.join(dataDir, 'audio', recordingId);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, audio.filename);
  const buffer = Buffer.from(audio.data, 'base64');
  await writeFile(filePath, buffer);
  return {
    path: filePath,
    bytesWritten: buffer.length,
    mimeType: audio.mimeType,
    filename: audio.filename,
  };
}
