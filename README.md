# JANSEVA

JANSEVA is an AI-assisted civic complaint platform with a citizen app, an admin dashboard, a backend API, and an AI service for transcription, translation, classification, and complaint review.

## What It Does

- Lets citizens file complaints by text or voice
- Shows AI-generated transcript, English translation, category, and priority before filing
- Sends complaints to the backend and surfaces them on the admin dashboard
- Tracks complaint history and current status in the citizen app

## Repository Structure

- `mobile/` - Expo citizen app for text and voice complaint filing
- `frontend/` - React + Vite admin dashboard
- `backend/` - Express API for complaints, interactions, media, and citizens
- `ai/` - FastAPI AI service for transcription, extraction, translation, and chat utilities
- `scripts/` - local development helpers

## Main Flows

### Text Complaint

1. Citizen types a complaint in the mobile app
2. App calls `POST /api/interactions/preview`
3. AI returns category, priority, and English translation
4. Citizen confirms and the complaint is filed through `POST /api/interactions/chat`
5. Complaint appears in the dashboard and citizen history

### Voice Complaint

1. Citizen selects a language and records a voice complaint
2. App calls `POST /api/interactions/voice/transcribe`
3. AI returns transcript, translation, category, and priority preview
4. Citizen confirms and the complaint is filed through `POST /api/interactions/voice/submit`
5. Complaint appears in the dashboard and citizen history

## Tech Stack

- Mobile app: Expo, React Native, React Native Web
- Dashboard: React, Vite, Tailwind CSS, Axios
- Backend: Node.js, Express, Supabase, Multer, Socket.IO
- AI service: FastAPI, Groq, Whisper-style transcription flow

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Python 3.11+
- A configured Supabase project
- AI service credentials in `ai/.env`

### Install

From the repo root:

```bash
npm install
```

Install AI dependencies separately:

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run The Full Stack

From the repo root:

```bash
npm run dev:all
```

This starts:

- backend on `http://localhost:5000`
- dashboard on `http://localhost:5173` if free, otherwise the next Vite port
- AI service on `http://127.0.0.1:8000`

The `dev:all` script automatically clears stale backend processes on port `5000` before startup.

### Run Services Individually

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:ai
```

## Important Endpoints

### Backend

- `GET /api/health`
- `GET /api/complaints`
- `POST /api/interactions/preview`
- `POST /api/interactions/chat`
- `POST /api/interactions/voice/transcribe`
- `POST /api/interactions/voice/submit`

### AI Service

- `POST /transcribe`
- `POST /classify`
- `POST /extract`
- `POST /translate`

## Environment Notes

You need working environment variables in the backend and AI service for the project to function correctly.

Typical requirements include:

- backend Supabase URL and service key
- AI provider key for transcription / LLM operations

If the mobile app shows fallback review messages, first confirm:

- backend is running on port `5000`
- AI service is running on port `8000`

## Current Product Notes

- Mobile app opens with onboarding screens and then goes to the homepage
- Voice complaint flow supports web and native upload paths
- JANSEVA branding is applied across the citizen app and admin dashboard
- Non-functional placeholder UI has been removed from the citizen app

## Build Checks

Dashboard build:

```bash
npm run build --workspace frontend
```

Mobile web export:

```bash
cd mobile
npx expo export --platform web
```

