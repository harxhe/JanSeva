import os
import json
from typing import List, Dict, Any, Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from app.schemas import ClassificationResponse, ExtractionResponse, TranslationResponse

import logging
logger = logging.getLogger(__name__)

class BrainAgent:
    def __init__(self, model_name: str = "llama-3.3-70b-versatile", temperature: float = 0):
        self.llm = ChatGroq(
            model=model_name,
            temperature=temperature,
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.parser = JsonOutputParser()

    def classify_complaint(self, text: str, labels: List[str], multi_label: bool = False) -> ClassificationResponse:
        prompt = ChatPromptTemplate.from_template(
            """You are a civic complaint classifier. 
            Classify the following text into these labels: {labels}.
            
            Multi-label allowed: {multi_label}
            
            Text: {text}
            
            IMPORTANT: The input text might be in English, Hindi, Bengali, or Tamil. 
            Understand the meaning and classify it into the English labels provided above.
            
            Output ONLY valid JSON correctly matching the following schema:
            {{
                "top_label": "string",
                "scores": {{ "label": float }}
            }}
            Scores must be floats between 0 and 1. If a label is not applicable, set its score to 0.
            No explanation or extra text."""
        )
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = chain.invoke({
                "text": text,
                "labels": ", ".join(labels),
                "multi_label": multi_label
            })
            
            # Ensure all labels are present in scores
            scores = result.get("scores", {})
            for label in labels:
                if label not in scores:
                    scores[label] = 0.0
            
            return ClassificationResponse(
                top_label=result.get("top_label", labels[0] if labels else "unknown"),
                scores=scores,
                model_name=self.llm.model_name
            )
        except Exception as e:
            import traceback
            logger.error(f"Classification error: {traceback.format_exc()}")
            # Safe Fallback
            return ClassificationResponse(
                top_label=labels[0] if labels else "unknown",
                scores={label: 0.0 for label in labels},
                model_name=self.llm.model_name
            )

    def extract_complaint_data(self, text: str, labels: List[str]) -> ExtractionResponse:
        prompt = ChatPromptTemplate.from_template(
            """You are a civic data extractor. 
            Analyze the following complaint text and categorize it using one of these labels: {labels}.
            Determine urgency using this rubric:
            - high: immediate public safety risk, active hazard, blocked essential service, exposed electrical issue, flooding, fire, collapse, sewage overflow, injury risk, or user explicitly says urgent/immediate.
            - medium: service disruption or sanitation issue that needs prompt attention but is not an immediate life-safety emergency.
            - low: minor inconvenience, cosmetic issue, intermittent issue, or routine maintenance with no current danger.
            Do not default to medium unless the complaint clearly fits the medium definition.
            
            Text: {text}
            
            Output ONLY valid JSON matching this schema:
            {{
                "category": "string",
                "confidence": float,
                "urgency": "low" | "medium" | "high",
                "location_hint": "string or null",
                "summary": "string (max 300 chars)",
                "language": "string or null"
            }}
            No explanation or extra text."""
        )
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = chain.invoke({
                "text": text,
                "labels": ", ".join(labels)
            })
            
            # Validation and Fallbacks
            return ExtractionResponse(
                category=result.get("category", labels[0] if labels else "unknown"),
                confidence=float(result.get("confidence", 0.5)),
                urgency=result.get("urgency", "medium"),
                location_hint=result.get("location_hint"),
                summary=result.get("summary", text[:300]),
                language=result.get("language"),
                model_name=self.llm.model_name
            )
        except Exception:
            import traceback
            logger.error(f"Extraction error: {traceback.format_exc()}")
            return ExtractionResponse(
                category=labels[0] if labels else "unknown",
                confidence=0.0,
                urgency="medium",
                location_hint=None,
                summary=text[:300],
                language=None,
                model_name=self.llm.model_name
            )

    def translate_text(self, text: str, target_language: str = "English") -> TranslationResponse:
        prompt = ChatPromptTemplate.from_template(
            """You are a civic complaint translation assistant.
            Translate the following complaint into {target_language} while preserving civic details faithfully.

            Text: {text}

            Output ONLY valid JSON matching this schema:
            {{
                "translated_text": "string",
                "source_language": "string or null",
                "target_language": "string"
            }}
            No explanation or extra text."""
        )

        chain = prompt | self.llm | self.parser

        try:
            result = chain.invoke({
                "text": text,
                "target_language": target_language,
            })

            return TranslationResponse(
                translated_text=result.get("translated_text", text),
                source_language=result.get("source_language"),
                target_language=result.get("target_language", target_language),
                model_name=self.llm.model_name,
            )
        except Exception:
            import traceback
            logger.error(f"Translation error: {traceback.format_exc()}")
            return TranslationResponse(
                translated_text=text,
                source_language=None,
                target_language=target_language,
                model_name=self.llm.model_name,
            )

    def chat(self, text: str, history: List[Dict[str, str]], language: str = "English") -> str:
        # Construct message history
        # We explicitly tell the LLM to include the intro and outro in the target language.
        system_prompt = (
            f"You are the OFFICIAL CIVIC COMPLAINT PORTAL. Respond ONLY in {language}.\n"
            f"STRICT PERSONA RULES:\n"
            f"1. [AUTHORITY]: You only collect civic complaints (potholes, street lights, waste, water, etc.).\n"
            f"2. [DEFLECTION]: If a user asks something UNRELATED to civic issues (personal, trivia, etc.), politely ignore it and state you only handle civic complaints.\n"
            f"3. [GATHERING INFO]: You MUST gather the following before filing:\n"
            f"   - NATURE OF COMPLAINT (What is the issue?)\n"
            f"   - LOCATION (Where is it? Address/Landmark)\n"
            f"   - If any is missing, ASK for it. DO NOT assume or hallucinate details.\n"
            f"4. [STRUCTURE]:\n"
            f"   - START: Respond in {language}.\n"
            f"   - BODY: Ask for missing details or confirm existing ones.\n"
            f"   - ALWAYS END by asking: 'Is there anything else I can help you with?' in {language}.\n"
            f"5. [TERMINATION]: ONLY when you have the Nature AND Location, AND the user says 'No', 'That is all', 'Nothing else', then respond with: 'Thank you, your complaint has been filed and is being processed for verification.' in {language} and add the token [FINISH] at the very end.\n"
            f"Example (Incomplete): 'I understand the issue is about a pothole. Where is this located?'\n"
            f"Example (Complete): 'Thank you, your complaint regarding the pothole at MG Road has been filed. [FINISH]'"
        )
        
        messages = [
            ("system", system_prompt)
        ]
        
        for msg in history:
            role = msg.get("role")
            content = msg.get("content")
            if role in ["user", "assistant"] and content:
                messages.append((role, content))
        
        messages.append(("user", text))
        
        try:
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            import traceback
            logger.error(f"Chat Error: {traceback.format_exc()}")
            return f"I'm having trouble connecting to my brain right now. Processing in {language} is encountering an issue."

# Singleton instance
brain_agent: Optional[BrainAgent] = None

def get_brain_agent() -> BrainAgent:
    global brain_agent
    if brain_agent is None:
        model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        brain_agent = BrainAgent(model_name=model_name)
    return brain_agent
