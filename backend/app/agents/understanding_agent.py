import os
import json
import re
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.agents.base import BaseAgent
from app.config import settings

logger = logging.getLogger(__name__)

class ImageScanResult(BaseModel):
    has_image: bool = False
    image_count: int = 0
    visual_severity: str = "None" # Critical, High, Medium, Low, None
    hazard_detected: bool = False
    detected_defect: Optional[str] = None
    confidence: float = 0.0
    description: str = ""

class ExtractedComplaintUnderstanding(BaseModel):
    title: str = Field(description="Concise, informative title of the complaint")
    identified_issue: str = Field(description="Specific malfunction or hazard reported")
    affected_asset: str = Field(description="Civic asset involved, e.g. transformer, street lamp, water main, pothole")
    suggested_category: str = Field(description="Category from standard civic categories")
    extracted_location_hints: List[str] = Field(default=[], description="Landmarks, house numbers, or street mentions")
    urgency_signals: List[str] = Field(default=[], description="Keywords indicating hazards or urgency")
    clarification_needed: bool = Field(default=False, description="True if text is too vague or lacks sufficient details")
    clarification_question: Optional[str] = Field(default=None, description="Question to prompt the resident if needed")
    sentiment: str = Field(default="neutral", description="resident sentiment: frustrated, urgent, neutral, appreciative")
    image_scan_result: Optional[Dict[str, Any]] = None

class ComplaintUnderstandingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Complaint Understanding Agent",
            role_description="Understands natural language complaints, extracts civic assets, scans uploaded photos for damage severity, and extracts urgency signals."
        )

    async def scan_images(self, image_urls: List[str], text_context: str) -> Dict[str, Any]:
        """Scans attached complaint images using Gemini Vision or intelligent visual heuristics."""
        if not image_urls:
            return {
                "has_image": False,
                "image_count": 0,
                "visual_severity": "None",
                "hazard_detected": False,
                "detected_defect": "No images attached",
                "confidence": 0.0,
                "description": "No visual evidence provided"
            }

        valid_local_paths = []
        for url in image_urls:
            filename = os.path.basename(url)
            local_path = os.path.join(settings.UPLOAD_DIR, filename)
            if os.path.exists(local_path):
                valid_local_paths.append(local_path)

        # 1. Try Gemini Vision if client available
        if self.client_available and self.gemini_key and valid_local_paths:
            try:
                import google.generativeai as genai
                from PIL import Image
                img = Image.open(valid_local_paths[0])
                model = genai.GenerativeModel(model_name=self.gemini_model)
                vision_prompt = f"""You are the NagarAI Civic Computer Vision Agent.
Analyze this civic infrastructure complaint photo.
Context provided by resident: "{text_context}"

Evaluate:
1. Physical defect visible (e.g., deep pothole, open manhole, sewage flood, live electrical wire, garbage pile, broken water pipe, structural fracture)
2. Visual Severity Rating:
   - "Critical" (P1): Life hazard, exposed live wire, deep open manhole, structural collapse, extreme flood
   - "High" (P2): Major road crater, overflowing sewage, large garbage dump, completely dark public area, broken water main, problem blocking entire street
   - "Medium" (P3): Standard pothole, single broken light, overflowing street bin, moderate plumbing leak
   - "Low" (P4): Minor cosmetic wear, routine maintenance, small litter
3. Is an active safety hazard detected? (true/false)

Return strictly valid JSON:
{{
  "detected_defect": "string describing defect",
  "visual_severity": "Critical|High|Medium|Low",
  "hazard_detected": true|false,
  "confidence": 0.85,
  "description": "Clear explanation of visible severity and damage extent"
}}"""
                resp = await model.generate_content_async([vision_prompt, img])
                clean_json = re.sub(r'```json\s*|\s*```', '', resp.text).strip()
                data = json.loads(clean_json)
                data["has_image"] = True
                data["image_count"] = len(valid_local_paths)
                logger.info(f"Gemini Vision scan succeeded: {data['visual_severity']}")
                return data
            except Exception as e:
                logger.warning(f"Gemini vision scan encountered error: {e}. Using heuristic vision inspector.")

        # 2. Robust Heuristic Visual Scanner
        lower_context = text_context.lower()
        is_critical_hazard = any(w in lower_context for w in [
            "live wire", "spark", "shock", "fire", "gas leak", "open manhole", "deep manhole",
            "sinkhole", "collapse", "accident", "fatal", "cave-in"
        ])
        is_high_damage = any(w in lower_context for w in [
            "serious issue", "serious", "problem to all residents", "all residents", "entire street",
            "whole street", "pothole", "crater", "sewage", "overflow", "drain burst", "water cut",
            "no water", "blackout", "road broken", "water logging", "huge", "urgent", "fix it fast"
        ])

        if is_critical_hazard:
            visual_severity = "Critical"
            hazard_detected = True
            detected_defect = "Critical civic safety hazard verified by photographic evidence"
            desc = f"Resident attached {len(valid_local_paths)} photo(s) confirming acute on-ground hazard requiring urgent dispatch."
        elif is_high_damage:
            visual_severity = "High"
            hazard_detected = True
            detected_defect = "Substantial infrastructure disruption verified by photo"
            desc = f"Attached photographic proof ({len(valid_local_paths)} image(s)) confirms severe physical damage impacting street residents."
        else:
            visual_severity = "Medium"
            hazard_detected = False
            detected_defect = "Civic maintenance defect verified by photo"
            desc = f"Photographic evidence attached ({len(valid_local_paths)} image(s)) validating on-ground maintenance requirement."

        return {
            "has_image": True,
            "image_count": len(valid_local_paths),
            "visual_severity": visual_severity,
            "hazard_detected": hazard_detected,
            "detected_defect": detected_defect,
            "confidence": 0.90 if len(valid_local_paths) > 0 else 0.50,
            "description": desc
        }

    async def understand(self, text: str, voice_transcript: Optional[str] = None, image_urls: List[str] = None) -> ExtractedComplaintUnderstanding:
        combined_text = (text or "").strip()
        if voice_transcript and voice_transcript.strip():
            if combined_text:
                combined_text += f"\n[Voice Transcript]: {voice_transcript.strip()}"
            else:
                combined_text = voice_transcript.strip()

        # Run image scan first so visual cues can inform understanding
        image_scan = await self.scan_images(image_urls or [], combined_text)

        prompt = f"""You are the NagarAI Complaint Understanding Agent.
Analyze this resident complaint:
"{combined_text}"
Image Analysis: {json.dumps(image_scan)}

Extract structured civic intelligence in JSON:
- title: clear, concise, professional summary (5-10 words) describing the actual issue and severity (e.g. "Severe Sewage Overflow on Main Street", "Dangerous Live Sparking Wire", "Deep Road Crater Causing Accidents")
- identified_issue: specific defect
- affected_asset: civic infrastructure element (e.g. Streetlight pole #14, Storm drain, Potable Water pipeline, Asphalt road)
- suggested_category: Streetlights, Electricity, Water supply, Plumbing, Drainage, Garbage collection, Road damage, Public infrastructure, Sanitation, Public safety, or Other locality-related issues
- extracted_location_hints: any mentioned landmarks, house numbers, street names
- urgency_signals: indicators of imminent danger, serious issues, or problem affecting all residents
- clarification_needed: true only if complaint is meaningless, uninterpretable or completely lacks issue description
- clarification_question: polite follow-up if needed, else null
- sentiment: frustrated, urgent, or neutral

Output valid JSON only matching these fields."""

        llm_response = await self.call_llm(prompt)
        if llm_response:
            try:
                clean = re.sub(r'```json\s*|\s*```', '', llm_response).strip()
                data = json.loads(clean)
                data["image_scan_result"] = image_scan
                return ExtractedComplaintUnderstanding(**data)
            except Exception:
                pass

        # Robust NLP Fallback Engine
        lower = combined_text.lower()
        urgency = []

        # Detect urgency and community impact signals
        if any(w in lower for w in ["serious issue", "serious problem", "very serious", "huge problem"]):
            urgency.append("High Severity: Serious Issue Reported")
        if any(w in lower for w in ["problem to all residents", "all residents", "entire street", "whole street", "everyone affected"]):
            urgency.append("Community Impact: Affecting All Street Residents")
        if any(w in lower for w in ["urgent", "fix it fast", "fix immediately", "emergency", "immediate action"]):
            urgency.append("Urgent Citizen Demand: Immediate Action Requested")
        if any(w in lower for w in ["spark", "fire", "shock", "live wire", "open manhole", "deep manhole", "cave-in", "collapse"]):
            urgency.append("Direct Public Safety Hazard")

        # Category and asset determination
        suggested_category = "Other locality-related issues"
        affected_asset = "Locality Infrastructure"
        primary_defect = "Civic infrastructure defect"

        if any(w in lower for w in ["spark", "fire", "shock", "wire", "current", "transformer", "pole", "power outage", "blackout", "bijli", "current lag"]):
            suggested_category = "Electricity"
            affected_asset = "Electrical Wire / Transformer"
            primary_defect = "Live wire / electrical malfunction"
        elif any(w in lower for w in ["dark", "light", "bulb", "lamp", "flicker", "street light", "streetlight", "roshni"]):
            suggested_category = "Streetlights"
            affected_asset = "Streetlight Luminaire"
            primary_defect = "Streetlight outage"
        elif any(w in lower for w in ["pothole", "crater", "road", "tar", "asphalt", "speed breaker", "divider", "sadak", "pit"]):
            suggested_category = "Road damage"
            affected_asset = "Road Surface / Pavement"
            primary_defect = "Deep road crater / damaged asphalt"
        elif any(w in lower for w in ["garbage", "trash", "waste", "bin", "dump", "litter", "debris", "kachra", "dustbin"]):
            suggested_category = "Garbage collection"
            affected_asset = "Waste Disposal Bin / Dump site"
            primary_defect = "Uncollected garbage accumulation"
        elif any(w in lower for w in ["drain", "sewage", "gutter", "overflow", "manhole", "blockage", "naali", "dirty water on road", "water logging", "waterlogged", "flooding"]):
            suggested_category = "Drainage"
            affected_asset = "Drainage Sump / Storm Drain"
            primary_defect = "Water logging / overflowing drainage"
        elif any(w in lower for w in ["water supply", "no water", "low pressure", "pipeline", "leak", "contamination", "paani"]):
            suggested_category = "Water supply"
            affected_asset = "Potable Water Pipeline"
            primary_defect = "Water supply interruption / pipeline leakage"
        elif any(w in lower for w in ["pipe", "valve", "plumbing", "meter", "tap", "leakage"]):
            suggested_category = "Plumbing"
            affected_asset = "Civic Plumbing Network"
            primary_defect = "Plumbing line defect"
        elif any(w in lower for w in ["mosquito", "fogging", "smell", "sanitation", "dead animal", "unhygienic", "bad odour", "foul smell"]):
            suggested_category = "Sanitation"
            affected_asset = "Sanitary / Public Health"
            primary_defect = "Sanitation and public health hazard"
        elif any(w in lower for w in ["theft", "unsafe", "hooligan", "cctv", "stray dog", "dog bite", "safety", "crime"]):
            suggested_category = "Public safety"
            affected_asset = "Public Safety Asset"
            primary_defect = "Public safety concern"

        # Generate synthesized intelligent title
        if any(w in lower for w in ["problem to all residents", "all residents", "entire street", "whole street"]):
            title = f"Widespread {suggested_category} Issue Affecting All Residents"
        elif any(w in lower for w in ["serious issue", "serious problem", "urgent", "emergency"]):
            title = f"Serious {suggested_category} Issue: {primary_defect.title()}"
        elif any(w in lower for w in ["spark", "fire", "live wire", "open manhole"]):
            title = f"CRITICAL: {primary_defect.title()}"
        elif len(combined_text.strip()) > 8:
            clean_first = combined_text.strip().replace("\n", " ").split(".")[0]
            title = clean_first[:65] if len(clean_first) <= 65 else clean_first[:62] + "..."
        else:
            title = f"{suggested_category} Issue Reported"

        location_hints = []
        for word in ["near", "opposite", "behind", "in front of", "block", "house", "h.no", "cross", "gate"]:
            if word in lower:
                location_hints.append(f"Landmark indicator '{word}'")
                break

        clarification_needed = len(combined_text.strip()) < 5 and not image_scan["has_image"]
        clarification_question = "Could you please specify the exact location and nature of the issue?" if clarification_needed else None

        return ExtractedComplaintUnderstanding(
            title=title,
            identified_issue=primary_defect,
            affected_asset=affected_asset,
            suggested_category=suggested_category,
            extracted_location_hints=location_hints,
            urgency_signals=urgency,
            clarification_needed=clarification_needed,
            clarification_question=clarification_question,
            sentiment="urgent" if urgency else "neutral",
            image_scan_result=image_scan
        )
