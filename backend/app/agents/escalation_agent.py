from app.agents.base import BaseAgent
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class EscalationAction(BaseModel):
    complaint_id: str
    complaint_code: str
    action_type: str  # send_reminder, escalate_to_central, override_alert
    escalation_level: int
    target_role: str
    target_user_id: Optional[str] = None
    notification_title: str
    notification_message: str
    reason: str

class EscalationExecutionSummary(BaseModel):
    timestamp: datetime
    actions_taken: List[EscalationAction] = []
    reminders_sent: int
    escalations_raised: int
    log: str

class AccountabilityEscalationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Accountability and Escalation Agent",
            role_description="Enforces street-level accountability, issues warning reminders for inactivity, escalates overdue complaints to Central Head, and maintains escalation audit history."
        )

    async def evaluate_and_escalate(
        self,
        flagged_items: List[Dict[str, Any]],
        existing_escalations: List[Dict[str, Any]]
    ) -> EscalationExecutionSummary:
        now = datetime.now(timezone.utc)
        actions: List[EscalationAction] = []
        reminders_count = 0
        escalations_count = 0

        # Build map of existing active escalations by complaint_id to prevent duplicates
        escalated_map = {
            str(e.get("complaint_id")): e.get("escalation_level", 1)
            for e in existing_escalations
            if e.get("status") == "active"
        }

        for item in flagged_items:
            cid = item.get("complaint_id")
            code = item.get("complaint_code", f"CMP-{cid[-4:]}")
            flag_type = item.get("flag_type")
            mins_overdue = item.get("minutes_overdue", 0)
            priority = item.get("priority", "P3")
            street_head_id = item.get("assigned_street_head_id")
            street_head_name = item.get("assigned_street_head_name", "Street Head")
            street_name = item.get("street_name", "Assigned Street")
            current_esc_level = escalated_map.get(cid, 0)

            # Rule 1: Unacknowledged overdue
            if flag_type == "unacknowledged_overdue":
                if current_esc_level == 0 and mins_overdue < 60 and priority != "P1":
                    # Send reminder to Street Head
                    reminders_count += 1
                    actions.append(EscalationAction(
                        complaint_id=cid,
                        complaint_code=code,
                        action_type="send_reminder",
                        escalation_level=1,
                        target_role="street_head",
                        target_user_id=street_head_id,
                        notification_title=f"URGENT REMINDER: Acknowledge {code}",
                        notification_message=f"Complaint {code} ({priority}) on {street_name} is overdue for acknowledgement by {mins_overdue} minutes. Please review and acknowledge immediately.",
                        reason=f"Acknowledgement deadline breached by {mins_overdue} minutes."
                    ))
                else:
                    # Escalate directly to Central Head
                    escalations_count += 1
                    actions.append(EscalationAction(
                        complaint_id=cid,
                        complaint_code=code,
                        action_type="escalate_to_central",
                        escalation_level=2,
                        target_role="central_head",
                        target_user_id=None,
                        notification_title=f"ESCALATION ALERT: Inactive Street Head on {code}",
                        notification_message=f"Street Head {street_head_name} has not acknowledged {code} ({priority}) on {street_name}. Overdue by {mins_overdue} minutes. Administrative intervention recommended.",
                        reason=f"Street Head inactivity: {mins_overdue}m overdue acknowledgement."
                    ))

            # Rule 2: Resolution overdue
            elif flag_type == "resolution_overdue":
                escalations_count += 1
                actions.append(EscalationAction(
                    complaint_id=cid,
                    complaint_code=code,
                    action_type="escalate_to_central",
                    escalation_level=2,
                    target_role="central_head",
                    target_user_id=None,
                    notification_title=f"SLA BREACH ESCALATION: {code} Overdue",
                    notification_message=f"Complaint {code} on {street_name} has exceeded its resolution SLA deadline by {mins_overdue} minutes. Assigned to {street_head_name}.",
                    reason=f"Resolution SLA breached by {mins_overdue} minutes."
                ))

        log = f"Escalation Agent executed: {reminders_count} reminders issued, {escalations_count} official escalations raised to Central Administration."
        return EscalationExecutionSummary(
            timestamp=now,
            actions_taken=actions,
            reminders_sent=reminders_count,
            escalations_raised=escalations_count,
            log=log
        )
