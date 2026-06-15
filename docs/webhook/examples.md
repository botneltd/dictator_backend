# Webhook examples and integration patterns

Copy-paste examples for local testing against [dictator_backend](../../README.md) (`POST /webhook`).

Replace:

- `http://localhost:3000/webhook` — your URL
- `YOUR_SECRET` — same value as `WEBHOOK_API_KEY` in `.env` and Dictator Settings → API key

## 1. Recording saved — basic + translation

User saved a basic recording with **Translate speech** enabled (English speech → Finnish on screen; both texts in payload).

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST http://localhost:3000/webhook \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "type": "recording_saved",
    "recording": {
      "id": "rec-example-basic-tr",
      "createdAt": 1730000000000,
      "durationSeconds": 45,
      "recordingMode": "basic",
      "title": "Standup",
      "projectId": null,
      "isFavorite": false,
      "source": "file",
      "liveTranscriptInterrupted": false
    },
    "transcript": {
      "id": "trans-rec-example-basic-tr",
      "recordingId": "rec-example-basic-tr",
      "text": "We need to ship the Android build this week.",
      "translatedText": "Meidän pitää julkaista Android-build tällä viikolla.",
      "language": "fi",
      "segments": null,
      "summary": null,
      "contentType": null,
      "createdAt": 1730000000400
    }
  }'
```

Expected: `204` from the reference server.

## 2. Realtime transcript — streaming with translation

```bash
curl -s -X POST http://localhost:3000/webhook \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "type": "realtime_transcript",
    "timestamp": 1730000001000,
    "recordingId": "rec-example-basic-tr",
    "translationMode": "one_way",
    "sessionActive": true,
    "partialText": " week.",
    "finalText": "We need to ship the Android build this",
    "partialTranslated": " viikolla.",
    "finalTranslated": "Meidän pitää julkaista Android-build tällä",
    "partialTextA": "",
    "finalTextA": "",
    "partialTextB": "",
    "finalTextB": ""
  }'
```

## 3. Minimal handler (Node / Express pseudocode)

```js
app.post('/webhook', (req, res) => {
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.WEBHOOK_API_KEY}`) {
    return res.sendStatus(401);
  }

  const body = req.body;
  const type = body.type || 'recording_saved';

  if (type === 'recording_saved') {
    const rec = body.recording;
    const tr = body.transcript;
    console.log('saved', rec.id, tr?.text, tr?.translatedText);
    if (body.audio?.data) {
      // decode base64 → storage
    }
    return res.sendStatus(204);
  }

  if (type === 'realtime_transcript') {
    console.log('live', body.recordingId, body.finalText, body.finalTranslated);
    return res.sendStatus(204);
  }

  return res.sendStatus(400);
});
```

## 4. Field cheat sheet

| You want… | Read… |
|-----------|--------|
| Original spoken text (saved) | `transcript.text` |
| Translation (saved) | `transcript.translatedText` |
| Original while recording | `finalText` + `partialText` |
| Translation while recording | `finalTranslated` + `partialTranslated` |
| Two languages (interpret mode) | `finalTextA`, `finalTextB` |
| Audio file | `audio.data` (base64), only when `version: 2` |

## See also

- [README.md](./README.md) — overview
- [recording-saved.md](./recording-saved.md) — all `recording_saved` fields
- [realtime-transcript.md](./realtime-transcript.md) — streaming behaviour
