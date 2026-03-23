# Voice + Chat Mode Setup

This document explains the updated JanSeva backend flow for app/web clients.

## Modes

### 1) Chat Mode
- Supports: text message, voice note metadata, multiple image/audio metadata.
- Endpoint: `POST /api/interactions/chat`
- Uses same complaint pipeline and stores in DB (`citizens`, `complaints`, `complaint_media`, `complaint_events`).

Sample request:

```json
{
  "phone_number": "+919876543210",
  "name": "Ravi Kumar",
  "channel": "whatsapp",
  "message_text": "Garbage pile near bus stop",
  "priority": "high",
  "location_text": "Sector 9 Bus Stop",
  "media": [
    {
      "media_type": "image",
      "storage_path": "chat-session-11/images/image-0.jpg",
      "mime_type": "image/jpeg",
      "size_bytes": 223000
    },
    {
      "media_type": "audio",
      "storage_path": "chat-session-11/audio/voice-note-0.mp3",
      "mime_type": "audio/mpeg",
      "duration_sec": 14
    }
  ]
}
```

### 2) Voice Mode
- Session based call flow for app/web voice interaction.
- Endpoint: `POST /api/interactions/voice`
- Creates complaint with `channel = voice` and emits realtime updates.

Sample request:

```json
{
  "session_id": "session-voice-1001",
  "phone_number": "+919876543210",
  "initial_text": "Voice interaction started",
  "priority": "medium",
  "location_text": "Ward 6 main road"
}
```

## WebSocket Namespaces

### `/voice`
- Used by app/AI pipeline for streaming voice events.

Events:
- `voice:join` -> join a room by `session_id`
- `voice:chunk` -> streaming audio chunk event
- `voice:transcript` -> transcript text event from AI STT

Sample emit (`voice:transcript`):

```json
{
  "session_id": "session-voice-1001",
  "complaint_id": "8b7131a9-07c3-4efa-a579-a986b3f9f3cd",
  "transcript_text": "There is a big pothole near gate 2",
  "transcript_confidence": 0.92,
  "model_name": "whisper-stream"
}
```

When `voice:transcript` is received, backend stores transcript in `ai_outputs` and adds audit event to `complaint_events`.

### `/ops`
- Used by admin web dashboard to get live updates.

Broadcasted events:
- `complaint:created`
- `complaint:status_updated`
- `complaint:deleted`
- `call:incoming`
- `voice:chunk_received`
- `voice:transcript_received`

## Twilio Intake Routes

- `POST /api/twilio/sms`
- `POST /api/twilio/whatsapp`
- `POST /api/twilio/voice`

All routes normalize inbound payloads to the same complaint creation flow.
