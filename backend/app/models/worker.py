from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MaintenanceWorkerBase(BaseModel):
    name: str
    phone: str
    department: str
    locality_id: str
    skills: List[str] = []
    status: str = "available"  # available, busy, off_duty
    active_tasks_count: int = 0

class MaintenanceWorkerCreate(MaintenanceWorkerBase):
    pass

class MaintenanceWorkerResponse(MaintenanceWorkerBase):
    id: str
    created_at: datetime

class AssignmentRecord(BaseModel):
    id: str
    complaint_id: str
    worker_id: str
    worker_name: str
    worker_phone: str
    street_head_id: str
    instructions: Optional[str] = None
    status: str = "assigned"  # assigned, in_progress, completed
    assigned_at: datetime
    completed_at: Optional[datetime] = None
