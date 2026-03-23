from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal

class TranscriptionResponse(BaseModel):
    text: str
    language: Optional[str] = None
    confidence: Optional[float] = 0.0
    model_name: str

class ClassificationRequest(BaseModel):
    text: str
    labels: List[str]
    multi_label: bool = False

class ClassificationResponse(BaseModel):
    top_label: str
    scores: Dict[str, float]
    model_name: str

class ExtractionRequest(BaseModel):
    text: str
    labels: List[str]

class ExtractionResponse(BaseModel):
    category: str
    confidence: float
    urgency: Literal["low", "medium", "high"]
    location_hint: Optional[str] = None
    summary: str = Field(..., max_length=300)
    language: Optional[str] = None
    model_name: str

class ChatRequest(BaseModel):
    text: str
    history: List[Dict[str, str]] = []
    language: str = "English"

class ChatResponse(BaseModel):
    response: str
    audio_base64: Optional[str] = None
    model_name: str
