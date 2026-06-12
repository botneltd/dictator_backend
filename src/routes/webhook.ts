import type { FastifyInstance } from 'fastify';
import { verifyBearerToken, extractBearerToken } from '../auth.js';
import { handleRecordingSaved } from '../handlers/recording-saved.js';
import { handleRealtimeTranscript } from '../handlers/realtime-transcript.js';
import type { RealtimeTranscriptPayload, RecordingSavedPayload } from '../types.js';

type WebhookRouteConfig = {
  webhookApiKey: string;
  dataDir: string;
  logRealtimeLevel: string;
};

function resolveMessageType(body: Record<string, unknown>): 'recording_saved' | 'realtime_transcript' {
  if (body.type === 'realtime_transcript') return 'realtime_transcript';
  return 'recording_saved';
}

export async function registerWebhookRoutes(
  app: FastifyInstance,
  { webhookApiKey, dataDir, logRealtimeLevel }: WebhookRouteConfig
): Promise<void> {
  app.post('/webhook', async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    if (!verifyBearerToken(token, webhookApiKey)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return reply.code(400).send({ error: 'Invalid JSON body' });
    }

    try {
      const messageType = resolveMessageType(body);

      if (messageType === 'realtime_transcript') {
        handleRealtimeTranscript(body as RealtimeTranscriptPayload, logRealtimeLevel);
      } else {
        await handleRecordingSaved(body as RecordingSavedPayload, dataDir);
      }

      return reply.code(204).send();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid payload';
      return reply.code(400).send({ error: message });
    }
  });
}
