import os
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class BaseAgent:
    """Base class for NagarAI multi-agent workers with multi-provider LLM support."""
    def __init__(self, name: str, role_description: str):
        self.name = name
        self.role_description = role_description
        self.gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        self.gemini_model = settings.GEMINI_MODEL
        self._init_client()

    def _init_client(self):
        self.client_available = False
        if self.gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_key)
                self.client_available = True
                logger.info(f"[{self.name}] Gemini API configured.")
            except Exception as e:
                logger.warning(f"[{self.name}] Failed to configure Gemini API: {e}")

    async def call_llm(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Execute LLM prompt against Gemini if available, or fall back to structured heuristics."""
        if self.client_available and self.gemini_key:
            try:
                import google.generativeai as genai
                model = genai.GenerativeModel(
                    model_name=self.gemini_model,
                    system_instruction=system_instruction
                )
                response = await model.generate_content_async(prompt)
                return response.text
            except Exception as e:
                logger.error(f"[{self.name}] Gemini call error: {e}. Using intelligent fallback.")
        
        return None  # Triggers specialized agent heuristic rule engine
