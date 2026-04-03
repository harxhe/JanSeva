import os
from groq import Groq
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class ListenerAgent:
    def __init__(self, api_key: str, model_name: str = "whisper-large-v3-turbo"):
        """
        Initializes the Groq client for transcription.
        Cloud-based whisper is much faster and requires no local resources.
        """
        self.client = Groq(api_key=api_key)
        self.model_name = model_name

    def transcribe(self, audio_path: str, language_hint: Optional[str] = None) -> Tuple[str, str, float, str]:
        """
        Transcribes audio file using Groq's cloud API and returns (text, language, confidence, model_name).
        """
        with open(audio_path, "rb") as audio_file:
            audio_bytes = audio_file.read()

        def request_transcription(active_hint: Optional[str] = None):
            params = {
                "file": (os.path.basename(audio_path), audio_bytes),
                "model": self.model_name,
                "response_format": "verbose_json",
            }

            if active_hint:
                params["language"] = active_hint

            return self.client.audio.transcriptions.create(**params)

        try:
            transcription = request_transcription(language_hint)
        except Exception as exc:
            if language_hint:
                logger.warning("Transcription with language hint '%s' failed, retrying without hint: %s", language_hint, exc)
                transcription = request_transcription(None)
            else:
                raise
            
        text = getattr(transcription, 'text', "")
        language = getattr(transcription, 'language', "auto")
        
        segments = getattr(transcription, 'segments', [])
        
        print(f"DEBUG: Transcription success. Text length: {len(text)}")
        
        try:
            if segments:
                import math
                total_confidence = 0.0
                count = 0
                for s in segments:
                    # 's' could be a dict or an object
                    if isinstance(s, dict):
                        avg_logprob = s.get('avg_logprob', -1.0)
                    else:
                        avg_logprob = getattr(s, 'avg_logprob', -1.0)
                        
                    total_confidence += math.exp(avg_logprob)
                    count += 1
                
                confidence = total_confidence / count if count > 0 else 0.0
            else:
                confidence = 0.0
        except Exception as e:
            print(f"DEBUG: Error calculating confidence: {e}")
            confidence = 0.0

        return text, language, confidence, self.model_name

# Singleton instance initialized at app level
listener_agent: Optional[ListenerAgent] = None

def get_listener_agent() -> ListenerAgent:
    global listener_agent
    if listener_agent is None:
        api_key = os.getenv("GROQ_API_KEY")
        model_name = os.getenv("WHISPER_MODEL", "whisper-large-v3-turbo")
        listener_agent = ListenerAgent(api_key=api_key, model_name=model_name)
    return listener_agent
