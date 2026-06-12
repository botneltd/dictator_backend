export type WebhookMessageType = 'recording_saved' | 'realtime_transcript';

export type RecordingPayload = {
  id: string;
  createdAt: number;
  durationSeconds: number | null;
  recordingMode: string | null;
  title: string | null;
  projectId: string | null;
  isFavorite: boolean;
  source: string;
  liveTranscriptInterrupted?: boolean;
};

export type TranscriptPayload = {
  id: string;
  recordingId: string;
  text: string;
  translatedText: string | null;
  language: string;
  segments: string | null;
  summary: string | null;
  contentType: string | null;
  createdAt: number;
};

export type AudioPayload = {
  mimeType: string;
  encoding: string;
  filename: string;
  data: string;
};

export type RecordingSavedPayload = {
  version: number;
  type?: 'recording_saved';
  recording: RecordingPayload;
  transcript?: TranscriptPayload;
  audio?: AudioPayload;
};

export type RealtimeTranscriptPayload = {
  version: number;
  type: 'realtime_transcript';
  timestamp: number;
  recordingId: string;
  translationMode: 'one_way' | 'two_way';
  sessionActive: boolean;
  partialText: string;
  finalText: string;
  partialTranslated: string;
  finalTranslated: string;
  partialTextA: string;
  finalTextA: string;
  partialTextB: string;
  finalTextB: string;
};

export type WebhookPayload = RecordingSavedPayload | RealtimeTranscriptPayload;
