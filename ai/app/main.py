import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Body, Form
from dotenv import load_dotenv

import logging
load_dotenv()

logging.basicConfig(
    filename='server_debug.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("Server starting up...")

from app.schemas import (
    TranscriptionResponse,
    ClassificationRequest,
    ClassificationResponse,
    ExtractionRequest,
    ClassificationResponse,
    ExtractionRequest,
    ExtractionResponse,
    ChatRequest,
    ChatResponse
)
from app.utils.audio import download_audio, save_upload, delete_temp_file
from app.agents.listener import get_listener_agent
from app.agents.brain import get_brain_agent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models on startup
    print("Loading models...")
    get_listener_agent()
    get_brain_agent()
    print("Models loaded.")
    yield
    # Cleanup if needed

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Brain Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    audio_url: str = Body(None, embed=True),
    file: UploadFile = File(None),
    language: str = Form(None)
):
    temp_path = None
    try:
        if audio_url:
            temp_path = download_audio(audio_url)
        elif file:
            content = await file.read()
            print(f"DEBUG: Received file {file.filename}, size: {len(content)} bytes")
            temp_path = save_upload(content, file.filename)
        else:
            raise HTTPException(status_code=400, detail="Missing audio_url or file upload")

        listener = get_listener_agent()
        # Convert full language name to ISO code if possible
        lang_map = {
            "English": "en",
            "Hindi": "hi",
            "Bengali": "bn",
            "Tamil": "ta",
            "Punjabi": "pa",
            "Marathi": "mr",
            "Gujarati": "gu",
            "Kannada": "kn",
            "Telugu": "te",
            "Malayalam": "ml",
            "Odia": "or",
            "Urdu": "ur",
            "Maithili": "mai",
        }
        language_hint = lang_map.get(language)
        
        text, language_detected, confidence, model_name = listener.transcribe(temp_path, language_hint=language_hint)
        
        return TranscriptionResponse(
            text=text, 
            language=language_detected, 
            confidence=confidence, 
            model_name=model_name
        )
    
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logger.error(f"Transcription error: {error_msg}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            delete_temp_file(temp_path)

@app.post("/classify", response_model=ClassificationResponse)
async def classify(request: ClassificationRequest):
    try:
        brain = get_brain_agent()
        result = brain.classify_complaint(
            text=request.text,
            labels=request.labels,
            multi_label=request.multi_label
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract", response_model=ExtractionResponse)
async def extract(request: ExtractionRequest):
    try:
        brain = get_brain_agent()
        result = brain.extract_complaint_data(
            text=request.text,
            labels=request.labels
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.agents.speaker import get_speaker_agent

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        brain = get_brain_agent()
        speaker = get_speaker_agent()
        
        response_text = brain.chat(request.text, request.history, request.language)
        
        # Generate TTS
        audio_base64 = speaker.text_to_speech(response_text, request.language)
        
        return ChatResponse(
            response=response_text,
            audio_base64=audio_base64,
            model_name=brain.llm.model_name
        )
    except Exception as e:
        import traceback
        logger.error(f"Chat Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
