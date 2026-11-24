from app.agents.base import BaseAgent
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

class MonitoredComplaintFlag(BaseModel):
    complaint_id: str
    complaint_code: str
    title: str
    street_id: str
    street_name: str
    assigned_street_head_id: Optional[str] = None
    assigned_street_head_name: Optional[str] = None
    priority: str
    status: str
    flag_type: str  # unacknowledged_overdue, unassigned_overdue, resolution_overdue, reopened_stalled
    minutes_overdue: int
    sla_target: str
    urgency_level: str  # warning, critical, emergency
    recommended_action: str

class MonitoringAuditReport(BaseModel):
    timestamp: datetime
    total_evaluated: int
    flags_count: int
    unacknowledged_count: int
    overdue_resolution_count: int
    flagged_complaints: List[MonitoredComplaintFlag] = []
    summary: str

class ComplaintMonitoringAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Complaint Monitoring Agent",
            role_description="Monitors complaint lifecycle timelines, detects inactive or stalled complaints, and flags SLA violations for escalation."
        )

    async def monitor_complaints(self, active_complaints: List[Dict[str, Any]]) -> MonitoringAuditReport:
        now = datetime.now(timezone.utc)
        flags: List[MonitoredComplaintFlag] = []
        unack_count = 0
        overdue_res_count = 0

        for c in active_complaints:
            cid = str(c.get("_id", c.get("id", "")))
            code = c.get("complaint_code", f"CMP-{cid[-4:]}")
            status = c.get("status", "registered")
            priority = c.get("priority", "P3")
            ack_dl = c.get("acknowledgement_deadline")
            res_dl = c.get("resolution_deadline")
            street_head_id = c.get("assigned_street_head_id")
            street_head_name = c.get("assigned_street_head_name", "Street Head")
            street_name = c.get("street_name", "Local Street")

            # Check unacknowledged SLA
            if status == "registered" and ack_dl:
                if isinstance(ack_dl, str):
                    try:
                        ack_dl = datetime.fromisoformat(ack_dl.replace("Z", "+00:00"))
                    except Exception:
                        ack_dl = now
                if ack_dl.tzinfo is None:
                    ack_dl = ack_dl.replace(tzinfo=timezone.utc)

                if now > ack_dl:
                    overdue_mins = int((now - ack_dl).total_seconds() / 60)
                    unack_count += 1
                    urgency = "emergency" if priority == "P1" else ("critical" if priority == "P2" else "warning")
                    flags.append(MonitoredComplaintFlag(
                        complaint_id=cid,
                        complaint_code=code,
                        title=c.get("title", ""),
                        street_id=str(c.get("street_id", "")),
                        street_name=street_name,
                        assigned_street_head_id=str(street_head_id) if street_head_id else None,
                        assigned_street_head_name=street_head_name,
                        priority=priority,
                        status=status,
                        flag_type="unacknowledged_overdue",
                        minutes_overdue=overdue_mins,
                        sla_target=f"Ack target {priority}",
                        urgency_level=urgency,
                        recommended_action=f"Dispatch automated reminder to {street_head_name}; escalate if unresponsive."
                    ))

            # Check resolution SLA for open complaints
            if status in ["acknowledged", "worker_assigned", "in_progress", "reopened"] and res_dl:
                if isinstance(res_dl, str):
                    try:
                        res_dl = datetime.fromisoformat(res_dl.replace("Z", "+00:00"))
                    except Exception:
                        res_dl = now
                if res_dl.tzinfo is None:
                    res_dl = res_dl.replace(tzinfo=timezone.utc)

                if now > res_dl:
                    overdue_mins = int((now - res_dl).total_seconds() / 60)
                    overdue_res_count += 1
                    urgency = "emergency" if priority in ["P1", "P2"] else "critical"
                    flags.append(MonitoredComplaintFlag(
                        complaint_id=cid,
                        complaint_code=code,
                        title=c.get("title", ""),
                        street_id=str(c.get("street_id", "")),
                        street_name=street_name,
                        assigned_street_head_id=str(street_head_id) if street_head_id else None,
                        assigned_street_head_name=street_head_name,
                        priority=priority,
                        status=status,
                        flag_type="resolution_overdue",
                        minutes_overdue=overdue_mins,
                        sla_target=f"Resolution target {priority}",
                        urgency_level=urgency,
                        recommended_action="Escalate to Central Administration for administrative intervention."
                    ))

        summary = (
            f"Evaluated {len(active_complaints)} complaints: flagged {len(flags)} violations "
            f"({unack_count} unacknowledged, {overdue_res_count} overdue for resolution)."
        )

        return MonitoringAuditReport(
            timestamp=now,
            total_evaluated=len(active_complaints),
            flags_count=len(flags),
            unacknowledged_count=unack_count,
            overdue_resolution_count=overdue_res_count,
            flagged_complaints=flags,
            summary=summary
        )
