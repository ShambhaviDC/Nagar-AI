import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.config import settings

from app.agents.understanding_agent import ComplaintUnderstandingAgent, ExtractedComplaintUnderstanding
from app.agents.classification_priority_agent import ClassificationPriorityAgent, PriorityAssessmentResult
from app.agents.duplicate_detection_agent import DuplicateDetectionAgent, DuplicateDetectionResult
from app.agents.assignment_agent import SmartAssignmentAgent, AssignmentRecommendation
from app.agents.monitoring_agent import ComplaintMonitoringAgent, MonitoringAuditReport
from app.agents.escalation_agent import AccountabilityEscalationAgent, EscalationExecutionSummary
from app.agents.verification_agent import ResolutionVerificationAgent, VerificationAssessment
from app.agents.analytics_agent import LocalityAnalyticsAgent, LocalityInsightsReport

logger = logging.getLogger(__name__)

class MultiAgentOrchestrator:
    """Central AI Orchestrator managing task-based execution across 8 specialized agents."""

    def __init__(self):
        self.understanding_agent = ComplaintUnderstandingAgent()
        self.classification_agent = ClassificationPriorityAgent()
        self.duplicate_agent = DuplicateDetectionAgent()
        self.assignment_agent = SmartAssignmentAgent()
        self.monitoring_agent = ComplaintMonitoringAgent()
        self.escalation_agent = AccountabilityEscalationAgent()
        self.verification_agent = ResolutionVerificationAgent()
        self.analytics_agent = LocalityAnalyticsAgent()
        logger.info("NagarAI MultiAgentOrchestrator initialized with 8 agents.")

    async def process_new_complaint(
        self,
        text: str,
        locality_id: str,
        street_id: str,
        street_doc: Dict[str, Any],
        recent_complaints: List[Dict[str, Any]],
        available_workers: List[Dict[str, Any]],
        user_category: Optional[str] = None,
        user_priority: Optional[str] = None,
        voice_transcript: Optional[str] = None,
        image_urls: List[str] = None
    ) -> Dict[str, Any]:
        """Task-based orchestration pipeline for incoming complaint registration."""
        # 1. Understanding Agent
        understanding: ExtractedComplaintUnderstanding = await self.understanding_agent.understand(
            text=text,
            voice_transcript=voice_transcript,
            image_urls=image_urls
        )

        effective_category = user_category or understanding.suggested_category

        # 2. Classification & Priority Agent
        priority_assessment: PriorityAssessmentResult = await self.classification_agent.assess(
            title=understanding.title,
            description=text,
            category_hint=effective_category,
            voice_transcript=voice_transcript,
            image_urls=image_urls,
            image_scan_result=understanding.image_scan_result,
            upvotes_count=0
        )

        final_category = priority_assessment.category
        final_priority = user_priority or priority_assessment.priority

        # Calculate SLA Deadlines
        now = datetime.now(timezone.utc)
        ack_mins = settings.SLA_ACK_MINUTES.get(final_priority, 720)
        res_hours = settings.SLA_RESOLVE_HOURS.get(final_priority, 48)

        ack_deadline = now + timedelta(minutes=ack_mins)
        res_deadline = now + timedelta(hours=res_hours)

        # 3. Duplicate Detection Agent
        complaint_preview = {
            "title": understanding.title,
            "description": text,
            "category": final_category,
            "street_id": street_id
        }
        dup_result: DuplicateDetectionResult = await self.duplicate_agent.detect_duplicates(
            new_complaint=complaint_preview,
            recent_complaints=recent_complaints
        )

        # 4. Smart Assignment Agent
        assignment_result: AssignmentRecommendation = await self.assignment_agent.recommend_assignment(
            complaint={"category": final_category, "priority": final_priority, "locality_id": locality_id},
            street=street_doc,
            available_workers=available_workers
        )

        ai_metadata = {
            "understanding": understanding.model_dump(),
            "priority_assessment": priority_assessment.model_dump(),
            "duplicate_detection": dup_result.model_dump(),
            "assignment_recommendation": assignment_result.model_dump(),
            "image_scan_result": understanding.image_scan_result,
            "processed_at": now.isoformat()
        }

        return {
            "title": understanding.title,
            "category": final_category,
            "priority": final_priority,
            "severity_score": priority_assessment.severity_score,
            "impact_scope": priority_assessment.impact_scope,
            "image_scan_result": understanding.image_scan_result,
            "assigned_street_head_id": assignment_result.responsible_street_head_id,
            "assigned_street_head_name": assignment_result.responsible_street_head_name,
            "recommended_department": assignment_result.recommended_department,
            "recommended_workers": [w.model_dump() for w in assignment_result.recommended_workers],
            "acknowledgement_deadline": ack_deadline,
            "resolution_deadline": res_deadline,
            "is_duplicate": dup_result.is_duplicate,
            "duplicate_of_code": dup_result.matched_complaint_code,
            "ai_metadata": ai_metadata
        }

    async def run_monitoring_cycle(
        self,
        active_complaints: List[Dict[str, Any]],
        existing_escalations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Task-based orchestration for SLA surveillance and automated escalations."""
        # Agent 5: Monitoring
        audit_report: MonitoringAuditReport = await self.monitoring_agent.monitor_complaints(active_complaints)
        
        # Agent 6: Accountability & Escalation
        flagged_dicts = [f.model_dump() for f in audit_report.flagged_complaints]
        escalation_summary: EscalationExecutionSummary = await self.escalation_agent.evaluate_and_escalate(
            flagged_items=flagged_dicts,
            existing_escalations=existing_escalations
        )

        return {
            "audit_report": audit_report.model_dump(),
            "escalation_summary": escalation_summary.model_dump()
        }

    async def verify_resolution(
        self,
        complaint: Dict[str, Any],
        resolution_notes: str,
        resolution_image_urls: List[str]
    ) -> VerificationAssessment:
        """Agent 7: Validate evidence and prepare resident notification."""
        return await self.verification_agent.evaluate_evidence(
            complaint=complaint,
            resolution_notes=resolution_notes,
            resolution_image_urls=resolution_image_urls
        )

    async def generate_locality_insights(
        self,
        locality: Dict[str, Any],
        streets: List[Dict[str, Any]],
        complaints: List[Dict[str, Any]]
    ) -> LocalityInsightsReport:
        """Agent 8: Full analytics, metrics, hotspots, and AI recommendations."""
        return await self.analytics_agent.generate_insights(
            locality=locality,
            streets=streets,
            complaints=complaints
        )

orchestrator = MultiAgentOrchestrator()
