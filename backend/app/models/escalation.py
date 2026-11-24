from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EscalationRecordCreate(BaseModel):
    complaint_id: str
    street_id: str
    street_name: str
    assigned_street_head_id: Optional[str] = None
    street_head_name: Optional[str] = None
    reason: str
    escalation_level: int = 1
    escalated_to_role: str = "central_head"

class EscalationRecordResponse(BaseModel):
    id: str
    complaint_id: str
    street_id: str
    street_name: str
    assigned_street_head_id: Optional[str] = None
    street_head_name: Optional[str] = None
    reason: str
    escalation_level: int
    escalated_to_role: str
    status: str = "active"  # active, intervened, resolved
    intervention_notes: Optional[str] = None
    intervened_by_id: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
