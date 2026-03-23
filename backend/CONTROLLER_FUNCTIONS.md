# JanSeva Backend Controller Guide

This file explains each implemented controller function and gives a sample input.

## complaintController

### createComplaint
- Creates (or upserts) a citizen, creates a complaint, inserts `complaint_events`, optionally inserts `complaint_media`.
- Endpoint: `POST /api/complaints`
- Sample input:

```json
{
  "phone_number": "+919876543210",
  "name": "Ravi",
  "preferred_language": "hi",
  "channel": "whatsapp",
  "raw_text": "Water leakage near Ward 4",
  "priority": "high",
  "location_text": "Ward 4 market",
  "media": [
    {
      "media_type": "image",
      "storage_path": "abc123/whatsapp/twilio-media-0",
      "mime_type": "image/jpeg"
    }
  ]
}
```

### listComplaints
- Lists complaints with filters: `status`, `priority`, `channel`, `ward_id`, `department_id`, `start_date`, `end_date`, `search`, `page`, `limit`.
- Endpoint: `GET /api/complaints`
- Sample input (query):

```text
/api/complaints?status=assigned&priority=high&page=1&limit=20
```

### getComplaintById
- Returns complaint + `media` + `events` + `ai_outputs` + active assignment.
- Endpoint: `GET /api/complaints/:complaint_id`
- Sample input:

```text
/api/complaints/8b7131a9-07c3-4efa-a579-a986b3f9f3cd
```

### updateComplaintStatus
- Validates and updates status transition, writes `complaint_events`, sets `resolved_at` when status becomes `resolved`.
- Endpoint: `PATCH /api/complaints/:complaint_id/status`
- Sample input:

```json
{
  "status": "in_progress",
  "note": "Field team started work",
  "actor_id": "55f9a2be-719c-4adf-8b12-4cf57774fb1c",
  "actor_type": "admin"
}
```

## assignmentController

### assignComplaint
- Creates a new assignment, deactivates old active assignments, and logs assignment event.
- Endpoint: `POST /api/assignments`
- Sample input:

```json
{
  "complaint_id": "8b7131a9-07c3-4efa-a579-a986b3f9f3cd",
  "assigned_to_id": "f2ec670d-ff3a-4ca7-b81f-8de2cb17039c",
  "assigned_to_type": "field_staff",
  "assigned_by_id": "55f9a2be-719c-4adf-8b12-4cf57774fb1c",
  "due_at": "2026-02-12T10:00:00.000Z"
}
```

### reassignComplaint
- Closes current assignment and creates a new assignment for another assignee.
- Endpoint: `PATCH /api/assignments/:assignment_id/reassign`
- Sample input:

```json
{
  "assigned_to_id": "f9378995-cb78-4d28-b278-bdeaf3ffce75",
  "assigned_to_type": "ward_officer",
  "assigned_by_id": "55f9a2be-719c-4adf-8b12-4cf57774fb1c"
}
```

### closeAssignment
- Sets `is_active = false` on an assignment and logs closure event.
- Endpoint: `PATCH /api/assignments/:assignment_id/close`
- Sample input:

```json
{
  "actor_id": "55f9a2be-719c-4adf-8b12-4cf57774fb1c"
}
```

## mediaController

### attachMediaMetadata
- Inserts media metadata (`path/type/size/duration/checksum`) linked to complaint.
- Endpoint: `POST /api/media/complaints/:complaint_id`
- Sample input:

```json
{
  "media_type": "audio",
  "storage_bucket": "complaint-evidence",
  "storage_path": "8b7131a9-07c3-4efa-a579-a986b3f9f3cd/voice/call-recording",
  "mime_type": "audio/mpeg",
  "size_bytes": 783443,
  "duration_sec": 28,
  "checksum_sha256": "abc123hash"
}
```

### listComplaintMedia
- Returns all media entries for a complaint.
- Endpoint: `GET /api/media/complaints/:complaint_id`

## intakeController

### intakeSms
- Twilio SMS webhook normalization -> complaint creation.
- Endpoint: `POST /api/twilio/sms`
- Sample input (`application/x-www-form-urlencoded`):

```text
From=+919999999999&Body=Road is broken near bus stop&MessageSid=SM123&NumMedia=0
```

### intakeWhatsapp
- Twilio WhatsApp webhook normalization with optional media extraction.
- Endpoint: `POST /api/twilio/whatsapp`
- Sample input (`application/x-www-form-urlencoded`):

```text
From=whatsapp:+919999999999&Body=Garbage pile near park&MessageSid=SM456&NumMedia=1&MediaUrl0=https://example.com/a.jpg&MediaContentType0=image/jpeg
```

### intakeVoice
- Twilio Voice webhook normalization with recording metadata.
- Endpoint: `POST /api/twilio/voice`
- Sample input (`application/x-www-form-urlencoded`):

```text
From=+919999999999&CallSid=CA123&RecordingUrl=https://example.com/recording.mp3&RecordingDuration=35
```

## notificationController

### queueNotification
- Queues a new notification row with `delivery_status = queued`.
- Endpoint: `POST /api/notifications`
- Sample input:

```json
{
  "complaint_id": "8b7131a9-07c3-4efa-a579-a986b3f9f3cd",
  "channel": "sms",
  "template_key": "complaint_received"
}
```

### listNotificationsByComplaint
- Lists notifications linked to a complaint.
- Endpoint: `GET /api/notifications/complaints/:complaint_id`

### markNotificationStatus
- Updates delivery status and provider metadata.
- Endpoint: `PATCH /api/notifications/:notification_id/status`
- Sample input:

```json
{
  "delivery_status": "delivered",
  "provider_message_id": "SM_PROVIDER_999"
}
```

## aiController

### saveTranscription
- Stores transcript output from ASR.
- Endpoint: `POST /api/ai/transcription`
- Sample input:

```json
{
  "complaint_id": "8b7131a9-07c3-4efa-a579-a986b3f9f3cd",
  "transcript_text": "Street light not working near lane 3",
  "transcript_confidence": 0.91,
  "model_name": "whisper-1"
}
```

### saveClassification
- Stores classification output and updates complaint category/status.
- Endpoint: `POST /api/ai/classification`
- Sample input:

```json
{
  "complaint_id": "8b7131a9-07c3-4efa-a579-a986b3f9f3cd",
  "classification_label": "electrical",
  "classification_confidence": 0.88,
  "model_name": "hf-classifier-v1"
}
```

### overrideClassification
- Marks last AI result as overridden and inserts manual override output.
- Endpoint: `PATCH /api/ai/classification/override`
- Sample input:

```json
{
  "complaint_id": "8b7131a9-07c3-4efa-a579-a986b3f9f3cd",
  "classification_label": "water",
  "actor_id": "55f9a2be-719c-4adf-8b12-4cf57774fb1c",
  "note": "Manual triage corrected category"
}
```

## citizenController

### getCitizenByPhone
- Fetches citizen profile by phone number.
- Endpoint: `GET /api/citizens/:phone_number`
- Sample input:

```text
/api/citizens/+919876543210
```

### getCitizenHistory
- Fetches citizen profile and recent complaint history.
- Endpoint: `GET /api/citizens/:phone_number/history?limit=20`
