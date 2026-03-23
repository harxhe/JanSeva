import os
import base64
from io import BytesIO
from gtts import gTTS
import logging

logger = logging.getLogger(__name__)

class SpeakerAgent:
    def __init__(self):
        pass

    def text_to_speech(self, text: str, language: str = "en") -> str:
        """
        Converts text to speech and returns base64 encoded audio.
        """
        try:
            # Map full language names to gTTS codes
            lang_map = {
                "English": "en",
                "Hindi": "hi",
                "Bengali": "bn",
                "Tamil": "ta",
                "Telugu": "te",
                "Marathi": "mr",
                "Gujarati": "gu",
                "Kannada": "kn",
                "Malayalam": "ml",
                "Urdu": "ur"
            }
            lang_code = lang_map.get(language, "en")
            
            # Generate speech
            tts = gTTS(text=text, lang=lang_code, slow=False)
            
            # Save to memory
            mp3_fp = BytesIO()
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)
            
            # Encode to base64
            audio_base64 = base64.b64encode(mp3_fp.read()).decode("utf-8")
            return audio_base64
            
        except Exception as e:
            logger.error(f"TTS Error: {e}")
            return None

# Singleton
speaker_agent = SpeakerAgent()

def get_speaker_agent() -> SpeakerAgent:
    return speaker_agent
