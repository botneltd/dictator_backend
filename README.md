# Dictator 
Freedom to dictate!

Reference webhook receiver for the [Dictator](https://dictator.media) app. It accepts `POST` JSON from Dictator, validates `Authorization: Bearer`, logs each event in detail, and saves audio attachments to disk.

Payload field reference lives in the Dictator app (Settings → webhook guide) and on [dictator.media](https://dictator.media).

## Quick start

```bash
cp .env.example .env
# Set WEBHOOK_API_KEY to the same value you paste in Dictator Settings → API key
docker compose up --build
```

Webhook URL for Dictator: `http://localhost:3000/webhook` (use HTTPS + a public tunnel in production).

## Dictator app

1. Settings → **Own system**
2. Enable webhook integration
3. **Webhook URL** — your server URL ending in `/webhook`
4. **API key** — must match `WEBHOOK_API_KEY` in `.env`

Optional toggles: real-time transcripts, include audio file in payload.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Listen port |
| `WEBHOOK_API_KEY` | *(required)* | Shared secret with Dictator |
| `DATA_DIR` | `/app/data` | Root for saved audio files |
| `BODY_LIMIT_MB` | `25` | Max JSON body size |
| `LOG_LEVEL` | `info` | Server log level |
| `LOG_REALTIME_LEVEL` | `debug` | Log level for streaming `realtime_transcript` updates |

## Output

- **Logs** — structured JSON on stdout (`recording_saved`, `realtime_transcript`)
- **Audio** — `data/audio/<recordingId>/<filename>` when the app sends `version: 2` with an `audio` object

## Local tunnel

Expose localhost to your phone, e.g. `ngrok http 3000`, then use the HTTPS URL + `/webhook` in Dictator.

## Test with curl

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST http://localhost:3000/webhook \
  -H "Authorization: Bearer change-me-to-a-long-random-secret" \
  -H "Content-Type: application/json" \
  -d '{"version":1,"type":"recording_saved","recording":{"id":"rec-test","createdAt":1730000000000,"durationSeconds":10,"recordingMode":"basic","title":null,"projectId":null,"isFavorite":false,"source":"file"}}'
```

Expect `204`.

## License

MIT — Copyright (c) 2026 Botne Ltd. / Sorwi ([https://sorwi.fi](https://sorwi.fi))
