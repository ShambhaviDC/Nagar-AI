from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "complaint_status"  # complaint_status, reminder, escalation, verification, alert
    complaint_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    complaint_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime
