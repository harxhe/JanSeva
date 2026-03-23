# Brain Service

A production-ready FastAPI microservice for processing civic complaints.

## Features
- **Transcription**: Uses `faster-whisper` for local audio-to-text conversion.
- **Classification**: Uses Groq LLM to classify complaints into dynamic labels.
- **Extraction**: Uses Groq LLM to extract structured data (category, urgency, location, etc.).

## Setup

1.  **Clone and Navigate**:
    ```bash
    cd brain-service
    ```

2.  **Environment**:
    Create a `.env` file from `.env.example`:
    ```bash
    copy .env.example .env
    ```
    Add your `GROQ_API_KEY`.

3.  **Install Dependencies**:
    ```bash
    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    ```
    *Note: Ensure `ffmpeg` is installed on your system.*

4.  **Run Server**:
    ```bash
    uvicorn app.main:app --reload
    ```

## API Documentation

### 1. Transcription `POST /transcribe`
Accepts `audio_url` (JSON) or multipart file upload.
```bash
# File upload
curl -X POST -F "file=@complaint.mp3" http://localhost:8000/transcribe

# URL upload
curl -X POST -H "Content-Type: application/json" -d "{\"audio_url\": \"https://example.com/audio.mp3\"}" http://localhost:8000/transcribe
```

### 2. Classification `POST /classify`
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "text": "There is a massive pothole on the corner of 5th and Main.",
  "labels": ["roadwork", "sanitation", "lighting"],
  "multi_label": false
}' http://localhost:8000/classify
```

### 3. Extraction `POST /extract`
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "text": "Water leaking from a broken pipe since morning at Central Park.",
  "labels": ["water", "infrastructure"]
}' http://localhost:8000/extract
```

## Agent Roles
- **Listener Agent**: Handles the "hearing" part of the service. It transcribes audio files into text using a local Whisper model.
- **Brain Agent**: Handles the "reasoning" part. Specially prompted to act as a classifier and data extractor, ensuring predictable JSON outputs for downstream services.
