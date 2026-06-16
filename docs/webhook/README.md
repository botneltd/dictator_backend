# Dictator webhook integration

Dictator can POST JSON to a URL you configure in the app (**Settings → Own system**). Use this folder as the public integration guide for your server.

**Vendor-neutral:** payloads describe speech-to-text (STT), real-time transcription, translation, and speaker diarization — not specific third-party providers.

## Quick setup

1. Install [Dictator](https://play.google.com/store/apps/details?id=media.dictator) and open **Settings → Own system**.
2. Enable webhook integration.
3. Set **Webhook URL** (HTTPS recommended) and **API key** (shared secret).
4. Implement `POST` on your server; branch on the `type` field in each JSON body.

**Subscription:** Webhook integration requires a **Personal** or **Professional** subscription in the app. With a free tier, the app does not send webhook requests even when URL and API key are configured.

Optional toggles in the app:

| Setting | Effect |
|---------|--------|
| Send transcripts in real time | Also receives `realtime_transcript` while recording |
| Include audio file | `recording_saved` may use `version: 2` with base64 audio |

## HTTP

| Item | Value |
|------|--------|
| Method | `POST` |
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <your-api-key>` — required; empty key disables all sends |
| Success | Any `2xx` HTTP status (body ignored) |

Respond quickly; queue heavy work on your server. The client uses a longer timeout when audio is attached.

## Message types

| `type` | When | Guide |
|--------|------|--------|
| `recording_saved` | After a recording is saved on device | [recording-saved.md](./recording-saved.md) |
| `realtime_transcript` | During live transcription (optional setting) | [realtime-transcript.md](./realtime-transcript.md) |

If `type` is missing, treat the body as **`recording_saved`** (legacy clients).

## Reference receiver

This repository includes a sample server: [`README.md`](../../README.md) — `POST /webhook`, Bearer auth, optional audio save to disk.

## Examples and recipes

Copy-paste **curl** commands and full JSON bodies: [examples.md](./examples.md).

## App developer reference

Implementation source of truth: Dictator app `services/sync/webhook-sync.ts`. A shorter in-repo mirror lives at `dictator/docs/WEBHOOK_PAYLOAD.md`.
