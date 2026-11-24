from app.agents.base import BaseAgent
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import json
import re

class VerificationAssessment(BaseModel):
    is_valid_evidence: bool
    evidence_quality_score: int = Field(ge=1, le=10)
    completeness_notes: str
    resident_notification_message: str
    recommended_status: str  # resolved, verified, reopened

class ResolutionVerificationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Resolution Verification Agent",
            role_description="Validates street head resolution evidence, handles resident confirmation workflows, and coordinates complaint closure or reopening."
        )

    async def evaluate_evidence(
        self,
        complaint: Dict[str, Any],
        resolution_notes: str,
        resolution_image_urls: List[str]
    ) -> VerificationAssessment:
        code = complaint.get("complaint_code", "Complaint")
        title = complaint.get("title", "")
        
        has_images = len(resolution_image_urls) > 0
        has_notes = len(resolution_notes.strip()) >= 10
        
        score = 5
        if has_images:
            score += 3
        if has_notes:
            score += 2
        
        is_valid = (has_notes or has_images)
        notes = "Resolution evidence submitted with documentation." if is_valid else "Insufficient resolution evidence provided by street maintenance."

        resident_msg = (
            f"Work completed on your complaint '{title}' ({code}). "
            f"Notes from maintenance: \"{resolution_notes}\". "
            f"Please inspect the site and confirm if the issue is fully resolved, or tap Reopen if it persists."
        )

        return VerificationAssessment(
            is_valid_evidence=is_valid,
            evidence_quality_score=min(10, score),
            completeness_notes=notes,
            resident_notification_message=resident_msg,
            recommended_status="resolved"
        )

    async def handle_resident_reopen(
        self,
        complaint: Dict[str, Any],
        reopen_reason: str
    ) -> Dict[str, Any]:
        """Process resident dissatisfaction and prepare prioritized reopening workflow."""
        current_reopen_count = complaint.get("reopened_count", 0) + 1
        code = complaint.get("complaint_code", "Complaint")
        street_name = complaint.get("street_name", "Street")
        
        # When reopened, priority is elevated to ensure accountability
        new_priority = "P1" if current_reopen_count >= 2 else "P2"
        
        return {
            "reopened_count": current_reopen_count,
            "new_priority": new_priority,
            "status": "reopened",
            "escalate_immediately": current_reopen_count >= 2,
            "log": f"Complaint {code} reopened by resident (Attempt #{current_reopen_count}): '{reopen_reason}'. Priority adjusted to {new_priority}."
        }
