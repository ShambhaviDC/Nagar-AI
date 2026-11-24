from app.agents.base import BaseAgent
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import json
import re

class PriorityAssessmentResult(BaseModel):
    category: str = Field(description="Final validated category")
    priority: str = Field(description="P1, P2, P3, or P4")
    priority_label: str = Field(description="Critical, High, Medium, Low")
    severity_score: int = Field(ge=1, le=10, description="1 to 10 severity rating")
    public_safety_hazard: bool = Field(description="True if human injury or life threat exists")
    impact_scope: str = Field(description="single_household, street_segment, entire_street, multi_street")
    justification: str = Field(description="Clear explanation for this priority assignment")
    sla_acknowledgement_target_minutes: int
    sla_resolution_target_hours: int
    image_scan_result: Optional[Dict[str, Any]] = None

class ClassificationPriorityAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Classification and Priority Agent",
            role_description="Determines civic complaint category, impact scope, public safety risk, evaluates voice/text severity, scanned image damage, and community voting to assign strict SLA-driven P1-P4 priorities."
        )

    async def assess(
        self,
        title: str,
        description: str,
        category_hint: Optional[str] = None,
        voice_transcript: Optional[str] = None,
        image_urls: Optional[List[str]] = None,
        image_scan_result: Optional[Dict[str, Any]] = None,
        upvotes_count: int = 0
    ) -> PriorityAssessmentResult:
        full_text = f"{title}\n{description}"
        if voice_transcript:
            full_text += f"\n[Voice Transcript]: {voice_transcript}"

        prompt = f"""You are the NagarAI Classification & Priority Agent.
Analyze this civic complaint:
Text & Voice: "{full_text}"
Suggested category: {category_hint or 'None'}
Image Scan Findings: {json.dumps(image_scan_result or {})}
Community Upvotes: {upvotes_count} (neighbors who confirmed they are also affected)

Civic SLA Rules:
- P1 (Critical): Active life/injury hazard (live sparking wires, open deep manhole, gas leak, collapsing structure, extreme flooding, OR confirmed by 4+ community votes). Target ack: 15 mins, resolution: 6 hours. Severity 9-10.
- P2 (High): Major civic disruption, serious issues, problems affecting all street residents (overflowing sewage, total water cut, dark street, deep craters, "serious issue", "problem to all residents", OR verified by 2+ community votes, OR visual photo confirming extensive damage). Target ack: 120 mins, resolution: 24 hours. Severity 7-8.
- P3 (Medium): Standard localized maintenance failure (single flickering streetlight, leaking tap, regular pothole, overflowing dustbin). Target ack: 720 mins (12h), resolution: 48 hours. Severity 4-6.
- P4 (Low): Routine aesthetic or cosmetic request (tree branch pruning, faded sign, painting). Target ack: 1440 mins (24h), resolution: 96 hours. Severity 1-3.

Respond strictly with valid JSON:
{{
  "category": "Streetlights|Electricity|Water supply|Plumbing|Drainage|Garbage collection|Road damage|Public infrastructure|Sanitation|Public safety|Other locality-related issues",
  "priority": "P1|P2|P3|P4",
  "priority_label": "Critical|High|Medium|Low",
  "severity_score": 1-10,
  "public_safety_hazard": true|false,
  "impact_scope": "single_household|street_segment|entire_street|multi_street",
  "justification": "Why this priority was assigned based on voice/text severity, image scan, and community impact",
  "sla_acknowledgement_target_minutes": 15|120|720|1440,
  "sla_resolution_target_hours": 6|24|48|96
}}"""

        llm_response = await self.call_llm(prompt)
        if llm_response:
            try:
                clean = re.sub(r'```json\s*|\s*```', '', llm_response).strip()
                data = json.loads(clean)
                data["image_scan_result"] = image_scan_result
                return PriorityAssessmentResult(**data)
            except Exception:
                pass

        # Robust Multi-Factor Priority Rule Engine
        lower = full_text.lower()
        category = category_hint or "Other locality-related issues"
        
        # 1. P1 Triggers: Imminent safety/life hazard or massive disaster
        p1_triggers = [
            "live wire", "sparking", "sparks", "electric shock", "electrocution",
            "exposed wire", "short circuit", "transformer blast", "transformer burning",
            "active fire", "fire", "gas leak", "cylinder leak", "open manhole",
            "deep manhole", "missing manhole cover", "open gutter pit", "manhole open",
            "sinkhole", "road collapse", "building collapse", "wall collapse",
            "tree fallen on wire", "severe flood", "flooding inside", "drowning",
            "life hazard", "life threatening", "fatal", "major accident", "ambulance blocked",
            "critical emergency", "immediate danger", "someone injured", "bleeding"
        ]

        # 2. P2 Triggers: Serious issues, problems affecting all residents, major civic disruptions
        p2_serious_triggers = [
            "serious issue", "serious problem", "very serious", "major issue", "major problem",
            "huge issue", "huge problem", "severe issue", "severe problem", "urgent",
            "emergency", "critical issue", "urgent action", "fix it fast", "fix immediately",
            "action immediately", "cannot live", "unbearable", "extremely bad", "terrible condition",
            "worst condition", "problem to all residents", "problem for all residents",
            "affecting all residents", "all residents affected", "problem to all", "affecting all",
            "everyone affected", "entire street", "whole street", "whole locality", "whole area",
            "all houses", "every house", "community problem", "many people affected",
            "all neighbors", "locality problem", "public problem", "mass problem", "residents suffering"
        ]

        p2_disruption_triggers = [
            "no water", "water supply cut", "water cut", "contaminated water", "dirty water",
            "black water", "drinking water foul", "sewage overflow", "overflowing sewage",
            "overflowing drain", "drain burst", "sewage flood", "gutter overflowing",
            "foul smell", "stink", "dengue", "disease outbreak", "mosquito menace",
            "total blackout", "complete darkness", "all streetlights broken", "all lights off",
            "pitch dark", "unsafe at night", "stray dog attack", "dog bites",
            "huge pothole", "massive crater", "deep crater", "road blocked", "traffic blocked",
            "water logging", "waterlogged", "drainage blockage", "burst pipe", "pipe burst",
            "huge garbage dump", "massive trash pile", "waste rotting", "road broken"
        ]

        # 3. P4 Triggers: Routine, aesthetic, cosmetic requests
        p4_triggers = [
            "routine", "faded", "pruning", "branch trimming", "aesthetic",
            "cleaning schedule", "dustbin requested", "new dustbin", "paint",
            "beautification", "suggestion", "general inquiry"
        ]

        # Check image scan severity
        image_severity = (image_scan_result or {}).get("visual_severity", "None")
        has_image_evidence = (image_scan_result or {}).get("has_image", False)
        visual_hazard = (image_scan_result or {}).get("hazard_detected", False)

        # Multi-factor Priority Determination
        is_p1 = (
            any(t in lower for t in p1_triggers) or
            (upvotes_count >= 4) or
            (image_severity == "Critical")
        )

        is_p2 = (
            is_p1 is False and (
                any(t in lower for t in p2_serious_triggers) or
                any(t in lower for t in p2_disruption_triggers) or
                (upvotes_count >= 2) or
                (image_severity == "High") or
                (has_image_evidence and visual_hazard)
            )
        )

        is_p4 = (
            not is_p1 and not is_p2 and
            any(t in lower for t in p4_triggers)
        )

        if is_p1:
            priority = "P1"
            label = "Critical"
            score = 10 if upvotes_count >= 4 else 9
            safety = True
            scope = "entire_street"
            ack_mins = 15
            res_hours = 6
            justification = "Identified critical public safety hazard or acute life risk."
            if upvotes_count >= 4:
                justification += f" Escalated to Critical due to {upvotes_count} community upvotes confirming widespread crisis."
            elif image_severity == "Critical":
                justification += " Corroborated by uploaded photographic evidence of severe on-ground hazard."
        elif is_p2:
            priority = "P2"
            label = "High"
            score = 7 + (1 if upvotes_count >= 2 or has_image_evidence else 0)
            safety = False
            scope = "entire_street" if any(t in lower for t in p2_serious_triggers) or upvotes_count >= 2 else "street_segment"
            ack_mins = 120
            res_hours = 24
            justification = "Major civic infrastructure disruption or serious issue affecting locality residents."
            if any(t in lower for t in p2_serious_triggers):
                justification += " Detected resident urgency cues / widespread community impact."
            if upvotes_count >= 2:
                justification += f" Corroborated by {upvotes_count} resident upvotes indicating collective impact."
            if has_image_evidence:
                justification += " Photographic evidence attached verifying physical damage."
        elif is_p4:
            priority = "P4"
            label = "Low"
            score = 3
            safety = False
            scope = "single_household"
            ack_mins = 1440
            res_hours = 96
            justification = "Routine non-urgent civic request with minimal safety impact."
        else:
            priority = "P3"
            label = "Medium"
            score = 5
            safety = False
            scope = "single_household"
            ack_mins = 720
            res_hours = 48
            justification = "Standard civic operational defect requiring scheduled repair and maintenance."

        return PriorityAssessmentResult(
            category=category,
            priority=priority,
            priority_label=label,
            severity_score=score,
            public_safety_hazard=safety,
            impact_scope=scope,
            justification=justification,
            sla_acknowledgement_target_minutes=ack_mins,
            sla_resolution_target_hours=res_hours,
            image_scan_result=image_scan_result
        )
