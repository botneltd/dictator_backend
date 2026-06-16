# `recording_saved`

Sent after Dictator persists a recording locally (when webhook is enabled with valid URL + API key, and the user has a **Personal** or **Professional** subscription).

## Two-phase delivery (basic / audio-only file saves)

When the user stops a **basic** or **audio-only** recording **without** live transcription, the app may send **`recording_saved` twice**:

1. **Immediately after stop** — metadata only (`recording` object, no `transcript`). Audio may be attached if enabled.
2. **After transcription** — when the user runs async transcription from the recording detail screen (or when live STT completes on stop in other modes), a second `recording_saved` includes the `transcript` object.

Your server should upsert by `recording.id` and treat later messages as updates, not duplicates to ignore.

## Root fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | number | yes | `1` = metadata (+ optional transcript). `2` = same + optional `audio`. |
| `type` | string | yes | Always `recording_saved` (omit only on legacy). |
| `recording` | object | yes | Metadata — internal file URI is **not** sent. |
| `transcript` | object | no | Present when a transcript row exists. |
| `audio` | object | no | Present on `version: 2` when user enabled audio attachment and file was read successfully. |

## `recording` object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Stable recording id |
| `createdAt` | number | Unix ms |
| `durationSeconds` | number \| null | Length in seconds |
| `recordingMode` | string \| null | `basic`, `realtime-tts`, `audio-only`, `text-notes`, or null |
| `title` | string \| null | User title |
| `projectId` | string \| null | Project id |
| `isFavorite` | boolean | Favorite flag |
| `source` | string | `file`, `text`, or `realtime` |
| `liveTranscriptInterrupted` | boolean | `true` if live STT dropped during recording |

## `transcript` object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Transcript row id |
| `recordingId` | string | Matches `recording.id` |
| `text` | string | **Original STT** (source language) |
| `translatedText` | string \| null | **Translation** when enabled; read this for the target-language text |
| `language` | string | Locale tag stored with transcript |
| `segments` | string \| null | Opaque JSON (speaker diarization / timing) |
| `summary` | string \| null | Summary if generated |
| `contentType` | string \| null | e.g. `plain`, `checklist` for text notes |
| `createdAt` | number | Unix ms |

### Basic mode + “Translate speech”

When the user records in **basic** mode with live translation on, the home screen shows only the translation, but the saved payload includes **both**:

- `transcript.text` — original STT (auto-detected source language)
- `transcript.translatedText` — translation to the language chosen in settings

## `audio` object (`version: 2`)

| Field | Type | Description |
|-------|------|-------------|
| `mimeType` | string | e.g. `audio/mp4`, `audio/wav` |
| `encoding` | string | `base64` |
| `filename` | string | Suggested filename |
| `data` | string | Base64 file bytes (no data-URL prefix) |

## Example: metadata only

```bash
curl -s -X POST https://your-server.example/webhook \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "type": "recording_saved",
    "recording": {
      "id": "rec-1730000000001",
      "createdAt": 1730000000001,
      "durationSeconds": 120,
      "recordingMode": "audio-only",
      "title": null,
      "projectId": null,
      "isFavorite": false,
      "source": "file",
      "liveTranscriptInterrupted": false
    }
  }'
```

## Example: STT only

```json
{
  "version": 1,
  "type": "recording_saved",
  "recording": {
    "id": "rec-stt-1",
    "createdAt": 1730000000000,
    "durationSeconds": 42,
    "recordingMode": "realtime-tts",
    "title": null,
    "projectId": null,
    "isFavorite": false,
    "source": "file",
    "liveTranscriptInterrupted": false
  },
  "transcript": {
    "id": "trans-rec-stt-1",
    "recordingId": "rec-stt-1",
    "text": "Hello everyone, thanks for joining.",
    "translatedText": null,
    "language": "en",
    "segments": null,
    "summary": null,
    "contentType": null,
    "createdAt": 1730000000500
  }
}
```

## Example: STT + translation (basic + translate speech)

**Situation:** User saved a basic voice memo with live translation to Finnish.

```bash
curl -s -X POST https://your-server.example/webhook \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "type": "recording_saved",
    "recording": {
      "id": "rec-basic-fi",
      "createdAt": 1730000000000,
      "durationSeconds": 38,
      "recordingMode": "basic",
      "title": "Team standup",
      "projectId": null,
      "isFavorite": false,
      "source": "file",
      "liveTranscriptInterrupted": false
    },
    "transcript": {
      "id": "trans-rec-basic-fi",
      "recordingId": "rec-basic-fi",
      "text": "Hello everyone, thanks for joining.",
      "translatedText": "Hei kaikki, kiitos kun tulitte.",
      "language": "fi",
      "segments": null,
      "summary": null,
      "contentType": null,
      "createdAt": 1730000000400
    }
  }'
```

**What to read:** use `transcript.text` for the original language and `transcript.translatedText` for Finnish.

## Example: with audio (`version: 2`)

```json
{
  "version": 2,
  "type": "recording_saved",
  "recording": {
    "id": "rec-audio-1",
    "createdAt": 1730000000002,
    "durationSeconds": 30,
    "recordingMode": "basic",
    "title": null,
    "projectId": null,
    "isFavorite": false,
    "source": "file",
    "liveTranscriptInterrupted": false
  },
  "audio": {
    "mimeType": "audio/mp4",
    "encoding": "base64",
    "filename": "rec-audio-1.m4a",
    "data": "AAAA..."
  },
  "transcript": {
    "id": "trans-rec-audio-1",
    "recordingId": "rec-audio-1",
    "text": "Meeting notes from the call.",
    "translatedText": null,
    "language": "en",
    "segments": null,
    "summary": null,
    "contentType": null,
    "createdAt": 1730000000300
  }
}
```

`transcript` is omitted when there is no text row (same as version 1).
