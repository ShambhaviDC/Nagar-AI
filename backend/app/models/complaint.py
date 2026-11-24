from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ComplaintCategory:
    STREETLIGHTS = "Streetlights"
    ELECTRICITY = "Electricity"
    WATER_SUPPLY = "Water supply"
    PLUMBING = "Plumbing"
    DRAINAGE = "Drainage"
    GARBAGE = "Garbage collection"
    ROAD_DAMAGE = "Road damage"
    PUBLIC_INFRASTRUCTURE = "Public infrastructure"
    SANITATION = "Sanitation"
    PUBLIC_SAFETY = "Public safety"
    OTHER = "Other locality-related issues"

    ALL = [
        STREETLIGHTS, ELECTRICITY, WATER_SUPPLY, PLUMBING, DRAINAGE,
        GARBAGE, ROAD_DAMAGE, PUBLIC_INFRASTRUCTURE, SANITATION,
        PUBLIC_SAFETY, OTHER
    ]

class ComplaintPriority:
    P1 = "P1" # Critical / Public Safety hazard
    P2 = "P2" # High / Major civic inconvenience
    P3 = "P3" # Medium / Standard service request
    P4 = "P4" # Low / Routine maintenance

class ComplaintStatus:
    REGISTERED = "registered"
    ACKNOWLEDGED = "acknowledged"
    WORKER_ASSIGNED = "worker_assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    VERIFIED = "verified"
    REOPENED = "reopened"
    ESCALATED = "escalated"

class ComplaintBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    priority: Optional[str] = None
    locality_id: str
    street_id: str
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_urls: List[str] = []
    voice_url: Optional[str] = None
    voice_transcript: Optional[str] = None

class ComplaintCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = ""
    locality_id: str
    street_id: str
    category: Optional[str] = None
    priority: Optional[str] = None
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_urls: Optional[List[str]] = []
    voice_url: Optional[str] = None
    voice_transcript: Optional[str] = None

class WorkerAssignmentRequest(BaseModel):
    worker_id: str
    instructions: Optional[str] = None

class ResolutionEvidenceRequest(BaseModel):
    resolution_notes: str
    resolution_image_urls: List[str] = []

class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    is_satisfied: bool = True

class ReopenRequest(BaseModel):
    reason: str

class ComplaintResponse(BaseModel):
    id: str
    complaint_code: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    locality_id: str
    street_id: str
    street_name: Optional[str] = None
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_urls: List[str] = []
    voice_url: Optional[str] = None
    voice_transcript: Optional[str] = None
    resident_id: str
    resident_name: Optional[str] = None
    resident_phone: Optional[str] = None
    assigned_street_head_id: Optional[str] = None
    assigned_street_head_name: Optional[str] = None
    assigned_worker_id: Optional[str] = None
    worker_name: Optional[str] = None
    worker_department: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_image_urls: List[str] = []
    acknowledgement_deadline: Optional[datetime] = None
    resolution_deadline: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    reopened_count: int = 0
    escalation_level: int = 0
    upvotes_count: int = 0
    upvoted_by: List[str] = []
    has_upvoted: Optional[bool] = False
    severity_score: Optional[int] = 5
    impact_scope: Optional[str] = "street_segment"
    image_scan_result: Optional[Dict[str, Any]] = None
    ai_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
