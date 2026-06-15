# `realtime_transcript`

Streaming updates while the user records with **live STT** enabled and **Send transcripts to webhook in real time** turned on in Settings.

Same URL and `Authorization: Bearer` as `recording_saved`. Correlate with `recordingId`; a final `recording_saved` arrives after stop.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | number | `1` |
| `type` | string | `realtime_transcript` |
| `timestamp` | number | Unix ms when this POST was built |
| `recordingId` | string | Same id as future `recording.id` |
| `translationMode` | string | `one_way` or `two_way` |
| `sessionActive` | boolean | `true` while recording; `false` on final message after stop |
| `partialText` | string | Non-final STT buffer (one-way / single column) |
| `finalText` | string | Committed original STT so far |
| `partialTranslated` | string | Non-final translation buffer |
| `finalTranslated` | string | Committed translation so far |
| `partialTextA` | string | Two-way: non-final language A |
| `finalTextA` | string | Two-way: committed language A |
| `partialTextB` | string | Two-way: non-final language B |
| `finalTextB` | string | Two-way: committed language B |

Updates are **debounced** (~450 ms) during streaming. A **final** message is sent on stop with partial fields cleared.

There is no `recording` or `transcript` wrapper on this type.

## One-way STT only

```bash
curl -s -X POST https://your-server.example/webhook \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "type": "realtime_transcript",
    "timestamp": 1730000000123,
    "recordingId": "rec-live-1",
    "translationMode": "one_way",
    "sessionActive": true,
    "partialText": " wor",
    "finalText": "Hello",
    "partialTranslated": "",
    "finalTranslated": "",
    "partialTextA": "",
    "finalTextA": "",
    "partialTextB": "",
    "finalTextB": ""
  }'
```

## One-way with translation (basic “Translate speech”)

**Situation:** User speaks English; app translates live to Finnish. Home screen shows only Finnish; webhook still sends both streams.

```bash
curl -s -X POST https://your-server.example/webhook \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "type": "realtime_transcript",
    "timestamp": 1730000000456,
    "recordingId": "rec-basic-tr",
    "translationMode": "one_way",
    "sessionActive": true,
    "partialText": " world",
    "finalText": "Hello",
    "partialTranslated": " maailma",
    "finalTranslated": "Hei",
    "partialTextA": "",
    "finalTextA": "",
    "partialTextB": "",
    "finalTextB": ""
  }'
```

**What to read:** `finalText` / `partialText` = original STT; `finalTranslated` / `partialTranslated` = target language.

## Final message after stop

Partials empty; `sessionActive: false`; `final*` fields contain full merged text.

```json
{
  "version": 1,
  "type": "realtime_transcript",
  "timestamp": 1730000000999,
  "recordingId": "rec-basic-tr",
  "translationMode": "one_way",
  "sessionActive": false,
  "partialText": "",
  "finalText": "Hello world",
  "partialTranslated": "",
  "finalTranslated": "Hei maailma",
  "partialTextA": "",
  "finalTextA": "",
  "partialTextB": "",
  "finalTextB": ""
}
```

## Two-way (interpret speech mode)

Use `finalTextA` / `finalTextB` (and partials) instead of `finalText` / `finalTranslated` when `translationMode` is `two_way`.

## Server tips

1. Key tickets by `recordingId`; append streaming text on each POST.
2. On `sessionActive: false`, mark the live session complete and wait for `recording_saved` for durable metadata.
3. Do not assume every field is non-empty — branch on `translationMode`.
